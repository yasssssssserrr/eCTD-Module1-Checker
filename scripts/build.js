'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const esbuild = require('esbuild');
const root = path.resolve(__dirname, '..');
const destination = path.join(root, 'dist');
const documents = ['VALIDATION_PLAN.md','QUALIFICATION_PROTOCOL.md','USER_REQUIREMENTS.md','RISK_ASSESSMENT.md','TRACEABILITY.md','OPERATING_PROCEDURE.md','RELEASE_APPROVAL.md'];
const assets = ['index.html', 'style.css', 'core.js', 'data.js', 'zip.js', 'app.js', 'VALIDATION_REPORT.md', ...documents.map(name => `validation/${name}`), 'validation/eu-v8.2-catalogue.json'];
// An explicit allowlist keeps development files out of the published site.
for (const asset of assets) {
  if (!fs.statSync(path.join(root, asset)).isFile()) throw new Error(`Missing asset: ${asset}`);
}
if (path.dirname(destination) !== root || path.basename(destination) !== 'dist') throw new Error('Invalid build destination');
fs.rmSync(destination, { recursive: true, force: true });
fs.mkdirSync(destination);
for (const asset of assets) { fs.mkdirSync(path.dirname(path.join(destination,asset)),{recursive:true}); fs.copyFileSync(path.join(root, asset), path.join(destination, asset)); }
let commit = 'working-tree';
try {
  commit = process.env.GITHUB_SHA || execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();
  if (!process.env.GITHUB_SHA && execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim()) commit += '-dirty';
} catch { /* Source archives may not contain Git metadata. */ }
esbuild.buildSync({ entryPoints:[path.join(root,'validator/ui.mjs')], bundle:true, format:'esm', target:'es2022', outfile:path.join(destination,'validator-ui.js'), legalComments:'eof' });
esbuild.buildSync({ entryPoints:[path.join(root,'validator/worker.mjs')], bundle:true, format:'esm', target:'es2022', outfile:path.join(destination,'validator.worker.js'), external:['./vendor/libxml2/index.mjs'], define:{__BUILD_COMMIT__:JSON.stringify(commit)}, legalComments:'eof' });
const vendor = path.join(destination,'vendor/libxml2'); fs.mkdirSync(vendor,{recursive:true});
for (const filename of fs.readdirSync(path.join(root,'node_modules/libxml2-wasm/lib')).filter(name=>name.endsWith('.mjs'))) fs.copyFileSync(path.join(root,'node_modules/libxml2-wasm/lib',filename),path.join(vendor,filename));
const licences = { '@noble/hashes':'LICENSE', '@xmldom/xmldom':'LICENSE', 'libxml2-wasm':'LICENSE' };
const notices=[];
for(const [dependency,license] of Object.entries(licences)) notices.push(`${dependency}\n${fs.readFileSync(path.join(root,'node_modules',dependency,license),'utf8')}`);
notices.push(fs.readFileSync(path.join(root,'node_modules/libxml2-wasm/LICENSE.libxml2'),'utf8'));
fs.writeFileSync(path.join(destination,'THIRD_PARTY_NOTICES.txt'),notices.join('\n\n----------------\n\n'));
require(path.join(root,'zip.js'));
const packageFiles = Object.fromEntries(documents.map(name=>[name,fs.readFileSync(path.join(root,'validation',name),'utf8')]));
packageFiles['eu-v8.2-catalogue.json']=fs.readFileSync(path.join(root,'validation/eu-v8.2-catalogue.json'),'utf8');
const evidence=path.join(root,'.artifacts/qualification/automated-execution.json');
if(fs.existsSync(evidence)) {
  packageFiles['automated-execution.json']=fs.readFileSync(evidence,'utf8');
  fs.mkdirSync(path.join(destination,'validation/evidence'),{recursive:true});
  fs.copyFileSync(evidence,path.join(destination,'validation/evidence/automated-execution.json'));
}
fs.writeFileSync(path.join(destination,'qualification-package.zip'),globalThis.EctdZip.createFolderZip([],new Date('2026-10-16T00:00:00Z'),packageFiles));
fs.writeFileSync(path.join(destination, '.nojekyll'), '');
const artifactHashes={};
function inventory(directory,prefix='') { for(const item of fs.readdirSync(directory,{withFileTypes:true})) { const relative=prefix+item.name; if(item.isDirectory())inventory(path.join(directory,item.name),relative+'/');else artifactHashes[relative]=crypto.createHash('sha256').update(fs.readFileSync(path.join(directory,item.name))).digest('hex'); } }
inventory(destination);
fs.writeFileSync(path.join(destination,'release-manifest.json'),JSON.stringify({version:require('../package.json').version,buildCommit:commit,qualification:'PENDING_ORGANIZATIONAL_APPROVAL',artifactHashes},null,2)+'\n');
const releaseFiles={};
function collect(directory,prefix='') { for(const item of fs.readdirSync(directory,{withFileTypes:true})) { const relative=prefix+item.name; if(item.isDirectory())collect(path.join(directory,item.name),relative+'/');else releaseFiles[relative]=fs.readFileSync(path.join(directory,item.name)); } }
collect(destination);
const releaseBytes=globalThis.EctdZip.createFolderZip([],new Date('2026-10-16T00:00:00Z'),releaseFiles);
const releaseName=`eu-validator-v${require('../package.json').version}.zip`;
fs.writeFileSync(path.join(destination,releaseName),releaseBytes);
fs.writeFileSync(path.join(destination,releaseName+'.sha256'),crypto.createHash('sha256').update(releaseBytes).digest('hex')+'  '+releaseName+'\n');
console.log(`Built reference app, local validator, qualification package and hashed release manifest (${commit.slice(0,12)}).`);
