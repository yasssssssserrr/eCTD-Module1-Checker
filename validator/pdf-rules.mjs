const PDF_RULES = ['16.1','16.2','16.3','16.4','16.5','16.6','16.7','16.BP1','16.BP2','16.BP3','16.BP4','16.BP5','16.BP6','16.BP7','16.BP8','16.BP9','16.BP10','16.BP11'];
const SECTION_PATHS = [
  ['m1-0-cover', /\/m1\/eu\/10-cover\//], ['m1-2-form', /\/m1\/eu\/12-form\//], ['m1-3-1-spc-label-pl', /\/m1\/eu\/13-pi\/131-spclabelpl\//],
  ['m3-3-literature-references', /\/m3\/33-lit/], ['m4-3-literature-references', /\/m4\/43-lit/], ['m5-4-literature-references', /\/m5\/54-lit/],
];
const SECURITY_EXEMPT = ['m1-0-cover','m1-2-form','m3-3-literature-references','m4-3-literature-references','m5-4-literature-references'];
// Rule 16.4 allows changing the document (8), commenting (32) and assembly/page extraction/template pages (1024).
const FORM_ALLOWED_RESTRICTIONS = new Set([8, 32, 1024]);
const PERMISSION_NAMES = { 4:'printing', 8:'changing the document', 16:'content copying', 32:'commenting', 256:'filling form fields', 512:'copying for accessibility', 1024:'document assembly', 2048:'high-quality printing' };
const SUPPORTED_VERSIONS = ['1.4','1.5','1.6','1.7'];
const describe = flags => flags.map(flag => PERMISSION_NAMES[flag] || flag).join(', ');

function sectionsOf(path, leafSections) {
  const sections = new Set(leafSections.get(path) || []);
  for (const [section, pattern] of SECTION_PATHS) if (pattern.test(path)) sections.add(section);
  return sections;
}

function classifyForm(properties) {
  const application = `${properties.creator} ${properties.producer}`;
  if (/Designer 6\.5/i.test(application)) return 'interactive';
  if (/PDF generator/i.test(application) && /European Medicines Agency/i.test(properties.author)) return 'plm';
  return 'unknown';
}

function linkFile(basePath, target) {
  const normalized = target.replace(/\\/g, '/');
  if (/^(?:[a-z][a-z0-9+.-]*:|\/)/i.test(normalized)) return null;
  const pieces = basePath.split('/').slice(0, -1);
  for (const part of normalized.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') { if (!pieces.length) return null; pieces.pop(); } else pieces.push(part);
  }
  return pieces.join('/');
}

/** Evaluates criteria group 16 for every PDF in the selected sequence and returns rule probes. */
export async function evaluatePdfRules({ selected, files, sequence, leafSections, centralised, inspectPdf, maxBytes, onProgress }) {
  const probes = new Map(PDF_RULES.map(id => [id, []]));
  const add = (id, ok, path, message, extra = {}) => probes.get(id).push({ ok, path, message, ...extra });
  const open = (id, path, message) => probes.get(id).push({ status: 'not-evaluated', path, message });
  const pdfs = selected.filter(item => /\.pdf$/i.test(item.path));
  if (!inspectPdf) {
    const scope = pdfs.length ? pdfs.map(item => item.path) : [];
    for (const id of PDF_RULES) scope.forEach(path => open(id, path, 'PDF engine unavailable; this file has not been checked.'));
    return probes;
  }
  for (const [index, item] of pdfs.entries()) {
    const { path } = item;
    onProgress?.({ stage: 'pdf', current: index + 1, total: pdfs.length, path });
    const sections = sectionsOf(path, leafSections);
    const security = sections.has('m1-0-cover') || sections.has('m1-2-form');
    const skipAll = message => PDF_RULES.forEach(id => open(id, path, message));
    if (item.file.size > maxBytes) { skipAll(`File exceeds the supported ${maxBytes / 1024 ** 2} MiB PDF inspection limit; check it independently.`); continue; }
    let facts;
    try { facts = await inspectPdf(new Uint8Array(await item.file.arrayBuffer()), (page, pages) => onProgress?.({ stage: 'pdf', current: index + 1, total: pdfs.length, path, page, pages })); }
    catch (error) { skipAll(`PDF engine could not complete: ${error.message}`); continue; }
    if (!facts.opened) {
      if (facts.error === 'read') skipAll(`The file opened but its properties could not be read: ${facts.message}`);
      else if (facts.error === 'password' || facts.error === 'encryption') {
        add('16.2', false, path, facts.error === 'password' ? 'A password is required to open this file.' : 'This file uses certificate or other unsupported opening security.');
        for (const id of PDF_RULES.filter(id => id !== '16.2')) open(id, path, 'File cannot be opened because of its security settings.');
      } else {
        add('16.5', false, path, `File could not be opened as a PDF: ${facts.message}`);
        for (const id of PDF_RULES.filter(id => id !== '16.5')) open(id, path, 'File could not be opened.');
      }
      continue;
    }
    add('16.5', facts.pages > 0, path, 'The PDF contains no readable pages.');
    add('16.2', true, path, '');
    const lowVersion = /^1\.[0-3]$/.test(facts.header || '') ? facts.header : null;
    const version = lowVersion && facts.version === lowVersion ? lowVersion : facts.version;
    add('16.1', !/^1\.[0-3]$/.test(version || ''), path, `PDF version ${version} is 1.3 or earlier.`, { actual: version });
    add('16.BP1', SUPPORTED_VERSIONS.includes(version), path, `PDF version ${version} is outside 1.4–1.7.`, { actual: version });
    if (!security && !sections.has('m3-3-literature-references') && !sections.has('m4-3-literature-references') && !sections.has('m5-4-literature-references') && !facts.signed) add('16.3', !facts.restricted.length, path, `Security restrictions are set: ${describe(facts.restricted)}.`);
    if (security) {
      const forbidden = facts.restricted.filter(flag => !FORM_ALLOWED_RESTRICTIONS.has(flag));
      add('16.4', !forbidden.length, path, `Security restrictions outside the allowed list: ${describe(forbidden)}.`);
    }
    if (sections.has('m1-2-form')) {
      const form = classifyForm(facts.properties);
      const xml = facts.attachments.filter(name => /\.xml$/i.test(name || ''));
      if (form === 'unknown') for (const id of ['16.6','16.7']) open(id, path, 'File could not be identified as a PLM or interactive eAF from its properties. If it is an eAF, check its attachments independently.');
      else if (form === 'plm') add('16.6', xml.length > 0, path, 'PLM Portal eAF has no attached XML. The attachment name is checked, not its FHIR content.');
      else { add('16.6', !facts.attachments.length, path, 'Interactive eAF must not contain attachments.'); add('16.7', !facts.attachments.length, path, 'Interactive eAF must not contain attachments.'); }
    }
    add('16.BP5', security || facts.linearized, path, 'Fast Web View (linearization) is not active.');
    add('16.BP6', !facts.pageLayout && (!facts.openAction?.dest || facts.openZoom === 'inherit'), path, `Initial view is not default: layout ${facts.pageLayout || 'default'}, open action zoom ${facts.openZoom || 'default'}.`);
    if (facts.bookmarks) add('16.BP8', facts.pageMode === 'UseOutlines', path, 'Bookmarks exist but the bookmarks pane is not set to open.');
    else add('16.BP9', facts.pageMode !== 'UseOutlines', path, 'The bookmarks pane is set to open but the file has no bookmarks.');
    if (sections.has('m1-3-1-spc-label-pl') && centralised) {
      const missing = ['title','author','subject','keywords'].filter(name => !facts.properties[name].trim());
      add('16.BP11', !missing.length, path, `Document properties are empty: ${missing.join(', ')}.`);
    }
    if (!facts.linksComplete) for (const id of ['16.BP2','16.BP3','16.BP4','16.BP7','16.BP10']) open(id, path, 'Link annotations beyond the supported page limit were not read.');
    const fileLinks = facts.links.filter(link => link.kind === 'file');
    const broken = facts.links.filter(link => link.kind === 'internal' && !link.valid).length;
    const sameSequence = [], otherSequence = [], absolute = [];
    for (const link of fileLinks) {
      const target = linkFile(path, link.target);
      if (!target) absolute.push(link.target);
      else if (target.split('/')[0] === sequence) sameSequence.push(target);
      else otherSequence.push(target);
    }
    const missingSame = sameSequence.filter(target => !files.has(target));
    if (facts.links.length) add('16.BP2', !broken && !missingSame.length && !absolute.length, path, `Invalid targets: ${broken} internal; ${[...missingSame, ...absolute].slice(0, 5).join(', ') || 'no files'}.`);
    for (const target of otherSequence) {
      const number = target.split('/')[0];
      if (files.has(target)) add('16.BP3', true, path, '');
      else if (/^\d{4}$/.test(number) && Number(number) < Number(sequence)) open('16.BP3', path, `Earlier sequence file was not supplied: ${target}`);
      else add('16.BP3', false, path, `Link target leaves the application or points to a later sequence: ${target}`);
    }
    const fixed = facts.links.filter(link => link.zoom === 'fixed').length;
    const unknown = facts.links.filter(link => link.zoom === 'unknown' && link.kind === 'file').length;
    if (facts.links.length) add('16.BP4', !fixed, path, `${fixed} of ${facts.links.length} links or bookmarks set a fixed zoom or fit.`);
    if (unknown && !fixed) open('16.BP4', path, `${unknown} links to other files name a destination whose zoom cannot be read here.`);
    if (fileLinks.length) {
      add('16.BP7', !absolute.length, path, `Absolute links: ${absolute.slice(0, 5).join(', ')}.`);
      const backslash = facts.rawBackslashLink || fileLinks.some(link => link.target.includes('\\'));
      add('16.BP10', !backslash, path, 'A link to another file uses backslashes.');
    }
  }
  return probes;
}
