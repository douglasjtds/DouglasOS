import { test, expect } from "@playwright/test";
import { desktopIcon, gotoDesktop, startButton, startItem, windowById } from "./helpers";

/**
 * Easter eggs on the touch shell (stage 11): the same toast as a bottom
 * sheet, and Achievements from the Start panel. Phone projects only (the
 * file name matches MOBILE_SPECS in playwright.config.ts).
 */
test("press and hold → Delete finds an egg: toast sheet 1/15, then Achievements from Start", async ({ page }) => {
  await gotoDesktop(page);
  const whatsapp = desktopIcon(page, "whatsapp");
  const box = (await whatsapp.boundingBox())!;
  const point = { x: box.x + box.width / 2, y: box.y + box.height / 3 };
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
  await del.tap();

  // The rescue line comes first; the egg toast waits its turn (one balloon at a time).
  const notice = page.locator("[data-trash-notice]");
  const toast = page.locator("[data-easter-egg-toast]");
  await expect(notice).toBeVisible();
  await expect(toast).toHaveCount(0);
  await notice.getByRole("button", { name: "Close" }).tap();

  await expect(toast).toBeVisible();
  await expect(toast).toContainText("Easter egg found! (1/15)");
  await expect(toast).toContainText("Rescue mission");
  await expect(toast).toBeInViewport({ ratio: 1 });
  // Bottom sheet: full width, right above the taskbar.
  const sheet = (await toast.boundingBox())!;
  expect(Math.round(sheet.width)).toBe(page.viewportSize()!.width);
  const taskbar = (await page.locator("[data-taskbar]").boundingBox())!;
  expect(Math.round(sheet.y + sheet.height)).toBe(Math.round(taskbar.y));
  await toast.getByRole("button", { name: "Close" }).tap();
  await expect(toast).toHaveCount(0);

  await startButton(page).tap();
  const item = startItem(page, "achievements");
  await expect(item).toContainText("1/15");
  await item.tap();
  const win = windowById(page, "achievements");
  await expect(win).toHaveAttribute("data-presentation", "fullscreen");
  await expect(win).toContainText("Easter eggs found: 1 of 15");
  await expect(win.locator("[data-egg][data-found]")).toHaveCount(1);
});
