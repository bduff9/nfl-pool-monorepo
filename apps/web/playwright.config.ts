import { defineConfig, devices } from "@playwright/test";

import { AUTH_FILE } from "./e2e/auth";

export default defineConfig({
  forbidOnly: !!process.env.CI,
  fullyParallel: true,
  workers: 2,
  projects: [
    { name: "setup", testMatch: /auth\.setup\.spec\.ts/ },
    {
      name: "desktop",
      testIgnore: /authenticated|auth\.setup/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      testIgnore: /authenticated|auth\.setup/,
      use: { ...devices["Pixel 5"] },
    },
    {
      dependencies: ["setup"],
      name: "desktop-auth",
      testMatch: /authenticated/,
      use: { ...devices["Desktop Chrome"], storageState: AUTH_FILE },
    },
    {
      dependencies: ["setup"],
      name: "mobile-auth",
      testMatch: /authenticated/,
      use: { ...devices["Pixel 5"], storageState: AUTH_FILE },
    },
  ],
  retries: process.env.CI ? 2 : 0,
  testDir: "./e2e",
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: "http://localhost:3000",
    navigationTimeout: 60_000,
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm dev",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: "http://localhost:3000",
  },
});
