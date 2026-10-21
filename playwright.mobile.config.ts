import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e-mobile',
  fullyParallel: true,
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] ? 1 : 0,
  workers: process.env['CI'] ? 2 : 1,
  timeout: 45000,
  expect: { timeout: 10000 },
  outputDir: 'test-results-mobile',
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report-mobile' }]],
  use: {
    baseURL: 'http://127.0.0.1:4301',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'es-CL',
    timezoneId: 'America/Santiago',
  },
  projects: [
    { name: 'android-viewport', use: { ...devices['Pixel 7'], defaultBrowserType: 'chromium' } },
    {
      name: 'tablet-viewport',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1024, height: 768 }, hasTouch: true },
    },
  ],
  webServer: {
    command: 'node tools/serve-build.mjs --mobile --port 4301',
    url: 'http://127.0.0.1:4301',
    reuseExistingServer: false,
    timeout: 30000,
  },
});
