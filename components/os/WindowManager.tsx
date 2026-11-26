"use client";

import { useWindowStore } from "@/lib/store/windowStore";
import { Window } from "@/components/os/Window";

/**
 * Renders every open window inside one isolated stacking layer (z 100 in the
 * layering policy), so the windows' own ever-growing z-indexes can never climb
 * above the taskbar or menus. Close is an instant unmount (no exit tween).
 */
export function WindowManager() {
  const order = useWindowStore((s) => s.order);

  return (
    <div
      data-windows-layer
      className="pointer-events-none absolute inset-x-0 top-0 bottom-taskbar isolate z-100"
    >
      {order.map((id) => (
        <Window key={id} id={id} />
      ))}
    </div>
  );
}
