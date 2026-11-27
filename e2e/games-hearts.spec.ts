import { test, expect, type Page } from "@playwright/test";
import { gotoDesktop, startButton, startItem, windowById } from "./helpers";

/** Open Hearts through Start → All Programs → Games. */
async function openHearts(page: Page) {
  await startButton(page).click();
  await startItem(page, "all-programs").hover();
  await page.locator('[data-program-folder="games"]').hover();
  await page.locator('[data-program="hearts"]').click();
  await expect(windowById(page, "hearts")).toBeVisible();
}

test.describe("Hearts", () => {
  test.beforeEach(async ({ page }) => {
    await gotoDesktop(page);
  });

  test("Start → Games → Hearts: pass 3 cards, play a card, start a new game", async ({ page }) => {
    await openHearts(page);
    const win = windowById(page, "hearts");
    const handCards = win.locator("[data-hand-card]");
    await expect(handCards).toHaveCount(13);

    // Pass the first three cards.
    for (let i = 0; i < 3; i++) await handCards.nth(i).click();
    await win.locator('[data-hearts-action="pass"]').click();
    await expect(win.locator('[data-hearts-action="pass"]')).toHaveCount(0);

    // Wait for the computer players, then play a legal card.
    const legal = win.locator("[data-hand-card][data-legal]").first();
    await expect(legal).toBeVisible({ timeout: 10_000 });
    const id = await legal.getAttribute("data-hand-card");
    await legal.click();
    await expect(handCards).toHaveCount(12);
    await expect(win.locator(`[data-hearts-trick] [data-card="${id}"]`)).toBeVisible();

    // Game ▸ New game deals again and returns to passing.
    await win.locator('[data-game-menu="game"]').click();
    await page.locator('[data-game-menu-item="new"]').click();
    await expect(handCards).toHaveCount(13);
    await expect(win.locator('[data-hearts-action="pass"]')).toBeVisible();
  });
});
