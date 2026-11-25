import { test, expect, type Page } from "@playwright/test";
import {
  assistantBubble,
  assistantCharacter,
  desktopIcon,
  gotoDesktop,
  messengerTray,
  startButton,
  startItem,
  taskButton,
  windowById,
  windows,
} from "./helpers";

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
    // All Programs is inline (no cascading submenu) and lists every launcher,
    // folders included (stage 8: Entertainment → Media Player).
    await expect(page.locator("[data-all-programs] [data-program]")).toHaveCount(14);
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

  test("external shortcuts: a row below the apps, CV and Contact still first; tap opens a new tab", async ({
    page,
  }) => {
    await page
      .context()
      .route(/^https:\/\/www\.linkedin\.com\//, (route) =>
        route.fulfill({ status: 200, contentType: "text/html", body: "<title>stub</title>" }),
      );
    await gotoDesktop(page);
    const resume = (await desktopIcon(page, "resume").boundingBox())!;
    const contact = (await desktopIcon(page, "contact").boundingBox())!;
    const linkedin = (await desktopIcon(page, "linkedin").boundingBox())!;
    expect(Math.round(contact.y)).toBe(Math.round(resume.y));
    expect(linkedin.y).toBeGreaterThan(resume.y);
    await expect(desktopIcon(page, "resume")).toBeInViewport({ ratio: 1 });
    await expect(desktopIcon(page, "contact")).toBeInViewport({ ratio: 1 });

    const popupPromise = page.waitForEvent("popup");
    await desktopIcon(page, "linkedin").tap();
    const popup = await popupPromise;
    await expect.poll(() => popup.url()).toBe("https://www.linkedin.com/in/douglasjtds");
  });

  test("Explorer: full screen, compact address bar, tap a project, type another, Back", async ({ page }) => {
    await gotoDesktop(page);
    await desktopIcon(page, "projects").tap();
    const win = windowById(page, "projects");
    await expect(win).toHaveAttribute("data-presentation", "fullscreen");
    // Compact: no menu bar, a More menu, 44px nav buttons.
    await expect(win.getByRole("menubar")).toHaveCount(0);
    await expect(win.locator("[data-explorer-more]")).toBeVisible();
    const back = (await win.locator('[data-explorer-nav="back"]').boundingBox())!;
    expect(back.height).toBeGreaterThanOrEqual(44);

    await win.locator('[data-project-link="gasolinha"]').tap();
    await expect(win.locator("[data-explorer-page]")).toHaveAttribute("data-explorer-page", "gasolinha");

    const address = win.locator("[data-explorer-address]");
    await address.fill("douglasos");
    await address.press("Enter");
    await expect(win.locator("[data-explorer-page]")).toHaveAttribute("data-explorer-page", "douglasos");

    await win.locator('[data-explorer-nav="back"]').tap();
    await expect(win.locator("[data-explorer-page]")).toHaveAttribute("data-explorer-page", "gasolinha");

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
  test("mini Douglas: small character above the taskbar, bubble as a bottom sheet, out of the way of windows", async ({
    page,
  }) => {
    await gotoDesktop(page, "en", { assistant: true });
    const sheet = assistantBubble(page);
    // Phones wait longer before the greeting (5s) than the desktop.
    await expect(sheet).toBeVisible({ timeout: 12_000 });
    const viewport = page.viewportSize()!;
    const sheetBox = (await sheet.boundingBox())!;
    expect(sheetBox.x).toBe(0);
    expect(Math.round(sheetBox.width)).toBe(viewport.width);
    expect(Math.round(sheetBox.y + sheetBox.height)).toBe(Math.round(await taskbarTop(page)));

    // Shortcuts are real touch targets.
    const contact = sheet.locator('[data-assistant-action="open-contact"]');
    expect((await contact.boundingBox())!.height).toBeGreaterThanOrEqual(44);

    await sheet.getByRole("button", { name: "Close" }).tap();
    await expect(sheet).toHaveCount(0);
    const character = assistantCharacter(page);
    await expect(character).toBeVisible();
    expect((await character.boundingBox())!.y + (await character.boundingBox())!.height).toBeLessThan(
      await taskbarTop(page),
    );

    // A full-screen window owns the screen: the character steps aside.
    await desktopIcon(page, "about").tap();
    await expect(windowById(page, "about")).toBeVisible();
    await expect(character).toHaveCount(0);
  });

  test("Recycle Bin: press and hold an icon → Delete → it stays put and the rescue line shows", async ({ page }) => {
    await gotoDesktop(page);
    const whatsapp = desktopIcon(page, "whatsapp");
    const before = (await whatsapp.boundingBox())!;
    const point = { x: before.x + before.width / 2, y: before.y + before.height / 3 };
    // Playwright has no long-press: dispatch a held touch pointer (Radix opens the menu after ~700ms).
    await whatsapp.dispatchEvent("pointerdown", {
      pointerType: "touch",
      pointerId: 7,
      isPrimary: true,
      button: 0,
      buttons: 1,
      clientX: point.x,
      clientY: point.y,
    });
    const del = page.locator('[data-icon-menu-item="delete"]');
    await expect(del).toBeVisible({ timeout: 3000 });
    await whatsapp.dispatchEvent("pointerup", { pointerType: "touch", pointerId: 7, clientX: point.x, clientY: point.y });
    expect((await del.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await del.tap();

    const notice = page.locator("[data-trash-notice]");
    await expect(notice).toBeVisible();
    await expect(notice).toContainText("Rescued from the Recycle Bin");
    await expect.poll(async () => (await whatsapp.boundingBox())!).toEqual(before);
    await expect(windows(page)).toHaveCount(0);
    // The bin sits on its own row below the links.
    const bin = (await desktopIcon(page, "recycle-bin").boundingBox())!;
    expect(bin.y).toBeGreaterThan(before.y + before.height);
  });

  test("press and hold: an icon gets its own menu (with Properties), empty desktop gets the desktop menu", async ({
    page,
  }) => {
    await gotoDesktop(page);
    const hold = async (target: ReturnType<Page["locator"]>, point: { x: number; y: number }) => {
      await target.dispatchEvent("pointerdown", {
        pointerType: "touch",
        pointerId: 9,
        isPrimary: true,
        button: 0,
        buttons: 1,
        clientX: point.x,
        clientY: point.y,
      });
    };
    const release = (target: ReturnType<Page["locator"]>, point: { x: number; y: number }) =>
      target.dispatchEvent("pointerup", { pointerType: "touch", pointerId: 9, clientX: point.x, clientY: point.y });

    const contact = desktopIcon(page, "contact");
    const box = (await contact.boundingBox())!;
    const onIcon = { x: box.x + box.width / 2, y: box.y + box.height / 3 };
    await hold(contact, onIcon);
    const properties = page.locator('[data-icon-menu] [data-icon-menu-item="properties"]');
    await expect(properties).toBeVisible({ timeout: 3000 });
    await release(contact, onIcon);
    // Only the icon's menu: the desktop menu's long-press never armed.
    await page.waitForTimeout(300);
    await expect(page.locator("[data-desktop-menu]")).toHaveCount(0);
    await properties.tap();
    const dialog = page.getByTestId("icon-properties-dialog");
    await expect(dialog).toContainText("Contact");
    await dialog.getByRole("button", { name: "OK" }).tap();
    await expect(dialog).toHaveCount(0);

    // Empty desktop, below the last row of icons.
    const surface = page.locator('[data-desktop-surface="true"]').last();
    const bin = (await desktopIcon(page, "recycle-bin").boundingBox())!;
    const vp = page.viewportSize()!;
    const empty = { x: vp.width - 30, y: bin.y + bin.height / 2 };
    await hold(surface, empty);
    const menu = page.locator("[data-desktop-menu]");
    await expect(menu).toBeVisible({ timeout: 3000 });
    await release(surface, empty);
    await expect(menu.locator('[data-icon-menu-item="refresh"]')).toBeVisible();
    // No "Arrange Icons" on phones: the touch grid is derived from the width.
    await expect(menu.locator('[data-icon-menu-item="arrange"]')).toHaveCount(0);
    await expect(page.locator("[data-icon-menu]")).toHaveCount(0);
  });

  test("Start → Run… works on a phone (field near the top, CV by typing 'cv')", async ({ page }) => {
    await gotoDesktop(page);
    await startButton(page).tap();
    await page.locator('[data-start-item="run"]').tap();
    const field = page.locator("[data-run-input]");
    await expect(field).toBeVisible();
    const fieldBox = (await field.boundingBox())!;
    expect(fieldBox.y).toBeLessThan(page.viewportSize()!.height / 2);
    const downloadPromise = page.waitForEvent("download");
    await field.fill("cv");
    await field.press("Enter");
    expect((await downloadPromise).suggestedFilename()).toContain(".pdf");
  });

  test("Messenger: full screen from the tray, chips scroll sideways, composer above the taskbar, CV one tap away", async ({
    page,
  }) => {
    await gotoDesktop(page);
    // The new desktop icon never pushes About / CV / Contact off the first row.
    const about = (await desktopIcon(page, "about").boundingBox())!;
    const messengerIcon = (await desktopIcon(page, "messenger").boundingBox())!;
    expect(messengerIcon.y).toBeGreaterThan(about.y);

    await messengerTray(page).tap();
    const messenger = windowById(page, "messenger");
    await expect(messenger).toHaveAttribute("data-presentation", "fullscreen");
    await messenger.locator('[data-messenger-contact="douglas"]').tap();
    await expect(messenger.getByRole("log")).toContainText("looking around my portfolio");

    const viewport = page.viewportSize()!;
    const chips = messenger.locator("[data-messenger-quick-replies]");
    const chipsBox = (await chips.boundingBox())!;
    expect(chipsBox.width).toBeLessThanOrEqual(viewport.width);
    // One row of chips that scrolls sideways instead of wrapping.
    expect(await chips.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
    expect((await chips.locator("[data-quick-reply]").first().boundingBox())!.height).toBeGreaterThanOrEqual(44);

    const composer = (await messenger.locator("[data-messenger-input]").boundingBox())!;
    expect(composer.y + composer.height).toBeLessThanOrEqual(await taskbarTop(page));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);

    const downloadPromise = page.waitForEvent("download");
    await messenger.locator('[data-messenger-shortcut="cv"]').tap();
    expect((await downloadPromise).suggestedFilename()).toContain(".pdf");
  });
});
