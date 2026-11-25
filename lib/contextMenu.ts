/**
 * Keyboard access to context menus (Shift+F10 / the ContextMenu key, stage 7).
 * The menus are Radix ContextMenus, which open on a `contextmenu` event; this
 * dispatches one at the element's center so the menu appears next to it.
 * Browsers fire their own `contextmenu` for the ContextMenu key on some
 * platforms; a second one only re-anchors the same menu.
 */
export function openContextMenuOn(el: Element): void {
  const rect = el.getBoundingClientRect();
  el.dispatchEvent(
    new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      button: 2,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + Math.min(rect.height / 2, 48),
    }),
  );
}

/**
 * Where Shift+F10 should open a menu for the focused element: its desktop
 * icon, or the desktop background when nothing (or the desktop) has focus.
 * Null inside windows and other UI (the key is left to the browser there).
 */
export function contextMenuTarget(active: Element | null, doc: Document): Element | null {
  const icon = active?.closest("[data-desktop-icon]");
  if (icon) return icon;
  const surface = doc.querySelector("[data-desktop-background]");
  if (!active || active === doc.body || active.closest("[data-desktop]")) return surface;
  return null;
}
