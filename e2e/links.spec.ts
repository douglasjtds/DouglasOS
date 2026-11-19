import { test, expect, type Page } from "@playwright/test";
import { desktopIcon, gotoDesktop, startButton, startItem, windows } from "./helpers";

/**
 * External shortcuts (stage 3). The profile hosts are stubbed so the specs
 * never depend on (or hit) the real sites; we only assert that a popup opens
 * on the expected URL.
 */
const LINKEDIN = "https://www.linkedin.com/in/douglasjtds";
const GITHUB = "https://github.com/douglasjtds";

async function stubExternalSites(page: Page) {
  await page.context().route(/^https:\/\/(www\.linkedin\.com|github\.com)\//, (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: "<title>stub</title>" }),
  );
}

test.describe("external shortcuts", () => {
  test.beforeEach(async ({ page }) => {
    await stubExternalSites(page);
    await gotoDesktop(page);
  });

  test("a single click on linkedin.url opens LinkedIn in a new tab", async ({ page }) => {
    const icon = desktopIcon(page, "linkedin");
    await expect(icon).toHaveAccessibleName("linkedin.url");
    const popupPromise = page.waitForEvent("popup");
    await icon.click();
    const popup = await popupPromise;
    await expect.poll(() => popup.url()).toBe(LINKEDIN);
    // noopener: the new tab can't reach back into the portfolio.
    expect(await popup.evaluate(() => window.opener)).toBeNull();
    await expect(windows(page)).toHaveCount(0);
  });

  test("Start → All Programs → github.url opens GitHub in a new tab", async ({ page }) => {
    await startButton(page).click();
    await startItem(page, "all-programs").hover();
    const popupPromise = page.waitForEvent("popup");
    await page.locator('[data-all-programs] [data-program="github"]').click();
    const popup = await popupPromise;
    await expect.poll(() => popup.url()).toBe(GITHUB);
  });

  test("the links sit in their own column next to the apps", async ({ page }) => {
    const about = (await desktopIcon(page, "about").boundingBox())!;
    const linkedin = (await desktopIcon(page, "linkedin").boundingBox())!;
    const email = (await desktopIcon(page, "email").boundingBox())!;
    expect(linkedin.x).toBeGreaterThan(about.x);
    expect(Math.round(linkedin.y)).toBe(Math.round(about.y));
    expect(Math.round(email.x)).toBe(Math.round(linkedin.x));
  });
});
