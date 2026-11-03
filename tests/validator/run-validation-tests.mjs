import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { runValidation, normalizeFiles, resolveReference, hashFile, prepareXml, RELEASE, IMPLEMENTED_IDS, catalogue, trusted } from '../../validator/engine.mjs';
import { createDemoContents } from '../../validator/demo.mjs';
import { validateDtd } from '../../validator/dtd-node.mjs';
import { inspectPdf, pdfEngine } from '../../validator/pdf.mjs';
import { evaluatePdfRules } from '../../validator/pdf-rules.mjs';
import { buildPdf, internalLink, fileLink, webLink, bookmarks, bookmarkObjects, attachment } from './pdf-fixtures.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const cases=[];
const test=(id,requirements,name,fn)=>cases.push({id,requirements,name,fn});
const md5=content=>crypto.createHash('md5').update(content).digest('hex');
const entries=contents=>Object.entries(contents).map(([name,content])=>({path:name,file:new File([content],name.split('/').at(-1))}));
function sync(contents,sequence='0000') {
  const xml=`${sequence}/index.xml`;
  contents[xml]=contents[xml].replace(/checksum="[a-f0-9]{32}"/,`checksum="${md5(contents[`${sequence}/m1/eu/eu-regional.xml`])}"`);
  contents[`${sequence}/index-md5.txt`]=md5(contents[xml]);
  return contents;
}
const run=async(contents,options={})=>runValidation(entries(contents),{validateDtd,inspectPdf,pdfEngine,runId:'engineering-test',createdAt:'2026-10-16T00:00:00.000Z',...options});
const result=(report,id)=>report.rules.find(rule=>rule.id===id);
const expectStatus=(report,id,status)=>assert.equal(result(report,id)?.status,status,`${id}: ${JSON.stringify(result(report,id))}`);
const regional=(contents,change)=>{contents['0000/m1/eu/eu-regional.xml']=change(contents['0000/m1/eu/eu-regional.xml']);return sync(contents);};

