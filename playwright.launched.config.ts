import { defineConfig, devices } from '@playwright/test';

/** Same suite, but the site is built with every launch flag forced on (ALPHA_FLAGS=all). */
const PORT = 4323;

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: /launched\.spec\.ts/,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: `http://localhost:${PORT}`, trace: 'on-first-retry' },
  webServer: {
    command: `ALPHA_FLAGS=all npm run build && npm run preview -- --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'] } }],
});
