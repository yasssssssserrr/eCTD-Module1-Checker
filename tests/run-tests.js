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
  assert.equal(byTopic.get('Generika / Biosimilars').parentId, 'special-requirements');
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

test('Australian patent certification uses 1.2.3 under administrative information', () => {
  const paths = core.buildFolderPaths(data.ECTD_DATABASE, 'au', 'all');
  const patentPaths = paths.filter(folder => folder.includes('patent'));
  assert.equal(patentPaths.length, 1);
  assert.match(patentPaths[0], /12-administrative-information\/123-patent-certification/i);
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
  const paths = core.buildFolderPaths(data.ECTD_DATABASE, 'eu', 'admin').slice(0, 5);
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
    ...data.ECTD_DATABASE.find(entry => entry.regions.eu),
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

test('corrected EU regulatory headings match Appendix 2', () => {
  const section = id => data.ECTD_DATABASE.find(entry => entry.id === id).regions.eu;
  assert.equal(section('braille').num, '1.3.6');
  assert.equal(section('generics').num, '1.5.2');
  assert.equal(section('bibliographical').num, '1.5.1');
  assert.equal(section('exceptional').num, '1.5.4');
  assert.equal(section('conditional-ma').num, '1.5.5');
  assert.equal(section('specimen').title, 'Specimen');
  assert.ok(!data.ECTD_DATABASE.some(entry => entry.regions.eu?.num === '1.1'));
});

test('FDA sections are not confused with unrelated regulatory concepts', () => {
  const section = id => data.ECTD_DATABASE.find(entry => entry.id === id).regions.us;
  assert.equal(section('field-copy').num, '1.3.2');
  assert.equal(section('application-status').title, 'Application Status');
  assert.equal(section('protocol-assessment').num, '1.8');
  assert.equal(section('dispute-resolution').num, '1.10');
  assert.equal(section('investigational-plan').num, '1.20');
  assert.equal(data.ECTD_DATABASE.find(entry => entry.id === 'hc-summaries').regions.us, undefined);
});

test('Japanese headings match the official PMDA context-of-use codes', () => {
  const section = id => data.ECTD_DATABASE.find(entry => entry.id === id).regions.jp;
  assert.equal(section('certificates-jp').num, '1.3');
  assert.equal(section('patent-exclusivity').num, '1.4');
  assert.equal(section('prescribing-information').num, '1.8');
  assert.equal(section('risk-management').num, '1.11');
  assert.equal(section('related-products-jp').num, '1.7');
  assert.equal(section('attached-documents-jp').num, '1.12');
});

test('all displayed headings carry review evidence without invented requiredness', () => {
  for (const entry of data.ECTD_DATABASE) for (const [region, section] of Object.entries(entry.regions)) {
    assert.equal(section.requirement, 'not-assessed');
    assert.equal(section.reviewedAt, data.DATASET_META.lastReviewedAt);
    assert.ok(section.source.locator);
    assert.equal(section.reviewStatus, region === 'uk' ? 'format-reference' : 'source-checked');
  }
});

test('Australian dataset covers all 66 v3.2 heading elements, including 6.1', () => {
  const numbers = data.ECTD_DATABASE.flatMap(entry => entry.regions.au ? [entry.regions.au.num] : []);
  assert.equal(numbers.length, 66);
  assert.equal(new Set(numbers).size, 66);
  assert.ok(numbers.includes('6.1'));
});

test('Japanese dataset covers all 20 Module 1 context-of-use codes, including 1.13', () => {
  const numbers = data.ECTD_DATABASE.flatMap(entry => entry.regions.jp ? [entry.regions.jp.num] : []);
  assert.equal(numbers.length, 20);
  assert.ok(numbers.includes('1.13.4.1.3'));
  const paths = core.buildFolderPaths(data.ECTD_DATABASE, 'jp', 'all');
  assert.ok(paths.includes('m1/jp/11341-documents-for-pmda-copy/113412-novel-excipient/'));
});

test('Canadian placement restrictions from Health Canada stay visible', () => {
  const section = id => data.ECTD_DATABASE.find(entry => entry.id === id).regions.ca;
  assert.match(section('fee-forms').reqCondition, /keine Dokumente/);
  assert.match(section('environment').reqCondition, /keine Dokumente/);
  assert.match(section('lifecycle-table').reqCondition, /nicht mehr erforderlich/);
  assert.match(section('table-of-contents').reqCondition, /Nicht-eCTD/);
  assert.match(section('compliance-site-ca').reqCondition, /Unterabschnitten/);
  assert.equal(data.REGIONS.ca.source.url.includes('organization-document-placement'), true);
});

test('official unnumbered EU sections are allowed only when declared', () => {
  const section = id => data.ECTD_DATABASE.find(entry => entry.id === id).regions.eu;
  assert.equal(section('responses-eu').num, '');
  assert.equal(section('additional-data-eu').title, 'Additional Data');
  assert.ok(core.buildFolderPaths(data.ECTD_DATABASE, 'eu', 'all').includes('m1/eu/additional-data/'));
  const original = data.ECTD_DATABASE.find(entry => entry.id === 'braille');
  const invalid = { ...original, id: 'missing-number', parentId: null, regions: { eu: { ...original.regions.eu, num: '', title: 'Missing number' } } };
  const result = core.validateDatabase([...data.ECTD_DATABASE, invalid], data.REGIONS, data.SUBMISSION_TYPES);
  assert.ok(result.errors.some(error => error.includes('missing-number/eu requires num and title')));
});

test('unmapped regions expose editorial cross-references in rows, search and CSV', () => {
  const model = core.buildComparisonModel(data.ECTD_DATABASE, 'eu', 'us', 'all');
  const row = model.rows.find(item => item.id === 'environment');
  assert.equal(row.b, null);
  assert.equal(row.relatedB[0].num, '1.12.14');
  assert.ok(core.filterComparisonRows(model.rows, { search: '1.12.14' }).matchingIds.has('environment'));
  assert.match(core.buildComparisonCsv([row], data.REGIONS.eu, data.REGIONS.us, data.DATASET_META), /1\.12\.14 Environmental Analysis/);
  assert.deepEqual([...row.relatedA], []);
  const pointers = data.ECTD_DATABASE.find(entry => entry.id === 'orphan-decision-ch').crossReferences;
  assert.equal(pointers.eu[0].num, '1.7');
  assert.equal(pointers.us[0].num, '1.12.17');
  assert.equal(pointers.au[0].num, '1.5.2');
});

test('validation rejects cross-references that conflict with the dataset', () => {
  const entries = data.ECTD_DATABASE.map(entry => ({ ...entry }));
  const target = entries.find(entry => entry.id === 'environment');
  target.crossReferences = { eu: [{ num: '1.2', title: 'Duplicate' }], us: [{ num: '1.2', title: 'Wrong title' }, { num: 'x', title: 'Bad number' }] };
  const { errors } = core.validateDatabase(entries, data.REGIONS, data.SUBMISSION_TYPES);
  assert.ok(errors.some(error => error.includes('duplicates a direct mapping')));
  assert.ok(errors.some(error => error.includes('is invalid')));
  const wrongTitle = entries.map(entry => entry.id === 'environment' ? { ...entry, crossReferences: { us: [{ num: '1.14', title: 'Wrong title' }] } } : entry);
  assert.ok(core.validateDatabase(wrongTitle, data.REGIONS, data.SUBMISSION_TYPES).errors.some(error => error.includes('differs from')));
});

test('Canadian cover letter, forms and lifecycle table use their schema positions', () => {
  const section = id => data.ECTD_DATABASE.find(entry => entry.id === id).regions.ca;
  assert.equal(section('cover-letter').num, '1.0.1');
  assert.equal(section('application-forms').num, '1.2.1');
  assert.equal(section('lifecycle-table').num, '1.0.2');
});

test('filtered planning folders preserve regional ancestors outside the focus', () => {
  const paths = core.buildFolderPaths(data.ECTD_DATABASE, 'ca', 'safety');
  assert.ok(paths.some(folder => /13-product-information\/138-pharmacovigilance-information\/1382-risk-management-plan/.test(folder)));
});

test('Japanese root overrides do not inherit editorial comparison parents', () => {
  const paths = core.buildFolderPaths(data.ECTD_DATABASE, 'jp', 'all');
  assert.ok(paths.includes('m1/jp/14-patent-status/'));
  assert.ok(paths.includes('m1/jp/18-package-insert-draft/'));
  assert.ok(paths.includes('m1/jp/111-risk-management-plan-draft/'));
});

test('validation rejects duplicate numbers even with a different title', () => {
  const original = data.ECTD_DATABASE.find(entry => entry.regions.eu);
  const duplicate = { ...original, id: 'duplicate-number', regions: { eu: { ...original.regions.eu, title: 'Different title' } } };
  const result = core.validateDatabase([...data.ECTD_DATABASE, duplicate], data.REGIONS, data.SUBMISSION_TYPES);
  assert.ok(result.errors.some(error => error.startsWith('Duplicate eu section')));
});

test('validation detects regional hierarchy cycles and malformed arrays', () => {
  const entries = data.ECTD_DATABASE.map(entry => ({ ...entry, regionalParentIds: { ...entry.regionalParentIds } }));
  entries[0].regionalParentIds.ca = entries[0].id;
  entries[1].regions = { eu: { ...entries[1].regions.eu, submissionTypes: null } };
  const result = core.validateDatabase(entries, data.REGIONS, data.SUBMISSION_TYPES);
  assert.ok(result.errors.some(error => error.includes('Regional hierarchy cycle')));
  assert.ok(result.errors.some(error => error.includes('submissionTypes array')));
});

test('accent-insensitive search finds paediatrics with plain Latin input', () => {
  const model = core.buildComparisonModel(data.ECTD_DATABASE, 'eu', 'us');
  const result = core.filterComparisonRows(model.rows, { search: 'padiatrie' });
  assert.ok(result.matchingIds.has('paediatrics'));
});

test('CSV neutralizes whitespace-prefixed spreadsheet formulas', () => {
  const model = core.buildComparisonModel(data.ECTD_DATABASE, 'eu', 'us');
  for (const topic of [' =WEBSERVICE("bad")', '\t=1+1', '\r@SUM(1)']) {
    const row = { ...model.rows[0], entry: { ...model.rows[0].entry, topic } };
    const csv = core.buildComparisonCsv([row], data.REGIONS.eu, data.REGIONS.us, data.DATASET_META);
    assert.ok(csv.includes(`"'${topic.replace(/"/g, '""')}"`));
  }
});

test('planning ZIP includes a readable notice with valid CRC and file sizes', () => {
  const content = 'PLANNING ONLY — not an eCTD submission template.';
  const bytes = zip.createFolderZip(['m1/eu/'], new Date(), { 'README.txt': content });
  const buffer = Buffer.from(bytes);
  let offset = 0;
  const files = new Map();
  while (buffer.readUInt32LE(offset) === 0x04034b50) {
    const size = buffer.readUInt32LE(offset + 18);
    const nameSize = buffer.readUInt16LE(offset + 26);
    const name = buffer.subarray(offset + 30, offset + 30 + nameSize).toString('utf8');
    const body = buffer.subarray(offset + 30 + nameSize, offset + 30 + nameSize + size);
    assert.equal(buffer.readUInt32LE(offset + 14), zip.crc32(body));
    files.set(name, body.toString('utf8'));
    offset += 30 + nameSize + size;
  }
  assert.equal(files.get('README.txt'), content);
  assert.equal(buffer.readUInt32LE(offset), 0x02014b50);
});

test('ZIP rejects directory traversal and absolute paths', () => {
  for (const folder of ['../outside/', '/absolute/', 'C:\\absolute\\', 'm1/../outside/']) {
    assert.throws(() => zip.createFolderZip([folder]), /Unsafe archive path/);
  }
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
