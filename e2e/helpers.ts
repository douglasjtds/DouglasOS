import { expect, type Page } from "@playwright/test";

/**
 * Land on the desktop shell with boot + logon out of the way.
 *
 * Boot and logon play once per browser session (sessionStorage flag, see
 * `lib/store/shellStore.ts`); the welcome balloon also shows once per session.
 * Most specs only care about the shell, so we pre-set both flags and emulate
 * reduced motion (instant transitions). `boot.spec.ts` drives the real flow.
 */
export async function gotoDesktop(page: Page, locale: "en" | "pt" = "en") {
  await page.addInitScript(() => {
    sessionStorage.setItem("douglasos-booted", "1");
    sessionStorage.setItem("douglasos-welcomed", "1");
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`/${locale}`);
  await expect(startButton(page)).toBeVisible();
}

/** The green Start button (stable data attribute, copy-independent). */
export function startButton(page: Page) {
  return page.locator("[data-start-button]");
}

/** A Start menu entry by its stable id (`about`, `resume`, `contact`, `log-off`…). */
export function startItem(page: Page, id: string) {
  return page.locator(`[data-start-item="${id}"]`).first();
}

/** A desktop icon by launcher id. */
export function desktopIcon(page: Page, id: string) {
  return page.locator(`[data-desktop-icon="${id}"]`);
}

/** A window's taskbar button by app id. */
export function taskButton(page: Page, id: string) {
  return page.locator(`[data-task-app="${id}"]`);
}

/** Open windows (Luna chrome renders each as a labelled section). */
export function windows(page: Page) {
  return page.locator("[data-window]");
}

export function windowById(page: Page, id: string) {
  return page.locator(`[data-window="${id}"]`);
}
