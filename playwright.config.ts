import { defineConfig, devices } from '@playwright/test';

const production = Boolean(process.env['CI']) || process.env['POS_E2E_PRODUCTION'] === '1';
const rawPort = process.env['POS_E2E_PORT'] ?? '4300';
const port = Number(rawPort);
if (!/^\d+$/.test(rawPort) || !Number.isInteger(port) || port < 1024 || port > 65535) {
  throw new Error('POS_E2E_PORT must be an integer from 1024 to 65535.');
}
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] ? 1 : 0,
  workers: process.env['CI'] ? 2 : 3,
  timeout: 45000,
  expect: { timeout: 10000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'es-CL',
    timezoneId: 'America/Santiago',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } },
  ],
  webServer: {
    command: production
      ? `node tools/serve-build.mjs --port ${port}`
      : `npm exec -- nx serve pos-web --host 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: !production,
    timeout: 180000,
  },
});
