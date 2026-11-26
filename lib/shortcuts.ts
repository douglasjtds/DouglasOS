/**
 * The single shortcut registry (DESKTOP-INTERFACE-SPEC §12 → Shortcut map).
 * Pure: it maps a key event + context to an action; the shell performs it.
 * Later stages add rows here so shortcuts can't collide.
 *
 * Classic shortcuts owned by the host OS/browser (Alt+Tab, the Super key on
 * some systems, Alt+F4 on Windows) work only where the browser lets them
 * through; the `Alt+Shift` family is the always-available alternative. Alt+Shift
 * combos match on `event.code` so macOS Option characters don't interfere.
 */

export type ShortcutAction =
  | "toggleStartMenu"
  | "nextWindow"
  | "previousWindow"
  | "closeWindow"
  | "confirmCloseWindow"
  | "maximizeWindow"
  | "restoreWindow"
  | "openRun"
  | "openPalette"
  | "openContextMenu";

export interface KeyInput {
  key: string;
  code: string;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
}

export interface ShortcutContext {
  /** Focus is in an input/textarea/contenteditable. */
  inTextField: boolean;
  /** A menu, dialog or balloon is open (Esc belongs to it first). */
  overlayOpen: boolean;
  /**
   * macOS/iOS: Cmd+R is the browser's reload there, so `Meta+R` never opens
   * Run on Apple platforms (Alt+Shift+R does).
   */
  applePlatform?: boolean;
}

/** Documented rows, also used by tests to guarantee no duplicates. */
export const SHORTCUTS: { action: ShortcutAction; keys: string[] }[] = [
  { action: "toggleStartMenu", keys: ["Ctrl+Escape", "Meta (tap)", "Alt+Shift+S"] },
  { action: "nextWindow", keys: ["Alt+Shift+W"] },
  { action: "previousWindow", keys: ["Alt+Shift+Q"] },
  { action: "closeWindow", keys: ["Alt+F4"] },
  // A bare Esc asks first ("Close <app>?"), so one stray key never loses work.
  { action: "confirmCloseWindow", keys: ["Escape"] },
  { action: "maximizeWindow", keys: ["Alt+Shift+ArrowUp"] },
  { action: "restoreWindow", keys: ["Alt+Shift+ArrowDown"] },
  { action: "openRun", keys: ["Meta+R (best effort, not on Apple)", "Alt+Shift+R"] },
  { action: "openPalette", keys: ["Ctrl+K", "Meta+K"] },
  { action: "openContextMenu", keys: ["Shift+F10", "ContextMenu"] },
];

const ALT_SHIFT_CODES: Record<string, ShortcutAction> = {
  KeyS: "toggleStartMenu",
  KeyW: "nextWindow",
  KeyQ: "previousWindow",
  ArrowUp: "maximizeWindow",
  ArrowDown: "restoreWindow",
  KeyR: "openRun",
};

export function matchShortcut(
  e: KeyInput,
  ctx: ShortcutContext,
): ShortcutAction | null {
  // Ctrl+Esc works everywhere (it is the classic Start shortcut).
  if (e.key === "Escape" && e.ctrlKey && !e.altKey && !e.metaKey) {
    return "toggleStartMenu";
  }
  // Everything else is suspended while typing.
  if (ctx.inTextField) return null;

  if (e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey) {
    return ALT_SHIFT_CODES[e.code] ?? null;
  }
  // Command palette: Ctrl+K, or Cmd+K on macOS.
  if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.code === "KeyK") {
    return "openPalette";
  }
  // Run: Meta+R where the browser lets it through (Win+R is OS-owned on
  // Windows), never on Apple platforms where Cmd+R reloads the page.
  if (e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey && e.code === "KeyR" && !ctx.applePlatform) {
    return "openRun";
  }
  if (
    (e.key === "F10" && e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) ||
    (e.key === "ContextMenu" && !e.ctrlKey && !e.altKey && !e.metaKey)
  ) {
    return "openContextMenu";
  }
  if (e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey && e.key === "F4") {
    return "closeWindow";
  }
  if (
    e.key === "Escape" &&
    !e.altKey &&
    !e.shiftKey &&
    !e.metaKey &&
    !ctx.overlayOpen
  ) {
    return "confirmCloseWindow";
  }
  return null;
}

/**
 * Detects a lone tap of the Meta (Windows/Super/Cmd) key: Meta pressed and
 * released with no other key in between and without the page losing focus
 * (so Cmd+Tab away and back never opens the Start menu).
 */
export function createMetaTapTracker() {
  let armed = false;
  return {
    keydown(e: Pick<KeyInput, "key">) {
      armed = e.key === "Meta" ? true : false;
    },
    /** True when this keyup completes a clean Meta tap. */
    keyup(e: Pick<KeyInput, "key">): boolean {
      const tapped = armed && e.key === "Meta";
      armed = false;
      return tapped;
    },
    reset() {
      armed = false;
    },
  };
}

/** Best-effort Apple platform check (Cmd is the Meta key there). */
export function isApplePlatform(
  nav: Pick<Navigator, "platform" | "userAgent"> | undefined,
): boolean {
  if (!nav) return false;
  return /Mac|iPhone|iPad|iPod/i.test(nav.platform || nav.userAgent);
}

/** True when the event target is a text-entry control. */
export function isTextField(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target instanceof HTMLTextAreaElement) return true;
  if (target instanceof HTMLInputElement) {
    const nonText = ["button", "checkbox", "radio", "range", "submit", "reset", "color", "file", "image"];
    return !nonText.includes(target.type);
  }
  return false;
}
