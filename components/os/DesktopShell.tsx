"use client";

import { MotionConfig } from "framer-motion";
import { Desktop } from "@/components/os/Desktop";
import { WindowManager } from "@/components/os/WindowManager";
import { Taskbar } from "@/components/os/taskbar/Taskbar";
import { WelcomeBalloon } from "@/components/os/taskbar/WelcomeBalloon";
import { ShellDialogs } from "@/components/os/ShellDialogs";
import { SessionScreens } from "@/components/os/session/SessionScreens";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useShellStore } from "@/lib/store/shellStore";
import { useShellShortcuts } from "@/hooks/useShellShortcuts";

/**
 * Top-level interactive island (≥ 768px): desktop (wallpaper + icons),
 * windows, taskbar and balloons, with the session screens (boot / logon /
 * shutdown) layered above. The desktop is `inert` while a session screen is
 * up so focus and screen readers stay on that screen.
 */
export function DesktopShell() {
  const phase = useShellStore((s) => s.phase);
  useShellShortcuts();

  return (
    // reducedMotion="user" turns transform animations off for visitors who
    // prefer reduced motion; components also pick instant durations.
    <MotionConfig reducedMotion="user">
      <TooltipProvider>
        <div
          data-shell
          inert={phase !== "desktop"}
          className="relative h-dvh w-screen overflow-hidden bg-desktop"
        >
          <Desktop />
          <WindowManager />
          <Taskbar />
          <WelcomeBalloon />
        </div>
        <ShellDialogs />
        <SessionScreens />
      </TooltipProvider>
    </MotionConfig>
  );
}
