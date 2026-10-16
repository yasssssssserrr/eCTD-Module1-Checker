export const RELEASE = Object.freeze({
  version: '7.0.0', rulepack: 'EU-3.2.2-M1-3.1.1-VC8.2-r1',
  qualification: 'PENDING_ORGANIZATIONAL_APPROVAL',
  intendedUse: 'Supplementary technical preflight of a selected EU eCTD 3.2.2 sequence. No submission-release decision.',
  limits: { files: 20000, totalBytes: 32 * 1024 ** 3, xmlBytes: 20 * 1024 ** 2 },
});

export const IMPLEMENTED_IDS = Object.freeze([
  '1.1','1.2','1.3','2.1','2.2','2.3','3.1','3.2','3.3','4.1','4.2','4.3','5.1','5.2','5.3','6.1','6.2','6.3',
  '7.1','7.2','7.3','7.4','7.5','7.6','8.1','8.2','8.3','9.1','9.2','9.3','9.4','9.5','9.6','9.7','9.9','10.1',
  '11.1','11.2','11.3','11.4','11.5','11.6','11.7','11.8','11.11','12.1','13.1','13.3',
  '14.1','14.2','14.3','14.4','14.5','14.6','14.7','14.8','14.9','14.BP3','14.BP4','14.BP5','14.BP7','14.BP8',
  '15.3','15.4','15.5','15.6','15.7','15.8','15.9','15.11','15.12','15.BP1','15.BP4','15.BP5','15.BP6',
]);

export const TITLES = {
  '7.3': 'ICH XML well-formedness', '7.4': 'ICH DTD validity', '7.5': 'ICH DTD reference', '7.6': 'ICH stylesheet reference',
  '8.3': 'Index MD5 integrity', '9.3': 'EU XML well-formedness', '9.4': 'EU DTD validity', '9.5': 'EU DTD reference', '9.6': 'EU stylesheet reference',
  '9.7': 'Envelope UUID format', '9.9': 'UUID consistency across envelopes', '10.1': 'Content in lowest headings',
  '11.1': 'Leaf checksum algorithm', '11.2': 'Leaf file MD5 integrity', '11.3': 'Leaf title', '11.4': 'Non-delete leaf URI',
  '11.5': 'Delete leaf URI', '11.6': 'Referenced file availability', '11.7': 'Lifecycle target required', '11.8': 'New leaf has no lifecycle target', '11.11': 'Unique leaf IDs across both backbones',
  '12.1': 'Node-extension title', '13.1': 'Four-digit sequence folder', '13.3': 'Envelope sequence matches folder',
  '14.1': 'Centralised envelopes', '14.2': 'MRP/DCP envelopes', '14.3': 'National envelope', '14.4': 'EDQM envelope',
  '14.5': 'Country-specific leaf envelope', '14.6': 'Initial/reformat related sequence', '14.7': 'Follow-up related sequence', '14.8': 'Initial MAA INN', '14.9': 'EDQM procedure',
  '14.BP3': 'Delete leaf country envelope', '14.BP4': 'Grouping/worksharing number', '14.BP5': 'Number outside grouping/worksharing', '14.BP7': 'Grouped submission type', '14.BP8': 'Worksharing submission type',
  '15.3': 'Path length ≤180 characters', '15.4': 'Filename length ≤64 characters', '15.5': 'Folder name length ≤64 characters',
  '15.6': 'Filename characters', '15.7': 'Folder name characters', '15.8': 'Unreferenced module files', '15.9': 'Sequence-root files',
  '15.11': 'Tracking table location', '15.12': 'Tracking table filename', '15.BP1': 'Non-video size recommendation',
  '15.BP4': 'Country folder matches XML', '15.BP5': 'Country filename matches XML', '15.BP6': 'Video size recommendation',
};

export const GAP_REASONS = {
  history: 'Not implemented: lifecycle history and prior authority receipt state require a separate validated workflow.',
  pdf: 'Not implemented: PDF version/catalogue, encryption, attachments, rendering, links, bookmarks and document properties need a dedicated qualified PDF engine.',
  '15.10': 'Not observable with browser folder selection: empty directories are not included in FileList.',
  other: 'Not implemented in this release. Review the official rule and perform the required independent check.',
};
