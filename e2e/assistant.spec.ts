import { test, expect } from "@playwright/test";
import { assistantBubble, assistantCharacter, gotoDesktop, windowById } from "./helpers";

/** Greeting delay (2.5s) + idle-time lazy load, with headroom. */
const APPEAR_TIMEOUT = 10_000;

test.describe("mini Douglas assistant", () => {
  test("greets → Contact opens the window → Not now hides him until the next session", async ({ page }) => {
    await gotoDesktop(page, "en", { assistant: true });

    const bubble = assistantBubble(page);
    await expect(bubble).toBeVisible({ timeout: APPEAR_TIMEOUT });
    await expect(bubble).toHaveAttribute("data-message", "greeting");
    await expect(assistantCharacter(page)).toBeVisible();
    // Appearing on his own never steals focus.
    await expect(page.locator("[data-assistant] :focus")).toHaveCount(0);

    await bubble.locator('[data-assistant-action="open-contact"]').click();
    await expect(windowById(page, "contact")).toBeVisible();
    await expect(bubble).toHaveCount(0);

    // Reduced motion (set by gotoDesktop): a click offers help instead of dancing.
    await assistantCharacter(page).click();
    await expect(bubble).toHaveAttribute("data-message", "help");
    await bubble.locator('[data-assistant-action="dismiss"]').click();
    await expect(assistantCharacter(page)).toHaveCount(0);

    // Same session: he stays away after a reload.
    await page.reload();
    await expect(windowById(page, "contact")).toBeVisible();
    await page.waitForTimeout(4000);
    await expect(assistantCharacter(page)).toHaveCount(0);
  });

  test("answers a search offline and downloads the CV from the answer", async ({ page }) => {
    await gotoDesktop(page, "en", { assistant: true });
    const bubble = assistantBubble(page);
    await expect(bubble).toBeVisible({ timeout: APPEAR_TIMEOUT });

    await bubble.getByLabel("Ask me something:").fill("Can I get your résumé?");
    await bubble.getByRole("button", { name: "Search" }).click();
    await expect(bubble).toHaveAttribute("data-message", "answer");

    const downloadPromise = page.waitForEvent("download");
    await bubble.locator('[data-assistant-action="downloadCv"]').click();
    expect((await downloadPromise).suggestedFilename()).toContain(".pdf");
  });

  test("Esc closes the bubble first, then the window", async ({ page }) => {
    await gotoDesktop(page, "en", { assistant: true });
    await expect(assistantBubble(page)).toBeVisible({ timeout: APPEAR_TIMEOUT });
    // Open a window without using the bubble (the bubble stays up).
    await page.locator('[data-quick-launch="contact"]').click();
    await expect(windowById(page, "contact")).toBeVisible();
    await expect(assistantBubble(page)).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(assistantBubble(page)).toHaveCount(0);
    await expect(windowById(page, "contact")).toBeVisible();
    await page.keyboard.press("Escape");
    await page.getByTestId("confirm-close-dialog").getByRole("button", { name: "Yes" }).click();
    await expect(windowById(page, "contact")).toHaveCount(0);
  });

  test("a click makes him dance, then he gets back to work", async ({ page }) => {
    await gotoDesktop(page, "en", { assistant: true });
    await expect(assistantBubble(page)).toBeVisible({ timeout: APPEAR_TIMEOUT });
    // Reload with motion allowed; the greeting already played this session,
    // so he comes back quietly (no bubble).
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.reload();
    const character = assistantCharacter(page);
    await expect(character).toBeVisible({ timeout: APPEAR_TIMEOUT });
    await expect(assistantBubble(page)).toHaveCount(0);

    await character.click();
    await expect(character).toHaveAttribute("data-state", "dancing");
    await expect(assistantBubble(page)).toHaveCount(0);
    await expect(assistantBubble(page)).toHaveAttribute("data-message", "afterDance", { timeout: 6000 });
  });
});
