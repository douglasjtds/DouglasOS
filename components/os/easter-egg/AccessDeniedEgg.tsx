"use client";

import { useEffect, useId, useRef } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { WarningIcon } from "@/components/icons/SystemIcons";
import { TitleBarButton } from "@/components/os/window/WindowControls";
import type { EggProps } from "@/components/os/easter-egg/EasterEggPlayer";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { EGG_TIMING } from "@/lib/easterEgg";
import { DURATION } from "@/lib/motion";

const T = EGG_TIMING.accessDenied;

/**
 * Egg C: an "Access denied" warning box; half a second later mini Douglas's
 * sticky note ("NO!", signed) slaps onto it, and at 1.5s his scolding line
 * appears with CV / Contact buttons. The line lives in the box itself, so it
 * lands whether or not he's on the desktop — after "Not now" he stays gone
 * (the player's `say()` afterwards is a no-op then). Reduced motion: the
 * finished box, note already stuck. Same chrome as the shell's message boxes,
 * built by hand so a click outside it can leave (an AlertDialog can't).
 */
export function AccessDeniedEgg({ dismiss, act }: EggProps) {
  const t = useTranslations("easterEgg.accessDenied");
  const tw = useTranslations("window");
  const reduced = useReducedMotion();
  const ids = useId();
  const okRef = useRef<HTMLButtonElement>(null);

  const boxRef = useRef<HTMLDivElement>(null);

  // Focus the box first; the default OK button once it's visible.
  useEffect(() => {
    boxRef.current?.focus({ preventScroll: true });
    const timer = setTimeout(
      () => {
        if (document.activeElement === boxRef.current) okRef.current?.focus({ preventScroll: true });
      },
      reduced ? 0 : T.scold * 1000,
    );
    return () => clearTimeout(timer);
  }, [reduced]);

  const later = (delay: number) =>
    reduced
      ? {}
      : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay, duration: DURATION.slow } };

  return (
    // Transparent click-catcher (a click on it leaves, see EasterEggPlayer).
    <div data-easter-egg="access-denied" className="fixed inset-0 z-1400 flex items-center justify-center p-4">
      <motion.div
        ref={boxRef}
        tabIndex={-1}
        data-egg-keep
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`${ids}-title`}
        aria-describedby={`${ids}-text`}
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: DURATION.base }}
        className="relative flex w-[min(440px,calc(100vw-32px))] flex-col outline-none rounded-t-window border-x-[3px] border-b-[3px] border-window-frame bg-window-frame shadow-window"
      >
        <div className="flex h-titlebar items-center gap-1.5 rounded-t-window bg-titlebar-gradient px-1.5 pt-0.5">
          <h2 id={`${ids}-title`} className="min-w-0 flex-1 truncate pl-1 font-title text-title font-bold text-titlebar-text">
            {t("title")}
          </h2>
          <TitleBarButton glyph="close" aria-label={tw("close")} onClick={dismiss} />
        </div>
        <div className="flex flex-col gap-4 bg-button-face p-3 text-body text-text">
          <div className="flex items-start gap-3 pr-20 max-md:pr-16">
            <span className="shrink-0">
              <WarningIcon size={32} />
            </span>
            <p id={`${ids}-text`} className="pt-1">
              {t("text")}
            </p>
          </div>

          <motion.div {...later(T.scold)} data-egg-scold className="flex flex-col gap-3">
            <p>{t("scold")}</p>
            <div className="flex flex-wrap justify-end gap-1.5">
              <Button data-egg-action="contact" onClick={() => act({ kind: "openApp", app: "contact" })} className="max-md:h-touch-target">
                {t("contact")}
              </Button>
              <Button data-egg-action="cv" onClick={() => act({ kind: "downloadCv" })} className="max-md:h-touch-target">
                {t("cv")}
              </Button>
              <Button ref={okRef} variant="primary" data-egg-action="ok" onClick={dismiss} className="max-md:h-touch-target">
                {t("ok")}
              </Button>
            </div>
          </motion.div>
        </div>

        {/* mini Douglas's sticky note, slapped on the box's corner. */}
        <motion.div
          aria-hidden
          data-egg-note
          initial={reduced ? false : { opacity: 0, scale: 1.6, rotate: -18 }}
          animate={{ opacity: 1, scale: 1, rotate: -6 }}
          transition={{ delay: T.noteDelay, duration: T.noteDuration, ease: "easeOut" }}
          className="absolute -right-3 top-8 flex w-24 flex-col items-center gap-0.5 border border-hot bg-info px-2 py-2 shadow-menu max-md:w-20"
        >
          <span className="font-title text-heading-lg font-bold text-icon-error">{t("note")}</span>
          <span className="text-system text-text-muted">{t("signature")}</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
