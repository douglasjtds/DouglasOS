import { test, expect, type Page } from "@playwright/test";
import { gotoDesktop, startButton, startItem, taskButton, windowById } from "./helpers";

/** Open Pinball through Start → All Programs → Games. */
async function openPinball(page: Page) {
  await startButton(page).click();
  await startItem(page, "all-programs").hover();
  await page.locator('[data-program-folder="games"]').hover();
  await page.locator('[data-program="pinball"]').click();
  await expect(windowById(page, "pinball")).toBeVisible();
}

test.describe("Pinball", () => {
  test.beforeEach(async ({ page }) => {
    await gotoDesktop(page);
  });

  test("Start → Games → Pinball: launch a ball, then start a new game", async ({ page }) => {
    await openPinball(page);
    const win = windowById(page, "pinball");
    const canvas = win.locator("[data-pinball-canvas]");
    await expect(canvas).toBeVisible();
    await expect(win.locator("[data-pinball-score]")).toHaveText("0");
    await expect(win.locator("[data-pinball-ball]")).toContainText("1");
    await expect(win.locator("[data-pinball-launch]")).toBeVisible();

    // Hold Space to charge the plunger, release to launch.
    await canvas.focus();
    await page.keyboard.down("Space");
    await expect(win.locator("[data-pinball]")).toHaveAttribute("data-plunger", "down");
    await page.waitForTimeout(700);
    await page.keyboard.up("Space");
    await expect(win.locator("[data-pinball]")).toHaveAttribute("data-plunger", "up");

    // Flipper keys reach the game.
    await page.keyboard.down("z");
    await expect(win.locator("[data-pinball]")).toHaveAttribute("data-left-flipper", "down");
    await page.keyboard.up("z");

    // Game ▸ New game resets the table.
    await win.locator('[data-game-menu="game"]').click();
    await page.locator('[data-game-menu-item="new"]').click();
    await expect(win.locator("[data-pinball-score]")).toHaveText("0");
    await expect(win.locator("[data-pinball-ball]")).toContainText("1");
    await expect(win.locator("[data-pinball-launch]")).toBeVisible();
  });

  test("pauses when another window takes focus", async ({ page }) => {
    await openPinball(page);
    const win = windowById(page, "pinball");
    await expect(win.locator("[data-pinball]")).toHaveAttribute("data-paused", "false");
    await startButton(page).click();
    await startItem(page, "about").click();
    await expect(win.locator("[data-pinball]")).toHaveAttribute("data-paused", "true");
    // Bring Pinball back to the front: it stays paused until the player continues.
    await taskButton(page, "pinball").click();
    await expect(win.locator("[data-pinball]")).toHaveAttribute("data-paused", "true");
    await win.locator("[data-pinball-paused]").click();
    await expect(win.locator("[data-pinball]")).toHaveAttribute("data-paused", "false");
  });
});
