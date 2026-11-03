'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const destination = path.join(root, 'dist');
const assets = ['index.html', 'style.css', 'theme.js', 'core.js', 'data.js', 'zip.js', 'app.js', 'VALIDATION_REPORT.md'];
// An explicit allowlist keeps development files out of the published site.
for (const asset of assets) {
  if (!fs.statSync(path.join(root, asset)).isFile()) throw new Error(`Missing asset: ${asset}`);
}
if (path.dirname(destination) !== root || path.basename(destination) !== 'dist') throw new Error('Invalid build destination');
fs.rmSync(destination, { recursive: true, force: true });
fs.mkdirSync(destination);
for (const asset of assets) fs.copyFileSync(path.join(root, asset), path.join(destination, asset));
fs.writeFileSync(path.join(destination, '.nojekyll'), '');
console.log(`Built Module 1 comparison site (${assets.length} files).`);
