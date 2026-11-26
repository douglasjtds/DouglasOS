import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright e2e config. Specs live in `e2e/` and drive the production build
 * (`pnpm run build && pnpm run start`) against a real browser, covering the boot
 * → desktop shell flows that change least as app content evolves.
 *
 * Multi-browser (Chromium/Firefox/WebKit) directly serves the MVP's
 * cross-browser requirement. CI sets `CI=1`, which enables retries + `forbidOnly`.
 */
// PORT overrides the default, e.g. to run against `next start -p 3100` while a dev
// server already holds 3000.
const PORT = Number(process.env.PORT ?? 3000);
const BASE_URL = `http://localhost:${PORT}`;
/** Specs for the touch shell; they run only on the phone projects. */
const MOBILE_SPECS = /mobile\.spec\.ts/;
/** Desktop Retro Cam spec, also run with Chromium's fake camera. */
const CAMERA_SPECS = /camera\.spec\.ts/;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["html"], ["list"]] : "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    // Desktop shell (>= 768px) on the three engines.
    { name: "chromium", use: { ...devices["Desktop Chrome"] }, testIgnore: MOBILE_SPECS },
    { name: "firefox", use: { ...devices["Desktop Firefox"] }, testIgnore: MOBILE_SPECS },
    { name: "webkit", use: { ...devices["Desktop Safari"] }, testIgnore: MOBILE_SPECS },
    // Retro Cam (stage 9) with Chromium's built-in fake camera (a synthetic
    // test pattern, auto-accepted permission). Only the camera spec runs here;
    // the other engines have no equivalent switch and skip the live-camera tests.
    {
      name: "chromium-camera",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
        },
      },
      testMatch: CAMERA_SPECS,
    },
    // Touch shell (< 768px) on real phone descriptors (touch, mobile viewport,
    // DPR). Firefox has no mobile emulation (`isMobile`), so phones run on
    // WebKit (iPhone) and Chromium (Android).
    { name: "iphone-13", use: { ...devices["iPhone 13"] }, testMatch: MOBILE_SPECS },
    { name: "pixel-7", use: { ...devices["Pixel 7"] }, testMatch: MOBILE_SPECS },
  ],
  webServer: {
    // Reuse a running dev server locally; build+start fresh in CI.
    command: process.env.CI
      ? "pnpm run build && pnpm run start"
      : "pnpm run dev",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
