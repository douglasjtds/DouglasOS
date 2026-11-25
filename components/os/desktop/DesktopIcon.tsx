"use client";

import { useRef, type KeyboardEvent, type MouseEvent, type PointerEvent, type RefObject } from "react";
import { useTranslations } from "next-intl";
import { launcherTitleKey, type LauncherConfig } from "@/lib/apps/registry";
import type { DesktopItemId } from "@/lib/store/desktopStore";
import type { IconComponent } from "@/components/icons/types";
import { IconContextMenu, type IconMenuItem } from "@/components/os/desktop/IconContextMenu";
import { cn } from "@/lib/utils";

/**
 * Hover hint (also the accessible description): what a non-window icon does,
 * since its label is a file name ("resume.pdf", "linkedin.url").
 */
function iconHint(
  launcher: LauncherConfig,
  t: ReturnType<typeof useTranslations>,
): string | undefined {
  if (launcher.kind === "download") return t("resume.download");
  if (launcher.kind === "link") return t(`links.${launcher.id}.description`);
  return undefined;
}

/**
 * One desktop icon: 48px glyph + white shadowed label. A single click opens it
 * (DouglasOS decision, see DESKTOP-INTERFACE-SPEC §3); the press shows the blue
 * selection; Ctrl/Cmd+click toggles the selection without opening (stage 6).
 * Keyboard focus shows the dotted rectangle. A press that turned into a drag
 * (the `wasDragged` guard) or a long-press that opened the context menu never
 * opens the icon. Selection and activation rules live in `Desktop`.
 */
export function DesktopIcon({
  launcher,
  selected,
  tabbable,
  wasDragged,
  glyph,
  dropTarget = false,
  menuItems,
  onPress,
  onActivate,
  onFocusIcon,
  onKeyDown,
}: {
  launcher: LauncherConfig & { id: DesktopItemId };
  selected: boolean;
  tabbable: boolean;
  wasDragged?: RefObject<boolean>;
  /** Glyph override (the Recycle Bin's "full" state). */
  glyph?: IconComponent;
  /** Highlighted as the drop target of a drag in progress (the bin). */
  dropTarget?: boolean;
  menuItems: readonly IconMenuItem[];
  onPress: (id: DesktopItemId, e: PointerEvent) => void;
  onActivate: (id: DesktopItemId, e: MouseEvent) => void;
  onFocusIcon: (id: DesktopItemId) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLDivElement>) => void;
}) {
  const t = useTranslations();
  const Icon = glyph ?? launcher.icon;
  const label = t(launcherTitleKey(launcher.id));
  // Set when the context menu opens (e.g. after a long-press): the click
  // that may follow the release must not also open the icon.
  const menuOpened = useRef(false);
  const highlighted = selected || dropTarget;

  function handleClick(e: MouseEvent) {
    if (menuOpened.current) {
      menuOpened.current = false;
      return;
    }
    // A drag just ended on this icon — don't also open/download it.
    if (wasDragged?.current) return;
    onActivate(launcher.id, e);
  }

  return (
    <IconContextMenu
      items={menuItems}
      onOpenChange={(open) => {
        if (open) menuOpened.current = true;
      }}
    >
      <div
        role="option"
        aria-selected={selected}
        tabIndex={tabbable ? 0 : -1}
        data-desktop-icon={launcher.id}
        data-drop-target={dropTarget || undefined}
        title={iconHint(launcher, t)}
        onPointerDown={(e: PointerEvent) => {
          if (e.button !== 0) return;
          menuOpened.current = false;
          onPress(launcher.id, e);
        }}
        onFocus={() => onFocusIcon(launcher.id)}
        onClick={handleClick}
        onKeyDown={onKeyDown}
        // No text selection / iOS callout on long-press (it opens the icon's
        // context menu); on touch the whole 88px cell is the hit area.
        className="group flex w-desktop-label cursor-default select-none flex-col items-center gap-1 outline-none [-webkit-touch-callout:none] max-md:py-1"
      >
        <span className={cn("size-icon-desktop", highlighted && "icon-selected-tint")}>
          <Icon size={48} />
        </span>
        <span
          className={cn(
            "max-w-desktop-label px-0.5 text-center text-system break-words",
            "group-focus-visible:outline group-focus-visible:outline-1 group-focus-visible:outline-dotted group-focus-visible:outline-focus-ring-inverse",
            highlighted
              ? "bg-highlight text-highlight-text"
              : "line-clamp-2 text-desktop-label text-shadow-desktop-label",
          )}
        >
          {label}
        </span>
      </div>
    </IconContextMenu>
  );
}
