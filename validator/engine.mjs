import { DOMParser } from '@xmldom/xmldom';
import { md5 } from '@noble/hashes/legacy.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import catalogue from '../validation/eu-v8.2-catalogue.json' with { type: 'json' };
import trusted from '../validation/trusted-sources.json' with { type: 'json' };
import { RELEASE, IMPLEMENTED_IDS, TITLES, GAP_REASONS } from './config.mjs';
import { evaluatePdfRules } from './pdf-rules.mjs';

export { RELEASE, IMPLEMENTED_IDS, catalogue, trusted };
const XLINK = 'http://www.w3c.org/1999/xlink';
const utf8 = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });
const children = node => Array.from(node.childNodes || []).filter(child => child.nodeType === 1);
const direct = (node, tag) => children(node).filter(child => child.nodeName === tag);
const text = (node, tag) => direct(node, tag)[0]?.textContent.trim() || '';
const all = (node, tag) => Array.from(node.getElementsByTagName(tag));
const basename = path => path.split('/').at(-1);
const digest = (algorithm, input) => bytesToHex(algorithm(input));

export function normalizeFiles(input) {
  const entries = Array.from(input, item => ({ path: item.path ?? item.webkitRelativePath ?? item.name, file: item.file ?? item }));
  if (!entries.length) throw new Error('Select a sequence or application folder containing files.');
  if (entries.length > RELEASE.limits.files) throw new Error(`At most ${RELEASE.limits.files} files are supported.`);
  let total = 0;
  for (const item of entries) {
    if (typeof item.path !== 'string' || !item.path || /[\\\u0000-\u001f]|^(?:\/|[a-z]:)/i.test(item.path) || item.path.split('/').some(part => !part || part === '.' || part === '..')) throw new Error('Unsafe or ambiguous input path.');
    if (!Number.isSafeInteger(item.file.size) || item.file.size < 0 || typeof item.file.slice !== 'function') throw new Error('Unreadable input file.');
    total += item.file.size;
  }
  if (total > RELEASE.limits.totalBytes) throw new Error('The selected data exceeds the supported 32 GiB limit.');
  const roots = new Set(entries.map(item => item.path.split('/')[0]));
  if (roots.size === 1 && !/^\d{4}$/.test(entries[0].path.split('/')[0]) && entries.some(item => /^\d{4}$/.test(item.path.split('/')[1] || ''))) {
    entries.forEach(item => { item.path = item.path.slice(item.path.indexOf('/') + 1); });
  }
  const seen = new Set();
  for (const item of entries) {
    const key = item.path.toLowerCase();
    if (seen.has(key)) throw new Error(`Duplicate or case-colliding path: ${item.path}`);
    seen.add(key);
  }
  return entries.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
}

export function sequenceChoices(entries) {
  return [...new Set(entries.filter(item => /\/index\.xml$/i.test(item.path)).map(item => item.path.split('/')[0]))].sort();
}

