import { test, expect, type Page } from "@playwright/test";
import { gotoDesktop, paintPixel as pixel, startButton, startItem, windowById } from "./helpers";

/**
 * Open DouglasOS Paint through Start → All Programs → Accessories. (Run and
 * the command palette, stage 7, get their own entry at integration.)
 */
async function openPaint(page: Page) {
  await startButton(page).click();
  await startItem(page, "all-programs").hover();
  await page.locator('[data-program-folder="accessories"]').hover();
  await page.locator('[data-program="paint"]').click();
  await expect(windowById(page, "paint")).toBeVisible();
}

test.describe("DouglasOS Paint", () => {
  test.beforeEach(async ({ page }) => {
    await gotoDesktop(page);
  });

  test("Start → Accessories → Paint: draw a line, undo, redo", async ({ page }) => {
    await openPaint(page);
    const surface = page.locator("[data-paint-surface]");
    const box = (await surface.boundingBox())!;
    expect(await pixel(page, 40, 30)).toEqual([255, 255, 255, 255]);

    // Pencil (default) drag from (20, 30) to (80, 30) in canvas pixels.
    await page.mouse.move(box.x + 20, box.y + 30);
    await page.mouse.down();
    await page.mouse.move(box.x + 50, box.y + 30, { steps: 4 });
    await page.mouse.move(box.x + 80, box.y + 30, { steps: 4 });
    await page.mouse.up();
    await expect.poll(() => pixel(page, 40, 30)).toEqual([0, 0, 0, 255]);

    await page.locator('[data-paint-action="undo"]').click();
    await expect.poll(() => pixel(page, 40, 30)).toEqual([255, 255, 255, 255]);

    // Focus is still inside Paint (the Undo button): the keyboard redo works.
    await page.keyboard.press("Control+y");
    await expect.poll(() => pixel(page, 40, 30)).toEqual([0, 0, 0, 255]);
  });

  test("bucket fill with a palette color, rectangle, and Save as PNG", async ({ page }) => {
    await openPaint(page);
    const surface = page.locator("[data-paint-surface]");

    await page.locator('[data-paint-tool="rectangle"]').click();
    await surface.hover({ position: { x: 30, y: 30 } });
    await page.mouse.down();
    await surface.hover({ position: { x: 120, y: 90 } });
    await page.mouse.up();
    await expect.poll(() => pixel(page, 30, 60)).not.toEqual([255, 255, 255, 255]);

    await page.locator('[data-paint-color="#2e8b2e"]').click();
    await page.locator('[data-paint-tool="fill"]').click();
    await surface.click({ position: { x: 70, y: 60 } });
    await expect.poll(() => pixel(page, 70, 60)).toEqual([0x2e, 0x8b, 0x2e, 255]);
    // Outside the rectangle stays white.
    expect(await pixel(page, 10, 10)).toEqual([255, 255, 255, 255]);

    await page.locator('[data-paint-menu="file"]').click();
    const download = page.waitForEvent("download");
    await page.locator('[data-paint-menu-item="save"]').click();
    expect((await download).suggestedFilename()).toMatch(/^douglasos-paint-\d{8}-\d{6}\.png$/);
  });

  test("Esc mid-stroke cancels it without closing the window", async ({ page }) => {
    await openPaint(page);
    await page.locator('[data-paint-tool="line"]').click();
    const surface = page.locator("[data-paint-surface]");
    await surface.hover({ position: { x: 20, y: 20 } });
    await page.mouse.down();
    await surface.hover({ position: { x: 100, y: 20 } });
    await page.keyboard.press("Escape");
    await page.mouse.up();
    await expect(windowById(page, "paint")).toBeVisible();
    expect(await pixel(page, 60, 20)).toEqual([255, 255, 255, 255]);
    await expect(page.locator('[data-paint-action="undo"]')).toBeDisabled();
  });
});
