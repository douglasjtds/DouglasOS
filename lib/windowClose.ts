import type { AppId } from "@/lib/apps/registry";
import { useShellStore } from "@/lib/store/shellStore";
import { useWindowStore } from "@/lib/store/windowStore";

/**
 * Guarded window closing. A bare Esc always asks first (one stray key must
 * never throw away a drawing, the camera or the music); the X button, Alt+F4
 * and the window menu close immediately unless the window registered unsaved
 * work (today only Paint, via `setUnsavedChanges`).
 */

const unsaved = new Set<AppId>();

/** Apps report whether they hold work that closing would lose. */
export function setUnsavedChanges(id: AppId, value: boolean) {
  if (value) unsaved.add(id);
  else unsaved.delete(id);
}

export function hasUnsavedChanges(id: AppId): boolean {
  return unsaved.has(id);
}

export function focusWindowElement(id: AppId) {
  requestAnimationFrame(() =>
    document.querySelector<HTMLElement>(`[data-window="${id}"]`)?.focus({ preventScroll: true }),
  );
}

/** After closing a window: next window, else its desktop icon, else Start. */
export function focusAfterClose(closedId: AppId) {
  const next = useWindowStore.getState().focusedId;
  if (next) {
    focusWindowElement(next);
    return;
  }
  const fallback =
    document.querySelector<HTMLElement>(`[data-desktop-icon="${closedId}"]`) ??
    document.querySelector<HTMLElement>("[data-start-button]");
  fallback?.focus();
}

/** Opens the "Close <app>?" message box (no-op if another dialog is up). */
export function askToCloseWindow(id: AppId) {
  const shell = useShellStore.getState();
  if (!useWindowStore.getState().windows[id] || shell.dialog !== null) return;
  shell.openDialog({ kind: "confirmClose", windowId: id });
}

/** X button, Alt+F4, window menu: close now, unless there is unsaved work. */
export function requestCloseWindow(id: AppId): "closed" | "confirming" {
  if (hasUnsavedChanges(id)) {
    askToCloseWindow(id);
    return "confirming";
  }
  useWindowStore.getState().closeWindow(id);
  return "closed";
}

/** "Yes" in the confirmation: close for real. */
export function confirmCloseWindow(id: AppId) {
  setUnsavedChanges(id, false);
  useWindowStore.getState().closeWindow(id);
}
