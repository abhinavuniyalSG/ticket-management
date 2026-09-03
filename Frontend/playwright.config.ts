import { defineConfig, devices } from "@playwright/test";

// These end-to-end tests never talk to the real backend: they intercept
// every `/api/**` call with page.route() so they run fast and don't need a
// database, a running server, or seeded test accounts.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: "html",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
