/**
 * Playwright E2E Test Configuration
 * Story 1.1 baseline: mobile + desktop shell smoke only.
 * Visual regression and expanded matrices are added by later stories.
 */
import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["html", { open: "never" }],
    ["list"],
  ],

  expect: {
    timeout: 10000,
  },

  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "Desktop Chrome",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "Mobile Chrome",
      use: {
        ...devices["Pixel 5"],
        browserName: "chromium",
      },
    },
  ],

  // Reuse existing dev server when PLAYWRIGHT_TEST_BASE_URL is set externally,
  // otherwise boot a local pnpm dev server for the test run.
  ...(process.env.PLAYWRIGHT_TEST_BASE_URL
    ? {}
    : {
        webServer: {
          command: "pnpm dev",
          url: baseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 120 * 1000,
        },
      }),
});
