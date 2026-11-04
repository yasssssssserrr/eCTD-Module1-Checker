'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const destination = path.join(root, 'dist');
const assets = ['index.html', 'style.css', 'theme.js', 'notice.js', 'core.js', 'data.js', 'zip.js', 'app.js', 'VALIDATION_REPORT.md'];
// An explicit allowlist keeps development files out of the published site.
for (const asset of assets) {
  if (!fs.statSync(path.join(root, asset)).isFile()) throw new Error(`Missing asset: ${asset}`);
}
if (path.dirname(destination) !== root || path.basename(destination) !== 'dist') throw new Error('Invalid build destination');
fs.rmSync(destination, { recursive: true, force: true });
fs.mkdirSync(destination);
for (const asset of assets) fs.copyFileSync(path.join(root, asset), path.join(destination, asset));
// Hashed URLs stop browsers from combining a new page with cached old styles or scripts.
let page = fs.readFileSync(path.join(destination, 'index.html'), 'utf8');
for (const asset of ['style.css', 'theme.js', 'notice.js', 'core.js', 'data.js', 'zip.js', 'app.js']) {
  const hash = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, asset))).digest('hex').slice(0, 12);
  const reference = new RegExp(`(?:href|src)="${asset.replace('.', '\\.')}"`);
  if (!reference.test(page)) throw new Error(`index.html does not load ${asset}`);
  page = page.replace(reference, match => `${match.slice(0, -1)}?v=${hash}"`);
}
fs.writeFileSync(path.join(destination, 'index.html'), page);
fs.writeFileSync(path.join(destination, '.nojekyll'), '');
console.log(`Built Module 1 comparison site (${assets.length} files).`);
