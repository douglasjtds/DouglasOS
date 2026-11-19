"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useShellStore } from "@/lib/store/shellStore";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { DURATION } from "@/lib/motion";
import { InfoIcon } from "@/components/icons/SystemIcons";

/** sessionStorage flag: the welcome balloon already showed this session. */
export const WELCOMED_KEY = "douglasos-welcomed";
/** Auto-dismiss delay (paused while hovered or focused). */
export const BALLOON_MS = 8000;

function alreadyWelcomed(): boolean {
  try {
    return sessionStorage.getItem(WELCOMED_KEY) === "1";
  } catch {
    return true; // No storage → don't risk nagging on every load.
  }
}

/**
 * First-logon tray balloon (DESKTOP-INTERFACE-SPEC §7): once per session,
 * points at the taskbar, never steals focus, auto-dismisses after ~8s unless
 * hovered/focused. Polite live region.
 */
export function WelcomeBalloon() {
  const t = useTranslations("balloon");
  const phase = useShellStore((s) => s.phase);
  const reduced = useReducedMotion();
  const [eligible] = useState(() => !alreadyWelcomed());
  const [dismissed, setDismissed] = useState(false);
  const [paused, setPaused] = useState(false);
  const visible = eligible && !dismissed && phase === "desktop";

  useEffect(() => {
    if (!visible) return;
    try {
      sessionStorage.setItem(WELCOMED_KEY, "1");
    } catch {
      // Non-fatal.
    }
  }, [visible]);

  useEffect(() => {
    if (!visible || paused) return;
    const timer = setTimeout(() => setDismissed(true), BALLOON_MS);
    return () => clearTimeout(timer);
  }, [visible, paused]);

  if (!visible) return null;

  return (
    <motion.div
      role="status"
      aria-live="polite"
      data-balloon="welcome"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduced ? DURATION.instant : DURATION.base }}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="absolute bottom-[calc(var(--spacing-taskbar)+10px)] right-2 z-1300 w-72 rounded-balloon border border-info-border bg-info p-2.5 text-system text-text shadow-balloon"
    >
      <div className="mb-1 flex items-center gap-1.5">
        <InfoIcon size={16} />
        <p className="flex-1 font-bold">{t("title")}</p>
        <button
          type="button"
          aria-label={t("close")}
          onClick={() => setDismissed(true)}
          className="flex size-icon-small items-center justify-center rounded-control border border-bevel-shadow text-text hover:bg-surface focus-light"
        >
          <svg viewBox="0 0 10 10" className="size-2" aria-hidden>
            <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </button>
      </div>
      <p>{t("body")}</p>
      {/* Tail pointing down at the tray. */}
      <span
        aria-hidden
        className="absolute -bottom-[7px] right-10 size-3 rotate-45 border-b border-r border-info-border bg-info"
      />
    </motion.div>
  );
}
