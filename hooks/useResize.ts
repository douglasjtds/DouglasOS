import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import { useWindowStore } from "@/lib/store/windowStore";
import type { AppId } from "@/lib/apps/registry";
import type { Edge, Rect } from "@/lib/store/geometry";
import type { DragHandlers } from "@/hooks/useDrag";

interface ResizeSession {
  pointerId: number;
  edge: Edge;
  startX: number;
  startY: number;
  /** Window rect captured when the resize began (the anchor for every move). */
  origin: Rect;
}

/**
 * Native pointer-event resize for a window's edge/corner handles. Mirrors
 * `useDrag`: it captures the pointer and writes the clamped rect straight into
 * the store on every move via `getState()`, so it never re-renders or goes
 * stale. One hook instance serves all eight handles — only one resize runs at a
 * time — returning a per-edge handler factory.
 */
export function useResize(
  id: AppId,
  disabled: boolean,
): (edge: Edge) => DragHandlers {
  const session = useRef<ResizeSession | null>(null);

  function makeHandlers(edge: Edge): DragHandlers {
    return {
      onPointerDown(e: ReactPointerEvent) {
        if (disabled || e.button !== 0) return;
        const { windows, focusWindow } = useWindowStore.getState();
        const instance = windows[id];
        if (!instance) return;

        focusWindow(id);
        session.current = {
          pointerId: e.pointerId,
          edge,
          startX: e.clientX,
          startY: e.clientY,
          origin: instance.rect,
        };
        e.currentTarget.setPointerCapture(e.pointerId);
      },

      onPointerMove(e: ReactPointerEvent) {
        const s = session.current;
        if (!s || e.pointerId !== s.pointerId) return;
        useWindowStore
          .getState()
          .resizeWindow(
            id,
            s.edge,
            s.origin,
            e.clientX - s.startX,
            e.clientY - s.startY,
          );
      },

      onPointerUp: endResize,
      onPointerCancel: endResize,
    };
  }

  function endResize(e: ReactPointerEvent) {
    const s = session.current;
    if (!s || e.pointerId !== s.pointerId) return;
    session.current = null;
    if (e.currentTarget.hasPointerCapture(s.pointerId)) {
      e.currentTarget.releasePointerCapture(s.pointerId);
    }
  }

  return makeHandlers;
}