test('VAL-001',['URS-01','URS-02'],'Source catalogue preserves all 111 distinct IDs, including 11.10 and 15.10',()=>{
  assert.equal(catalogue.rules.length,111);assert.equal(new Set(catalogue.rules.map(rule=>rule.id)).size,111);
  assert.ok(catalogue.rules.some(rule=>rule.id==='11.10'));assert.ok(catalogue.rules.some(rule=>rule.id==='15.10'));
  assert.equal(IMPLEMENTED_IDS.length,93);
  assert.equal(RELEASE.version,JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version);
  for(const id of IMPLEMENTED_IDS)assert.ok(catalogue.rules.some(rule=>rule.id===id));
});
test('VAL-002',['URS-02'],'Pinned utility bytes match independently recomputed MD5 and SHA-256',()=>{
  const known={'ich-ectd-3-2.dtd':'1d6f631cc6b6357f0f4fe378e5f79a27','eu-regional.dtd':'f8e473246d58499f9ffff8e51a32380d','eu-leaf.mod':'23b854174e61c68044b9f53c0009af95','eu-envelope.mod':'cf059a8f48c68fe4ce9ad2947ab854ca','ectd-2-0.xsl':'3a07a202455e954a2eb203c5bb443f77','eu-regional.xsl':'474f3fe1fdadb31c74477793e060383d'};
  for(const file of trusted.files){const bytes=fs.readFileSync(path.join(root,'validation/vendor',file.path.slice(5)));assert.equal(md5(bytes),known[path.basename(file.path)]);assert.equal(file.md5,md5(bytes));assert.equal(file.sha256,crypto.createHash('sha256').update(bytes).digest('hex'));assert.deepEqual(Buffer.from(file.base64,'base64'),bytes);}
});
test('VAL-003',['URS-03','URS-04','URS-05','URS-06'],'Synthetic positive control passes every applicable implemented P/F check but remains incomplete',async()=>{
  const report=await run(createDemoContents());assert.equal(report.summary.failedRules,0);assert.equal(report.summary.notEvaluated,18);assert.equal(report.pdfEngine.name,'pdfjs-dist');expectStatus(report,'16.5','pass');
  expectStatus(report,'7.4','pass');expectStatus(report,'9.4','pass');expectStatus(report,'8.3','pass');expectStatus(report,'11.2','pass');
  assert.equal(report.overall,'incomplete');assert.equal(report.fullEuValidationComplete,false);assert.equal(report.certification,'NOT_CERTIFIED');
});
test('VAL-004',['URS-07'],'Changed backbone bytes are detected by index MD5',async()=>{const c=createDemoContents();c['0000/index.xml']+='\n';expectStatus(await run(c),'8.3','fail');});
test('VAL-005',['URS-07'],'Changed document bytes are detected by leaf MD5',async()=>{const c=createDemoContents();c['0000/m1/eu/10-cover/ema/ema-cover.pdf']+='changed';expectStatus(await run(c),'11.2','fail');});
test('VAL-006',['URS-02','URS-04'],'Uploaded modified DTD cannot redefine the trusted grammar or receive a validity pass',async()=>{const c=createDemoContents();c['0000/util/dtd/ich-ectd-3-2.dtd']='<!ELEMENT fake ANY>';const r=await run(c);expectStatus(r,'1.3','fail');expectStatus(r,'7.4','not-evaluated');});
test('VAL-007',['URS-04'],'Undeclared ICH element fails actual DTD validation',async()=>{const c=createDemoContents();c['0000/index.xml']=c['0000/index.xml'].replace('</ectd:ectd>','<not-an-ich-element/></ectd:ectd>');sync(c);expectStatus(await run(c),'7.4','fail');});
test('VAL-008',['URS-04'],'Missing mandatory EU envelope element fails actual DTD validation',async()=>{const c=regional(createDemoContents(),xml=>xml.replace(/<applicant>.*?<\/applicant>/,''));expectStatus(await run(c),'9.4','fail');});
test('VAL-009',['URS-04'],'DTD fixed version rejects a non-supported backbone version',async()=>{const c=regional(createDemoContents(),xml=>xml.replace('dtd-version="3.1"','dtd-version="9.9"'));expectStatus(await run(c),'9.4','fail');});
test('VAL-010',['URS-04','URS-12'],'Malformed XML cannot produce a passed structural result',async()=>{const c=regional(createDemoContents(),xml=>xml.replace('</m1-eu>','</wrong>'));const r=await run(c);assert.notEqual(result(r,'9.3').status,'pass');expectStatus(r,'9.4','not-evaluated');assert.ok(r.localFindings.length);});
test('VAL-011',['URS-12'],'Internal entities and external entity declarations are rejected before evaluation',()=>{for(const xml of ['<!DOCTYPE root [<!ENTITY x SYSTEM "file:///secret">]><root>&x;</root>','<!DOCTYPE root [<!ENTITY x "ha">]><root/>'])assert.throws(()=>prepareXml(xml),/Internal DTD/);});
test('VAL-012',['URS-12'],'DOCTYPE written only in a comment cannot satisfy external subset requirements',()=>{assert.throws(()=>prepareXml('<!-- <!DOCTYPE root SYSTEM "trusted.dtd"> --><root/>'),/Exactly one/);});
test('VAL-013',['URS-12'],'Reference resolver rejects network, absolute, encoded separator and escaping paths',()=>{
  for(const ref of ['https://example.test/x','file:///secret','/absolute','../../../../secret','a\\b','%2fetc/passwd','a%00b','a%5cb','doc.pdf#dest'])assert.equal(resolveReference('0000/m1/eu/eu-regional.xml',ref),null,ref);
});
test('VAL-014',['URS-03','URS-12'],'Input paths cannot collide by case or escape the selected root',()=>{
  const file=new File(['x'],'x');for(const name of ['../x','C:/x','/x','0000/../x'])assert.throws(()=>normalizeFiles([{path:name,file}]),/Unsafe/);
  assert.throws(()=>normalizeFiles([{path:'0000/a.pdf',file},{path:'0000/A.pdf',file}]),/colliding/);
});
test('VAL-015',['URS-03'],'Application-folder selection normalizes consistently with sequence-folder selection',async()=>{
  const c=createDemoContents();const a=await run(c);const b=await runValidation(entries(c).map(item=>({...item,path:'application/'+item.path})),{validateDtd,inspectPdf,pdfEngine,runId:'engineering-test',createdAt:'2026-10-16T00:00:00.000Z'});assert.equal(a.reportSha256,b.reportSha256);
});
test('VAL-016',['URS-08'],'Missing current-sequence file is a failure, not a pass',async()=>{const c=createDemoContents();delete c['0000/m1/eu/10-cover/ema/ema-cover.pdf'];expectStatus(await run(c),'11.6','fail');});
test('VAL-017',['URS-08','URS-11'],'Missing historical file is explicitly not evaluated',async()=>{
  const c=createDemoContents('0001');c['0001/m1/eu/eu-regional.xml']=c['0001/m1/eu/eu-regional.xml'].replace('10-cover/ema/ema-cover.pdf','../../../0000/m1/eu/10-cover/ema/ema-cover.pdf');sync(c,'0001');expectStatus(await run(c,{sequence:'0001'}),'11.6','not-evaluated');
});
test('VAL-018',['URS-08','URS-10'],'Available historical files are hash checked and bound into a reference inventory',async()=>{
  const c=createDemoContents('0001');c['0001/m1/eu/eu-regional.xml']=c['0001/m1/eu/eu-regional.xml'].replace('10-cover/ema/ema-cover.pdf','../../../0000/m1/eu/10-cover/ema/ema-cover.pdf');sync(c,'0001');c['0000/m1/eu/10-cover/ema/ema-cover.pdf']=createDemoContents()['0000/m1/eu/10-cover/ema/ema-cover.pdf'];const r=await run(c,{sequence:'0001'});expectStatus(r,'11.6','pass');expectStatus(r,'11.2','pass');assert.equal(r.referenceManifest.length,1);assert.equal(r.referenceManifest[0].md5,md5(c['0000/m1/eu/10-cover/ema/ema-cover.pdf']));expectStatus(r,'11.9','not-evaluated');
});
test('VAL-019',['URS-08'],'References into future sequences fail',async()=>{const c=regional(createDemoContents(),xml=>xml.replace('10-cover/ema/ema-cover.pdf','../../../0002/m1/eu/10-cover/ema/ema-cover.pdf'));expectStatus(await run(c),'11.6','fail');});
test('VAL-020',['URS-06'],'Duplicate leaf ID across ICH and EU XML is detected',async()=>{const c=regional(createDemoContents(),xml=>xml.replace('ID="demo-cover"','ID="demo-regional"'));expectStatus(await run(c),'11.11','fail');});
test('VAL-021',['URS-06'],'Blank leaf title and empty heading are detected',async()=>{const c=regional(createDemoContents(),xml=>xml.replace('<title>Synthetic cover</title>','<title> </title>'));const r=await run(c);expectStatus(r,'11.3','fail');const d=createDemoContents();d['0000/index.xml']=d['0000/index.xml'].replace('</ectd:ectd>','<m2-common-technical-document-summaries><m2-2-introduction/></m2-common-technical-document-summaries></ectd:ectd>');sync(d);expectStatus(await run(d),'10.1','fail');});
test('VAL-022',['URS-06'],'Lifecycle attributes are checked without claiming lifecycle-state validation',async()=>{const c=regional(createDemoContents(),xml=>xml.replace('ID="demo-cover" operation="new"','ID="demo-cover" operation="replace"'));const r=await run(c);expectStatus(r,'11.7','fail');expectStatus(r,'11.12','not-evaluated');});
test('VAL-023',['URS-06'],'Delete leaves with an href fail and new leaves cannot carry modified-file',async()=>{const c=regional(createDemoContents(),xml=>xml.replace('ID="demo-cover" operation="new"','ID="demo-cover" operation="delete" modified-file="../../../0000/m1/eu/eu-regional.xml#old"'));expectStatus(await run(c),'11.5','fail');const d=regional(createDemoContents(),xml=>xml.replace('ID="demo-cover"','ID="demo-cover" modified-file="old"'));expectStatus(await run(d),'11.8','fail');});
test('VAL-024',['URS-05'],'Envelope sequence and related-sequence must match an initial sequence',async()=>{const c=regional(createDemoContents(),xml=>xml.replace('<sequence>0000</sequence>','<sequence>9999</sequence>').replace('<related-sequence>0000</related-sequence>','<related-sequence>0009</related-sequence>'));const r=await run(c);expectStatus(r,'13.3','fail');expectStatus(r,'14.6','fail');});
test('VAL-025',['URS-05'],'Initial MAA without an INN fails',async()=>{const c=regional(createDemoContents(),xml=>xml.replace('<inn>synthetic example</inn>',''));expectStatus(await run(c),'14.8','fail');});
test('VAL-026',['URS-05'],'Centralised country and country-specific leaf envelope must agree',async()=>{const c=regional(createDemoContents(),xml=>xml.replace('<envelope country="ema">','<envelope country="fr">'));const r=await run(c);expectStatus(r,'14.1','fail');expectStatus(r,'14.5','fail');});
test('VAL-027',['URS-05'],'Invalid UUID and differing UUIDs are never silently accepted',async()=>{const c=regional(createDemoContents(),xml=>xml.replace('12345678-1234-4234-8234-123456789abc','not-a-uuid'));expectStatus(await run(c),'9.7','fail');});
test('VAL-028',['URS-09'],'Unreferenced content and unexpected root files are detected',async()=>{const c=createDemoContents();c['0000/m2/unreferenced.pdf']='x';c['0000/readme.txt']='unexpected';const r=await run(c);expectStatus(r,'15.8','fail');expectStatus(r,'15.9','fail');});
test('VAL-029',['URS-09'],'Path/filename length boundaries and filename characters are enforced',async()=>{const c=createDemoContents();c[`0000/m2/${'a'.repeat(64)}/${'b'.repeat(64)}/${'c'.repeat(65)}.pdf`]='x';c['0000/m2/Upper.pdf']='x';const r=await run(c);expectStatus(r,'15.3','fail');expectStatus(r,'15.4','fail');expectStatus(r,'15.6','fail');});
test('VAL-030',['URS-09'],'Tracking-table PDF is required for the centralised non-CEP fixture',async()=>{const c=createDemoContents();delete c['0000/m1/eu/10-cover/ema/ema-tracking-demo.pdf'];const r=await run(c);expectStatus(r,'15.11','fail');expectStatus(r,'15.12','fail');});
test('VAL-031',['URS-10'],'Report is reproducible and digest verifies independently',async()=>{const a=await run(createDemoContents());const b=await run(createDemoContents());assert.equal(a.reportSha256,b.reportSha256);const {reportSha256,...payload}=a;assert.equal(reportSha256,crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex'));payload.sequence='9999';assert.notEqual(reportSha256,crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex'));});
test('VAL-032',['URS-11','URS-14'],'Unavailable engines, lifecycle and empty folders remain not evaluated',async()=>{const r=await run(createDemoContents(),{validateDtd:undefined,inspectPdf:undefined});for(const id of ['7.4','9.4','16.1','16.2','16.5','13.2','15.10'])expectStatus(r,id,'not-evaluated');assert.equal(r.qualification,'PENDING_ORGANIZATIONAL_APPROVAL');});
test('VAL-033',['URS-07'],'Hash streaming matches an independent implementation over a chunk boundary',async()=>{const bytes=Buffer.alloc(1024*1024+17,0x57);const actual=await hashFile(new File([bytes],'large.pdf'));assert.equal(actual.md5,md5(bytes));assert.equal(actual.sha256,crypto.createHash('sha256').update(bytes).digest('hex'));});
test('VAL-034',['URS-12'],'Truncated reads and excessive input counts fail closed',async()=>{await assert.rejects(hashFile({size:10,slice:()=>new Blob(['short'])}),/incomplete/);const file=new File(['x'],'x');assert.throws(()=>normalizeFiles(Array.from({length:RELEASE.limits.files+1},(_,i)=>({path:`0000/${i}.pdf`,file}))),/At most/);});
test('VAL-035',['URS-12'],'Large declared inventory is refused before any read',()=>{assert.throws(()=>normalizeFiles([{path:'0000/huge.pdf',file:{size:RELEASE.limits.totalBytes+1,slice(){throw new Error('must not read');}}}]),/32 GiB/);});
test('VAL-036',['URS-04'],'Remote DTD locator is reported and is not used to change validation grammar',async()=>{const c=createDemoContents();c['0000/index.xml']=c['0000/index.xml'].replace('SYSTEM "util/dtd/ich-ectd-3-2.dtd"','SYSTEM "https://untrusted.invalid/payload.dtd"');sync(c);const r=await run(c);expectStatus(r,'7.5','fail');expectStatus(r,'7.4','pass');});

