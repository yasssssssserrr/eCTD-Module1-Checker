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
  await expect(page.locator('#dataStatus')).toContainText('2026.11.03-3');
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

test('an unmapped region points to a related heading or its official source', async ({ page }) => {
  await page.goto('./?a=eu&b=us');
  const environment = page.locator('[data-row-id="environment"]');
  await expect(environment).toContainText('Keine Zuordnung erfasst');
  await expect(environment).toContainText('1.12.14');
  await expect(environment).toContainText('Environmental Analysis');
  await expect(environment.getByRole('link', { name: /FDA/ })).toHaveAttribute('href', /fda\.gov/);
  const experts = page.locator('[data-row-id="experts"]');
  await expect(experts).toContainText('Keine Zuordnung erfasst');
  await expect(experts).toContainText('In der offiziellen Quelle nachsehen');
  await page.locator('#searchInput').fill('1.12.14');
  await expect(environment).toBeVisible();
});

test('authority placement restrictions appear beside the heading', async ({ page }) => {
  await page.goto('./?a=ca&b=au&q=fee');
  await expect(page.locator('[data-row-id="fee-forms"]')).toContainText('keine Dokumente hier ablegen');
});

test('theme switch overrides the device setting and remembers the choice', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ colorScheme: 'dark', baseURL });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const background = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await page.goto('./');
  const toggle = page.locator('#themeToggle');
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-label', 'Zum hellen Design wechseln');
  const dark = await background();
  await expect(toggle).toContainText('Hell');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-label', 'Zum dunklen Design wechseln');
  await expect(toggle).toContainText('Dunkel');
  await expect(page.locator('html')).not.toHaveClass(/theme-changing/);
  const light = await background();
  expect(light).not.toBe(dark);
  expect(await page.locator('.logo-title').evaluate(element => getComputedStyle(element).color)).not.toBe(light);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(await background()).toBe(light);
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual(['ectd-theme']);
  await page.locator('#themeToggle').click();
  expect(await background()).toBe(dark);
  await page.emulateMedia({ media: 'print' });
  expect(await background()).not.toBe(dark);
  expect(errors).toEqual([]);
  await context.close();
});

test('theme switch stays clearly visible in both themes and all assets use versioned URLs', async ({ browser, baseURL }) => {
  const contrast = () => {
    const parse = value => value.match(/[\d.]+/g).map(Number);
    const luminance = ([r, g, b]) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const ratio = (a, b) => { const [x, y] = [luminance(parse(a)), luminance(parse(b))].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
    const button = document.getElementById('themeToggle');
    const style = getComputedStyle(button);
    const icon = [...button.querySelectorAll('svg')].find(svg => getComputedStyle(svg).display !== 'none');
    return { icon: ratio(getComputedStyle(icon).color, style.backgroundColor), border: ratio(style.borderTopColor, getComputedStyle(document.querySelector('.app-header')).backgroundColor), label: ratio(style.color, style.backgroundColor) };
  };
  for (const colorScheme of ['light', 'dark']) {
    const context = await browser.newContext({ colorScheme, baseURL });
    const page = await context.newPage();
    await page.goto('./');
    await expect(page.locator('#themeToggle')).toBeVisible();
    const result = await page.evaluate(contrast);
    expect(result.icon).toBeGreaterThanOrEqual(3);
    expect(result.border).toBeGreaterThanOrEqual(3);
    expect(result.label).toBeGreaterThanOrEqual(4.5);
    expect(await page.evaluate(() => [...document.querySelectorAll('link[rel=stylesheet], script[src]')].every(element => /\?v=[0-9a-f]{12}$/.test(element.getAttribute('href') || element.getAttribute('src'))))).toBe(true);
    await context.close();
  }
});

test('theme switch follows a light device by default and fits on a phone', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ colorScheme: 'light', baseURL, viewport: { width: 375, height: 700 } });
  const page = await context.newPage();
  await page.goto('./');
  await expect(page.locator('#themeToggle')).toHaveAttribute('aria-label', 'Zum dunklen Design wechseln');
  await expect(page.locator('#themeToggle')).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  await page.addStyleTag({ content: '.app-header * { letter-spacing:.08em; }' });
  for (const width of [320, 360, 375, 390]) {
    await page.setViewportSize({ width, height: 700 });
    await expect(page.locator('#themeToggle')).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `header overflows at ${width}px with a wide font`).toBe(true);
  }
  await context.close();
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
