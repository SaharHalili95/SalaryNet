import { defineConfig, devices } from '@playwright/test'

// Mobile end-to-end tests against the demo build, on Safari (WebKit) and Chrome engines.
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'iphone-14', use: { ...devices['iPhone 14'] } },
    { name: 'iphone-se', use: { ...devices['iPhone SE'] } },
    { name: 'pixel-7', use: { ...devices['Pixel 7'] } },
    { name: 'angular-iphone-14', use: { ...devices['iPhone 14'], baseURL: 'http://localhost:4174' }, metadata: { app: 'angular' }, grepInvert: /@full-app/ },
    { name: 'angular-iphone-se', use: { ...devices['iPhone SE'], baseURL: 'http://localhost:4174' }, metadata: { app: 'angular' }, grepInvert: /@full-app/ },
    { name: 'angular-pixel-7', use: { ...devices['Pixel 7'], baseURL: 'http://localhost:4174' }, metadata: { app: 'angular' }, grepInvert: /@full-app/ },
  ],
  webServer: [
    {
      command: 'npx vite build --mode demo --outDir dist-e2e && npx vite preview --mode demo --outDir dist-e2e --port 4173 --strictPort',
      env: { VITE_BASE: '/' }, url: 'http://localhost:4173', reuseExistingServer: !process.env.CI, timeout: 180_000,
    },
    {
      command: 'cd ../web-angular && npx ng build --configuration e2e && cd ../web && npx vite preview --outDir ../web-angular/dist/salarynet/browser --port 4174 --strictPort',
      url: 'http://localhost:4174', reuseExistingServer: !process.env.CI, timeout: 180_000,
    },
  ],
})
