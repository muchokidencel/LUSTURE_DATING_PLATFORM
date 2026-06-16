import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const testDir = defineBddConfig({
  paths: ['tests/features/*.feature'],
  importTestFrom: 'tests/steps/fixtures.ts',
  steps: ['tests/steps/**/*.ts'],
});

export default defineConfig({
  testDir,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev --prefix client',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});

