import { defineConfig, devices } from '@playwright/test';

// A port of its own: my other sites use the same test setup, and two of them can run at the same time.
const PORT = Number(process.env.VISUAL_PORT ?? 4338);
const BASE = '/easy-web-worker/';

/**
 * Visual regression baselines for the whole site. Local only: no CI job runs `test:visual`, and the
 * baselines are macOS-rendered. See visual/README.md.
 */
export default defineConfig({
  testDir: './visual',
  snapshotDir: './visual/__screenshots__',
  snapshotPathTemplate: '{snapshotDir}/{arg}-{projectName}{ext}',
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  expect: {
    // VISUAL_STRICT=1 is the restyling gate. `threshold` is the per-pixel colour sensitivity: at
    // its 0.2 default a subtle recolour counts as zero differing pixels, so maxDiffPixelRatio alone
    // cannot catch one. Playwright squares this value, leaving a usable window of 0.0022 (above
    // antialiasing noise) to 0.051 (below a one-step hairline recolour).
    toHaveScreenshot: {
      threshold: process.env.VISUAL_STRICT ? 0.01 : 0.2,
      maxDiffPixelRatio: process.env.VISUAL_STRICT ? 0 : 0.03,
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
    },
  },
  use: {
    baseURL: `http://127.0.0.1:${PORT}${BASE}`,
    reducedMotion: 'reduce',
    colorScheme: 'light',
    locale: 'en-US',
    timezoneId: 'UTC',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } },
    { name: 'mobile', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: `node scripts/visual-server.mjs ${PORT}`,
    url: `http://127.0.0.1:${PORT}${BASE}`,
    // Never reuse: a server already on the port may be serving another site, and the tests would run against it.
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
