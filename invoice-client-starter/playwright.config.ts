import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: 'https://fe.local.test:5173',
    browserName: 'chromium',
    channel: 'msedge',    
    headless: false, // pro první test záměrně false
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
