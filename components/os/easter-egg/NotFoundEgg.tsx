"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { BlueScreen, blueScreenActionClass } from "@/components/os/easter-egg/BlueScreen";
import type { EggProps } from "@/components/os/easter-egg/EasterEggPlayer";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { EGG_TIMING } from "@/lib/easterEgg";

const T = EGG_TIMING.notFound;

/**
 * Egg A: the DouglasOS "404" blue screen over the whole shell (modal layer,
 * z-1400), fading in over 0.3s — no flash. The recovery options appear when
 * the fake search ends (~3s) and take focus; they are the CV, Contact and
 * the way back. Reduced motion: the finished screen at once.
 */
export function NotFoundEgg({ dismiss, act }: EggProps) {
  const t = useTranslations("easterEgg");
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const cvRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    rootRef.current?.focus({ preventScroll: true });
    const timer = setTimeout(
      () => {
        if (document.activeElement === rootRef.current) cvRef.current?.focus({ preventScroll: true });
      },
      reduced ? 0 : T.recovery * 1000,
    );
    return () => clearTimeout(timer);
  }, [reduced]);

  return (
    <motion.div
      ref={rootRef}
      role="alertdialog"
      aria-modal="true"
      aria-label={t("blueScreen.label")}
      tabIndex={-1}
      data-easter-egg="not-found"
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: T.fadeIn }}
      className="fixed inset-0 z-1400 overflow-auto outline-none"
    >
      <BlueScreen
        variant="egg"
        actions={
          <>
            <button ref={cvRef} type="button" data-egg-keep data-egg-action="cv" className={blueScreenActionClass} onClick={() => act({ kind: "downloadCv" })}>
              {t("blueScreen.cv")}
            </button>
            <button type="button" data-egg-keep data-egg-action="contact" className={blueScreenActionClass} onClick={() => act({ kind: "openApp", app: "contact" })}>
              {t("blueScreen.contact")}
            </button>
            <button type="button" data-egg-keep data-egg-action="desktop" className={blueScreenActionClass} onClick={dismiss}>
              {t("blueScreen.desktop")}
            </button>
          </>
        }
        footer={<p className="opacity-80">{t("dismissHint")}</p>}
      />
    </motion.div>
  );
}
