"use client";

import type { ReactNode } from "react";
import { ContextMenu } from "radix-ui";
import { ChevronRight } from "lucide-react";
import { menuItemClass, menuSurfaceClass } from "@/components/os/menuStyles";
import { cn } from "@/lib/utils";

/** One entry of a desktop context menu (an icon's or the background's). */
export interface IconMenuItem {
  /** Stable id (`open`, `delete`, `properties`…), exposed as `data-icon-menu-item`. */
  id: string;
  label: string;
  /** Runs on select; omitted for a submenu trigger. */
  onSelect?: () => void;
  /** Bold, like the default action of a classic context menu. */
  primary?: boolean;
  /** Draw a separator line above this item. */
  separatorBefore?: boolean;
  /** Makes the item a cascading submenu (`New ▸`). */
  items?: readonly IconMenuItem[];
}

const surface = cn(menuSurfaceClass, "z-1200 min-w-40 max-md:min-w-48");
const itemClass = cn(menuItemClass, "max-md:min-h-touch-target");

function MenuItems({ items }: { items: readonly IconMenuItem[] }) {
  return items.map((item) => (
    <MenuEntry key={item.id} item={item} />
  ));
}

function MenuEntry({ item }: { item: IconMenuItem }) {
  const separator = item.separatorBefore ? (
    <ContextMenu.Separator className="mx-0.5 my-0.5 h-px bg-bevel-shadow" />
  ) : null;
  if (item.items) {
    return (
      <>
        {separator}
        <ContextMenu.Sub>
          <ContextMenu.SubTrigger data-icon-menu-item={item.id} className={itemClass}>
            <span className="flex-1">{item.label}</span>
            <ChevronRight className="size-3 shrink-0" aria-hidden />
          </ContextMenu.SubTrigger>
          <ContextMenu.Portal>
            <ContextMenu.SubContent data-icon-submenu={item.id} sideOffset={2} className={surface}>
              <MenuItems items={item.items} />
            </ContextMenu.SubContent>
          </ContextMenu.Portal>
        </ContextMenu.Sub>
      </>
    );
  }
  return (
    <>
      {separator}
      <ContextMenu.Item
        data-icon-menu-item={item.id}
        onSelect={item.onSelect}
        className={cn(itemClass, item.primary && "font-bold")}
      >
        {item.label}
      </ContextMenu.Item>
    </>
  );
}

/**
 * A desktop context menu (Radix ContextMenu): right-click with a mouse, press
 * and hold (~700ms, Radix) on touch, `Shift+F10` / the ContextMenu key from
 * the keyboard (stage 7: the shell dispatches a `contextmenu` event on the
 * focused icon, or on the desktop when nothing has focus — `lib/contextMenu.ts`).
 *
 * Two menus share this one mechanism (items are data):
 * - an icon's (stage 6): **Open**, **Delete** (the Recycle Bin rescue joke),
 *   **Rename** (the F2 "protected file" box), **Properties** (stage 7);
 * - the desktop background's (`menu="desktop"`, stage 7): Arrange Icons,
 *   Refresh, New ▸, Properties.
 * The background trigger is a layer *under* the icons, never their ancestor,
 * so a press on an icon only ever reaches the icon's menu (Radix arms its
 * long-press on pointerdown, which would otherwise bubble to both).
 *
 * `onOpenChange(true)` lets the icon swallow the click that may follow a
 * long-press, so holding an icon never also opens it.
 */
export function IconContextMenu({
  items,
  onOpenChange,
  children,
  menu = "icon",
}: {
  items: readonly IconMenuItem[];
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
  /** Which menu this is, exposed as `data-icon-menu` / `data-desktop-menu`. */
  menu?: "icon" | "desktop";
}) {
  return (
    <ContextMenu.Root modal={false} onOpenChange={onOpenChange}>
      <ContextMenu.Trigger asChild>{children}</ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content
          data-icon-menu={menu === "icon" ? "" : undefined}
          data-desktop-menu={menu === "desktop" ? "" : undefined}
          className={surface}
        >
          <MenuItems items={items} />
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}
