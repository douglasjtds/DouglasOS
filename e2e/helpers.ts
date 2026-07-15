import { expect, type Page } from "@playwright/test";

/**
 * Land on the desktop shell with the boot animation out of the way.
 *
 * The boot screen plays once per session and is skipped entirely under
 * `prefers-reduced-motion: reduce` (see `BootScreen.tsx`). Most specs only care
 * about the shell, so we emulate reduced motion to go straight to the desktop.
 * The dedicated boot spec opts out of this and drives the animation itself.
 */
export async function gotoDesktop(page: Page, locale: "en" | "pt" = "en") {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`/${locale}`);
  await expect(dockButton(page, "about")).toBeVisible();
}

/** A dock launcher button, located by its stable data attribute. */
export function dockButton(page: Page, appId: string) {
  return page.locator(`[data-dock-app="${appId}"]`);
}

/** Any open window (custom chrome renders as role="dialog"). */
export function windows(page: Page) {
  return page.getByRole("dialog");
}
