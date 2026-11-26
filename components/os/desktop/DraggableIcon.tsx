"use client";

import type { ComponentProps } from "react";
import { motion, type TargetAndTransition, type Transition } from "framer-motion";
import { DesktopIcon } from "@/components/os/desktop/DesktopIcon";
import { useDesktopIconDrag } from "@/hooks/useDesktopIconDrag";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useRescuePhase } from "@/hooks/useRescuePhase";
import { useDesktopStore } from "@/lib/store/desktopStore";
import { cellToPixel } from "@/lib/store/desktopGrid";
import { RECYCLE_BIN_ID } from "@/lib/store/recycleBin";
import { DURATION, EASE } from "@/lib/motion";
import type { DesktopIconId, LauncherConfig } from "@/lib/apps/registry";

const SNAP_SPRING: Transition = { type: "spring", stiffness: 500, damping: 40 };

/**
 * Positions one desktop icon and makes it draggable. The icon follows the
 * cursor live while dragging (with the rest of its selected group), then
 * springs to its snapped grid cell on release (instant under reduced motion).
 * Dropped on the Recycle Bin, it shrinks into the bin and fades back in on
 * its own cell (stage 6; instant under reduced motion). The `wasDragged`
 * guard keeps a drop from also opening the app. The shell only renders
 * client-side, so `window` is safe here.
 */
export function DraggableIcon(
  props: Omit<ComponentProps<typeof DesktopIcon>, "wasDragged" | "launcher"> & {
    launcher: LauncherConfig & { id: DesktopIconId };
  },
) {
  const id = props.launcher.id;
  const cell = useDesktopStore((s) => s.iconCells[id]);
  const binCell = useDesktopStore((s) => s.binCell);
  const dx = useDesktopStore((s) => (s.drag?.ids.includes(id) ? s.drag.dx : null));
  const dy = useDesktopStore((s) => (s.drag?.ids.includes(id) ? s.drag.dy : null));
  const { handlers, wasDragged } = useDesktopIconDrag(id);
  const reducedMotion = useReducedMotion();
  const rescue = useRescuePhase(id, reducedMotion);

  const vp = { width: window.innerWidth, height: window.innerHeight };
  const target = cellToPixel(cell, vp);
  const dragging = dx !== null && dy !== null;
  const pos = dragging ? { x: target.x + dx, y: target.y + dy } : target;

  let animate: TargetAndTransition;
  let transition: Transition;
  if (rescue.phase === "entering") {
    // Into the bin wherever it currently sits.
    const bin = cellToPixel(binCell, vp);
    animate = { x: bin.x, y: bin.y, scale: 0.3, opacity: 0 };
    transition = { duration: DURATION.slow, ease: EASE.in };
  } else if (rescue.phase === "returning") {
    // Jump home while invisible, pause a beat (the bin shows "full"), fade in.
    animate = { x: target.x, y: target.y, scale: 1, opacity: 1 };
    transition = {
      x: { duration: 0 },
      y: { duration: 0 },
      scale: { ...SNAP_SPRING, delay: 0.35 },
      opacity: { duration: DURATION.slow, delay: 0.35 },
    };
  } else {
    animate = { x: pos.x, y: pos.y, scale: 1, opacity: 1 };
    transition = dragging || reducedMotion ? { duration: 0 } : SNAP_SPRING;
  }

  return (
    <motion.div
      role="none"
      data-rescue={rescue.phase === "idle" ? undefined : rescue.phase}
      className="absolute left-0 top-0 touch-none"
      style={{ zIndex: dragging || rescue.phase === "entering" ? 2 : 1 }}
      // No fly-in on mount: icons render directly at their grid cell; the
      // spring only animates subsequent moves (drag release snapping).
      initial={false}
      animate={animate}
      transition={transition}
      onAnimationComplete={rescue.onAnimationComplete}
      {...handlers}
    >
      <DesktopIcon {...props} wasDragged={wasDragged} />
    </motion.div>
  );
}

/**
 * The Recycle Bin on the desktop grid: draggable like any icon (it follows
 * the pointer, then springs to the nearest free cell — `moveBin`), but it
 * always moves alone and dropping it never runs the rescue joke. Idle, it
 * sits under the other icons (layer 0) so anything dropped into it flies
 * over it; while dragged it rises above them.
 */
export function DraggableRecycleBin(
  props: Omit<ComponentProps<typeof DesktopIcon>, "wasDragged">,
) {
  const cell = useDesktopStore((s) => s.binCell);
  const dx = useDesktopStore((s) => (s.drag?.ids.includes(RECYCLE_BIN_ID) ? s.drag.dx : null));
  const dy = useDesktopStore((s) => (s.drag?.ids.includes(RECYCLE_BIN_ID) ? s.drag.dy : null));
  const { handlers, wasDragged } = useDesktopIconDrag(RECYCLE_BIN_ID);
  const reducedMotion = useReducedMotion();

  const vp = { width: window.innerWidth, height: window.innerHeight };
  const target = cellToPixel(cell, vp);
  const dragging = dx !== null && dy !== null;
  const pos = dragging ? { x: target.x + dx, y: target.y + dy } : target;

  return (
    <motion.div
      role="none"
      data-recycle-bin
      className="absolute left-0 top-0 touch-none"
      style={{ zIndex: dragging ? 2 : 0 }}
      initial={false}
      animate={{ x: pos.x, y: pos.y }}
      transition={dragging || reducedMotion ? { duration: 0 } : SNAP_SPRING}
      {...handlers}
    >
      <DesktopIcon {...props} wasDragged={wasDragged} />
    </motion.div>
  );
}
