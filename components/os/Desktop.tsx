"use client";

import { LAUNCHERS, type LauncherId } from "@/lib/apps/registry";
import { DesktopIcon } from "@/components/os/desktop/DesktopIcon";

/** Organic free placement (per the interface spec), not a rigid grid. */
const POSITIONS: Record<LauncherId, { top: string; left: string }> = {
  about: { top: "10%", left: "5%" },
  experience: { top: "10%", left: "19%" },
  projects: { top: "40%", left: "6%" },
  skills: { top: "40%", left: "20%" },
  "how-i-work-with-ai": { top: "40%", left: "34%" },
  resume: { top: "70%", left: "6%" },
  contact: { top: "70%", left: "20%" },
};

export function Desktop() {
  return (
    <div className="absolute inset-0 z-[1] pt-9" aria-label="Desktop">
      {LAUNCHERS.map((launcher) => (
        <div
          key={launcher.id}
          className="absolute"
          style={POSITIONS[launcher.id]}
        >
          <DesktopIcon launcher={launcher} />
        </div>
      ))}
    </div>
  );
}
