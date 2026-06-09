"use client";

import { useEffect } from "react";
import { MotionConfig } from "framer-motion";
import { MenuBar } from "@/components/os/MenuBar";
import { Desktop } from "@/components/os/Desktop";
import { Dock } from "@/components/os/Dock";
import { WindowManager } from "@/components/os/WindowManager";
import { BootScreen } from "@/components/os/BootScreen";
import { useWindowStore } from "@/lib/store/windowStore";

/** Top-level interactive island: the persistent desktop chrome + windows. */
export function DesktopShell() {
  // Esc closes the focused window and returns focus to its dock launcher.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      const { focusedId, closeWindow } = useWindowStore.getState();
      if (!focusedId) return;
      e.preventDefault();
      closeWindow(focusedId);
      const launcher = document.querySelector<HTMLElement>(
        `[data-dock-app="${focusedId}"]`,
      );
      launcher?.focus();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    // reducedMotion="user" auto-disables transform/layout animations (window
    // scale, dock magnification) while keeping opacity — honoring the OS setting.
    <MotionConfig reducedMotion="user">
      <div className="relative h-dvh w-screen overflow-hidden bg-base-0">
        <MenuBar />
        <Desktop />
        <WindowManager />
        <Dock />
        <BootScreen />
      </div>
    </MotionConfig>
  );
}
