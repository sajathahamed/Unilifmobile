import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  fullyParallel: false,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  webServer: {
    command: 'set CI=1&& npx expo start --web --port 19007',
    url: 'http://localhost:19007',
    reuseExistingServer: true,
    timeout: 180_000,
  },
  use: {
    baseURL: 'http://localhost:19007',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
