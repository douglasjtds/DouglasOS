import {
  useRef,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import { onlyIcons, useDesktopStore, type DesktopItemId } from "@/lib/store/desktopStore";
import { RECYCLE_BIN_ID, hitsBin } from "@/lib/store/recycleBin";
import type { DesktopIconId } from "@/lib/apps/registry";

/** Pixels of movement before a press is treated as a drag (not a click). */
const DRAG_THRESHOLD = 4;

interface DragSession {
  pointerId: number;
  startX: number;
  startY: number;
  /** The items that move together (the selection, if this icon is in it; the bin alone). */
  ids: DesktopItemId[];
  /** The element that takes pointer capture once the press becomes a drag. */
  element: Element;
  /** Removes the window listeners that watch the press until it's a drag. */
  stopWatching: () => void;
}

export interface IconDragHandlers {
  onPointerDown: (e: ReactPointerEvent) => void;
  onPointerMove: (e: ReactPointerEvent) => void;
  onPointerUp: (e: ReactPointerEvent) => void;
  onPointerCancel: (e: ReactPointerEvent) => void;
}

export interface IconDrag {
  handlers: IconDragHandlers;
  /**
   * True once the press passed the drag threshold — read by the icon's click
   * handler so a drop never also opens the app. Cleared on the next press.
   */
  wasDragged: RefObject<boolean>;
}

function viewport() {
  return { width: window.innerWidth, height: window.innerHeight };
}

/** Is the pointer over the Recycle Bin, on its current cell? */
function overBin(x: number, y: number) {
  return hitsBin({ x, y }, useDesktopStore.getState().binCell, viewport());
}

/**
 * Free-pixel pointer drag for a desktop icon with snap-on-release. Pressing
 * an icon that is part of a multi-selection drags the whole group (stage 6).
 * The live offset is published to `desktopStore.drag`, so every icon of the
 * group follows the pointer; on release the group either settles into the
 * nearest free cells (`moveIcons`, offsets kept) or — when the pointer is
 * over the Recycle Bin — is "deleted" (`trashIcons`: rescued straight back).
 *
 * The Recycle Bin uses the same hook: it always drags alone (it never joins
 * a selection group), never counts as "over the bin" and settles through
 * `moveBin`, so dragging the bin itself never triggers the rescue joke.
 *
 * The icon's own pointerdown (selection) runs first, since it bubbles up from
 * the child, so the group read here is already up to date. Ctrl/Cmd presses
 * only toggle the selection and never start a drag.
 */
export function useDesktopIconDrag(id: DesktopItemId): IconDrag {
  const isBin = id === RECYCLE_BIN_ID;
  const session = useRef<DragSession | null>(null);
  const wasDragged = useRef(false);

  function onPointerDown(e: ReactPointerEvent) {
    wasDragged.current = false;
    if (e.button !== 0 || e.ctrlKey || e.metaKey) return;
    const { selectedIds } = useDesktopStore.getState();
    const group = onlyIcons(selectedIds);
    session.current?.stopWatching();
    const pointerId = e.pointerId;
    // NB: capture is deferred to the first real move. Capturing here would
    // retarget the subsequent `click` to this wrapper, swallowing the icon's
    // open/download click. Until then, a window listener watches the press, so
    // a fast first move that already left the icon still starts the drag.
    const watch = (ev: PointerEvent) => {
      if (ev.pointerId === pointerId) move(ev.pointerId, ev.clientX, ev.clientY);
    };
    const stop = (ev: PointerEvent) => {
      if (ev.pointerId === pointerId) stopWatching();
    };
    function stopWatching() {
      window.removeEventListener("pointermove", watch);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    }
    window.addEventListener("pointermove", watch);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    session.current = {
      pointerId,
      startX: e.clientX,
      startY: e.clientY,
      ids: !isBin && group.includes(id) && group.length > 1 ? group : [id],
      element: e.currentTarget,
      stopWatching,
    };
  }

  function onPointerMove(e: ReactPointerEvent) {
    move(e.pointerId, e.clientX, e.clientY);
  }

  function move(pointerId: number, clientX: number, clientY: number) {
    const drag = session.current;
    if (!drag || pointerId !== drag.pointerId) return;
    const dx = clientX - drag.startX;
    const dy = clientY - drag.startY;
    if (!wasDragged.current && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      wasDragged.current = true;
      drag.stopWatching();
      // Only now capture, so a plain click never does — the press has become a drag.
      if (drag.element.isConnected) drag.element.setPointerCapture(pointerId);
    }
    if (wasDragged.current) {
      useDesktopStore.getState().setDrag({
        ids: drag.ids,
        dx,
        dy,
        overBin: !isBin && overBin(clientX, clientY),
      });
    }
  }

  function endDrag(e: ReactPointerEvent) {
    const drag = session.current;
    if (!drag || e.pointerId !== drag.pointerId) return;
    session.current = null;
    drag.stopWatching();
    if (e.currentTarget.hasPointerCapture(drag.pointerId)) {
      e.currentTarget.releasePointerCapture(drag.pointerId);
    }
    const store = useDesktopStore.getState();
    if (wasDragged.current) {
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      if (isBin) store.moveBin(dx, dy);
      else if (e.type === "pointerup" && overBin(e.clientX, e.clientY)) store.trashIcons(drag.ids);
      else store.moveIcons(onlyIcons(drag.ids), id as DesktopIconId, dx, dy);
    }
    store.setDrag(null);
  }

  return {
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    },
    wasDragged,
  };
}
