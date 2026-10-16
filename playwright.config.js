'use strict';
const { defineConfig, devices } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests/browser', fullyParallel: true,
  retries: process.env.CI ? 1 : 0, workers: process.env.CI ? 2 : undefined,
  reporter: 'list',
  use: { baseURL: process.env.ECTD_TEST_URL || 'http://127.0.0.1:4173/', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.ECTD_TEST_URL ? undefined : {
    command: 'node scripts/serve.js', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI,
  },
});
