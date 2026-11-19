import { test, expect, type Page } from "@playwright/test";
import { desktopIcon, gotoDesktop, startButton, startItem, taskButton, windowById, windows } from "./helpers";

/**
 * Touch shell (DESKTOP-INTERFACE-SPEC §11). Runs only in the phone projects of
 * playwright.config.ts (iPhone 13 on WebKit, Pixel 7 on Chromium), which bring
 * real device descriptors: touch, mobile viewport, device scale factor.
 */

async function taskbarTop(page: Page): Promise<number> {
  const box = await page.locator("[data-taskbar]").boundingBox();
  return box!.y;
}

test.describe("touch shell", () => {
  test("boot → desktop → tap Contact opens it full screen → close → Start → Résumé downloads", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/en");

    // Short (~1s) boot, then logon; a tap on the tile logs on.
    await expect(page.getByTestId("boot-screen")).toBeVisible();
    const tile = page.getByRole("button", { name: "Log on as Douglas" });
    await expect(tile).toBeVisible({ timeout: 4000 });
    await expect(page.getByTestId("logon-screen")).toContainText("Tap Douglas");
    await tile.tap();
    await expect(startButton(page)).toBeVisible();

    // The CV icon is on the first screen, inside the viewport.
    const viewport = page.viewportSize()!;
    await expect(desktopIcon(page, "resume")).toBeInViewport({ ratio: 1 });

    // Single tap opens Contact as a full-screen window above the taskbar.
    await desktopIcon(page, "contact").tap();
    const contact = windowById(page, "contact");
    await expect(contact).toBeVisible();
    await expect(contact).toHaveAttribute("data-presentation", "fullscreen");
    const box = (await contact.boundingBox())!;
    expect(box.x).toBe(0);
    expect(box.y).toBe(0);
    expect(Math.round(box.width)).toBe(viewport.width);
    expect(Math.round(box.y + box.height)).toBe(Math.round(await taskbarTop(page)));
    await expect(contact.getByRole("button", { name: "Maximize" })).toHaveCount(0);

    await contact.getByRole("button", { name: "Close" }).tap();
    await expect(windows(page)).toHaveCount(0);

    // CV in two taps: Start → Résumé (CV).
    await startButton(page).tap();
    const downloadPromise = page.waitForEvent("download");
    await startItem(page, "resume").tap();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain(".pdf");
  });

  test("no horizontal scroll, and the taskbar and icons are ≥ 44px touch targets", async ({ page }) => {
    await gotoDesktop(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);

    const targets = [
      startButton(page),
      page.locator('[data-quick-launch="resume"]'),
      page.locator('[data-quick-launch="contact"]'),
      page.locator("[data-locale-switch]"),
      desktopIcon(page, "about"),
      desktopIcon(page, "resume"),
    ];
    for (const target of targets) {
      const box = (await target.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });

  test("only one window is visible; the taskbar switches between them", async ({ page }) => {
    await gotoDesktop(page);
    await desktopIcon(page, "about").tap();
    await expect(windowById(page, "about")).toBeVisible();
    // Back to the desktop via Minimize, then open a second app.
    await windowById(page, "about").getByRole("button", { name: "Minimize" }).tap();
    await desktopIcon(page, "skills").tap();

    await expect(windowById(page, "skills")).toBeVisible();
    await expect(windowById(page, "about")).toHaveAttribute("aria-hidden", "true");

    await taskButton(page, "about").tap();
    await expect(windowById(page, "about")).not.toHaveAttribute("aria-hidden", "true");
    await expect(windowById(page, "skills")).toHaveAttribute("aria-hidden", "true");
    await expect(taskButton(page, "about")).toHaveAttribute("aria-pressed", "true");
  });

  test("Start menu: full-width panel, at most 85% of the screen, scrollable", async ({ page }) => {
    await gotoDesktop(page);
    await startButton(page).tap();
    const menu = page.locator("[data-start-menu]");
    await expect(menu).toBeVisible();
    const viewport = page.viewportSize()!;
    const box = (await menu.boundingBox())!;
    expect(Math.round(box.width)).toBe(viewport.width);
    expect(box.height).toBeLessThanOrEqual(viewport.height * 0.85 + 1);
    // All Programs is inline (no cascading submenu) and lists every launcher.
    await expect(page.locator("[data-all-programs] [data-program]")).toHaveCount(8);
    await expect(startItem(page, "resume")).toBeVisible();
  });

  test("the content is real text in the DOM for crawlers and screen readers", async ({ page }) => {
    await gotoDesktop(page);
    const text = page.locator("[data-static-content]");
    await expect(text.locator("h1")).toContainText("Douglas Tertuliano");
    await expect(text.locator("h2")).toHaveCount(6);
    // Windows keep a heading outline: the title bar is the h2.
    await desktopIcon(page, "about").tap();
    await expect(windowById(page, "about").getByRole("heading", { level: 2 })).toHaveText(
      "About Douglas",
    );
    await expect(windowById(page, "about").getByRole("heading", { level: 3 })).toBeVisible();
  });
});
