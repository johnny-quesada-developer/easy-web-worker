import { defineConfig, devices } from '@playwright/test';

// Same switch as vitest.config.ts: the page loads the source or the built package.
const target = process.env.EASY_WEB_WORKER_TEST_TARGET === 'dist' ? 'dist' : 'src';

const port = 4319;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  outputDir: './e2e/.results',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: [['list']],
  timeout: 30_000,
  use: {
    baseURL,
  },
  projects: [
    {
      name: `chrome (${target})`,
      // the locally installed Chrome, no browser download needed
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],
  webServer: {
    command: 'yarn --silent tsx e2e/harness/serve.ts',
    url: `${baseURL}/`,
    reuseExistingServer: false,
    env: {
      EASY_WEB_WORKER_TEST_TARGET: target,
      EASY_WEB_WORKER_E2E_PORT: String(port),
    },
  },
});
