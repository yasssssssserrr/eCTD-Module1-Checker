'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs/promises');
const path=require('node:path');
const crypto=require('node:crypto');

async function fixture(kind='valid') {
  const {createDemoContents}=await import('../../validator/demo.mjs');
  const contents=createDemoContents();
  if(kind==='tampered')contents['0000/m1/eu/10-cover/ema/ema-cover.pdf']+='changed document';
  if(kind==='entity')contents['0000/m1/eu/eu-regional.xml']='<!DOCTYPE root [<!ENTITY x SYSTEM "https://untrusted.invalid/confidential">]><root>&x;</root>';
  const directory=path.resolve('.artifacts/browser-fixtures',crypto.randomUUID(),'private-product-application');
  for(const [relative,value] of Object.entries(contents)){const filename=path.join(directory,relative);await fs.mkdir(path.dirname(filename),{recursive:true});await fs.writeFile(filename,value);}
  return directory;
}
async function demo(page){await page.goto('./?view=validate');await page.locator('#demoDossier').click();await expect(page.locator('#dossierResults')).toBeVisible({timeout:30000});}

test('EU-B01 demo executes real browser DTD checks and discloses all incomplete scope',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await demo(page);
  await expect(page.locator('#dossierConclusion')).toContainText('Gesamtprüfung unvollständig');
  await expect(page.locator('#dossierSummary')).toContainText('18');
  await expect(page.locator('#dossierRunMeta')).toContainText('SYNTHETISCHE DEMO');
  await page.locator('#dossierFilter').selectOption('all');
  await expect(page.locator('#dossierRules tr')).toHaveCount(111);
  await expect(page.locator('#dossierRules tr').filter({has:page.getByRole('link',{name:'7.4',exact:true})})).toContainText('Bestanden');
  await expect(page.locator('#dossierRules tr').filter({has:page.getByRole('link',{name:'9.4',exact:true})})).toContainText('Bestanden');
  await expect(page.locator('#dossierRules tr').filter({has:page.getByRole('link',{name:'16.5',exact:true})})).toContainText('Bestanden');
  expect(errors).toEqual([]);
});
test('EU-B02 directory selection scans files without uploads, name disclosure or browser storage',async({page,baseURL})=>{
  const directory=await fixture();const external=[],writes=[],leaks=[];
  page.on('request',request=>{if(new URL(request.url()).origin!==new URL(baseURL).origin)external.push(request.url());if(request.method()!=='GET')writes.push(request.method());if(/private-product|ema-cover\.pdf/.test(request.url()))leaks.push(request.url());});
  await page.goto('./?view=validate');await page.locator('#dossierFiles').setInputFiles(directory);
  await expect(page.locator('#dossierSequence')).toHaveValue('0000');await page.locator('#runDossier').click();
  await expect(page.locator('#dossierResults')).toBeVisible({timeout:30000});
  await expect(page.locator('#dossierConclusion')).not.toContainText('Abweichungen gefunden');
  expect(external).toEqual([]);expect(writes).toEqual([]);expect(leaks).toEqual([]);
  expect(page.url()).not.toContain('private-product');
  expect(await page.evaluate(()=>({local:localStorage.length,session:sessionStorage.length}))).toEqual({local:0,session:0});
});
test('EU-B03 tampered content produces a failed MD5 finding',async({page})=>{
  await page.goto('./?view=validate');await page.locator('#dossierFiles').setInputFiles(await fixture('tampered'));await page.locator('#runDossier').click();
  await expect(page.locator('#dossierResults')).toBeVisible({timeout:30000});await expect(page.locator('#dossierConclusion')).toContainText('Abweichungen gefunden');
  await expect(page.locator('#dossierRules tr').filter({has:page.getByRole('link',{name:'11.2',exact:true})})).toContainText('MD5 mismatch');
});
test('EU-B04 untrusted XML entities are rejected without resolving their network references',async({page})=>{
  const external=[];page.on('request',request=>{if(request.url().includes('untrusted.invalid'))external.push(request.url());});
  await page.goto('./?view=validate');await page.locator('#dossierFiles').setInputFiles(await fixture('entity'));await page.locator('#runDossier').click();
  await expect(page.locator('#dossierResults')).toBeVisible({timeout:30000});await expect(page.locator('#dossierLocalErrors')).toContainText('Internal DTD');expect(external).toEqual([]);
});
test('EU-B05 downloaded JSON verifies independently and HTML preserves qualification limits',async({page})=>{
  await demo(page);const promise=page.waitForEvent('download');await page.locator('#downloadDossierJson').click();const download=await promise;
  const report=JSON.parse(await fs.readFile(await download.path(),'utf8'));const {reportSha256,...payload}=report;
  expect(crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex')).toBe(reportSha256);
  expect(report.rules).toHaveLength(111);expect(report.manifest).toHaveLength(11);expect(report.certification).toBe('NOT_CERTIFIED');expect(report.fullEuValidationComplete).toBe(false);
  const htmlDownload=page.waitForEvent('download');await page.locator('#downloadDossierHtml').click();const html=await fs.readFile(await(await htmlDownload).path(),'utf8');
  expect(html).toContain('ORGANIZATIONAL APPROVAL PENDING');expect(html).toContain('FULL EU VALIDATION INCOMPLETE');expect(html).toContain(reportSha256);expect(html).not.toContain('<script');
});
test('EU-B06 cancellation and clearing discard stale results',async({page})=>{
  await page.goto('./?view=validate');await page.locator('#demoDossier').click();await page.locator('#cancelDossier').click();
  await expect(page.locator('#dossierProgress')).toContainText('abgebrochen');await expect(page.locator('#dossierResults')).toBeHidden();
  await page.locator('#demoDossier').click();await expect(page.locator('#dossierResults')).toBeVisible({timeout:30000});await page.locator('#clearDossier').click();await expect(page.locator('#dossierResults')).toBeHidden();await expect(page.locator('#runDossier')).toBeDisabled();
});
test('EU-B07 controlled release ZIP, manifest and qualification package are downloadable',async({page})=>{
  await page.goto('./?view=validate');const manifest=await(await page.request.get('release-manifest.json')).json();expect(manifest.version).toBe('7.1.0');expect(manifest.qualification).toBe('PENDING_ORGANIZATIONAL_APPROVAL');
  const zip=await page.request.get('eu-validator-v7.1.0.zip');expect(zip.ok()).toBe(true);const bytes=await zip.body();expect(bytes.readUInt32LE(0)).toBe(0x04034b50);
  const expected=(await(await page.request.get('eu-validator-v7.1.0.zip.sha256')).text()).split(' ')[0];expect(crypto.createHash('sha256').update(bytes).digest('hex')).toBe(expected);
  const qualifications=await page.request.get('qualification-package.zip');expect(qualifications.ok()).toBe(true);expect((await qualifications.body()).toString()).toContain('VALIDATION_PLAN.md');
});
test('EU-B08 validator mobile layout and keyboard tabs remain usable',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('./?view=validate');await expect(page.locator('#validatorWorkspace')).toBeVisible();
  await expect(page.locator('.skip-link')).toHaveAttribute('href','#validatorWorkspace');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('#validationTab').focus();await page.keyboard.press('ArrowRight');await expect(page.locator('#referenceWorkspace')).toBeVisible();
  await expect(page.locator('.skip-link')).toHaveAttribute('href','#referenceWorkspace');
  await page.keyboard.press('Home');await expect(page.locator('#validatorWorkspace')).toBeVisible();await expect(page).toHaveURL(/view=validate/);
});
