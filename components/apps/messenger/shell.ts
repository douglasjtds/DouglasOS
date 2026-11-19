import { runShellAction } from "@/lib/assistant/actions";
import type { MessengerAction } from "@/lib/messenger/types";
import { useMessengerStore } from "@/lib/store/messengerStore";
import { useWindowStore } from "@/lib/store/windowStore";

/**
 * Run a button under one of Douglas's lines (or a quick reply's effect):
 * the message form opens in place, everything else goes through the shared
 * shell launcher (windows, project routes, the CV download).
 */
export function runMessengerAction(action: MessengerAction): void {
  if (action.kind === "leaveMessage") {
    useMessengerStore.getState().openForm();
    return;
  }
  runShellAction(action);
}

/**
 * Close the Messenger window (Esc from the composer) and put focus somewhere
 * sensible: the next window, else the tray icon, else Start.
 */
export function closeMessengerWindow(): void {
  const windows = useWindowStore.getState();
  windows.closeWindow("messenger");
  const next = useWindowStore.getState().focusedId;
  requestAnimationFrame(() => {
    const target =
      (next && document.querySelector<HTMLElement>(`[data-window="${next}"]`)) ||
      document.querySelector<HTMLElement>("[data-tray-messenger]") ||
      document.querySelector<HTMLElement>("[data-start-button]");
    target?.focus();
  });
}
