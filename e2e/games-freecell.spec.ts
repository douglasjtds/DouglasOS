import { test, expect, type Page } from "@playwright/test";
import { gotoDesktop, startButton, startItem, windowById } from "./helpers";

/** Open FreeCell through Start → All Programs → Games. */
async function openFreeCell(page: Page) {
  await startButton(page).click();
  await startItem(page, "all-programs").hover();
  await page.locator('[data-program-folder="games"]').hover();
  await page.locator('[data-program="freecell"]').click();
  await expect(windowById(page, "freecell")).toBeVisible();
}

const table = (page: Page) => page.locator("[data-freecell-table]");
const pile = (page: Page, id: string) => page.locator(`[data-pile="${id}"]`);

async function gameMenu(page: Page, item: string) {
  await page.locator('[data-game-menu="game"]').click();
  await page.locator(`[data-game-menu-item="${item}"]`).click();
}

test.describe("FreeCell", () => {
  test.beforeEach(async ({ page }) => {
    await gotoDesktop(page);
  });

  test("Start → Games → FreeCell: select a numbered deal, play a move, undo, new game", async ({ page }) => {
    await openFreeCell(page);
    await expect(page.locator('[data-pile^="column-"]')).toHaveCount(8);
    await expect(page.locator('[data-pile^="free-"]')).toHaveCount(4);

    // Deal #1234 (deterministic): its column 1 top card has no foundation to go to.
    await gameMenu(page, "select");
    const input = page.locator("[data-freecell-game-input]");
    await input.fill("99999");
    await page.locator('[data-freecell-action="select-ok"]').click();
    await expect(page.getByTestId("freecell-select-game").getByRole("alert")).toBeVisible();
    await input.fill("1234");
    await page.locator('[data-freecell-action="select-ok"]').click();
    await expect(table(page)).toHaveAttribute("data-game-number", "1234");
    await expect(table(page)).toHaveAttribute("data-moves", "0");

    // Click-select column 1, then click free cell 1.
    await pile(page, "column-0").locator("[data-card]").last().click();
    await expect(pile(page, "column-0")).toHaveAttribute("aria-pressed", "true");
    await pile(page, "free-0").click();
    await expect(table(page)).toHaveAttribute("data-moves", "1");
    await expect(pile(page, "free-0").locator("[data-card]")).toHaveCount(1);

    await page.keyboard.press("Control+z");
    await expect(table(page)).toHaveAttribute("data-moves", "0");
    await expect(pile(page, "free-0").locator("[data-card]")).toHaveCount(0);

    // Double-click sends a card to a free cell; New game clears it.
    await pile(page, "column-0").locator("[data-card]").last().dblclick();
    await expect(pile(page, "free-0").locator("[data-card]")).toHaveCount(1);
    await gameMenu(page, "new");
    await expect(table(page)).toHaveAttribute("data-moves", "0");
    await expect(pile(page, "free-0").locator("[data-card]")).toHaveCount(0);
  });

  test("keyboard: rove over piles and move a card to a free cell", async ({ page }) => {
    await openFreeCell(page);
    await pile(page, "column-0").focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("ArrowUp");
    await expect(pile(page, "free-0")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(table(page)).toHaveAttribute("data-moves", "1");
  });
});
