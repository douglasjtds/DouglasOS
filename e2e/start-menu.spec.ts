import { test, expect } from "@playwright/test";
import { gotoDesktop, startButton, startItem, windowById, windows } from "./helpers";

test.describe("Start menu", () => {
  test.beforeEach(async ({ page }) => {
    await gotoDesktop(page);
  });

  test("Start → Résumé (CV) downloads the PDF", async ({ page }) => {
    await startButton(page).click();
    const downloadPromise = page.waitForEvent("download");
    await page.locator('[data-start-column="right"] [data-start-item="resume"]').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("Douglas-Tertuliano-CV.pdf");
    await expect(page.getByRole("menu")).toHaveCount(0);
  });

  test("Start → Contact opens the Contact window", async ({ page }) => {
    await startButton(page).click();
    await page.locator('[data-start-column="right"] [data-start-item="contact"]').click();
    await expect(windowById(page, "contact")).toBeVisible();
  });

  test("All Programs lists every launcher", async ({ page }) => {
    await startButton(page).click();
    await startItem(page, "all-programs").hover();
    const programs = page.locator("[data-all-programs] [data-program]");
    // 7 apps + Display Properties + 4 external shortcuts.
    await expect(programs).toHaveCount(12);
    await programs.filter({ hasText: "Skills" }).click();
    await expect(windowById(page, "skills")).toBeVisible();
  });

  test("keyboard: Ctrl+Esc opens, arrows navigate, Esc closes", async ({ page }) => {
    await page.locator("body").press("Control+Escape");
    const menu = page.getByRole("menu", { name: "Start menu" });
    await expect(menu).toBeVisible();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Escape");
    await expect(menu).toHaveCount(0);
    await expect(startButton(page)).toBeFocused();

    // Always-available alternative.
    await page.keyboard.press("Alt+Shift+KeyS");
    await expect(menu).toBeVisible();
  });

  test("Log Off returns to the logon screen and back, windows kept", async ({ page }) => {
    await startButton(page).click();
    await startItem(page, "about").click();
    await expect(windowById(page, "about")).toBeVisible();

    await startButton(page).click();
    await startItem(page, "log-off").click();
    await expect(page.getByTestId("logon-screen")).toBeVisible();
    await page.getByRole("button", { name: "Log on as Douglas" }).click();
    await expect(windowById(page, "about")).toBeVisible();
  });

  test("Turn Off: confirm → shutdown screen → Turn on", async ({ page }) => {
    await startButton(page).click();
    await startItem(page, "about").click();
    await startButton(page).click();
    await startItem(page, "turn-off").click();

    const dialog = page.getByRole("alertdialog", { name: "Turn off DouglasOS" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Turn Off" }).click();

    await expect(page.getByTestId("shutdown-screen")).toBeVisible();
    await page.getByRole("button", { name: "Turn on" }).click();
    await expect(startButton(page)).toBeVisible();
    await expect(windows(page)).toHaveCount(0);
  });
});
