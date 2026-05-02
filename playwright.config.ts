/**
 * Playwright E2E Test Configuration
 * Story 1.1 baseline: mobile + desktop shell smoke only.
 * Visual regression and expanded matrices are added by later stories.
 */
import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000";
const stripeWebhookSecret =
  process.env.STRIPE_WEBHOOK_SECRET || "whsec_playwright_test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60 * 1000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
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

  // Reuse existing dev server when PLAYWRIGHT_TEST_BASE_URL is set externally.
  // Use webpack for automated E2E because Turbopack can panic under parallel
  // Playwright navigation on Windows with the current Next.js 16 dev build.
  // Keep one worker because auth + Prisma onboarding flows mutate shared local
  // session/database state and became flaky when Desktop/Mobile ran concurrently.
  ...(process.env.PLAYWRIGHT_TEST_BASE_URL
    ? {}
    : {
        webServer: {
          command: "pnpm exec next dev --webpack",
          url: baseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 120 * 1000,
          env: {
            ...process.env,
            STRIPE_WEBHOOK_SECRET: stripeWebhookSecret,
          },
        },
      }),
});
