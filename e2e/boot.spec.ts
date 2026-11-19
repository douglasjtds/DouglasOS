import { test, expect } from "@playwright/test";
import { startButton } from "./helpers";

test.describe("boot → logon → desktop", () => {
  test("plays the boot, then the logon tile logs on", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/en");

    await expect(page.getByTestId("boot-screen")).toBeVisible();
    const logon = page.getByTestId("logon-screen");
    await expect(logon).toBeVisible({ timeout: 6000 });
    const tile = page.getByRole("button", { name: "Log on as Douglas" });
    await expect(tile).toBeFocused();

    await tile.click();
    await expect(logon).toHaveCount(0);
    await expect(startButton(page)).toBeVisible();
    // First logon of the session shows the welcome balloon.
    await expect(page.locator('[data-balloon="welcome"]')).toBeVisible();
  });

  test("Skip jumps past boot and logon straight to the desktop", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/en");
    await page.getByTestId("boot-screen").getByRole("button", { name: "Skip" }).click();
    await expect(page.getByTestId("logon-screen")).toHaveCount(0);
    await expect(startButton(page)).toBeVisible();
  });

  test("does not replay within the same session", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/en");
    // Wait for hydration (the boot focuses Skip on mount, in the same commit
    // that installs its key listener); an earlier Esc would be lost.
    await expect(page.getByTestId("boot-screen").getByRole("button", { name: "Skip" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("boot-screen")).toHaveCount(0);
    await expect(startButton(page)).toBeVisible();

    await page.goto("/en");
    await expect(startButton(page)).toBeVisible();
    await expect(page.getByTestId("boot-screen")).toHaveCount(0);
    await expect(page.getByTestId("logon-screen")).toHaveCount(0);
  });

  test("reduced motion: static boot label, quick logon, Enter logs on", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/en");
    await expect(page.getByTestId("boot-screen")).toContainText("Starting DouglasOS");
    await expect(page.getByTestId("logon-screen")).toBeVisible({ timeout: 3000 });
    await page.keyboard.press("Enter");
    await expect(startButton(page)).toBeVisible();
    await expect(page.getByTestId("logon-screen")).toHaveCount(0);
  });
});
