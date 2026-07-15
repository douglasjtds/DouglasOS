"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMounted } from "@/hooks/useMounted";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const SESSION_KEY = "douglasos-booted";
const BOOT_MS = 2400;
const SKIP_AFTER_MS = 1000;

function markBooted() {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    // sessionStorage may be unavailable (private mode) — non-fatal.
  }
}

/**
 * Plays once per session: a centered wordmark + loading bar that fades into the
 * desktop. Skipped entirely on reduced-motion or if already booted this session.
 * No setState happens synchronously in an effect body — visibility is derived
 * and dismissal flips state from timers / the skip handler.
 */
export function BootScreen() {
  const mounted = useMounted();
  const reduced = useReducedMotion();
  const [dismissed, setDismissed] = useState(false);
  const [canSkip, setCanSkip] = useState(false);

  const shouldBoot = useMemo(() => {
    if (!mounted || reduced) return false;
    try {
      return sessionStorage.getItem(SESSION_KEY) !== "1";
    } catch {
      return false;
    }
  }, [mounted, reduced]);

  useEffect(() => {
    if (!shouldBoot) {
      markBooted();
      return;
    }
    const skipTimer = setTimeout(() => setCanSkip(true), SKIP_AFTER_MS);
    const doneTimer = setTimeout(() => {
      markBooted();
      setDismissed(true);
    }, BOOT_MS);
    return () => {
      clearTimeout(skipTimer);
      clearTimeout(doneTimer);
    };
  }, [shouldBoot]);

  function skip() {
    markBooted();
    setDismissed(true);
  }

  const visible = shouldBoot && !dismissed;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="boot"
          data-testid="boot-screen"
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-10 bg-base-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_45%,rgb(0_217_255/0.06),transparent)]"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.03,
            transition: { duration: 0.4, ease: "easeIn" },
          }}
        >
          <motion.p
            className="font-mono text-5xl font-bold tracking-tight"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-text-primary [text-shadow:0_0_24px_var(--color-accent-glow)]">
              Douglas
            </span>
            <span className="text-accent [text-shadow:0_0_24px_var(--color-accent-glow)]">
              OS
            </span>
          </motion.p>

          <div className="h-0.5 w-40 overflow-hidden rounded-full bg-base-3">
            <motion.div
              className="h-full w-1/3 rounded-full bg-accent shadow-glow-subtle"
              animate={{ x: ["-100%", "320%"] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          {canSkip && (
            <button
              type="button"
              onClick={skip}
              className="absolute bottom-10 font-mono text-xs text-text-muted transition-colors hover:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Skip →
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
