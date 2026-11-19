"use client";

import { useState, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { DESKTOP_LAUNCHERS, type DesktopIconId } from "@/lib/apps/registry";
import { launch } from "@/lib/apps/launch";
import { useDesktopStore } from "@/lib/store/desktopStore";
import { useShellStore } from "@/lib/store/shellStore";
import {
  iconsInGridOrder,
  neighborIcon,
  type Direction,
} from "@/lib/store/desktopGrid";
import { DraggableIcon } from "@/components/os/desktop/DraggableIcon";
import { Wallpaper } from "@/components/os/desktop/Wallpaper";

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
 */
export function Desktop() {
  const t = useTranslations("desktop");
  const iconCells = useDesktopStore((s) => s.iconCells);
  const openDialog = useShellStore((s) => s.openDialog);
  const [selected, setSelected] = useState<DesktopIconId | null>(null);

  const ordered = iconsInGridOrder(iconCells);
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
        role="listbox"
        aria-label={t("label")}
        aria-orientation="vertical"
        data-desktop-surface="true"
        className="absolute inset-0 z-10"
      >
        {DESKTOP_LAUNCHERS.map((launcher) => (
          <DraggableIcon
            key={launcher.id}
            launcher={launcher}
            selected={selected === launcher.id}
            tabbable={tabStop === launcher.id}
            onSelect={setSelected}
            onKeyDown={onIconKeyDown}
          />
        ))}
      </div>
    </div>
  );
}
