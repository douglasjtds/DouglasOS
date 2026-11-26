"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { animate, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { InfoIcon } from "@/components/icons/SystemIcons";
import type { EggProps } from "@/components/os/easter-egg/EasterEggPlayer";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useIsMobile } from "@/hooks/useIsMobile";
import { selectActiveBalloon, useBalloonStore } from "@/lib/store/balloonStore";
import { EGG_TIMING, scatterOffsets } from "@/lib/easterEgg";
import { DURATION, EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

const T = EGG_TIMING.scramble;
const BALLOON_WIDTH = 280;
/** How long the reduced-motion version dims the icons (ms): a still "blink", no movement. */
const REDUCED_DIM_MS = 600;

type Controls = ReturnType<typeof animate>;

/**
 * Egg B: the desktop "runs away" — every icon scatters to a random spot on
 * screen with a small tilt, holds, flies back, then the CV icon gives one
 * "look at me" pulse and a balloon next to it says the CV is still waiting
 * (≈4.2s). Purely visual: it animates the icons' own elements with
 * transforms and resets them, never `desktopStore`, so nothing is persisted
 * and the layout can't change. Reduced motion: the icons dim for a moment,
 * the balloon shows at once. The balloon takes the shared balloon slot.
 */
export function ScrambleEgg({ dismiss, act }: EggProps) {
  const t = useTranslations("easterEgg.scramble");
  const reduced = useReducedMotion();
  const mobile = useIsMobile();
  const [settled, setSettled] = useState(false);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const holdsSlot = useBalloonStore((s) => selectActiveBalloon(s) === "dontOpenThis");

  useEffect(() => {
    const icons = [...document.querySelectorAll<HTMLElement>("[data-desktop-icon]")];
    const cv = document.querySelector<HTMLElement>('[data-desktop-icon="resume"]');
    const running: Controls[] = [];
    const timers: ReturnType<typeof setTimeout>[] = [];
    let cancelled = false;

    const settle = () => {
      if (cancelled) return;
      setAnchor(cv?.getBoundingClientRect() ?? null);
      setSettled(true);
    };

    if (reduced) {
      for (const el of icons) el.style.opacity = "0.5";
      timers.push(
        setTimeout(() => {
          for (const el of icons) el.style.opacity = "";
        }, REDUCED_DIM_MS),
      );
      timers.push(setTimeout(settle, 0));
    } else {
      const bottom = document.querySelector("[data-taskbar]")?.getBoundingClientRect().top ?? window.innerHeight;
      const offsets = scatterOffsets(
        icons.map((el) => el.getBoundingClientRect()),
        { width: window.innerWidth, height: bottom },
      );
      const run = async () => {
        const out = icons.map((el, i) =>
          animate(el, { x: offsets[i].x, y: offsets[i].y, rotate: offsets[i].rotate }, { duration: T.scatter, ease: EASE.out }),
        );
        running.push(...out);
        await Promise.all(out);
        if (cancelled) return;
        await new Promise((r) => timers.push(setTimeout(r, T.hold * 1000)));
        if (cancelled) return;
        const back = icons.map((el) => animate(el, { x: 0, y: 0, rotate: 0 }, { duration: T.regroup, ease: EASE.out }));
        running.push(...back);
        await Promise.all(back);
        if (cancelled) return;
        for (const el of icons) el.style.transform = "";
        settle();
        if (cv) running.push(animate(cv, { scale: [1, 1.15, 1] }, { duration: T.pulse, ease: "easeInOut" }));
      };
      void run();
    }

    return () => {
      cancelled = true;
      for (const c of running) c.stop();
      for (const id of timers) clearTimeout(id);
      // Whatever frame we were on, every icon goes straight back.
      for (const el of icons) {
        el.style.transform = "";
        el.style.opacity = "";
      }
    };
  }, [reduced]);

  // The balloon queues for the shared slot once the desktop is back in place.
  useEffect(() => {
    if (!settled) return;
    const { request, release } = useBalloonStore.getState();
    request("dontOpenThis");
    const timer = setTimeout(dismiss, T.balloonAutoClose * 1000);
    return () => {
      clearTimeout(timer);
      release("dontOpenThis");
    };
  }, [settled, dismiss]);

  if (!settled || !holdsSlot) return <span data-easter-egg="scramble" hidden />;

  let style: CSSProperties | undefined;
  if (!mobile && anchor) {
    const left = Math.min(anchor.right + 8, window.innerWidth - BALLOON_WIDTH - 8);
    style = { left: Math.max(8, left), top: Math.max(8, anchor.top), width: BALLOON_WIDTH };
  }

  return (
    <motion.section
      data-easter-egg="scramble"
      data-egg-keep
      aria-labelledby="egg-scramble-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduced ? DURATION.instant : DURATION.base }}
      style={style}
      className={cn(
        "fixed z-1300 flex flex-col gap-2 border-info-border bg-info p-2.5 text-system text-text shadow-balloon",
        mobile ? "inset-x-0 bottom-taskbar rounded-t-balloon border-t p-3 px-safe" : "rounded-balloon border",
      )}
    >
      <div className="flex items-center gap-1.5">
        <InfoIcon size={16} />
        <h2 id="egg-scramble-title" className="flex-1 font-bold">
          {t("title")}
        </h2>
      </div>
      <p role="status" aria-live="polite">
        {t("text")}
      </p>
      <div className="flex flex-wrap justify-end gap-1.5">
        <Button variant="primary" data-egg-action="cv" onClick={() => act({ kind: "downloadCv" })} className="max-md:h-touch-target">
          {t("cv")}
        </Button>
        <Button data-egg-action="contact" onClick={() => act({ kind: "openApp", app: "contact" })} className="max-md:h-touch-target">
          {t("contact")}
        </Button>
        <Button data-egg-action="close" onClick={dismiss} className="max-md:h-touch-target">
          {t("close")}
        </Button>
      </div>
    </motion.section>
  );
}
