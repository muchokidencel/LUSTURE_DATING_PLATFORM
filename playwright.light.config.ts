import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: 'ui_exploration_light.spec.ts',
  timeout: 120000,
  use: {
    baseURL: 'http://localhost:5173',
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
