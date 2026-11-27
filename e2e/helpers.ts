import { expect, type Page } from "@playwright/test";

/**
 * Land on the desktop shell with boot + logon out of the way.
 *
 * Boot and logon play once per browser session (sessionStorage flag, see
 * `lib/store/shellStore.ts`); the welcome balloon also shows once per session.
 * Most specs only care about the shell, so we pre-set both flags and emulate
 * reduced motion (instant transitions). `boot.spec.ts` drives the real flow.
 *
 * The mini Douglas assistant is dismissed too (as if "Not now" was picked
 * this session) so his timed appearances can't overlap other specs; pass
 * `{ assistant: true }` to keep him (`assistant.spec.ts`). Likewise the
 * DouglasOS Messenger toast is marked as already shown; pass
 * `{ messengerToast: true }` to let it pop up.
 */
/**
 * Hide the Next.js dev indicator. Locally Playwright drives `pnpm run dev`
 * (CI uses the production build, which has none), and the indicator sits in
 * the bottom-left corner: at phone sizes it covers the Start button and
 * swallows its taps. Hidden here rather than with `devIndicators: false` in
 * next.config.ts, which made WebKit's dev client fall into a reload loop.
 */
export async function hideNextDevIndicator(page: Page) {
  await page.addInitScript(() => {
    const style = document.createElement("style");
    style.textContent = "nextjs-portal { display: none !important; }";
    document.addEventListener("DOMContentLoaded", () => document.head.append(style));
  });
}

export async function gotoDesktop(
  page: Page,
  locale: "en" | "pt" = "en",
  { assistant = false, messengerToast = false }: { assistant?: boolean; messengerToast?: boolean } = {},
) {
  await hideNextDevIndicator(page);
  await page.addInitScript(
    ({ keepAssistant, keepToast }) => {
      sessionStorage.setItem("douglasos-booted", "1");
      sessionStorage.setItem("douglasos-welcomed", "1");
      // Only on the first load of the session, so a test can dismiss him and reload.
      if (!keepAssistant && sessionStorage.getItem("douglasos-assistant") === null) {
        sessionStorage.setItem("douglasos-assistant", JSON.stringify({ dismissed: true, fired: [] }));
      }
      if (!keepToast) sessionStorage.setItem("douglasos-messenger-toast", "1");
    },
    { keepAssistant: assistant, keepToast: messengerToast },
  );
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

/** The mini Douglas character button and his bubble. */
export function assistantCharacter(page: Page) {
  return page.locator("[data-assistant-character]");
}

export function assistantBubble(page: Page) {
  return page.locator("[data-assistant-bubble]");
}

/** DouglasOS Messenger: the window, its tray icon and the toast. */
export function messengerTray(page: Page) {
  return page.locator("[data-tray-messenger]");
}

export function messengerToast(page: Page) {
  return page.locator("[data-messenger-toast]");
}

/** DouglasOS Paint (stage 10): RGBA of one pixel of the drawing (canvas coordinates). */
export function paintPixel(page: Page, x: number, y: number) {
  return page
    .locator("[data-paint-canvas]")
    .evaluate(
      (canvas: HTMLCanvasElement, [px, py]) => [...canvas.getContext("2d")!.getImageData(px, py, 1, 1).data],
      [x, y],
    );
}
