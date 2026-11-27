import { test, expect, type Page } from "@playwright/test";
import { gotoDesktop, startButton, startItem, windowById } from "./helpers";

/** Open Mines through Start → All Programs → Games. */
async function openMines(page: Page) {
  await startButton(page).click();
  await startItem(page, "all-programs").hover();
  await page.locator('[data-program-folder="games"]').hover();
  await page.locator('[data-program="mines"]').click();
  await expect(windowById(page, "mines")).toBeVisible();
}

test.describe("Mines", () => {
  test.beforeEach(async ({ page }) => {
    await gotoDesktop(page);
  });

  test("Start → All Programs → Games → Mines: reveal, flag, New game", async ({ page }) => {
    await openMines(page);
    const win = windowById(page, "mines");
    const grid = win.locator("[data-mines-grid]");
    const cells = grid.locator("[data-cell]");
    await expect(cells).toHaveCount(81);
    await expect(grid).toHaveAttribute("data-status", "ready");

    // The first reveal is always safe and opens an empty region.
    await cells.nth(40).click();
    await expect(cells.nth(40)).toHaveAttribute("data-state", "empty");
    await expect(grid).toHaveAttribute("data-status", "playing");

    // Right-click flags a hidden cell and the counter goes down.
    const hidden = grid.locator('[data-cell][data-state="hidden"]').first();
    const hiddenIndex = await hidden.getAttribute("data-index");
    await hidden.click({ button: "right" });
    await expect(grid.locator(`[data-index="${hiddenIndex}"]`)).toHaveAttribute("data-state", "flagged");
    await expect(win.locator("[data-mines-counter]")).toHaveText("009");

    // The face button starts a new game.
    await win.locator("[data-mines-face]").click();
    await expect(grid).toHaveAttribute("data-status", "ready");
    await expect(grid.locator('[data-cell][data-state="hidden"]')).toHaveCount(81);
    await expect(win.locator("[data-mines-counter]")).toHaveText("010");
    await expect(win.locator("[data-mines-timer]")).toHaveText("000");
  });

  test("Game menu: Expert difficulty builds a 30×16 field", async ({ page }) => {
    await openMines(page);
    const win = windowById(page, "mines");
    await win.locator('[data-game-menu="game"]').click();
    await page.locator('[data-game-menu-item="expert"]').click();
    await expect(win.locator("[data-mines-grid] [data-cell]")).toHaveCount(480);
    await expect(win.locator("[data-mines-counter]")).toHaveText("099");
  });
});
