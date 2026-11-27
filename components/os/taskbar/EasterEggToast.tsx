"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useShellStore } from "@/lib/store/shellStore";
import { useAssistantStore } from "@/lib/store/assistantStore";
import { selectActiveBalloon, useBalloonStore } from "@/lib/store/balloonStore";
import { useEasterEggStore } from "@/lib/store/easterEggStore";
import { EASTER_EGG_TOTAL, easterEggTitleKey, type EasterEggId } from "@/lib/easter-eggs/registry";
import { discoveryOrdinal } from "@/lib/easter-eggs/progress";
import { completionMessage, deliverCompletionReward } from "@/lib/easter-eggs/reward";
import { runShellAction } from "@/lib/assistant/actions";
import type { AssistantAction } from "@/lib/assistant/script";
import { launch } from "@/lib/apps/launch";
import { AssistantBubble } from "@/components/os/assistant/AssistantBubble";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { DURATION } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** Auto-dismiss delay of an egg toast (paused while hovered or focused). */
export const EASTER_EGG_TOAST_MS = 8000;

/**
 * Easter-egg tray toast (stage 11, DESKTOP-INTERFACE-SPEC → Easter eggs):
 * "🎉 Easter egg found! (n/14)" + the egg's title, one per discovery, in the
 * order they were found (`easterEggStore.pending`, persisted — so an egg
 * found on the real 404 page is announced here the next time the desktop
 * loads).
 *
 * Shares the single balloon slot as owner `easterEgg`, which **yields**: the
 * reaction to what the visitor did (rescue line, mini Douglas's bubble…)
 * shows first. It also waits while the Start menu or a shell dialog is open
 * (e.g. the `F2` message box that earned it) and while mini Douglas dances.
 * Polite live region, never takes focus, closes itself after 8s unless
 * hovered/focused; phones get a bottom sheet like the other balloons.
 *
 * After the last egg's toast comes the reward: mini Douglas's "all found"
 * line through `say()`, or — when he was dismissed — the same line in this
 * toast's own balloon.
 */
export function EasterEggToast() {
  const t = useTranslations();
  const head = useEasterEggStore((s) => s.pending[0] ?? null);
  const found = useEasterEggStore((s) => s.found);
  const acknowledge = useEasterEggStore((s) => s.acknowledge);
  const phase = useShellStore((s) => s.phase);
  const startOpen = useShellStore((s) => s.startMenuOpen);
  const dialogOpen = useShellStore((s) => s.dialog !== null);
  const assistantDismissed = useAssistantStore((s) => s.dismissed);
  const dancing = useAssistantStore((s) => s.state === "dancing" && !s.dismissed);
  const mobile = useIsMobile();
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false);

  const ready = phase === "desktop" && !startOpen && !dialogOpen && !dancing;

  // The reward goes to mini Douglas whenever he's around; he takes the slot
  // in his own turn, so this toast just hands it over.
  useEffect(() => {
    if (head !== "complete" || !ready || assistantDismissed) return;
    deliverCompletionReward();
    acknowledge("complete");
  }, [head, ready, assistantDismissed, acknowledge]);

  const wanted = head !== null && ready && (head !== "complete" || assistantDismissed);
  const holdsSlot = useBalloonStore((s) => selectActiveBalloon(s) === "easterEgg");
  const visible = wanted && holdsSlot;

  useEffect(() => {
    const { request, release } = useBalloonStore.getState();
    if (wanted) request("easterEgg");
    else release("easterEgg");
  }, [wanted]);
  useEffect(() => () => useBalloonStore.getState().release("easterEgg"), []);

  const close = useCallback(() => {
    setPaused(false);
    if (head !== null) acknowledge(head);
  }, [acknowledge, head]);

  // Egg toasts close themselves; the reward line waits for the visitor.
  useEffect(() => {
    if (!visible || paused || head === "complete") return;
    const timer = setTimeout(close, EASTER_EGG_TOAST_MS);
    return () => clearTimeout(timer);
  }, [visible, paused, head, close]);

  if (!visible || head === null) return null;

  if (head === "complete") {
    function onAction(action: AssistantAction) {
      if (action.kind === "nextTip" || action.kind === "dismiss") return;
      close();
      runShellAction(action);
    }
    return (
      <div className="pointer-events-none absolute inset-0 z-1300">
        <AssistantBubble
          source="easterEgg"
          message={completionMessage()}
          variant={mobile ? "sheet" : "balloon"}
          style={
            mobile
              ? undefined
              : { right: 8, bottom: "calc(var(--spacing-taskbar) + 10px)", width: 300, maxWidth: "calc(100% - 16px)" }
          }
          reducedMotion={reduced}
          onAction={onAction}
          onClose={close}
          onSearch={() => {}}
        />
      </div>
    );
  }

  return (
    <EggToast
      key={head}
      title={t("easterEggs.toast.title", { count: discoveryOrdinal(found, head), total: EASTER_EGG_TOTAL })}
      egg={head}
      eggTitle={t(easterEggTitleKey(head))}
      mobile={mobile}
      reduced={reduced}
      onPause={setPaused}
      onClose={close}
    />
  );
}

function EggToast({
  title,
  egg,
  eggTitle,
  mobile,
  reduced,
  onPause,
  onClose,
}: {
  title: string;
  egg: EasterEggId;
  eggTitle: string;
  mobile: boolean;
  reduced: boolean;
  onPause: (paused: boolean) => void;
  onClose: () => void;
}) {
  const t = useTranslations("easterEggs.toast");
  return (
    <motion.div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      data-balloon="easterEgg"
      data-easter-egg-toast={egg}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduced ? DURATION.instant : DURATION.base }}
      onPointerEnter={() => onPause(true)}
      onPointerLeave={() => onPause(false)}
      onFocus={() => onPause(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) onPause(false);
      }}
      className={cn(
        "absolute z-1300 border-info-border bg-info text-system text-text shadow-balloon",
        mobile
          ? "inset-x-0 bottom-taskbar rounded-t-balloon border-t px-safe"
          : "bottom-[calc(var(--spacing-taskbar)+10px)] right-2 w-72 max-w-[calc(100%-16px)] rounded-balloon border",
      )}
    >
      <div className={mobile ? "p-3" : "p-2.5"}>
        <div className="mb-1 flex items-center gap-1.5">
          <p className="flex-1 font-bold">{title}</p>
          <button
            type="button"
            aria-label={t("close")}
            onClick={onClose}
            className="relative flex size-icon-small items-center justify-center rounded-control border border-bevel-shadow text-text hover:bg-surface focus-light max-md:after:absolute max-md:after:-inset-3.5 max-md:after:content-['']"
          >
            <svg viewBox="0 0 10 10" className="size-2" aria-hidden>
              <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </button>
        </div>
        <p>{eggTitle}</p>
        <button
          type="button"
          data-easter-egg-open-achievements
          onClick={() => {
            onClose();
            launch("achievements");
          }}
          className="mt-1 text-link underline focus-light max-md:mt-0 max-md:min-h-touch-target"
        >
          {t("viewAll")}
        </button>
      </div>
      {!mobile && (
        <span
          aria-hidden
          className="absolute -bottom-[7px] right-10 size-3 rotate-45 border-b border-r border-info-border bg-info"
        />
      )}
    </motion.div>
  );
}
