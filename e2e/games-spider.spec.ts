import { test, expect, type Page } from "@playwright/test";
import { gotoDesktop, startButton, startItem, windowById } from "./helpers";

/** Open Spider Solitaire through Start → All Programs → Games. */
async function openSpider(page: Page) {
  await startButton(page).click();
  await startItem(page, "all-programs").hover();
  await page.locator('[data-program-folder="games"]').hover();
  await page.locator('[data-program="spider"]').click();
  await expect(windowById(page, "spider")).toBeVisible();
}

test.describe("Spider Solitaire", () => {
  test.beforeEach(async ({ page }) => {
    await gotoDesktop(page);
  });

  test("Start → Games → Spider: deal a row, undo, change suits, new game", async ({ page }) => {
    await openSpider(page);
    const win = windowById(page, "spider");
    const table = win.locator("[data-spider-table]");
    const stock = win.locator("[data-spider-stock]");

    await expect(win.locator("[data-spider-column]")).toHaveCount(10);
    await expect(stock).toHaveAttribute("data-spider-stock", "5");
    await expect(table).toHaveAttribute("data-suits", "1");

    // Dealing a row is always legal at the start: ten more face-up cards.
    await stock.click();
    await expect(stock).toHaveAttribute("data-spider-stock", "4");
    await expect(table).toHaveAttribute("data-spider-moves", "1");
    await expect(win.locator("[data-spider-index]")).toHaveCount(20);

    // Undo through the Game menu.
    await win.locator('[data-game-menu="game"]').click();
    await page.locator('[data-game-menu-item="undo"]').click();
    await expect(stock).toHaveAttribute("data-spider-stock", "5");

    // Two suits starts a new game with spades and hearts.
    await win.locator('[data-game-menu="game"]').click();
    await page.locator('[data-game-menu-item="suits-2"]').click();
    await expect(table).toHaveAttribute("data-suits", "2");

    // New game resets the counters.
    await stock.click();
    await expect(table).toHaveAttribute("data-spider-moves", "1");
    await win.locator('[data-game-menu="game"]').click();
    await page.locator('[data-game-menu-item="new"]').click();
    await expect(table).toHaveAttribute("data-spider-moves", "0");
    await expect(stock).toHaveAttribute("data-spider-stock", "5");
    await expect(table).toHaveAttribute("data-suits", "2");
  });

  test("keyboard: pick up and cancel a card, deal with D", async ({ page }) => {
    await openSpider(page);
    const win = windowById(page, "spider");
    const first = win.locator('[data-spider-column="0"] [data-spider-index]').last();
    await first.focus();
    await page.keyboard.press("Enter");
    await expect(first).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("Escape");
    await expect(first).toHaveAttribute("aria-pressed", "false");
    await page.keyboard.press("d");
    await expect(win.locator("[data-spider-stock]")).toHaveAttribute("data-spider-stock", "4");
  });
});
