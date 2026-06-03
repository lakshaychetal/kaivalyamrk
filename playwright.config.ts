import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for the Kaivalyam Homestay Website.
 *
 * Drives end-to-end and accessibility checks (Playwright + `@axe-core/playwright`,
 * see tech.md "Testing"). This is configuration only — the actual E2E and a11y
 * specs are authored in later tasks (17.2 keyboard/focus/reduced-motion a11y,
 * 17.3 responsive layout). Until then `npx playwright test` simply finds zero
 * specs and exits cleanly.
 *
 * The `webServer` block boots the production build on demand so accessibility
 * runs hit the real, optimized site. It is started by Playwright only when specs
 * exist and run; it is never launched from automated setup steps.
 */
const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3000);
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  // Match spec files only; keeps a bare `tests/e2e` dir from erroring.
  testMatch: /.*\.(e2e|spec)\.ts/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    // Responsive coverage maps to the design breakpoints (375 / 768 / 1024 / 1440).
    { name: "chromium-desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 5"] } },
  ],
  // Boot the built site for E2E runs. Disabled when reusing an already-running
  // dev server locally. Started lazily by Playwright, not by setup tooling.
  webServer: {
    command: "npm run start",
    url: BASE_URL,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
});
