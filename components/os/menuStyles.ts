/**
 * Shared class recipes for XP menus (window icon menu, Start submenus):
 * white surface, 1px bevel-shadow border, blue highlight with white text.
 */
export const menuSurfaceClass =
  "border border-bevel-shadow bg-surface p-0.5 text-system text-text shadow-menu";

export const menuItemClass =
  "flex h-menu-item cursor-default select-none items-center gap-2 px-2 outline-none data-[disabled]:text-text-disabled data-[highlighted]:bg-highlight data-[highlighted]:text-highlight-text";
