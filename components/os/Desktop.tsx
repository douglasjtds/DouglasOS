"use client";

import { LAUNCHERS } from "@/lib/apps/registry";
import { DraggableIcon } from "@/components/os/desktop/DraggableIcon";

export function Desktop() {
  return (
    <div className="absolute inset-0 z-[1]" aria-label="Desktop">
      {LAUNCHERS.map((launcher) => (
        <DraggableIcon key={launcher.id} launcher={launcher} />
      ))}
    </div>
  );
}
