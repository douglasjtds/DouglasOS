"use client";

import { LAUNCHERS } from "@/lib/apps/registry";
import { DraggableIcon } from "@/components/os/desktop/DraggableIcon";
import { AmbientBackground } from "@/components/os/desktop/AmbientBackground";

export function Desktop() {
  return (
    <div className="absolute inset-0 z-[1]" aria-label="Desktop">
      {/* Wallpaper: layered radial glows over base-0 — depth without noise. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_-10%,rgb(0_217_255/0.07),transparent),radial-gradient(ellipse_55%_45%_at_85%_110%,rgb(124_58_237/0.08),transparent),radial-gradient(ellipse_45%_40%_at_10%_95%,rgb(0_217_255/0.05),transparent)]"
      />
      <AmbientBackground />
      {LAUNCHERS.map((launcher) => (
        <DraggableIcon key={launcher.id} launcher={launcher} />
      ))}
    </div>
  );
}
