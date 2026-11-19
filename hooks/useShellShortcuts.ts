import { useEffect } from "react";
import { useShellStore } from "@/lib/store/shellStore";
import { useWindowStore } from "@/lib/store/windowStore";
import {
  createMetaTapTracker,
  isTextField,
  matchShortcut,
  type ShortcutAction,
} from "@/lib/shortcuts";
import { cycleWindow } from "@/lib/taskbar";
import type { AppId } from "@/lib/apps/registry";

function focusWindowElement(id: AppId) {
  requestAnimationFrame(() =>
    document.querySelector<HTMLElement>(`[data-window="${id}"]`)?.focus(),
  );
}

/** After closing a window: next window, else its desktop icon, else Start. */
function focusAfterClose(closedId: AppId) {
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

/** Any transient UI that owns Esc before the window manager does. */
function overlayOpen(): boolean {
  const { startMenuOpen, dialog } = useShellStore.getState();
  return (
    startMenuOpen ||
    dialog !== null ||
    document.querySelector('[role="menu"], [role="alertdialog"]') !== null
  );
}

function perform(action: ShortcutAction) {
  const shell = useShellStore.getState();
  const windows = useWindowStore.getState();
  const focused = windows.focusedId;

  switch (action) {
    case "toggleStartMenu":
      shell.toggleStartMenu();
      return;
    case "closeWindow":
      if (!focused) return;
      windows.closeWindow(focused);
      focusAfterClose(focused);
      return;
    case "maximizeWindow":
      if (focused && !windows.windows[focused]?.maximized) windows.toggleMaximize(focused);
      return;
    case "restoreWindow":
      if (focused && windows.windows[focused]?.maximized) windows.toggleMaximize(focused);
      return;
    case "nextWindow":
    case "previousWindow": {
      const target = cycleWindow(windows.order, focused, action === "nextWindow" ? 1 : -1);
      if (!target) return;
      if (windows.windows[target]?.minimized) windows.restoreWindow(target);
      else windows.focusWindow(target);
      focusWindowElement(target);
    }
  }
}

/**
 * Wires the shortcut registry (`lib/shortcuts.ts`) to the shell while the
 * desktop is showing. Keys already handled by a menu/dialog (defaultPrevented)
 * are left alone.
 */
export function useShellShortcuts() {
  useEffect(() => {
    const meta = createMetaTapTracker();

    function onKeyDown(e: KeyboardEvent) {
      meta.keydown(e);
      if (useShellStore.getState().phase !== "desktop" || e.defaultPrevented) return;
      const action = matchShortcut(e, {
        inTextField: isTextField(e.target),
        overlayOpen: overlayOpen(),
      });
      if (!action) return;
      e.preventDefault();
      perform(action);
    }

    function onKeyUp(e: KeyboardEvent) {
      if (!meta.keyup(e)) return;
      if (useShellStore.getState().phase !== "desktop") return;
      if (useShellStore.getState().dialog) return;
      useShellStore.getState().toggleStartMenu();
    }

    const onBlur = () => meta.reset();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);
}
