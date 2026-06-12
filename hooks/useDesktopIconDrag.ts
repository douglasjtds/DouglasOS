import {
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import { useDesktopStore } from "@/lib/store/desktopStore";
import { cellToPixel } from "@/lib/store/desktopGrid";
import type { LauncherId } from "@/lib/apps/registry";

/** Pixels of movement before a press is treated as a drag (not a click). */
const DRAG_THRESHOLD = 4;

interface DragSession {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
}

export interface IconDragHandlers {
  onPointerDown: (e: ReactPointerEvent) => void;
  onPointerMove: (e: ReactPointerEvent) => void;
  onPointerUp: (e: ReactPointerEvent) => void;
  onPointerCancel: (e: ReactPointerEvent) => void;
}

export interface IconDrag {
  handlers: IconDragHandlers;
  /** Live top-left pixel while dragging (for instant follow), else null. */
  live: { x: number; y: number } | null;
  /**
   * True once the press passed the drag threshold — read by the icon's click
   * handler so a drop never also opens the app. Cleared on the next press.
   */
  wasDragged: RefObject<boolean>;
}

/**
 * Free-pixel pointer drag for a desktop icon, mirroring `useDrag` but with
 * snap-on-release: the icon follows the cursor live, then `moveIcon` settles it
 * into the nearest free grid cell. Reads the store imperatively via
 * `getState()`; `live` drives the follow render.
 */
export function useDesktopIconDrag(id: LauncherId): IconDrag {
  const session = useRef<DragSession | null>(null);
  const wasDragged = useRef(false);
  const [live, setLive] = useState<{ x: number; y: number } | null>(null);

  function onPointerDown(e: ReactPointerEvent) {
    if (e.button !== 0) return;
    const vp = { width: window.innerWidth, height: window.innerHeight };
    const cell = useDesktopStore.getState().iconCells[id];
    const origin = cellToPixel(cell, vp);
    wasDragged.current = false;
    session.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: origin.x,
      originY: origin.y,
    };
    // NB: capture is deferred to the first real move (see onPointerMove). Capturing
    // here would retarget the subsequent `click` to this wrapper, swallowing the
    // icon button's open/download click.
  }

  function onPointerMove(e: ReactPointerEvent) {
    const drag = session.current;
    if (!drag || e.pointerId !== drag.pointerId) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!wasDragged.current && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      wasDragged.current = true;
      // Only now capture, so a plain click never does — the press has become a drag.
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    if (wasDragged.current) {
      setLive({ x: drag.originX + dx, y: drag.originY + dy });
    }
  }

  function endDrag(e: ReactPointerEvent) {
    const drag = session.current;
    if (!drag || e.pointerId !== drag.pointerId) return;
    session.current = null;
    if (e.currentTarget.hasPointerCapture(drag.pointerId)) {
      e.currentTarget.releasePointerCapture(drag.pointerId);
    }
    if (wasDragged.current) {
      useDesktopStore
        .getState()
        .moveIcon(
          id,
          drag.originX + (e.clientX - drag.startX),
          drag.originY + (e.clientY - drag.startY),
        );
    }
    setLive(null);
  }

  return {
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    },
    live,
    wasDragged,
  };
}
