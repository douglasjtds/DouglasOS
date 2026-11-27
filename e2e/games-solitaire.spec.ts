import { test, expect, type Page } from "@playwright/test";
import { gotoDesktop, startButton, startItem, windowById } from "./helpers";

/** Start → All Programs → Games → Solitaire. */
async function openSolitaire(page: Page) {
  await startButton(page).click();
  await startItem(page, "all-programs").hover();
  await page.locator('[data-program-folder="games"]').hover();
  await page.locator('[data-program="solitaire"]').click();
  await expect(windowById(page, "solitaire")).toBeVisible();
}

test.describe("Solitaire", () => {
  test.beforeEach(async ({ page }) => {
    await gotoDesktop(page);
  });

  test("open from All Programs, draw from the stock, select a card, new game", async ({ page }) => {
    await openSolitaire(page);
    const win = windowById(page, "solitaire");
    const stock = win.locator('[data-solitaire-pile="stock"]');
    const waste = win.locator('[data-focus-key="p1"]');
    const moves = win.locator("[data-solitaire-moves]");

    // Dealt table: seven columns, 7 face-up cards, an empty waste.
    await expect(win.locator('[data-solitaire-pile^="tableau-"]')).toHaveCount(7);
    await expect(win.locator('[data-solitaire-pile^="tableau-"] [data-card]')).toHaveCount(7);
    await expect(waste.locator("[data-card]")).toHaveCount(0);

    // Clicking the stock turns a card onto the waste.
    await stock.click();
    await expect(waste.locator("[data-card]")).toHaveCount(1);
    await expect(moves).toHaveAttribute("data-solitaire-moves", "1");

    // Selecting the waste card marks it pressed; Escape clears it.
    await waste.click();
    await expect(waste).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("Escape");
    await expect(waste).toHaveAttribute("aria-pressed", "false");
    await expect(win).toBeVisible();

    // Game → New game deals again.
    await win.locator('[data-game-menu="game"]').click();
    await page.locator('[data-game-menu-item="new"]').click();
    await expect(moves).toHaveAttribute("data-solitaire-moves", "0");
    await expect(waste.locator("[data-card]")).toHaveCount(0);
  });

  test("Draw three option fans three cards on the waste", async ({ page }) => {
    await openSolitaire(page);
    const win = windowById(page, "solitaire");
    await win.locator('[data-game-menu="game"]').click();
    await page.locator('[data-game-menu-item="draw-three"]').click();
    await expect(win.locator("[data-solitaire-draw]")).toHaveAttribute("data-solitaire-draw", "3");
    await win.locator('[data-solitaire-pile="stock"]').click();
    await expect(win.locator('[data-solitaire-pile="waste"] [data-card]')).toHaveCount(3);
  });
});