for(const [index,relative] of ['util/dtd/ich-ectd-3-2.dtd','util/style/ectd-2-0.xsl','util/dtd/eu-regional.dtd','util/dtd/eu-leaf.mod','util/dtd/eu-envelope.mod','util/style/eu-regional.xsl'].entries()) {
  test(`VAL-${String(37+index).padStart(3,'0')}`,['URS-02'],`Utility group ${index+1}: wrong filename/location and altered bytes cannot pass`,async()=>{
    const source=`0000/${relative}`,c=createDemoContents();c[`0000/wrong/${path.basename(relative)}`]=c[source];delete c[source];const a=await run(c);expectStatus(a,`${index+1}.1`,'pass');expectStatus(a,`${index+1}.2`,'fail');expectStatus(a,`${index+1}.3`,'not-evaluated');
    const d=createDemoContents();d[source]=Buffer.concat([Buffer.from(d[source]),Buffer.from('altered')]);expectStatus(await run(d),`${index+1}.3`,'fail');
  });
}
function procedureFixture(procedure,country,submission='maa') {
  let c=createDemoContents();
  c=regional(c,xml=>xml.replaceAll('country="ema"',`country="${country}"`).replace('type="centralised"',`type="${procedure}"`).replace('type="maa"',`type="${submission}"`).replaceAll('10-cover/ema/ema-',`10-cover/${country}/${country}-`));
  c=Object.fromEntries(Object.entries(c).map(([name,value])=>[name.replace('/ema/ema-',`/${country}/${country}-`),value]));
  return c;
}
test('VAL-043',['URS-05','URS-09'],'National envelope uses a country-specific tracking location',async()=>{const r=await run(procedureFixture('national','de'));expectStatus(r,'14.3','pass');expectStatus(r,'15.11','pass');expectStatus(r,'15.12','pass');assert.equal(r.summary.failedRules,0);});
test('VAL-044',['URS-05','URS-09'],'MRP and DCP use country envelopes and a common tracking folder',async()=>{
  for(const procedure of ['mutual-recognition','decentralised']) {let c=procedureFixture(procedure,'de');c=regional(c,xml=>xml.replace('<specific country="de">','<specific country="common">').replaceAll('10-cover/de/de-','10-cover/common/common-'));c=Object.fromEntries(Object.entries(c).map(([name,value])=>[name.replace('/de/de-','/common/common-'),value]));const r=await run(c);expectStatus(r,'14.2','pass');expectStatus(r,'15.11','pass');expectStatus(r,'15.12','pass');assert.equal(r.summary.failedRules,0);}
});
test('VAL-045',['URS-05','URS-09'],'EDQM CEP exception does not require a tracking table',async()=>{const c=procedureFixture('centralised','edqm','cep');delete c['0000/m1/eu/10-cover/edqm/edqm-tracking-demo.pdf'];c['0000/m1/eu/eu-regional.xml']=c['0000/m1/eu/eu-regional.xml'].replace(/<leaf ID="demo-tracking"[\s\S]*?<\/leaf>/,'');sync(c);const r=await run(c);expectStatus(r,'14.4','pass');expectStatus(r,'14.9','pass');expectStatus(r,'15.11','not-applicable');expectStatus(r,'15.12','not-applicable');assert.equal(r.summary.failedRules,0);});
test('VAL-046',['URS-05'],'Grouping/worksharing applicability produces BP findings without reclassifying them as P/F',async()=>{const c=regional(createDemoContents(),xml=>xml.replace('mode="single"','mode="grouping"'));const r=await run(c);expectStatus(r,'14.BP4','fail');expectStatus(r,'14.BP7','fail');assert.equal(result(r,'14.BP4').type,'BP');assert.equal(r.summary.failedRules,0);assert.equal(r.summary.bestPracticeWarnings,2);});
test('VAL-047',['URS-05'],'Follow-up sequence must refer to a different related sequence',async()=>{const c=regional(createDemoContents(),xml=>xml.replace('<submission-unit type="initial"/>','<submission-unit type="response"/>'));expectStatus(await run(c),'14.7','fail');});
test('VAL-048',['URS-06'],'Leaf checksum algorithm and safe URI syntax are independently checked',async()=>{const c=regional(createDemoContents(),xml=>xml.replace('checksum-type="md5"','checksum-type="sha256"').replace('10-cover/ema/ema-cover.pdf','10-cover/ema/ema%2dcover.pdf'));const r=await run(c);expectStatus(r,'11.1','fail');expectStatus(r,'11.4','fail');});
test('VAL-049',['URS-05'],'UUID consistency is checked across multiple envelopes',async()=>{const c=regional(createDemoContents(),xml=>{const envelope=/<envelope country="ema">[\s\S]*?<\/envelope>/.exec(xml)[0];return xml.replace('</eu-envelope>',envelope.replace('12345678-1234-4234-8234-123456789abc','87654321-1234-4234-8234-123456789abc')+'</eu-envelope>');});expectStatus(await run(c),'9.9','fail');});
test('VAL-050',['URS-09'],'Country folder and filename mappings are checked at the correct section',async()=>{const c=regional(createDemoContents(),xml=>xml.replace('10-cover/ema/ema-cover.pdf','10-cover/de/wrong-cover.pdf'));c['0000/m1/eu/10-cover/de/wrong-cover.pdf']=c['0000/m1/eu/10-cover/ema/ema-cover.pdf'];delete c['0000/m1/eu/10-cover/ema/ema-cover.pdf'];const r=await run(c);expectStatus(r,'15.BP4','fail');expectStatus(r,'15.BP5','fail');});
test('VAL-051',['URS-04'],'Wrong stylesheet targets cannot satisfy stylesheet-reference rules',async()=>{const c=createDemoContents();c['0000/index.xml']=c['0000/index.xml'].replace('href="util/style/ectd-2-0.xsl"','href="wrong.xsl"');c['0000/m1/eu/eu-regional.xml']=c['0000/m1/eu/eu-regional.xml'].replace('href="../../util/style/eu-regional.xsl"','href="wrong.xsl"');sync(c);const r=await run(c);expectStatus(r,'7.6','fail');expectStatus(r,'9.6','fail');});
test('VAL-052',['URS-12'],'A safe but mismatched DOCTYPE root cannot receive a DTD validity pass',async()=>{const c=createDemoContents();c['0000/index.xml']=c['0000/index.xml'].replace('<!DOCTYPE ectd:ectd','<!DOCTYPE wrong');sync(c);const r=await run(c);expectStatus(r,'7.4','fail');expectStatus(r,'7.5','fail');});

