import { test, expect } from "@playwright/test";
import { dockButton, gotoDesktop, windows } from "./helpers";

const WINDOW_APPS = [
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

  for (const appId of WINDOW_APPS) {
    test(`"${appId}" opens a window with content`, async ({ page }) => {
      await dockButton(page, appId).click();
      const win = windows(page).first();
      await expect(win).toBeVisible();
      // The lazy content renders something inside the window body.
      await expect(win).not.toBeEmpty();
    });
  }

  test("resume triggers a download instead of opening a window", async ({
    page,
  }) => {
    // resume is a download launcher (no data-dock-app). Its dock button is
    // labelled exactly "Resume" (the desktop icon uses "resume.pdf").
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Resume", exact: true }).click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain(".pdf");
    await expect(windows(page)).toHaveCount(0);
  });
});