export function resolveReference(basePath, reference) {
  if (!reference || reference.trim() !== reference || /[\\\u0000-\u0020]|^[a-z][a-z0-9+.-]*:|^\//i.test(reference)) return null;
  let decoded;
  try { decoded = decodeURIComponent(reference); } catch { return null; }
  if (/[\\\u0000-\u0020?#:]|^\//.test(decoded)) return null;
  const pieces = basePath.split('/').slice(0, -1);
  for (const part of decoded.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') { if (!pieces.length) return null; pieces.pop(); }
    else pieces.push(part);
  }
  return pieces.join('/');
}

export async function hashFile(file, onChunk) {
  const m = md5.create(), s = sha256.create();
  for (let offset = 0; offset < file.size; offset += 1024 * 1024) {
    const chunk = new Uint8Array(await file.slice(offset, offset + 1024 * 1024).arrayBuffer());
    if (chunk.length !== Math.min(1024 * 1024, file.size - offset)) throw new Error('File read was incomplete; no trustworthy manifest can be produced.');
    m.update(chunk); s.update(chunk);
    if (offset % (16 * 1024 ** 2) === 0) onChunk?.(Math.min(offset + chunk.length, file.size));
  }
  return { md5: bytesToHex(m.digest()), sha256: bytesToHex(s.digest()) };
}

export function prepareXml(source) {
  // Uploaded external subsets are never executed or loaded. Trusted DTDs are used separately.
  const scan = source.replace(/<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>/g, value => ' '.repeat(value.length));
  if (/<!ENTITY\b/i.test(scan) || /<!DOCTYPE[^>]*\[/i.test(scan)) throw new Error('Internal DTD subsets and entity declarations are outside the supported safe profile.');
  const declarations = [...scan.matchAll(/<!DOCTYPE\s+([^\s>]+)\s+(?:SYSTEM\s+(["'])(.*?)\2|PUBLIC\s+(["'])(.*?)\4\s+(["'])(.*?)\6)\s*>/gs)];
  if (declarations.length !== 1) throw new Error('Exactly one external DOCTYPE declaration is required by this profile.');
  const declaration = declarations[0];
  const stripped = source.slice(0, declaration.index) + source.slice(declaration.index + declaration[0].length);
  const encoding = /^\uFEFF?<\?xml\s[^?]*\bencoding\s*=\s*(["'])(.*?)\1/.exec(source)?.[2];
  if (encoding && !/^utf-8$/i.test(encoding)) throw new Error('Only UTF-8 backbone XML is supported by this release profile.');
  if (/<!DOCTYPE/i.test(scan.slice(0,declaration.index) + scan.slice(declaration.index+declaration[0].length))) throw new Error('Unsupported DOCTYPE declaration.');
  if (/\bxml:base\s*=/.test(stripped)) throw new Error('xml:base is outside this release profile; relative references cannot be assessed safely.');
  const errors = [];
  let doc;
  try { doc = new DOMParser({ onError: (level, message) => { errors.push(`${level}: ${message}`); } }).parseFromString(stripped, 'application/xml'); }
  catch (error) { throw new Error(`XML parsing failed: ${error.message}`); }
  if (errors.length || !doc?.documentElement) throw new Error(errors.join('\n') || 'Missing document element.');
  return { doc, stripped, declaredRoot: declaration[1], systemId: declaration[3] ?? declaration[7] };
}

export async function runValidation(input, options = {}) {
  const entries = normalizeFiles(input);
  const sequence = options.sequence || sequenceChoices(entries).at(-1);
  if (!sequence) throw new Error('No sequence backbone found. Select the named sequence folder containing index.xml.');
  const selected = entries.filter(item => item.path.startsWith(`${sequence}/`));
  if (!selected.length) throw new Error('The selected sequence is unavailable.');
  const files = new Map(entries.map(item => [item.path, item.file]));
  const manifest = [];
  for (const [index, item] of selected.entries()) {
    options.onProgress?.({ stage: 'hashing', current: index + 1, total: selected.length, path: item.path });
    manifest.push({ path: item.path, size: item.file.size, ...await hashFile(item.file, bytes => options.onProgress?.({ stage:'hashing',current:index+1,total:selected.length,path:item.path,bytes })) });
  }
  const hashes = new Map(manifest.map(item => [item.path, item]));
  const results = new Map();
  function put(id, probes, message = '') {
    if (!IMPLEMENTED_IDS.includes(id)) throw new Error(`Unregistered implementation: ${id}`);
    const counts = { pass: 0, fail: 0, 'not-evaluated': 0 };
    for (const probe of probes) counts[probe.status || (probe.ok ? 'pass' : 'fail')] += 1;
    const status = counts.fail ? 'fail' : counts['not-evaluated'] ? 'not-evaluated' : probes.length ? 'pass' : 'not-applicable';
    const findings = probes.filter(probe => probe.status === 'not-evaluated' || probe.ok === false).slice(0, 500).map(({ ok, status, ...finding }) => finding);
    results.set(id, { status, message, counts, findings, findingsTruncated: counts.fail + counts['not-evaluated'] > findings.length });
  }
  const probe = (ok, path, message, extra = {}) => ({ ok, path, message, ...extra });
  const unavailable = (path, message) => ({ status: 'not-evaluated', path, message });
  const local = [];
  const utilityRules = [
    ['1', 'util/dtd/ich-ectd-3-2.dtd'], ['2', 'util/style/ectd-2-0.xsl'], ['3', 'util/dtd/eu-regional.dtd'],
    ['4', 'util/dtd/eu-leaf.mod'], ['5', 'util/dtd/eu-envelope.mod'], ['6', 'util/style/eu-regional.xsl'],
  ];
  for (const [group, relative] of utilityRules) {
    const path = `${sequence}/${relative}`;
    const expected = trusted.files.find(file => file.path === relative);
    const sameName = selected.filter(item => basename(item.path) === basename(relative));
    put(`${group}.1`, [probe(sameName.length > 0, path, 'Expected utility filename is missing.')]);
    put(`${group}.2`, [probe(files.has(path), path, 'Expected utility location is missing.')]);
    put(`${group}.3`, [files.has(path) ? probe(hashes.get(path).md5 === expected.md5, path, 'Utility bytes differ from the pinned authority file.', { expected: expected.md5, actual: hashes.get(path).md5 }) : unavailable(path, 'Utility file missing; its checksum cannot be assessed.')]);
  }
  const indexPath = `${sequence}/index.xml`, euPath = `${sequence}/m1/eu/eu-regional.xml`, md5Path = `${sequence}/index-md5.txt`;
  const locationChecks = [['7.1',indexPath],['7.2',indexPath],['8.1',md5Path],['8.2',md5Path],['9.1',euPath],['9.2',euPath]];
  locationChecks.forEach(([id, path]) => put(id, [probe(files.has(path), path, 'Expected backbone/checksum file is missing at its specified path.')]));
  put('13.1', [probe(/^\d{4}$/.test(sequence), sequence, 'Sequence directory must contain exactly four digits.')]);
  if (files.has(indexPath) && files.has(md5Path) && files.get(md5Path).size <= 1024) {
    let claimed = '';
    try { claimed = decoder.decode(await files.get(md5Path).arrayBuffer()).trim(); } catch { /* invalid text remains a failed comparison */ }
    put('8.3', [probe(/^[a-f\d]{32}$/i.test(claimed) && claimed.toLowerCase() === hashes.get(indexPath).md5, md5Path, 'index-md5.txt must contain the MD5 of the original index.xml bytes.', { expected: hashes.get(indexPath).md5, actual: claimed.slice(0, 100) })]);
  } else put('8.3', [unavailable(md5Path, 'Backbone/checksum missing or checksum file exceeds the supported text limit.')]);

  const parsed = [];
  for (const [path, parseId, dtdId, refId, styleId, dtdFile, styleFile] of [
    [indexPath,'7.3','7.4','7.5','7.6','util/dtd/ich-ectd-3-2.dtd','util/style/ectd-2-0.xsl'],
    [euPath,'9.3','9.4','9.5','9.6','util/dtd/eu-regional.dtd','util/style/eu-regional.xsl'],
  ]) {
    const file = files.get(path);
    if (!file || file.size > RELEASE.limits.xmlBytes) {
      for (const id of [parseId,dtdId,refId,styleId]) put(id, [unavailable(path, !file ? 'Backbone missing.' : 'XML exceeds the supported 20 MiB limit.')]);
      continue;
    }
    let source, prepared;
    try { source = decoder.decode(await file.arrayBuffer()); prepared = prepareXml(source); }
    catch (error) {
      put(parseId, [unavailable(path, error.message)]);
      local.push({ id: 'LOCAL-XML-INPUT', status: 'fail', path, message: error.message });
      for (const id of [dtdId,refId,styleId]) put(id, [unavailable(path, 'XML input could not be safely parsed.')]);
      continue;
    }
    put(parseId, [probe(true, path, '')]);
    const expectedDtdPath = `${sequence}/${dtdFile}`;
    put(refId, [probe(prepared.declaredRoot === prepared.doc.documentElement.nodeName && resolveReference(path, prepared.systemId) === expectedDtdPath && files.has(expectedDtdPath), path, 'DOCTYPE must reference the expected local utility DTD and its correct root element.')]);
    const styles = Array.from(prepared.doc.childNodes).filter(node => node.nodeType === 7 && node.target === 'xml-stylesheet').map(node => /\bhref\s*=\s*(["'])(.*?)\1/.exec(node.data)?.[2]);
    put(styleId, [probe(styles.length === 1 && resolveReference(path, styles[0]) === `${sequence}/${styleFile}` && files.has(`${sequence}/${styleFile}`), path, 'Expected local XML stylesheet reference is missing or incorrect.')]);
    const requiredDtds = path === euPath ? ['util/dtd/eu-regional.dtd','util/dtd/eu-leaf.mod','util/dtd/eu-envelope.mod'] : ['util/dtd/ich-ectd-3-2.dtd'];
    const baselineMatches = requiredDtds.every(name => hashes.get(`${sequence}/${name}`)?.md5 === trusted.files.find(item => item.path === name).md5);
    if (!baselineMatches) put(dtdId, [unavailable(path, 'Uploaded DTD/dependencies differ from the pinned baseline or are missing. Untrusted definitions are not executed; DTD validity is not asserted.')]);
    else if (!options.validateDtd) put(dtdId, [unavailable(path, 'DTD engine unavailable; structural validity has not been checked.')]);
    else {
      options.onProgress?.({ stage: 'dtd', path });
      try {
        const validation = await options.validateDtd({ xml: prepared.stripped, dtdName: basename(dtdFile), trustedFiles: trusted.files.filter(item => item.path.startsWith('util/dtd/')).map(item => ({ fileName: basename(item.path), contents: item.contents })) });
        put(dtdId, [probe(validation.valid === true && prepared.declaredRoot === prepared.doc.documentElement.nodeName, path, validation.valid ? 'DTD document type and document element must agree.' : String(validation.rawOutput || 'DTD validation failed.').slice(0, 12000))]);
      } catch (error) { put(dtdId, [unavailable(path, `DTD engine could not complete: ${error.message}`)]); }
    }
    parsed.push({ path, ...prepared });
  }
  const completeXml = parsed.length === 2;
  const leaves = parsed.flatMap(xml => all(xml.doc, 'leaf').map(node => ({ node, path: xml.path, href: node.getAttributeNS(XLINK, 'href') || '', operation: node.getAttribute('operation'), id: node.getAttribute('ID') || '' })));
  const leafProbes = new Map(['11.1','11.2','11.3','11.4','11.5','11.6','11.7','11.8','11.11','15.BP4','15.BP5'].map(id => [id, []]));
  const used = new Set();
  const ids = new Set();
  const leafSections = new Map();
  function countryFor(node) {
    for (let cursor = node.parentNode; cursor?.nodeType === 1; cursor = cursor.parentNode) {
      if (['specific','pi-doc'].includes(cursor.nodeName)) return cursor.getAttribute('country');
    }
    return null;
  }
  for (const leaf of leaves) {
    const p = (ok, message, extra = {}) => probe(ok, leaf.path, message, { leafId: leaf.id, ...extra });
    leafProbes.get('11.1').push(p(/^md5$/i.test(leaf.node.getAttribute('checksum-type') || ''), 'Leaf checksum-type must be md5.'));
    leafProbes.get('11.3').push(p(Boolean(text(leaf.node, 'title')), 'Leaf title must not be empty.'));
    leafProbes.get('11.11').push(p(Boolean(leaf.id) && !ids.has(leaf.id), 'Leaf ID missing or duplicated across the selected sequence.'));
    ids.add(leaf.id);
    if (['new','replace','append'].includes(leaf.operation)) {
      const target = resolveReference(leaf.path, leaf.href);
      const validUri = Boolean(target) && /^(?:\.\.\/)*(?:[a-z0-9-]+\/)*[a-z0-9-]+\.[a-z0-9]+$/.test(leaf.href);
      leafProbes.get('11.4').push(p(Boolean(leaf.href) && validUri, 'Leaf URI must be a safe relative file URI using permitted characters.', { reference: leaf.href }));
      if (target) {
        used.add(target);
        const sections = leafSections.get(target) || [];
        for (let cursor = leaf.node.parentNode; cursor?.nodeType === 1; cursor = cursor.parentNode) sections.push(cursor.nodeName);
        leafSections.set(target, sections);
      }
      const targetSequence = target?.split('/')[0];
      if (!target || !/^\d{4}$/.test(targetSequence || '') || Number(targetSequence) > Number(sequence)) {
        leafProbes.get('11.6').push(p(false, 'Reference leaves the selected application or targets an invalid/future sequence.', { reference: leaf.href }));
        leafProbes.get('11.2').push(unavailable(leaf.path, 'Referenced file cannot be hashed.'));
      } else if (!files.has(target)) {
        const finding = targetSequence !== sequence ? unavailable(leaf.path, `Earlier sequence ${targetSequence} or its referenced file was not supplied: ${target}`) : p(false, `Referenced file not found: ${target}`);
        leafProbes.get('11.6').push(finding);
        leafProbes.get('11.2').push(unavailable(leaf.path, `File unavailable: ${target}`));
      } else {
        leafProbes.get('11.6').push(p(true, ''));
        const actual = hashes.get(target) || await hashFile(files.get(target));
        if (!hashes.has(target)) hashes.set(target, { path:target, size:files.get(target).size, ...actual });
        const expected = leaf.node.getAttribute('checksum') || '';
        leafProbes.get('11.2').push(p(/^[a-f\d]{32}$/i.test(expected) && actual.md5 === expected.toLowerCase(), `Leaf MD5 mismatch: ${target}`, { expected, actual: actual.md5, reference: target }));
      }
      const country = countryFor(leaf.node);
      if (country && target) {
        const locations = { 'm1-0-cover':'10-cover', 'm1-2-form':'12-form', 'm1-3-1-spc-label-pl':'13-pi/131-spclabelpl', 'm1-3-2-mockup':'13-pi/132-mockup', 'm1-3-3-specimen':'13-pi/133-specimen', 'm1-3-4-consultation':'13-pi/134-consultation', 'm1-3-5-approved':'13-pi/135-approved', 'm1-responses':'responses', 'm1-additional-data':'additional-data' };
        let section = leaf.node.parentNode;
        while (section && !locations[section.nodeName]) section = section.parentNode;
        const expectedFolder = section ? `${targetSequence}/m1/eu/${locations[section.nodeName]}/${country}/` : null;
        leafProbes.get('15.BP4').push(expectedFolder ? p(target.startsWith(expectedFolder), 'Country folder does not match the XML specific/pi-doc country at the required section.', { reference: leaf.href, country }) : unavailable(leaf.path,'Country-folder section is outside the supported mapping.'));
        leafProbes.get('15.BP5').push(p(basename(target).startsWith(`${country}-`), 'Country filename prefix does not match the XML country.', { reference: leaf.href, country }));
      }
    }
    if (leaf.operation === 'delete') leafProbes.get('11.5').push(p(!leaf.href, 'A delete leaf must not specify xlink:href.'));
    if (['replace','delete','append'].includes(leaf.operation)) leafProbes.get('11.7').push(p(Boolean((leaf.node.getAttribute('modified-file') || '').trim()), 'Lifecycle operation requires modified-file.'));
    if (leaf.operation === 'new') leafProbes.get('11.8').push(p(!(leaf.node.getAttribute('modified-file') || '').trim(), 'A new leaf must not specify modified-file.'));
  }
  for (const [id, probes] of leafProbes) put(id, completeXml ? probes : [...probes, unavailable(sequence, 'Both XML backbones must be readable to complete this check.')]);
  const headingProbes = [], extensionProbes = [];
  const isHeading = node => /^(?:m[1-5](?:-|$)|specific$|pi-doc$|node-extension$)/.test(node.nodeName);
  parsed.forEach(xml => all(xml.doc, '*').forEach(node => {
    if (isHeading(node) && !children(node).some(isHeading)) headingProbes.push(probe(all(node, 'leaf').length > 0, xml.path, `Lowest heading has no leaf: ${node.nodeName}`));
    if (node.nodeName === 'node-extension') extensionProbes.push(probe(Boolean(text(node, 'title')), xml.path, 'Node-extension title must not be empty.'));
  }));
  put('10.1', completeXml ? headingProbes : [unavailable(sequence, 'Both backbones are needed to assess headings.')]);
  put('12.1', completeXml ? extensionProbes : [unavailable(sequence, 'Both backbones are needed to assess node extensions.')]);

  const regional = parsed.find(xml => xml.path === euPath);
  const envelopes = regional ? all(regional.doc, 'envelope').map(node => ({ node, country: node.getAttribute('country'), uuid: text(node, 'identifier'), sequence: text(node, 'sequence'), related: direct(node, 'related-sequence').map(item => item.textContent.trim()), procedure: direct(node,'procedure')[0]?.getAttribute('type'), submission: direct(node,'submission')[0]?.getAttribute('type'), mode: direct(node,'submission')[0]?.getAttribute('mode'), unit: direct(node,'submission-unit')[0]?.getAttribute('type') })) : [];
  if (!envelopes.length) {
    for (const id of ['9.7','9.9','13.3',...IMPLEMENTED_IDS.filter(id => id.startsWith('14.')),'15.11','15.12']) put(id, [unavailable(euPath, 'No safely parsed envelope is available.')]);
  } else {
    const cp = envelopes.some(e => e.procedure === 'centralised' && e.submission !== 'cep');
    const mrp = envelopes.some(e => ['mutual-recognition','decentralised'].includes(e.procedure));
    const national = envelopes.some(e => e.procedure === 'national');
    const cep = envelopes.some(e => e.submission === 'cep');
    const countrySpecific = value => /^[a-z]{2}$/.test(value || '');
    put('9.7', envelopes.map(e => probe(/^[a-f\d]{8}-[a-f\d]{4}-[1-5][a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(e.uuid), euPath, 'Envelope UUID must have the supported ISO UUID layout/variant.')));
    put('9.9', [probe(new Set(envelopes.map(e => e.uuid.toLowerCase())).size === 1, euPath, 'Envelope UUIDs differ.')]);
    put('13.3', envelopes.map(e => probe(e.sequence === sequence, euPath, 'Envelope sequence differs from folder name.', { expected: sequence, actual: e.sequence })));
    put('14.1', cp ? [probe(envelopes.length === 1 && envelopes[0].country === 'ema', euPath, 'A centralised non-CEP submission needs one ema envelope.')] : []);
    put('14.2', mrp ? [probe(envelopes.every(e => countrySpecific(e.country)), euPath, 'MRP/DCP requires country-specific envelopes.')] : []);
    put('14.3', national ? [probe(envelopes.length === 1 && countrySpecific(envelopes[0].country), euPath, 'A national submission needs one country-specific envelope.')] : []);
    put('14.4', cep ? [probe(envelopes.length === 1 && envelopes[0].country === 'edqm', euPath, 'A CEP submission needs one edqm envelope.')] : []);
    put('14.9', envelopes.filter(e => e.country === 'edqm').map(e => probe(e.procedure === 'centralised', euPath, 'EDQM procedure must be centralised.')));
    for (const [id, isDelete] of [['14.5',false],['14.BP3',true]]) {
      const probes = leaves.filter(l => l.path === euPath && (isDelete ? l.operation === 'delete' : ['new','replace','append'].includes(l.operation))).flatMap(l => {
        const country = countryFor(l.node);
        return country && country !== 'common' ? [probe(envelopes.some(e => e.country === country), euPath, 'No matching envelope for country-specific leaf.', { country, leafId: l.id })] : [];
      });
      put(id, probes);
    }
    put('14.6', envelopes.filter(e => ['initial','reformat'].includes(e.unit)).map(e => probe(e.related.length > 0 && e.related.every(n => n === sequence), euPath, 'Initial/reformat related-sequence must equal the current sequence.')));
    put('14.7', envelopes.filter(e => !['initial','reformat'].includes(e.unit)).map(e => probe(e.related.length > 0 && e.related.every(n => /^\d{4}$/.test(n) && n !== sequence), euPath, 'Follow-up related-sequence must differ from the current sequence.')));
    put('14.8', envelopes.filter(e => e.submission === 'maa' && e.unit === 'initial').map(e => probe(Boolean(text(e.node,'inn')), euPath, 'Initial MAA needs a populated INN.')));
    put('14.BP4', envelopes.filter(e => ['grouping','worksharing'].includes(e.mode) && e.submission !== 'psusa').map(e => probe(Boolean(text(direct(e.node,'submission')[0], 'number')), euPath, 'Grouped/worksharing submission should include its high-level number.')));
    put('14.BP5', envelopes.filter(e => !['grouping','worksharing'].includes(e.mode)).map(e => probe(!direct(direct(e.node,'submission')[0],'number').length, euPath, 'High-level number should be absent outside grouping/worksharing.')));
    put('14.BP7', envelopes.filter(e => e.mode === 'grouping').map(e => probe(['var-type1a','var-type1ain','var-type1b','var-type2','extension'].includes(e.submission), euPath, 'Submission type is not a supported grouped type.')));
    put('14.BP8', envelopes.filter(e => e.mode === 'worksharing').map(e => probe(['var-type1b','var-type2','psusa'].includes(e.submission), euPath, 'Submission type is not a supported worksharing type.')));
    const prefixes = cp ? ['ema'] : mrp ? ['common'] : national ? [envelopes[0].country] : [];
    const tracking = selected.filter(item => /\/[^/]*tracking[^/]*\.[^/]+$/.test(item.path));
    put('15.11', cep ? [] : prefixes.length ? prefixes.map(prefix => probe(tracking.some(item => item.path.startsWith(`${sequence}/m1/eu/10-cover/${prefix}/`)), euPath, `Tracking table required under 10-cover/${prefix}.`)) : [unavailable(euPath, 'Procedure does not map to a supported tracking-table location.')]);
    put('15.12', cep ? [] : prefixes.length ? prefixes.map(prefix => probe(tracking.some(item => new RegExp(`^${sequence}/m1/eu/10-cover/${prefix}/${prefix}-tracking(?:-[a-z0-9-]+)?\\.pdf$`).test(item.path)), euPath, 'Tracking table must use the country prefix and PDF filename convention.')) : [unavailable(euPath, 'Tracking filename cannot be assessed for this procedure.')]);
  }
  const folders = [...new Set(selected.flatMap(item => { const parts = item.path.split('/').slice(0,-1); return parts.map((part,index) => parts.slice(0,index+1).join('/')); }))];
  put('15.3', selected.map(item => probe(item.path.length <= 180, item.path, 'Path exceeds 180 characters, counted from sequence folder.')));
  put('15.4', selected.map(item => probe(basename(item.path).length <= 64, item.path, 'Filename exceeds 64 characters.')));
  put('15.5', folders.map(path => probe(basename(path).length <= 64, path, 'Folder name exceeds 64 characters.')));
  put('15.6', selected.map(item => probe(/^[a-z0-9-]+\.[a-z0-9]+$/.test(basename(item.path)), item.path, 'Filename uses characters outside this supported eCTD naming profile.')));
  put('15.7', folders.map(path => probe(/^[a-z0-9-]+$/.test(basename(path)), path, 'Folder name uses characters outside this supported eCTD naming profile.')));
  put('15.8', completeXml ? selected.filter(item => new RegExp(`^${sequence}/m[1-5]/`).test(item.path) && !item.path.includes('/util/')).map(item => probe(used.has(item.path), item.path, 'File is not referenced by either selected backbone.')) : [unavailable(sequence, 'Unreferenced-file check requires both XML backbones.')]);
  put('15.9', selected.filter(item => item.path.split('/').length === 2).map(item => probe(['index.xml','index-md5.txt'].includes(basename(item.path)), item.path, 'Unexpected file in sequence root.')));
  const isVideo = path => /\.(?:mp4|mpg|mpeg|avi|mov|wmv)$/i.test(path);
  put('15.BP1', selected.filter(item => !isVideo(item.path)).map(item => probe(item.file.size <= 500 * 1000 ** 2, item.path, 'File exceeds the configured 500 MB (decimal) recommendation threshold.')));
  put('15.BP6', selected.filter(item => isVideo(item.path)).map(item => probe(item.file.size <= 1000 ** 3, item.path, 'Video exceeds the configured 1 GB (decimal) recommendation threshold.')));
  const pdfProbes = await evaluatePdfRules({ selected, files, sequence, leafSections, centralised: envelopes.some(e => e.procedure === 'centralised'), inspectPdf: options.inspectPdf, maxBytes: RELEASE.limits.pdfBytes, onProgress: options.onProgress });
  for (const [id, probes] of pdfProbes) put(id, probes);

  const ruleResults = catalogue.rules.map(rule => ({
    ...rule, title: TITLES[rule.id] || `${rule.category} · ${rule.id}`,
    implemented: IMPLEMENTED_IDS.includes(rule.id),
    ...(results.get(rule.id) || { status: 'not-evaluated', message: GAP_REASONS[rule.id] || (rule.historyRequired ? GAP_REASONS.history : GAP_REASONS.other), findings: [], counts: {} }),
  }));
  for (const id of IMPLEMENTED_IDS) if (!results.has(id)) throw new Error(`Implementation did not produce a result for ${id}`);
  const failures = ruleResults.filter(r => r.status === 'fail' && r.type === 'P/F').length;
  const warnings = ruleResults.filter(r => r.status === 'fail' && r.type === 'BP').length;
  const report = {
    schemaVersion: '1.0', applicationVersion: RELEASE.version, rulepack: RELEASE.rulepack,
    buildCommit: typeof __BUILD_COMMIT__ === 'undefined' ? 'working-tree' : __BUILD_COMMIT__,
    runId: options.runId || globalThis.crypto.randomUUID(), createdAt: options.createdAt || new Date().toISOString(),
    inputKind: options.inputKind || 'user-selected', sequence, environment: options.environment || {},
    pdfEngine: options.pdfEngine || null,
    intendedUse: RELEASE.intendedUse, qualification: RELEASE.qualification, certification: 'NOT_CERTIFIED',
    overall: failures || local.length ? 'issues-found' : 'incomplete',
    fullEuValidationComplete: false,
    summary: { files: manifest.length, bytes: manifest.reduce((sum,f) => sum + f.size,0), implemented: IMPLEMENTED_IDS.length, catalogue: catalogue.rules.length, failedRules: failures, bestPracticeWarnings: warnings, notEvaluated: ruleResults.filter(r => r.status === 'not-evaluated').length, localErrors: local.length },
    sources: { criteriaUrl: catalogue.sourceUrl, criteriaSha256: catalogue.sourceSha256, utilityArchiveUrl: trusted.sourceUrl, utilityArchiveSha256: trusted.archiveSha256, reviewedAt: catalogue.reviewedAt },
    limitations: [
      'This release is not approved for operational reliance until organizational QA completes qualification and signs the intended-use release.',
      'Full EU validation is incomplete. Lifecycle state, empty directories and other gaps are explicitly listed in rule results.',
      'PDF criteria are read with pdf.js, which tolerates some damaged files, and do not include links created with JavaScript or backslashes hidden in compressed objects. Confirm PDF results against an approved reference validator.',
      'Prior files supplied for reference hashing are evidence of availability only, not of authority receipt or valid lifecycle state.',
      'No malware scan, clinical/CMC/content assessment, electronic signature, immutable audit trail or authority acceptance decision is provided.',
      'The report digest is not a digital signature. Store approved evidence and its digest independently under your document-control procedure.',
    ],
    manifest, referenceManifest: [...hashes.values()].filter(item => !item.path.startsWith(sequence+'/')).sort((a,b)=>a.path < b.path ? -1 : 1), rules: ruleResults, localFindings: local,
  };
  report.reportSha256 = digest(sha256, utf8.encode(JSON.stringify(report)));
  return report;
}
