"use client";

import type { KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { DesktopIcon } from "@/components/os/desktop/DesktopIcon";
import { useDesktopIconDrag } from "@/hooks/useDesktopIconDrag";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useDesktopStore } from "@/lib/store/desktopStore";
import { cellToPixel } from "@/lib/store/desktopGrid";
import type { DesktopIconId, LauncherConfig } from "@/lib/apps/registry";

/**
 * Positions one desktop icon and makes it draggable. The icon follows the
 * cursor live while dragging, then springs to its snapped grid cell on release
 * (instant under reduced motion). The `wasDragged` guard keeps a drop from also
 * opening the app. The shell only renders client-side, so `window` is safe here.
 */
export function DraggableIcon({
  launcher,
  selected,
  tabbable,
  onSelect,
  onKeyDown,
}: {
  launcher: LauncherConfig & { id: DesktopIconId };
  selected: boolean;
  tabbable: boolean;
  onSelect: (id: DesktopIconId) => void;
  onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void;
}) {
  const cell = useDesktopStore((s) => s.iconCells[launcher.id]);
  const { handlers, live, wasDragged } = useDesktopIconDrag(launcher.id);
  const reducedMotion = useReducedMotion();

  const vp = { width: window.innerWidth, height: window.innerHeight };
  const target = cellToPixel(cell, vp);
  const pos = live ?? target;
  const dragging = live !== null;

  return (
    <motion.div
      role="none"
      className="absolute left-0 top-0 touch-none"
      style={{ zIndex: dragging ? 2 : 1 }}
      // No fly-in on mount: icons render directly at their grid cell; the
      // spring only animates subsequent moves (drag release snapping).
      initial={false}
      animate={{ x: pos.x, y: pos.y }}
      transition={
        dragging || reducedMotion
          ? { duration: 0 }
          : { type: "spring", stiffness: 500, damping: 40 }
      }
      {...handlers}
    >
      <DesktopIcon
        launcher={launcher}
        selected={selected}
        tabbable={tabbable}
        wasDragged={wasDragged}
        onSelect={onSelect}
        onKeyDown={onKeyDown}
      />
    </motion.div>
  );
}
