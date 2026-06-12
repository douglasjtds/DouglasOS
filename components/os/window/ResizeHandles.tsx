"use client";

import { useResize } from "@/hooks/useResize";
import type { AppId } from "@/lib/apps/registry";
import type { Edge } from "@/lib/store/geometry";

/**
 * Eight invisible grab zones around a window frame — four edge strips plus four
 * corner squares — that drive `useResize`. Corners are listed last so they
 * stack above the edge strips and win the diagonal cursor at the intersections.
 * Rendered nothing while maximized (resize is disabled, like dragging).
 */
const HANDLES: { edge: Edge; className: string }[] = [
  { edge: "n", className: "inset-x-0 top-0 h-2 cursor-ns-resize" },
  { edge: "s", className: "inset-x-0 bottom-0 h-2 cursor-ns-resize" },
  { edge: "w", className: "inset-y-0 left-0 w-2 cursor-ew-resize" },
  { edge: "e", className: "inset-y-0 right-0 w-2 cursor-ew-resize" },
  { edge: "nw", className: "top-0 left-0 h-3 w-3 cursor-nwse-resize" },
  { edge: "ne", className: "top-0 right-0 h-3 w-3 cursor-nesw-resize" },
  { edge: "sw", className: "bottom-0 left-0 h-3 w-3 cursor-nesw-resize" },
  { edge: "se", className: "bottom-0 right-0 h-3 w-3 cursor-nwse-resize" },
];

export function ResizeHandles({
  id,
  maximized,
}: {
  id: AppId;
  maximized: boolean;
}) {
  const handlersFor = useResize(id, maximized);
  if (maximized) return null;

  return (
    <>
      {HANDLES.map(({ edge, className }) => (
        <div
          key={edge}
          {...handlersFor(edge)}
          data-no-drag
          aria-hidden
          className={`absolute z-10 touch-none ${className}`}
        />
      ))}
    </>
  );
}
