"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { launch } from "@/lib/apps/launch";
import { MESSENGER_TIMING } from "@/lib/messenger/types";
import { useMessengerStore } from "@/lib/store/messengerStore";
import { selectActiveBalloon, useBalloonStore } from "@/lib/store/balloonStore";
import { useShellStore } from "@/lib/store/shellStore";
import { useWindowStore } from "@/lib/store/windowStore";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { DURATION, EASE } from "@/lib/motion";
import { UserAvatar } from "@/components/icons/SystemIcons";
import { MessengerIcon } from "@/components/icons/MessengerIcons";
import { MessageText } from "@/components/apps/messenger/MessageText";

/** sessionStorage flag: the Messenger toast already showed this session. */
export const MESSENGER_TOAST_KEY = "douglasos-messenger-toast";

function alreadyToasted(): boolean {
  try {
    return sessionStorage.getItem(MESSENGER_TOAST_KEY) === "1";
  } catch {
    return true; // No storage → don't risk showing it on every load.
  }
}

/**
 * The Messenger toast (DESKTOP-INTERFACE-SPEC §14): "Douglas says: …" near
 * the tray, at most once per session, a while after the desktop appears.
 * Never steals focus (polite live region), closes itself after a few seconds
 * unless hovered/focused, and a click opens the conversation. It takes turns
 * with the welcome balloon and the mini Douglas bubble through the shared
 * balloon slot, and skips the session entirely once the visitor has opened
 * the Messenger on their own. On phones it waits while a (full-screen) window
 * is up, and it never shows over the Start menu.
 */
export function MessengerToast() {
  const t = useTranslations("messenger");
  const phase = useShellStore((s) => s.phase);
  const startOpen = useShellStore((s) => s.startMenuOpen);
  const mobile = useIsMobile();
  const reduced = useReducedMotion();
  const messengerOpen = useWindowStore((s) => s.order.includes("messenger"));
  const windowCount = useWindowStore((s) => s.order.length);
  const greeted = useMessengerStore((s) => s.greeted);
  const [eligible] = useState(() => !alreadyToasted());
  const [due, setDue] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [shown, setShown] = useState(false);
  const [paused, setPaused] = useState(false);

  const onDesktop = phase === "desktop";
  const blocked = startOpen || (mobile && windowCount > 0);
  // Opening the Messenger (any way) makes the invitation pointless; and once
  // shown, Start or a phone window taking over the screen ends it for good.
  // Adjusted during render, React's pattern for state that follows other state.
  if (!dismissed && (messengerOpen || greeted || (shown && blocked))) setDismissed(true);

  useEffect(() => {
    if (!eligible || !onDesktop || due) return;
    const delay = MESSENGER_TIMING.toastDelay[mobile ? "mobile" : "desktop"];
    const timer = setTimeout(() => setDue(true), delay);
    return () => clearTimeout(timer);
  }, [eligible, onDesktop, due, mobile]);

  const wanted = eligible && due && onDesktop && !dismissed && !blocked;
  const holdsSlot = useBalloonStore((s) => selectActiveBalloon(s) === "messenger");
  const visible = wanted && holdsSlot;
  if (visible && !shown) setShown(true);

  useEffect(() => {
    const { request, release } = useBalloonStore.getState();
    if (wanted) request("messenger");
    else release("messenger");
  }, [wanted]);
  useEffect(() => () => useBalloonStore.getState().release("messenger"), []);

  useEffect(() => {
    if (!visible) return;
    try {
      sessionStorage.setItem(MESSENGER_TOAST_KEY, "1");
    } catch {
      // Non-fatal.
    }
  }, [visible]);

  useEffect(() => {
    if (!visible || paused) return;
    const timer = setTimeout(() => setDismissed(true), MESSENGER_TIMING.toastAutoHide);
    return () => clearTimeout(timer);
  }, [visible, paused]);

  if (!visible) return null;

  function open() {
    setDismissed(true);
    useMessengerStore.getState().setView("conversation");
    launch("messenger");
  }

  return (
    <motion.div
      role="status"
      aria-live="polite"
      data-messenger-toast
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? DURATION.instant : DURATION.slow, ease: EASE.out }}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
      }}
      className="absolute right-2 bottom-[calc(var(--spacing-taskbar)+6px)] z-1300 w-64 max-w-[calc(100%-16px)] overflow-hidden rounded-t-window border border-window-frame bg-startmenu-right text-system text-text shadow-balloon"
    >
      <div className="flex h-5 items-center gap-1 bg-titlebar-gradient pl-1.5 pr-0.5 text-titlebar-text">
        <MessengerIcon size={14} />
        <p className="flex-1 truncate font-bold">{t("name")}</p>
        <button
          type="button"
          aria-label={t("toast.close")}
          onClick={() => setDismissed(true)}
          className="relative flex size-4 items-center justify-center rounded-control text-titlebar-text hover:bg-close-hover focus-inverse max-md:after:absolute max-md:after:-inset-3.5 max-md:after:content-['']"
        >
          <svg viewBox="0 0 10 10" className="size-2" aria-hidden>
            <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </button>
      </div>
      <button
        type="button"
        onClick={open}
        data-messenger-toast-open
        className="flex w-full items-start gap-2 p-2.5 text-left hover:bg-surface focus-light"
      >
        <UserAvatar size={32} />
        <span className="min-w-0">
          <span className="block font-bold text-startmenu-right-text">{t("toast.says")}</span>
          <span className="block text-text">
            <MessageText text={t("toast.text")} />
          </span>
        </span>
      </button>
    </motion.div>
  );
}
