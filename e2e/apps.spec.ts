import { test, expect } from "@playwright/test";
import { desktopIcon, gotoDesktop, startButton, startItem, windowById, windows } from "./helpers";

const DESKTOP_APPS = [
  "about",
  "experience",
  "projects",
  "skills",
  "how-i-work-with-ai",
  "contact",
] as const;

test.describe("app launchers", () => {
  test.beforeEach(async ({ page }) => {
    await gotoDesktop(page);
  });

  for (const appId of DESKTOP_APPS) {
    test(`"${appId}" opens a window with content on a single click`, async ({ page }) => {
      await desktopIcon(page, appId).click();
      const win = windowById(page, appId);
      await expect(win).toBeVisible();
      await expect(win).not.toBeEmpty();
    });
  }

  test("resume.pdf downloads instead of opening a window", async ({ page }) => {
    const downloadPromise = page.waitForEvent("download");
    await desktopIcon(page, "resume").click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain(".pdf");
    await expect(windows(page)).toHaveCount(0);
  });

  test("Display Properties opens from the Start menu (no desktop icon)", async ({ page }) => {
    await expect(desktopIcon(page, "display")).toHaveCount(0);
    await startButton(page).click();
    await startItem(page, "display").click();
    await expect(windowById(page, "display")).toBeVisible();
  });
});