test('VAL-053',['URS-04'],'XML keywords remain case sensitive and unsupported declared encodings are refused',async()=>{
  for(const replacement of [['<!DOCTYPE','<!doctype'],['SYSTEM','system'],['encoding="UTF-8"','encoding="ISO-8859-1"']]) {
    const c=createDemoContents();assert.ok(c['0000/index.xml'].includes(replacement[0]));c['0000/index.xml']=c['0000/index.xml'].replace(...replacement);sync(c);
    const r=await run(c);expectStatus(r,'7.3','not-evaluated');expectStatus(r,'7.4','not-evaluated');assert.equal(r.overall,'issues-found');
  }
});

test('VAL-054',['URS-04'],'Stylesheet declarations hidden in XML comments cannot pass reference checks',async()=>{
  const c=createDemoContents();for(const name of ['0000/index.xml','0000/m1/eu/eu-regional.xml'])c[name]=c[name].replace(/<\?xml-stylesheet[^?]+\?>/,match=>`<!--${match}-->`);sync(c);
  const r=await run(c);expectStatus(r,'7.6','fail');expectStatus(r,'9.6','fail');expectStatus(r,'7.4','pass');expectStatus(r,'9.4','pass');
});

const COVER='0000/m1/eu/10-cover/ema/ema-cover.pdf',MODULE2='0000/m2/document.pdf',FORM='0000/m1/eu/12-form/ema/ema-form.pdf',SMPC='0000/m1/eu/13-pi/131-spclabelpl/ema/en/ema-combined-en.pdf';
const withPdf=(options,location=MODULE2,extra={})=>({...createDemoContents(),[location]:Buffer.from(buildPdf(options),'latin1'),...extra});
const statusFor=async(options,id,location,extra)=>result(await run(withPdf(options,location,extra)),id).status;
const expectPdf=async(options,id,status,location,extra)=>assert.equal(await statusFor(options,id,location,extra),status,`${id} ${JSON.stringify(options)}`);
const ALLOWED=0xF3C,FORM_ROUTINE_RESTRICTIONS=ALLOWED&~(8|32|1024),NO_PRINTING=ALLOWED&~(4|2048),DESIGNER='/Creator (Designer 6.5)',PLM='/Creator (PDF generator) /Author (European Medicines Agency)';
test('VAL-055',['URS-16'],'PDF version uses the catalog when present and separates P/F from best practice',async()=>{
  await expectPdf({version:'1.3'},'16.1','fail');await expectPdf({version:'1.3'},'16.BP1','fail');await expectPdf({version:'1.4',catalog:'/Version /1.7'},'16.1','pass');await expectPdf({version:'1.4',catalog:'/Version /1.7'},'16.BP1','pass');await expectPdf({version:'2.0'},'16.1','pass');await expectPdf({version:'2.0'},'16.BP1','fail');
});
test('VAL-056',['URS-16'],'A password-protected PDF fails 16.2 and is not reported as corrupted',async()=>{
  const r=await run(withPdf({password:true}));expectStatus(r,'16.2','fail');expectStatus(r,'16.5','not-evaluated');expectStatus(r,'16.1','not-evaluated');
});
test('VAL-057',['URS-16','URS-12'],'Damaged PDFs fail 16.5 and never pass the other PDF checks',async()=>{
  for(const content of ['not a pdf',buildPdf().slice(0,60),'']){const r=await run({...createDemoContents(),[MODULE2]:content});expectStatus(r,'16.5','fail');expectStatus(r,'16.1','not-evaluated');assert.equal(result(r,'16.5').counts.fail,1);}
});
test('VAL-058',['URS-16'],'Security restrictions fail outside exempt sections; literature and signed files are exempt from 16.3',async()=>{
  await expectPdf({allowed:NO_PRINTING},'16.3','fail');await expectPdf({allowed:ALLOWED},'16.3','pass');
});
test('VAL-059',['URS-16'],'Sections 1.0 and 1.2 accept only the restrictions allowed by 16.4',async()=>{
  await expectPdf({allowed:FORM_ROUTINE_RESTRICTIONS},'16.4','pass',COVER);await expectPdf({allowed:FORM_ROUTINE_RESTRICTIONS},'16.4','pass',FORM);await expectPdf({allowed:NO_PRINTING},'16.4','fail',COVER);await expectPdf({allowed:ALLOWED&~16},'16.4','fail',FORM);await expectPdf({allowed:ALLOWED&~256},'16.4','fail',FORM);
});
test('VAL-060',['URS-16'],'eAF attachment rules follow the identified form type and unidentified forms stay open',async()=>{
  const attached=attachment('extra.pdf'),fhir=attachment('fhir.xml');
  await expectPdf({info:DESIGNER},'16.6','pass',FORM);await expectPdf({info:DESIGNER},'16.7','pass',FORM);await expectPdf({...attached,info:DESIGNER},'16.6','fail',FORM);await expectPdf({...attached,info:DESIGNER},'16.7','fail',FORM);
  await expectPdf({...fhir,info:PLM},'16.6','pass',FORM);await expectPdf({info:PLM},'16.6','fail',FORM);await expectPdf({...attached,info:PLM},'16.6','fail',FORM);
  await expectPdf({},'16.6','not-evaluated',FORM);await expectPdf({},'16.7','not-evaluated',FORM);await expectPdf({},'16.6','not-applicable');
});
test('VAL-061',['URS-16'],'Links within a sequence need valid targets; web links are ignored',async()=>{
  await expectPdf({page:internalLink()},'16.BP2','pass');await expectPdf({page:internalLink('(missing)')},'16.BP2','fail');await expectPdf({page:fileLink('target.pdf')},'16.BP2','pass',MODULE2,{'0000/m2/target.pdf':Buffer.from(buildPdf(),'latin1')});await expectPdf({page:fileLink('missing.pdf')},'16.BP2','fail');await expectPdf({page:webLink('https://example.test/')},'16.BP2','not-applicable');
});
test('VAL-062',['URS-16','URS-08'],'Cross-sequence links use supplied history and stay open when it is missing',async()=>{
  const base=()=>({...createDemoContents('0001')}),file='0001/m2/document.pdf',link=fileLink('../../0000/m2/old.pdf'),pdf=options=>Buffer.from(buildPdf(options),'latin1');
  expectStatus(await run({...base(),[file]:pdf({page:link})},{sequence:'0001'}),'16.BP3','not-evaluated');
  expectStatus(await run({...base(),[file]:pdf({page:link}),'0000/m2/old.pdf':pdf()},{sequence:'0001'}),'16.BP3','pass');
  expectStatus(await run({...base(),[file]:pdf({page:fileLink('../../0009/m2/new.pdf')})},{sequence:'0001'}),'16.BP3','fail');
});
test('VAL-063',['URS-16'],'Links and bookmarks must inherit zoom',async()=>{
  await expectPdf({page:internalLink()},'16.BP4','pass');await expectPdf({page:internalLink('[3 0 R /FitH 10]')},'16.BP4','fail');await expectPdf({page:internalLink('[3 0 R /XYZ 0 0 2]')},'16.BP4','fail');await expectPdf({catalog:bookmarks,objects:bookmarkObjects('[3 0 R /Fit]')},'16.BP4','fail');await expectPdf({page:internalLink('[3 0 R /XYZ 0 0 0]')},'16.BP4','pass');
});
test('VAL-064',['URS-16'],'Fast Web View is required except in sections 1.0 and 1.2',async()=>{
  await expectPdf({},'16.BP5','fail');await expectPdf({linearized:true},'16.BP5','pass');const r=await run(withPdf({},COVER));expectStatus(r,'16.BP5','pass');
});
test('VAL-065',['URS-16'],'Initial view must use default layout and magnification',async()=>{
  await expectPdf({},'16.BP6','pass');await expectPdf({catalog:'/PageLayout /TwoColumnLeft'},'16.BP6','fail');await expectPdf({catalog:'/OpenAction [3 0 R /Fit]'},'16.BP6','fail');await expectPdf({catalog:'/OpenAction [3 0 R /XYZ null null null]'},'16.BP6','pass');
});
test('VAL-066',['URS-16'],'Links must be relative and use forward slashes',async()=>{
  const target={'0000/m2/sub/other.pdf':Buffer.from(buildPdf(),'latin1')};
  await expectPdf({page:fileLink('sub/other.pdf')},'16.BP7','pass',MODULE2,target);await expectPdf({page:fileLink('C:/x/other.pdf')},'16.BP7','fail');await expectPdf({page:fileLink('/x/other.pdf')},'16.BP7','fail');
  await expectPdf({page:fileLink('sub/other.pdf')},'16.BP10','pass',MODULE2,target);await expectPdf({page:fileLink('sub\\\\other.pdf')},'16.BP10','fail',MODULE2,target);
});
test('VAL-067',['URS-16'],'The bookmarks pane must match whether bookmarks exist',async()=>{
  const outline={catalog:`${bookmarks} /PageMode /UseOutlines`,objects:bookmarkObjects()};
  await expectPdf(outline,'16.BP8','pass');await expectPdf({catalog:bookmarks,objects:bookmarkObjects()},'16.BP8','fail');await expectPdf({},'16.BP9','pass');await expectPdf({catalog:'/PageMode /UseOutlines'},'16.BP9','fail');
});
test('VAL-068',['URS-16'],'SmPC properties are required for centralised procedures only',async()=>{
  const full='/Title (T) /Author (A) /Subject (S) /Keywords (K)';
  await expectPdf({info:full},'16.BP11','pass',SMPC);await expectPdf({info:'/Title (T)'},'16.BP11','fail',SMPC);await expectPdf({},'16.BP11','not-applicable');
  const national=procedureFixture('national','de');national[SMPC]=Buffer.from(buildPdf(),'latin1');expectStatus(await run(national),'16.BP11','not-applicable');
});
test('VAL-069',['URS-16','URS-11','URS-12'],'Oversized and unreadable PDFs and engine errors stay not evaluated',async()=>{
  const base={sequence:'0000',files:new Map(),leafSections:new Map(),centralised:true,maxBytes:10};
  const big=await evaluatePdfRules({...base,selected:[{path:MODULE2,file:{size:11,arrayBuffer(){throw new Error('must not read');}}}],inspectPdf});for(const probes of big.values())assert.equal(probes[0].status,'not-evaluated');
  const failing=await evaluatePdfRules({...base,maxBytes:100,selected:[{path:MODULE2,file:new File(['x'],'x.pdf')}],inspectPdf:async()=>{throw new Error('engine stopped');}});for(const probes of failing.values())assert.equal(probes[0].status,'not-evaluated');
  const partial=await evaluatePdfRules({...base,maxBytes:100,selected:[{path:MODULE2,file:new File(['x'],'x.pdf')}],inspectPdf:async()=>({opened:false,parsed:true,error:'read',message:'stopped'})});assert.equal(partial.get('16.5')[0].status,'not-evaluated');
});
test('VAL-070',['URS-16'],'Exempt literature sections and signed files do not receive 16.3 security findings',async()=>{
  for(const location of ['0000/m3/33-lit-ref/paper.pdf','0000/m4/43-lit-ref/paper.pdf','0000/m5/54-lit-ref/paper.pdf'])await expectPdf({allowed:NO_PRINTING},'16.3','not-applicable',location);
  await expectPdf({allowed:NO_PRINTING,catalog:'/AcroForm << /Fields [] /SigFlags 3 >>'},'16.3','not-applicable');
});

