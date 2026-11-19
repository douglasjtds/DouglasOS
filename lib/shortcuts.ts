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
  | "maximizeWindow"
  | "restoreWindow";

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
}

/** Documented rows, also used by tests to guarantee no duplicates. */
export const SHORTCUTS: { action: ShortcutAction; keys: string[] }[] = [
  { action: "toggleStartMenu", keys: ["Ctrl+Escape", "Meta (tap)", "Alt+Shift+S"] },
  { action: "nextWindow", keys: ["Alt+Shift+W"] },
  { action: "previousWindow", keys: ["Alt+Shift+Q"] },
  { action: "closeWindow", keys: ["Alt+F4", "Escape"] },
  { action: "maximizeWindow", keys: ["Alt+Shift+ArrowUp"] },
  { action: "restoreWindow", keys: ["Alt+Shift+ArrowDown"] },
];

const ALT_SHIFT_CODES: Record<string, ShortcutAction> = {
  KeyS: "toggleStartMenu",
  KeyW: "nextWindow",
  KeyQ: "previousWindow",
  ArrowUp: "maximizeWindow",
  ArrowDown: "restoreWindow",
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
    return "closeWindow";
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
