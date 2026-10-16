import { md5 } from '@noble/hashes/legacy.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import trusted from '../validation/trusted-sources.json' with { type: 'json' };
const encode = new TextEncoder();
const checksum = content => bytesToHex(md5(encode.encode(content)));

function demoPdf() {
  const stream = 'BT /F1 12 Tf 50 750 Td (SYNTHETIC VALIDATION FIXTURE - NOT A SUBMISSION) Tj ET';
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = '%PDF-1.7\n';
  const offsets = [0];
  objects.forEach((object, index) => { offsets.push(pdf.length); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.slice(1).map(offset => `${String(offset).padStart(10,'0')} 00000 n \n`).join('');
  return pdf + `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
}

export function createDemoContents(sequence = '0000') {
  const pdf = demoPdf();
  const regional = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="../../util/style/eu-regional.xsl"?>
<!DOCTYPE eu:eu-backbone SYSTEM "../../util/dtd/eu-regional.dtd">
<eu:eu-backbone xmlns:eu="http://europa.eu.int" xmlns:xlink="http://www.w3c.org/1999/xlink" dtd-version="3.1">
<eu-envelope><envelope country="ema"><identifier>12345678-1234-4234-8234-123456789abc</identifier>
<submission type="maa" mode="single"><procedure-tracking><number>EMEA/H/C/999999/0000</number></procedure-tracking></submission>
<submission-unit type="initial"/><applicant>Synthetic Example Only</applicant><agency code="EU-EMA"/>
<procedure type="centralised"/><invented-name>Demo only</invented-name><inn>synthetic example</inn>
<sequence>${sequence}</sequence><related-sequence>${sequence}</related-sequence><submission-description>Synthetic software test fixture, not a dossier</submission-description>
</envelope></eu-envelope><m1-eu><m1-0-cover><specific country="ema">
<leaf ID="demo-cover" operation="new" checksum="${checksum(pdf)}" checksum-type="md5" xlink:href="10-cover/ema/ema-cover.pdf"><title>Synthetic cover</title></leaf>
<leaf ID="demo-tracking" operation="new" checksum="${checksum(pdf)}" checksum-type="md5" xlink:href="10-cover/ema/ema-tracking-demo.pdf"><title>Synthetic tracking table</title></leaf>
</specific></m1-0-cover></m1-eu></eu:eu-backbone>`;
  const index = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="util/style/ectd-2-0.xsl"?>
<!DOCTYPE ectd:ectd SYSTEM "util/dtd/ich-ectd-3-2.dtd">
<ectd:ectd xmlns:ectd="http://www.ich.org/ectd" xmlns:xlink="http://www.w3c.org/1999/xlink" dtd-version="3.2">
<m1-administrative-information-and-prescribing-information>
<leaf ID="demo-regional" operation="new" checksum="${checksum(regional)}" checksum-type="md5" xlink:href="m1/eu/eu-regional.xml"><title>EU regional backbone</title></leaf>
</m1-administrative-information-and-prescribing-information></ectd:ectd>`;
  return {
    [`${sequence}/index.xml`]: index, [`${sequence}/index-md5.txt`]: checksum(index),
    [`${sequence}/m1/eu/eu-regional.xml`]: regional,
    [`${sequence}/m1/eu/10-cover/ema/ema-cover.pdf`]: pdf,
    [`${sequence}/m1/eu/10-cover/ema/ema-tracking-demo.pdf`]: pdf,
    ...Object.fromEntries(trusted.files.map(file => [`${sequence}/${file.path}`, Uint8Array.from(atob(file.base64), character => character.charCodeAt(0))])),
  };
}

export function createDemoEntries(sequence) {
  return Object.entries(createDemoContents(sequence)).map(([path, content]) => ({ path, file: new File([content], path.split('/').at(-1)) }));
}