const results=[];
for(const item of cases){try{await item.fn();results.push({id:item.id,requirements:item.requirements,name:item.name,status:'passed'});console.log(`PASS ${item.id} ${item.name}`);}catch(error){results.push({id:item.id,requirements:item.requirements,name:item.name,status:'failed',error:error.stack});console.error(`FAIL ${item.id}: ${error.stack}`);}}
const sourceFiles=['package.json','package-lock.json','validator/config.mjs','validator/engine.mjs','validator/dtd-adapter.mjs','validator/dtd-node.mjs','validator/worker.mjs','validator/ui.mjs','validator/demo.mjs','validator/pdf.mjs','validator/pdf-rules.mjs','tests/validator/pdf-fixtures.mjs','validation/eu-v8.2-catalogue.json','validation/trusted-sources.json','tests/validator/run-validation-tests.mjs'];
const sourceHashes=Object.fromEntries(sourceFiles.map(name=>[name,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,name))).digest('hex')]));
const evidence={schemaVersion:'1.0',status:'ENGINEERING_EVIDENCE_NOT_QA_RELEASE',applicationVersion:RELEASE.version,rulepack:RELEASE.rulepack,executedAt:new Date().toISOString(),environment:{node:process.version,platform:process.platform,arch:process.arch},sourceHashes,summary:{passed:results.filter(r=>r.status==='passed').length,failed:results.filter(r=>r.status==='failed').length},results};
fs.mkdirSync(path.join(root,'.artifacts/qualification'),{recursive:true});fs.writeFileSync(path.join(root,'.artifacts/qualification/automated-execution.json'),JSON.stringify(evidence,null,2)+'\n');
console.log(`${evidence.summary.passed}/${results.length} validator cases passed. Organizational qualification remains pending.`);
if(evidence.summary.failed)process.exitCode=1;
