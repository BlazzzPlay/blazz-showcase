import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'node:path';

// Share only synthetic state with this invocation's child-owned local Worker.
process.env.TEST_STACK_STATE ??= resolve(`worker/.cloudflare/e2e-${process.pid}`);
const baseURL = `http://127.0.0.1:${process.env.TEST_STACK_PORT ?? 4401}`;

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: true,
  // Bound cached Chromium/workerd resource use on local and CI runners.
  workers: 2,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'node scripts/test-stack.mjs',
    url: `${baseURL}/api/health`,
    reuseExistingServer: false,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 10000 },
    timeout: 120_000,
  },
});
