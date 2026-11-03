'use strict';
// Captures documentation screenshots from the built site. Start `npm start` first.
const path = require('node:path');
const { chromium } = require('@playwright/test');

const base = process.env.ECTD_TEST_URL || 'http://127.0.0.1:4173/';
const output = path.resolve(__dirname, '..', 'docs', 'screenshots');
const desktop = { width: 1280, height: 800 };

async function row(page, id) {
  const element = page.locator(`[data-row-id="${id}"]`);
  await element.scrollIntoViewIfNeeded();
  return element;
}

(async () => {
  const browser = await chromium.launch();
  const capture = async (name, { url, scheme = 'light', viewport = desktop, prepare, fullPage = false }) => {
    const context = await browser.newContext({ colorScheme: scheme, viewport, deviceScaleFactor: 1 });
    const page = await context.newPage();
    await page.goto(new URL(url, base).href);
    await page.locator('#comparisonSection').waitFor({ state: 'visible' });
    const target = prepare ? await prepare(page) : null;
    await (target || page).screenshot({ path: path.join(output, name), fullPage: target ? undefined : fullPage });
    await context.close();
  };
  await capture('01-overview.png', { url: './?a=eu&b=us' });
  await capture('02-pointer.png', { url: './?a=eu&b=us', prepare: page => row(page, 'environment') });
  await capture('03-source-fallback.png', { url: './?a=eu&b=us', prepare: page => row(page, 'experts') });
  await capture('04-placement-restriction.png', { url: './?a=ca&b=au&q=fee', prepare: page => row(page, 'fee-forms') });
  await capture('05-dark-mode.png', { url: './?a=eu&b=ch', scheme: 'dark' });
  await capture('06-mobile.png', { url: './?a=jp&b=ch', viewport: { width: 390, height: 844 } });
  await capture('07-sources.png', { url: './', prepare: async page => {
    await page.locator('#sourcesPanel summary').click();
    return page.locator('#sourcesPanel');
  } });
  await browser.close();
})().catch(error => { console.error(error); process.exitCode = 1; });
