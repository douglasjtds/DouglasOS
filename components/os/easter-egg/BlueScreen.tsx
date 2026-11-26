"use client";

import { useEffect, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { DouglasOSLogo } from "@/components/icons/SystemIcons";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { EGG_TIMING } from "@/lib/easterEgg";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

const T = EGG_TIMING.notFound;

/** Recovery link/button look on the blue screen: white outline, inverts on hover. */
export const blueScreenActionClass = cn(
  "inline-flex min-h-touch-target items-center justify-center border border-text-inverse px-4 font-mono text-body text-text-inverse no-underline",
  "outline-none hover:bg-text-inverse hover:text-titlebar focus-visible:bg-text-inverse focus-visible:text-titlebar",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring-inverse",
);

/**
 * The DouglasOS "404" blue screen (stage 10): a parody of the era's crash
 * screen, but entirely our own — Luna title-bar blue from the tokens (never
 * the original screen's blue), DouglasOS wording about a missing page, no
 * frowning face, no QR code, no stop codes of the real thing.
 *
 * Two uses:
 * - `variant="egg"`: the first "DON'T OPEN THIS.exe" egg. Lines fade in, the
 *   "search" bar fills, then the recovery options appear (≈3s; static under
 *   reduced motion). The caller makes it a full-screen overlay.
 * - `variant="page"`: the site's real 404 (`app/[locale]/not-found.tsx`).
 *   Everything is server-rendered and visible at once, so the recovery links
 *   work without waiting (or without JS); only the bar animates.
 *
 * `actions` are the recovery buttons (egg) or links (page).
 */
export function BlueScreen({
  variant,
  actions,
  footer,
}: {
  variant: "egg" | "page";
  actions: ReactNode;
  footer?: ReactNode;
}) {
  const t = useTranslations("easterEgg.blueScreen");
  const reduced = useReducedMotion();
  const egg = variant === "egg";
  const staticEntrance = !egg || reduced;

  const progress = useMotionValue(reduced ? 100 : 0);
  const percent = useTransform(progress, (v) => Math.round(v));
  const barScale = useTransform(progress, (v) => v / 100);

  useEffect(() => {
    if (reduced) {
      progress.set(100);
      return;
    }
    const controls = animate(progress, 100, {
      delay: T.progressStart,
      duration: T.progressEnd - T.progressStart,
      ease: EASE.linear,
    });
    return () => controls.stop();
  }, [progress, reduced]);

  /** Fade-in props for the n-th line of the egg (nothing on the page variant). */
  const line = (n: number) =>
    staticEntrance
      ? {}
      : {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { delay: T.fadeIn + n * T.lineStagger, duration: T.fadeIn },
        };

  const Heading = egg ? "h2" : "h1";

  return (
    <div
      data-blue-screen={variant}
      className="flex min-h-full w-full flex-col justify-center bg-titlebar px-6 py-10 font-mono text-text-inverse max-md:px-4"
    >
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 text-body">
        <motion.p {...line(0)} className="flex items-center gap-2 font-bold">
          <DouglasOSLogo size={24} />
          {t("brand")}
        </motion.p>
        <motion.div {...line(1)}>
          <Heading className="text-heading-lg">{t("headline")}</Heading>
        </motion.div>
        <motion.p {...line(2)} data-blue-screen-code className="font-bold">
          {t("code")}
        </motion.p>
        <motion.p {...line(3)}>{t(egg ? "causeEgg" : "causePage")}</motion.p>

        <motion.div {...line(4)} className="flex flex-col gap-2">
          <p>
            {t("progress")}: <motion.span data-blue-screen-percent>{percent}</motion.span>%
          </p>
          <div aria-hidden className="h-3 w-full max-w-sm border border-text-inverse p-px">
            <motion.div className="h-full origin-left bg-text-inverse" style={{ scaleX: barScale }} />
          </div>
        </motion.div>

        <motion.section
          aria-label={t("recovery")}
          data-blue-screen-recovery
          {...(staticEntrance
            ? {}
            : {
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                transition: { delay: T.recovery, duration: T.fadeIn },
              })}
          className="flex flex-col gap-3"
        >
          <p>{t("done")}</p>
          <div className="flex flex-wrap gap-2">{actions}</div>
        </motion.section>

        {footer}
      </div>
    </div>
  );
}
