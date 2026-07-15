import { test, expect } from "@playwright/test";
import { dockButton } from "./helpers";

test.describe("boot screen", () => {
  test("plays the boot wordmark then reveals the desktop", async ({ page }) => {
    // Full motion + a fresh session so the boot sequence actually runs.
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/en");

    await expect(page.getByTestId("boot-screen")).toBeVisible();
    // It fades out on its own; the desktop (dock) shows up afterwards.
    await expect(dockButton(page, "about")).toBeVisible({ timeout: 6000 });
  });

  test("does not replay within the same session", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/en");
    await expect(dockButton(page, "about")).toBeVisible({ timeout: 6000 });

    // Second navigation in the same session (sessionStorage flag set).
    await page.goto("/en");
    await expect(dockButton(page, "about")).toBeVisible();
    await expect(page.getByTestId("boot-screen")).toHaveCount(0);
  });
});
