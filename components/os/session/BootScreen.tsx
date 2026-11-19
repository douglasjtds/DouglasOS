"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useShellStore } from "@/lib/store/shellStore";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { BOOT_MARQUEE_S, EASE } from "@/lib/motion";
import { DouglasOSLogo } from "@/components/icons/SystemIcons";
import { Wordmark } from "@/components/os/session/Wordmark";

/** Boot length: ~2s with motion, much shorter with the static label. */
export const BOOT_MS = 2000;
export const BOOT_REDUCED_MS = 600;

/** Three blue blocks sliding through a rounded track, looping. */
function ProgressMarquee() {
  return (
    <div
      aria-hidden
      className="relative h-4 w-40 overflow-hidden rounded-button border-2 border-boot-track p-0.5"
    >
      <motion.div
        className="flex h-full gap-0.5"
        initial={{ x: "-40%" }}
        animate={{ x: "300%" }}
        transition={{ duration: BOOT_MARQUEE_S, ease: EASE.linear, repeat: Infinity }}
      >
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-full w-2 bg-boot-block-gradient" />
        ))}
      </motion.div>
    </div>
  );
}

/**
 * DouglasOS boot (DESKTOP-INTERFACE-SPEC §1): logo + wordmark + progress, then
 * the logon screen. Skip (button, Esc, Enter or any click) jumps past logon
 * straight to the desktop. Plays once per session (see shellStore).
 */
export function BootScreen() {
  const t = useTranslations("boot");
  const reduced = useReducedMotion();
  const finishBoot = useShellStore((s) => s.finishBoot);
  const skipToDesktop = useShellStore((s) => s.skipToDesktop);
  const skipRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    skipRef.current?.focus();
    const timer = setTimeout(finishBoot, reduced ? BOOT_REDUCED_MS : BOOT_MS);
    return () => clearTimeout(timer);
  }, [finishBoot, reduced]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" || e.key === "Enter") {
        e.preventDefault();
        skipToDesktop();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [skipToDesktop]);

  return (
    <div
      data-testid="boot-screen"
      onClick={skipToDesktop}
      className="fixed inset-0 z-2000 flex cursor-default flex-col items-center justify-center gap-8 bg-boot-bg"
    >
      <div className="flex items-center gap-4">
        <DouglasOSLogo size={72} />
        <Wordmark />
      </div>
      {reduced ? (
        <p role="status" className="text-body text-text-inverse">
          {t("starting")}
        </p>
      ) : (
        <>
          <ProgressMarquee />
          <span role="status" className="sr-only">
            {t("starting")}
          </span>
        </>
      )}
      <div className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-3">
        <button
          ref={skipRef}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            skipToDesktop();
          }}
          className="rounded-button border border-boot-track px-3 py-0.5 text-system text-text-inverse hover:bg-text-inverse/10 focus-inverse"
        >
          {t("skip")}
        </button>
        <p className="text-system text-boot-track">{t("tagline")}</p>
      </div>
    </div>
  );
}
