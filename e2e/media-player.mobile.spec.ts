import { test, expect } from "@playwright/test";
import { gotoDesktop, startButton, windowById } from "./helpers";
import { mockYouTube } from "./fakeYouTube";

test.describe("DouglasOS Media Player (touch)", () => {
  test("opens full-screen from All Programs → Entertainment, plays by tap, tray shows it", async ({ page }) => {
    await mockYouTube(page);
    await gotoDesktop(page);
    await startButton(page).tap();
    const entry = page.locator('[data-program-folder="entertainment"] [data-program="media-player"]');
    await entry.scrollIntoViewIfNeeded();
    await entry.tap();

    const player = windowById(page, "media-player");
    await expect(player).toHaveAttribute("data-presentation", "fullscreen");
    await expect(player.locator("[data-media-player]")).toHaveAttribute("data-status", "ready");
    const box = await player.locator("[data-media-screen]").boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(200);
    expect(box!.height).toBeGreaterThanOrEqual(200);

    await player.locator('[data-media-control="play"]').tap();
    await expect(player.locator("[data-media-player]")).toHaveAttribute("data-status", "playing");
    const tray = page.locator("[data-tray-volume]");
    await expect(tray).toHaveAttribute("data-tray-now-playing", "true");
    const trayBox = await tray.boundingBox();
    expect(trayBox!.width).toBeGreaterThanOrEqual(44);

    // No horizontal scroll with the extra tray button.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    // The combined tray (media + Messenger + language + clock) stays on screen
    // and still leaves the window list room for the player's 44px button.
    const viewport = page.viewportSize()!;
    const trayGroup = (await page.locator("[data-tray]").boundingBox())!;
    expect(trayGroup.x + trayGroup.width).toBeLessThanOrEqual(viewport.width + 0.5);
    const clock = (await page.locator("[data-tray] time").boundingBox())!;
    expect(clock.x + clock.width).toBeLessThanOrEqual(viewport.width + 0.5);
    const taskListInner = await page
      .locator("[data-taskbar] ul")
      .evaluate((ul) => ul.clientWidth - parseFloat(getComputedStyle(ul).paddingLeft) - parseFloat(getComputedStyle(ul).paddingRight));
    expect(taskListInner).toBeGreaterThanOrEqual(44);
  });
});
