import { test, expect } from "@playwright/test";
import { gotoDesktop, paintPixel, startButton, windowById } from "./helpers";

/**
 * DouglasOS Paint on the touch shell (stage 10). The file name matches the
 * phone-only pattern in playwright.config.ts (iPhone 13, Pixel 7).
 */
test.describe("DouglasOS Paint (touch)", () => {
  test("Start → Accessories → Paint: full-screen, tap to paint, undo", async ({ page }) => {
    await gotoDesktop(page);
    await startButton(page).tap();
    const entry = page.locator('[data-program-folder="accessories"] [data-program="paint"]');
    await entry.scrollIntoViewIfNeeded();
    await entry.tap();
    const win = windowById(page, "paint");
    await expect(win).toHaveAttribute("data-presentation", "fullscreen");

    // The toolbar and palette are touch-sized and the page never scrolls sideways.
    const brush = page.locator('[data-paint-tool="brush"]');
    const brushBox = (await brush.boundingBox())!;
    expect(brushBox.width).toBeGreaterThanOrEqual(44);
    expect(brushBox.height).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    await brush.tap();
    await page.locator('[data-paint-size="9"]').tap();
    await page.locator('[data-paint-color="#d8461f"]').tap();
    const surface = page.locator("[data-paint-surface]");
    await surface.tap({ position: { x: 60, y: 60 } });
    await expect.poll(() => paintPixel(page, 60, 60)).toEqual([0xd8, 0x46, 0x1f, 255]);

    await page.locator('[data-paint-action="undo"]').tap();
    await expect.poll(() => paintPixel(page, 60, 60)).toEqual([255, 255, 255, 255]);
  });
});
