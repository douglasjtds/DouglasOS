import { useEffect } from "react";
import { useShellStore } from "@/lib/store/shellStore";
import { useWindowStore } from "@/lib/store/windowStore";
import {
  createMetaTapTracker,
  isApplePlatform,
  isTextField,
  matchShortcut,
  type ShortcutAction,
} from "@/lib/shortcuts";
import { cycleWindow } from "@/lib/taskbar";
import { contextMenuTarget, openContextMenuOn } from "@/lib/contextMenu";
import {
  askToCloseWindow,
  focusAfterClose,
  focusWindowElement,
  requestCloseWindow,
} from "@/lib/windowClose";

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
    case "openRun":
      if (shell.dialog === null) shell.openDialog({ kind: "run" });
      return;
    case "openPalette":
      if (shell.dialog?.kind === "palette") shell.closeDialog();
      else if (shell.dialog === null) shell.openDialog({ kind: "palette" });
      return;
    case "openContextMenu":
      // Handled in the key listener (it needs the focused element).
      return;
    case "closeWindow":
      if (!focused) return;
      if (requestCloseWindow(focused) === "closed") focusAfterClose(focused);
      return;
    case "confirmCloseWindow":
      if (focused) askToCloseWindow(focused);
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
    const applePlatform = isApplePlatform(typeof navigator === "undefined" ? undefined : navigator);

    function onKeyDown(e: KeyboardEvent) {
      meta.keydown(e);
      if (useShellStore.getState().phase !== "desktop" || e.defaultPrevented) return;
      const action = matchShortcut(e, {
        inTextField: isTextField(e.target),
        overlayOpen: overlayOpen(),
        applePlatform,
      });
      if (!action) return;
      if (action === "openContextMenu") {
        const target = contextMenuTarget(document.activeElement, document);
        if (!target) return;
        e.preventDefault();
        openContextMenuOn(target);
        return;
      }
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
