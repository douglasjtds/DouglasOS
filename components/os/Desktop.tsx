"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import {
  DESKTOP_ICON_IDS,
  DESKTOP_LAUNCHERS,
  type DesktopIconId,
} from "@/lib/apps/registry";
import { launch } from "@/lib/apps/launch";
import { useDesktopStore } from "@/lib/store/desktopStore";
import { useShellStore } from "@/lib/store/shellStore";
import {
  iconsInGridOrder,
  iconsInRowOrder,
  mobileIconLayout,
  neighborIcon,
  type Cell,
  type Direction,
} from "@/lib/store/desktopGrid";
import { DraggableIcon } from "@/components/os/desktop/DraggableIcon";
import { DesktopIcon } from "@/components/os/desktop/DesktopIcon";
import { Wallpaper } from "@/components/os/desktop/Wallpaper";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useElementWidth } from "@/hooks/useElementWidth";

const ARROWS: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

function focusIcon(id: DesktopIconId) {
  document.querySelector<HTMLElement>(`[data-desktop-icon="${id}"]`)?.focus();
}

/**
 * The desktop work area: wallpaper + the icon grid. The icons form one
 * listbox with a roving tab stop (one Tab stop for the whole desktop); arrows
 * move the selection across the grid, Home/End jump to the ends, Enter opens,
 * F2 shows the "protected file" joke instead of renaming.
 *
 * Below 768px (DESKTOP-INTERFACE-SPEC §11) the grid switches to the touch
 * layout: bigger cells filled row-first like a phone home screen, derived from
 * the container width (never persisted), no icon drag, and the container
 * scrolls vertically if a short screen can't fit every row.
 */
export function Desktop() {
  const t = useTranslations("desktop");
  const mobile = useIsMobile();
  const savedCells = useDesktopStore((s) => s.iconCells);
  const openDialog = useShellStore((s) => s.openDialog);
  const [selected, setSelected] = useState<DesktopIconId | null>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const surfaceWidth = useElementWidth(
    surfaceRef,
    typeof window === "undefined" ? 0 : window.innerWidth,
  );

  const mobileLayout = mobile ? mobileIconLayout(DESKTOP_ICON_IDS, surfaceWidth) : null;
  const iconCells: Record<DesktopIconId, Cell> = mobileLayout?.cells ?? savedCells;
  const ordered = mobileLayout ? iconsInRowOrder(iconCells) : iconsInGridOrder(iconCells);
  const tabStop = selected ?? ordered[0];

  function onIconKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const current = (e.currentTarget.dataset.desktopIcon ?? tabStop) as DesktopIconId;
    let next: DesktopIconId | null = null;
    if (e.key in ARROWS) next = neighborIcon(iconCells, current, ARROWS[e.key]);
    else if (e.key === "Home") next = ordered[0];
    else if (e.key === "End") next = ordered[ordered.length - 1];
    else if (e.key === "Enter") {
      e.preventDefault();
      launch(current);
      return;
    } else if (e.key === "F2") {
      e.preventDefault();
      openDialog({ kind: "protectedFile", iconId: current });
      return;
    } else {
      return;
    }
    e.preventDefault();
    if (next) {
      setSelected(next);
      focusIcon(next);
    }
  }

  return (
    <div
      data-desktop
      data-layout={mobile ? "touch" : "pointer"}
      className="absolute inset-x-0 top-0 bottom-taskbar z-0 overflow-hidden"
      // A press on empty desktop clears the selection.
      onPointerDown={(e) => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.desktopSurface) {
          setSelected(null);
        }
      }}
    >
      <Wallpaper />
      <div
        ref={surfaceRef}
        role="listbox"
        aria-label={t("label")}
        aria-orientation={mobile ? "horizontal" : "vertical"}
        data-desktop-surface="true"
        className={
          mobile
            ? "absolute inset-0 z-10 overflow-y-auto overscroll-contain pt-safe-top px-safe"
            : "absolute inset-0 z-10"
        }
      >
        {mobileLayout ? (
          // Sized wrapper so the scroll height matches the icon grid.
          <div
            data-desktop-surface="true"
            className="relative"
            style={{ height: mobileLayout.height }}
          >
            {DESKTOP_LAUNCHERS.map((launcher) => {
              const pos = mobileLayout.positions[launcher.id];
              return (
                <div
                  key={launcher.id}
                  role="none"
                  className="absolute left-0 top-0"
                  style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
                >
                  <DesktopIcon
                    launcher={launcher}
                    selected={selected === launcher.id}
                    tabbable={tabStop === launcher.id}
                    onSelect={setSelected}
                    onKeyDown={onIconKeyDown}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          DESKTOP_LAUNCHERS.map((launcher) => (
            <DraggableIcon
              key={launcher.id}
              launcher={launcher}
              selected={selected === launcher.id}
              tabbable={tabStop === launcher.id}
              onSelect={setSelected}
              onKeyDown={onIconKeyDown}
            />
          ))
        )}
      </div>
    </div>
  );
}
