"use client";

import { LAUNCHERS } from "@/lib/apps/registry";
import { DockItem } from "@/components/os/dock/DockItem";

export function Dock() {
  return (
    <nav
      aria-label="Dock"
      className="fixed inset-x-0 bottom-3 z-[5000] flex justify-center"
    >
      <ul className="flex items-end gap-3 rounded-dock border border-white/[0.08] bg-glass-chrome px-3 py-2 shadow-dock backdrop-blur-glass-strong">
        {LAUNCHERS.map((launcher) => (
          <DockItem key={launcher.id} launcher={launcher} />
        ))}
      </ul>
    </nav>
  );
}
