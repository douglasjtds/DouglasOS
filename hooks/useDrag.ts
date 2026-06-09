import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import { useWindowStore } from "@/lib/store/windowStore";
import type { AppId } from "@/lib/apps/registry";

interface DragSession {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
}

export interface DragHandlers {
  onPointerDown: (e: ReactPointerEvent) => void;
  onPointerMove: (e: ReactPointerEvent) => void;
  onPointerUp: (e: ReactPointerEvent) => void;
  onPointerCancel: (e: ReactPointerEvent) => void;
}

/**
 * Native pointer-event drag for a window's chrome bar. Writes the clamped
 * position straight into the store on every move (the store clamps to the
 * viewport, which doubles as the off-screen snap-back on release). Reads/writes
 * imperatively via `getState()` so the hook never re-renders or goes stale.
 */
export function useDrag(id: AppId, disabled = false): DragHandlers {
  const session = useRef<DragSession | null>(null);

  function onPointerDown(e: ReactPointerEvent) {
    if (disabled || e.button !== 0) return;
    // Don't start a drag from the control buttons.
    if ((e.target as HTMLElement).closest("[data-no-drag]")) return;

    const { windows, focusWindow } = useWindowStore.getState();
    const instance = windows[id];
    if (!instance) return;

    focusWindow(id);
    session.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: instance.rect.x,
      originY: instance.rect.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: ReactPointerEvent) {
    const drag = session.current;
    if (!drag || e.pointerId !== drag.pointerId) return;
    useWindowStore
      .getState()
      .moveWindow(
        id,
        drag.originX + (e.clientX - drag.startX),
        drag.originY + (e.clientY - drag.startY),
      );
  }

  function endDrag(e: ReactPointerEvent) {
    const drag = session.current;
    if (!drag || e.pointerId !== drag.pointerId) return;
    session.current = null;
    if (e.currentTarget.hasPointerCapture(drag.pointerId)) {
      e.currentTarget.releasePointerCapture(drag.pointerId);
    }
  }

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
  };
}
