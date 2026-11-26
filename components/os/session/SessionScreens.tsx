"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useShellStore } from "@/lib/store/shellStore";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { DURATION } from "@/lib/motion";
import { BootScreen } from "@/components/os/session/BootScreen";
import { LogonScreen } from "@/components/os/session/LogonScreen";
import { ShutdownScreen } from "@/components/os/session/ShutdownScreen";

/**
 * Full-screen session layers above everything (z 2000): boot, logon and
 * shutdown. Phase changes crossfade (`duration-slow`); instant under reduced
 * motion. The desktop renders underneath the whole time, so nothing waits.
 */
export function SessionScreens() {
  const phase = useShellStore((s) => s.phase);
  const reduced = useReducedMotion();
  const fade = { duration: reduced ? DURATION.instant : DURATION.slow };

  return (
    <AnimatePresence>
      {phase !== "desktop" && (
        <motion.div
          key={phase}
          initial={{ opacity: phase === "boot" ? 1 : 0 }}
          animate={{ opacity: 1, transition: fade }}
          // Never block clicks on the desktop while fading out.
          exit={{ opacity: 0, pointerEvents: "none", transition: fade }}
        >
          {phase === "boot" && <BootScreen />}
          {phase === "logon" && <LogonScreen />}
          {phase === "shutdown" && <ShutdownScreen />}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
