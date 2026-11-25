import { test, expect, type Page } from "@playwright/test";
import {
  assistantBubble,
  assistantCharacter,
  gotoDesktop,
  startButton,
  startItem,
  taskButton,
  windowById,
} from "./helpers";
import { mockYouTube } from "./fakeYouTube";

/** Start → All Programs → Entertainment → DouglasOS Media Player. */
async function openPlayer(page: Page) {
  await startButton(page).click();
  await startItem(page, "all-programs").hover();
  await page.locator('[data-all-programs] [data-program-folder="entertainment"]').hover();
  await page.locator('[data-program-folder-menu="entertainment"] [data-program="media-player"]').click();
  const player = windowById(page, "media-player");
  await expect(player).toBeVisible();
  await expect(player.locator("[data-media-player]")).toHaveAttribute("data-status", "ready");
  return player;
}

const control = (page: Page, id: string) => windowById(page, "media-player").locator(`[data-media-control="${id}"]`);

test.describe("DouglasOS Media Player", () => {
  test("loads YouTube only on open → play shows the tray note and makes mini Douglas dance → stop, he speaks", async ({
    page,
  }) => {
    const requested = await mockYouTube(page);
    await gotoDesktop(page, "en", { assistant: true });
    // Let the greeting play out so the bubble slot is free and predictable.
    await expect(assistantBubble(page)).toBeVisible({ timeout: 10_000 });
    await assistantBubble(page).getByRole("button", { name: "Close" }).click();
    expect(requested).toEqual([]);

    const player = await openPlayer(page);
    expect(requested.some((u) => u.startsWith("https://www.youtube.com/iframe_api"))).toBe(true);
    // The (fake) YouTube player is the visible screen, at least 200×200.
    const box = await player.locator("[data-media-screen]").boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(200);
    expect(box!.height).toBeGreaterThanOrEqual(200);
    await expect(page.locator("[data-tray-volume]")).toBeVisible();
    await expect(page.locator("[data-tray-now-playing]")).toHaveCount(0);

    await control(page, "play").click();
    await expect(player.locator("[data-media-player]")).toHaveAttribute("data-status", "playing");
    await expect(player.locator("[data-media-title]")).toHaveText("Fake Track One");
    await expect(page.locator("[data-tray-now-playing]")).toBeVisible();
    await expect(assistantCharacter(page)).toHaveAttribute("data-state", "dancing");

    await control(page, "next").click();
    await expect(player.locator("[data-media-title]")).toHaveText("Fake Track Two");
    await expect(assistantCharacter(page)).toHaveAttribute("data-state", "dancing");

    await control(page, "stop").click();
    await expect(player.locator("[data-media-player]")).toHaveAttribute("data-status", "ready");
    await expect(page.locator("[data-tray-now-playing]")).toHaveCount(0);
    await expect(assistantBubble(page)).toHaveAttribute("data-message", "afterDance");
    await expect(assistantBubble(page).locator('[data-assistant-action="openProject"]')).toBeVisible();
  });

  test("the tray note focuses the player; minimizing pauses (the player must stay visible)", async ({ page }) => {
    await mockYouTube(page);
    await gotoDesktop(page);
    const player = await openPlayer(page);
    await control(page, "play").click();
    await expect(player.locator("[data-media-player]")).toHaveAttribute("data-status", "playing");

    await page.locator('[data-quick-launch="contact"]').click();
    await expect(windowById(page, "contact")).toHaveAttribute("data-active", "true");
    await page.locator("[data-tray-now-playing]").click();
    await expect(player).toHaveAttribute("data-active", "true");

    await taskButton(page, "media-player").click(); // focused → minimize
    await expect(player.locator("[data-media-player]")).toHaveAttribute("data-status", "paused");
    await expect(player.locator("[data-media-notice]")).toHaveAttribute("data-media-notice", "hiddenPause");
    await expect(page.locator("[data-tray-now-playing]")).toHaveCount(0);
  });

  test("volume and mute from the tray persist across reloads", async ({ page }) => {
    await mockYouTube(page);
    await gotoDesktop(page);
    await openPlayer(page);
    await page.locator("[data-tray-volume]").click();
    const panel = page.locator("[data-media-volume-panel]");
    await panel.getByRole("slider").fill("25");
    await panel.getByRole("checkbox").check();
    await expect(page.locator("[data-tray-volume]")).toHaveAttribute("aria-label", "Volume: muted");
    await expect(windowById(page, "media-player").locator("[data-media-volume]")).toHaveValue("25");

    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("douglasos:media") ?? "{}"));
    expect(saved.state).toEqual({ volume: 25, muted: true });
    // The window itself is not restored after a reload (YouTube never loads on page load).
    await page.reload();
    await expect(startButton(page)).toBeVisible();
    await expect(windowById(page, "media-player")).toHaveCount(0);
    await openPlayer(page);
    await expect(windowById(page, "media-player").locator("[data-media-volume]")).toHaveValue("25");
  });

  test("when no video can be embedded, an error dialog links to the playlist on YouTube", async ({ page }) => {
    await mockYouTube(page, { failAll: true });
    await gotoDesktop(page);
    await openPlayer(page);
    await control(page, "play").click();
    const dialog = page.getByTestId("media-error-dialog");
    await expect(dialog).toBeVisible();
    const popupPromise = page.waitForEvent("popup");
    await dialog.getByRole("button", { name: "Open on YouTube" }).click();
    const popup = await popupPromise;
    expect(popup.url()).toContain("youtube.com/playlist?list=PLdw3FCGShY-U");
    await expect(dialog).toHaveCount(0);
  });
});
