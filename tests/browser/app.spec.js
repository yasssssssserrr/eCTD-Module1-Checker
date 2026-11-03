'use strict';
const { test, expect } = require('@playwright/test');
const fs = require('node:fs/promises');

test('loads a usable default comparison without external requests or script errors', async ({ page, baseURL }) => {
  const errors = [], external = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (new URL(request.url()).origin !== new URL(baseURL).origin) external.push(request.url()); });
  await page.goto('./');
  await expect(page.locator('#comparisonSection')).toBeVisible();
  await expect(page.locator('#regionA')).toHaveValue('eu');
  await expect(page.locator('#regionB')).toHaveValue('us');
  await expect(page.locator('#statPairs')).not.toHaveText('0');
  await expect(page.locator('#dataStatus')).toContainText('2026.11.03');
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});

test('restores shared filters and reveals matches under collapsed parents', async ({ page }) => {
  await page.goto('./?a=eu&b=uk&q=braille');
  await expect(page.locator('#searchInput')).toHaveValue('braille');
  const row = page.locator('[data-row-id="braille"]');
  await expect(row).toBeVisible();
  await expect(row).toContainText('1.3.6');
  await page.locator('#toggleExpandAll').click();
  await expect(row).toBeVisible();
  await expect(page.locator('#noResults')).toBeHidden();
  await page.reload();
  await expect(row).toBeVisible();
  await expect(page.locator('#regionB')).toHaveValue('uk');
});

test('searches plain Latin text and resets an empty result', async ({ page }) => {
  await page.goto('./');
  await page.locator('#searchInput').fill('padiatrie');
  await expect(page.locator('[data-row-id="paediatrics"]')).toBeVisible();
  await page.locator('#searchInput').fill('no-such-heading-012345');
  await expect(page.locator('#noResults')).toBeVisible();
  await page.locator('#resetFilters').click();
  await expect(page.locator('#noResults')).toBeHidden();
  await expect(page.locator('#searchInput')).toHaveValue('');
});

test('keeps regions distinct and swaps their selected values', async ({ page }) => {
  await page.goto('./?a=ca&b=au');
  await expect(page.locator('#regionA option[value="au"]')).toBeDisabled();
  await page.locator('#swapBtn').click();
  await expect(page.locator('#regionA')).toHaveValue('au');
  await expect(page.locator('#regionB')).toHaveValue('ca');
  await expect(page).toHaveURL(/a=au&b=ca/);
});

test('malformed URL parameters fall back to safe choices and do not create markup', async ({ page }) => {
  await page.goto('./?a=invalid&b=eu&focus=invalid&status=invalid&q=%3Cscript%3Ebad%3C%2Fscript%3E');
  await expect(page.locator('#regionA')).toHaveValue('eu');
  await expect(page.locator('#regionB')).toHaveValue('uk');
  await expect(page.locator('#submissionType')).toHaveValue('all');
  await expect(page.locator('#noResults')).toBeVisible();
  await expect(page.locator('#searchInput')).toHaveValue('<script>bad</script>');
  expect(await page.locator('script:not([src])').count()).toBe(0);
});

test('CSV downloads include filtered children, evidence and review limits', async ({ page }) => {
  await page.goto('./?a=eu&b=uk&q=braille');
  const download = page.waitForEvent('download');
  await page.locator('#exportCsv').click();
  const result = await download;
  const content = await fs.readFile(await result.path(), 'utf8');
  expect(content).toContain('1.3.6');
  expect(content).toContain('source-checked');
  expect(content).toContain('format-reference');
  expect(content).toContain('keine Dossiervalidierung');
  expect(content).not.toContain('Environmental Risk Assessment');
});

test('planning ZIP includes warnings and both regions', async ({ page }) => {
  await page.goto('./?a=ca&b=au&focus=admin');
  const download = page.waitForEvent('download');
  await page.locator('#exportFolders').click();
  const result = await download;
  const content = await fs.readFile(await result.path());
  expect(content.readUInt32LE(0)).toBe(0x04034b50);
  const text = content.toString('utf8');
  expect(text).toContain('README-PLANNING-ONLY.txt');
  expect(text).toContain('NOT official eCTD submission paths');
  expect(text).toContain('m1/ca/');
  expect(text).toContain('123-patent-certification');
});

test('source panel distinguishes UK format evidence and PMDA controlled vocabulary', async ({ page }) => {
  await page.goto('./');
  await page.locator('#sourcesPanel summary').click();
  await expect(page.locator('#sourceGrid article')).toHaveCount(7);
  await expect(page.locator('#sourceGrid')).toContainText('JP_CL4-context-of-use.gc_v4.xml');
  await expect(page.getByRole('link', { name: 'EU-Strukturreferenz' })).toBeVisible();
  const report = await page.request.get('VALIDATION_REPORT.md');
  expect(report.ok()).toBe(true);
  expect(await report.text()).toContain('2026-10-16');
});

test('PDF print includes filtered children even if collapsed and shows view metadata', async ({ page }) => {
  await page.goto('./?a=eu&b=uk&q=braille');
  await page.locator('#toggleExpandAll').click();
  await page.evaluate(() => { window.print = () => {}; });
  await page.locator('#exportPdf').click();
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('[data-row-id="braille"]')).toBeVisible();
  await expect(page.locator('[data-row-id="environment"]')).toBeHidden();
  await expect(page.locator('#printContext')).toContainText('braille');
});

test('mobile layout stays within viewport and leaves the comparison scrollable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./?a=jp&b=ch');
  await expect(page.locator('#comparisonSection')).toBeVisible();
  const dimensions = await page.evaluate(() => ({ viewport: innerWidth, body: document.documentElement.scrollWidth, table: document.querySelector('#comparisonSection .table-container').scrollWidth, container: document.querySelector('#comparisonSection .table-container').clientWidth }));
  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport);
  expect(dimensions.table).toBeGreaterThan(dimensions.container);
  await page.locator('#regionA').scrollIntoViewIfNeeded();
  await expect(page.locator('#regionA')).toBeInViewport();
});
