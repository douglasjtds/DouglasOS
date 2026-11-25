"use client";

import type { ReactNode } from "react";
import { ContextMenu } from "radix-ui";
import { menuItemClass, menuSurfaceClass } from "@/components/os/menuStyles";
import { cn } from "@/lib/utils";

/** One entry of an icon's context menu. */
export interface IconMenuItem {
  /** Stable id (`open`, `delete`…), exposed as `data-icon-menu-item`. */
  id: string;
  label: string;
  onSelect: () => void;
  /** Bold, like the default action of a classic context menu. */
  primary?: boolean;
}

/**
 * The context menu of a desktop icon: right-click with a mouse, press and
 * hold (~700ms, Radix) on touch, `Shift+F10` / the ContextMenu key once stage
 * 7 wires them. Stage 6 ships the minimal set — **Open** and **Delete** (the
 * Recycle Bin rescue joke) — as data, so stage 7 extends it by adding items
 * (e.g. Properties) instead of replacing the mechanism.
 *
 * `onOpenChange(true)` lets the icon swallow the click that may follow a
 * long-press, so holding an icon never also opens it.
 */
export function IconContextMenu({
  items,
  onOpenChange,
  children,
}: {
  items: readonly IconMenuItem[];
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}) {
  return (
    <ContextMenu.Root modal={false} onOpenChange={onOpenChange}>
      <ContextMenu.Trigger asChild>{children}</ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content
          data-icon-menu
          className={cn(menuSurfaceClass, "z-1200 min-w-40 max-md:min-w-48")}
        >
          {items.map((item) => (
            <ContextMenu.Item
              key={item.id}
              data-icon-menu-item={item.id}
              onSelect={item.onSelect}
              className={cn(menuItemClass, "max-md:min-h-touch-target", item.primary && "font-bold")}
            >
              {item.label}
            </ContextMenu.Item>
          ))}
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}
