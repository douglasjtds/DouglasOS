import type { AppId } from "@/lib/apps/registry";

export type TaskButtonAction = "restore" | "minimize" | "focus";

/**
 * What clicking a window's taskbar button does (DESKTOP-INTERFACE-SPEC §4):
 * minimized → restore + focus; focused → minimize; otherwise → focus.
 */
export function taskButtonAction(
  win: { minimized: boolean },
  isFocused: boolean,
): TaskButtonAction {
  if (win.minimized) return "restore";
  if (isFocused) return "minimize";
  return "focus";
}

/**
 * The window to activate when cycling (Alt+Shift+W / Alt+Shift+Q), in opening
 * order and wrapping around. Null when nothing is open.
 */
export function cycleWindow(
  order: AppId[],
  focusedId: AppId | null,
  dir: 1 | -1,
): AppId | null {
  if (order.length === 0) return null;
  const index = focusedId ? order.indexOf(focusedId) : -1;
  if (index === -1) return dir === 1 ? order[0] : order[order.length - 1];
  return order[(index + dir + order.length) % order.length];
}
