"use client";

import { MotionConfig } from "framer-motion";
import { Desktop } from "@/components/os/Desktop";
import { WindowManager } from "@/components/os/WindowManager";
import { Taskbar } from "@/components/os/taskbar/Taskbar";
import { WelcomeBalloon } from "@/components/os/taskbar/WelcomeBalloon";
import { MessengerToast } from "@/components/os/taskbar/MessengerToast";
import { LazyAssistant } from "@/components/os/assistant/LazyAssistant";
import { LazyTrashNotice } from "@/components/os/desktop/LazyTrashNotice";
import { ShellDialogs } from "@/components/os/ShellDialogs";
import { SessionScreens } from "@/components/os/session/SessionScreens";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useShellStore } from "@/lib/store/shellStore";
import { useShellShortcuts } from "@/hooks/useShellShortcuts";

/**
 * Top-level interactive island: desktop (wallpaper + icons), windows, the
 * mini Douglas assistant, taskbar and balloons (incl. the Recycle Bin's
 * rescue balloon, stage 6), with the session screens
 * (boot / logon / shutdown) layered above. The desktop is `inert` while a session screen is up so focus and
 * screen readers stay on that screen. The same tree serves phones (< 768px);
 * `touch-manipulation` removes the double-tap-zoom delay so a single tap opens.
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
          className="relative h-dvh w-full touch-manipulation overflow-clip bg-desktop"
        >
          <Desktop />
          <WindowManager />
          <LazyAssistant />
          <Taskbar />
          <WelcomeBalloon />
          <MessengerToast />
          <LazyTrashNotice />
        </div>
        <ShellDialogs />
        <SessionScreens />
      </TooltipProvider>
    </MotionConfig>
  );
}
