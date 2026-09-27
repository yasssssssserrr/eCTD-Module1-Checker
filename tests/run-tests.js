'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const context = {
  console,
  TextEncoder,
  TextDecoder,
  Uint8Array,
  Date,
  URL,
};
context.globalThis = context;
vm.createContext(context);
for (const file of ['core.js', 'data.js', 'zip.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
}

const { EctdCore: core, EctdData: data, EctdZip: zip } = context;
const tests = [];
const test = (name, fn) => tests.push({ name, fn });

test('the normalized dataset is internally valid', () => {
  const result = core.validateDatabase(data.ECTD_DATABASE, data.REGIONS, data.SUBMISSION_TYPES);
  assert.deepEqual([...result.errors], []);
  assert.deepEqual([...result.warnings], []);
});

test('every logical parent exists and the hierarchy has no cycles', () => {
  const entries = new Map(data.ECTD_DATABASE.map(entry => [entry.id, entry]));
  for (const entry of data.ECTD_DATABASE) {
    const seen = new Set([entry.id]);
    let parentId = entry.parentId;
    while (parentId) {
      assert.ok(entries.has(parentId), `${entry.id} has missing parent ${parentId}`);
      assert.ok(!seen.has(parentId), `${entry.id} is part of a hierarchy cycle`);
      seen.add(parentId);
      parentId = entries.get(parentId).parentId;
    }
  }
});

test('known children retain their explicit parents in comparisons', () => {
  const model = core.buildComparisonModel(data.ECTD_DATABASE, 'eu', 'uk', 'all');
  const byTopic = new Map(model.rows.map(row => [row.entry.topic, row]));
  assert.equal(byTopic.get('Braille (EU)').parentId, byTopic.get('Produktinformation (Labeling)').id);
  assert.equal(byTopic.get('Generika / Bibliografisch').parentId, 'special-requirements');
  assert.equal(byTopic.get('Clinical Expert').parentId, byTopic.get('Sachverständige / Experts').id);
});

test('all region pairs and submission filters build unique comparison rows', () => {
  const regions = Object.keys(data.REGIONS);
  const submissionTypes = Object.keys(data.SUBMISSION_TYPES);
  for (let left = 0; left < regions.length; left += 1) {
    for (let right = left + 1; right < regions.length; right += 1) {
      for (const submissionType of submissionTypes) {
        const model = core.buildComparisonModel(
          data.ECTD_DATABASE,
          regions[left],
          regions[right],
          submissionType
        );
        const ids = model.rows.map(row => row.id);
        assert.equal(new Set(ids).size, ids.length, `duplicate row in ${regions[left]}/${regions[right]}/${submissionType}`);
        assert.equal(model.stats.total, model.rows.filter(row => !row.contextOnly).length);
      }
    }
  }
});

test('folder paths are nested and unique for every region', () => {
  for (const region of Object.keys(data.REGIONS)) {
    const paths = core.buildFolderPaths(data.ECTD_DATABASE, region, 'all');
    assert.equal(new Set(paths).size, paths.length, `duplicate folder in ${region}`);
    assert.ok(paths.every(folder => folder.startsWith(`m1/${region}/`) && folder.endsWith('/')));
  }
});

test('Australian patent information uses the regional application-form parent once', () => {
  const paths = core.buildFolderPaths(data.ECTD_DATABASE, 'au', 'all');
  const patentPaths = paths.filter(folder => folder.includes('patent'));
  assert.equal(patentPaths.length, 1);
  assert.match(patentPaths[0], /12-application\/122-patent/i);
});

test('filtered export selection includes matching children and their context parent', () => {
  const model = core.buildComparisonModel(data.ECTD_DATABASE, 'eu', 'uk', 'all');
  const result = core.filterComparisonRows(model.rows, { search: 'braille' });
  assert.ok([...result.matchingIds].some(id => model.rows.find(row => row.id === id)?.entry.topic === 'Braille (EU)'));
  assert.ok(result.rows.some(row => row.entry.topic === 'Produktinformation (Labeling)'));
  assert.ok(result.rows.some(row => row.entry.topic === 'Braille (EU)'));
});

test('CSV contains metadata, child rows, sources and formula-injection protection', () => {
  const model = core.buildComparisonModel(data.ECTD_DATABASE, 'eu', 'uk', 'all');
  const rows = core.filterComparisonRows(model.rows, { search: 'braille' }).rows;
  const injected = {
    ...rows[rows.length - 1],
    entry: { ...rows[rows.length - 1].entry, topic: '=WEBSERVICE("bad")' },
  };
  const csv = core.buildComparisonCsv(
    [...rows, injected],
    data.REGIONS.eu,
    data.REGIONS.uk,
    data.DATASET_META
  );
  assert.match(csv, /Datenstand/);
  assert.match(csv, /Braille/);
  assert.match(csv, /https:\/\//);
  assert.match(csv, /"'=WEBSERVICE/);
});

test('generated folder archive has valid ZIP signatures and directory entries', () => {
  const paths = core.buildFolderPaths(data.ECTD_DATABASE, 'eu', 'initial').slice(0, 5);
  const bytes = zip.createFolderZip(paths);
  assert.equal(bytes[0], 0x50);
  assert.equal(bytes[1], 0x4b);
  assert.equal(bytes[2], 0x03);
  assert.equal(bytes[3], 0x04);
  const end = bytes.length - 22;
  assert.deepEqual([...bytes.slice(end, end + 4)], [0x50, 0x4b, 0x05, 0x06]);
  const archiveText = new TextDecoder().decode(bytes);
  for (const folder of paths) assert.ok(archiveText.includes(folder), `ZIP omits ${folder}`);
  assert.ok(archiveText.includes('m1/'));
  assert.ok(archiveText.includes('m1/eu/'));
  assert.ok(!zip.normalizePaths(['']).includes('/'));
});

test('validation rejects a duplicated regional section', () => {
  const duplicate = {
    ...data.ECTD_DATABASE[0],
    id: 'synthetic-duplicate',
    topic: 'Synthetic duplicate',
    parentId: null,
  };
  const result = core.validateDatabase(
    [...data.ECTD_DATABASE, duplicate],
    data.REGIONS,
    data.SUBMISSION_TYPES
  );
  assert.ok(result.errors.some(error => error.startsWith('Duplicate eu section')));
});

let failures = 0;
for (const { name, fn } of tests) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`✗ ${name}\n  ${error.stack || error.message}`);
  }
}
console.log(`\n${tests.length - failures}/${tests.length} tests passed.`);
if (failures) process.exitCode = 1;
