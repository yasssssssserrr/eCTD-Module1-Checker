import crypto from 'node:crypto';

const PAD = Buffer.from('28BF4E5E4E758A4164004E56FFFA01082E2E00B6D0683E802F0CA9FE6453697A', 'hex');
const hex = buffer => `<${Buffer.from(buffer).toString('hex')}>`;

function rc4(key, data) {
  const state = Array.from({ length: 256 }, (_, index) => index);
  for (let i = 0, j = 0; i < 256; i += 1) { j = (j + state[i] + key[i % key.length]) & 255; [state[i], state[j]] = [state[j], state[i]]; }
  const output = Buffer.alloc(data.length);
  for (let index = 0, i = 0, j = 0; index < data.length; index += 1) {
    i = (i + 1) & 255; j = (j + state[i]) & 255; [state[i], state[j]] = [state[j], state[i]];
    output[index] = data[index] ^ state[(state[i] + state[j]) & 255];
  }
  return output;
}

/** Standard security handler revision 2 with an empty user password, so the file opens but keeps its restrictions. */
function encryption(allowed) {
  const id = Buffer.alloc(16, 7);
  const owner = rc4(crypto.createHash('md5').update(PAD).digest().subarray(0, 5), PAD);
  const permissions = (allowed | 0xFFFFF0C0) | 0;
  const p = Buffer.alloc(4); p.writeInt32LE(permissions);
  const key = crypto.createHash('md5').update(Buffer.concat([PAD, owner, p, id])).digest().subarray(0, 5);
  return { id, object: `<< /Filter /Standard /V 1 /R 2 /O ${hex(owner)} /U ${hex(rc4(key, PAD))} /P ${permissions} >>` };
}

/**
 * Builds a small, real PDF. `catalog` and `page` add dictionary entries; `objects` adds indirect objects from number 6.
 * Set `info` to fill document properties, `allowed` for encryption permissions, `password` to require a password.
 */
export function buildPdf({ version = '1.7', catalog = '', page = '', objects = [], info = '', allowed, password = false, linearized = false } = {}) {
  const stream = 'BT /F1 12 Tf 50 750 Td (SYNTHETIC FIXTURE) Tj ET';
  const body = [
    `<< /Type /Catalog /Pages 2 0 R ${catalog} >>`,
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R ${page} >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    ...objects,
  ];
  const secured = allowed !== undefined || password ? encryption(allowed ?? 0) : null;
  if (password) secured.object = secured.object.replace(/\/U <[0-9a-f]+>/, `/U ${hex(Buffer.alloc(32, 9))}`);
  const extra = [];
  if (info) extra.push(['Info', `<< ${info} >>`]);
  if (secured) extra.push(['Encrypt', secured.object]);
  const render = lengthField => {
    const offsets = new Map();
    let text = `%PDF-${version}\n`;
    let number = body.length;
    const trailer = [];
    if (linearized) { number += 1; offsets.set(number, text.length); text += `${number} 0 obj\n<< /Linearized 1 /L ${String(lengthField).padStart(10, '0')} /H [1 1] /O 3 /E 1 /N 1 /T 1 >>\nendobj\n`; }
    body.forEach((object, index) => { offsets.set(index + 1, text.length); text += `${index + 1} 0 obj\n${object}\nendobj\n`; });
    for (const [key, object] of extra) { number += 1; offsets.set(number, text.length); text += `${number} 0 obj\n${object}\nendobj\n`; trailer.push(`/${key} ${number} 0 R`); }
    const xref = text.length;
    text += `xref\n0 ${number + 1}\n0000000000 65535 f \n`;
    for (let index = 1; index <= number; index += 1) text += `${String(offsets.get(index)).padStart(10, '0')} 00000 n \n`;
    const id = secured ? `/ID [${hex(secured.id)} ${hex(secured.id)}]` : '';
    return `${text}trailer\n<< /Size ${number + 1} /Root 1 0 R ${trailer.join(' ')} ${id} >>\nstartxref\n${xref}\n%%EOF\n`;
  };
  const pdf = render(0);
  return linearized ? render(pdf.length) : pdf;
}

export const internalLink = (dest = '[3 0 R /XYZ null null null]') => `/Annots [<< /Type /Annot /Subtype /Link /Rect [0 0 9 9] /Dest ${dest} >>]`;
export const fileLink = (path, dest = '') => `/Annots [<< /Type /Annot /Subtype /Link /Rect [0 0 9 9] /A << /S /GoToR /F (${path}) ${dest} >> >>]`;
export const webLink = url => `/Annots [<< /Type /Annot /Subtype /Link /Rect [0 0 9 9] /A << /S /URI /URI (${url}) >> >>]`;
export const bookmarks = '/Outlines 6 0 R';
export const bookmarkObjects = (dest = '[3 0 R /XYZ null null null]') => ['<< /Type /Outlines /First 7 0 R /Last 7 0 R /Count 1 >>', `<< /Title (Section) /Parent 6 0 R /Dest ${dest} >>`];
export const attachment = name => ({ catalog: `/Names << /EmbeddedFiles << /Names [(${name}) 6 0 R] >> >>`, objects: [`<< /Type /Filespec /F (${name}) /EF << /F 7 0 R >> >>`, '<< /Type /EmbeddedFile /Length 3 >>\nstream\nabc\nendstream'] });
