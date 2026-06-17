import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    video: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "live-rooms",
      use: { ...devices["Desktop Chrome"] },
      testMatch: ["**/create-room.spec.ts", "**/create-forms-alignment.spec.ts", "**/join-room.spec.ts", "**/live-room*.spec.ts"],
    },
    {
      name: "global-room",
      use: { ...devices["Desktop Chrome"] },
      testMatch: ["**/explore-quizzes.spec.ts", "**/global-room*.spec.ts"],
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
