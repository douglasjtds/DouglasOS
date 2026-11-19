"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useMessengerStore } from "@/lib/store/messengerStore";
import { useWindowStore } from "@/lib/store/windowStore";
import { greetingReply, typingDelayMs } from "@/lib/messenger/engine";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { ContactList } from "@/components/apps/messenger/ContactList";
import { Conversation } from "@/components/apps/messenger/Conversation";

/** The Messenger window is in front (focused and not minimized). */
function useInFront(): boolean {
  return useWindowStore((s) => s.focusedId === "messenger" && !s.windows.messenger?.minimized);
}

/**
 * Paces Douglas's lines: shows "Douglas is typing…" for a time proportional
 * to the line's length (capped; instant under reduced motion), then delivers
 * it. Lines whose copy is still an empty TODO are skipped. Runs as long as
 * the window is mounted (also minimized, which counts the line as unread).
 */
function useDelivery(unseen: boolean) {
  const t = useTranslations();
  const reduced = useReducedMotion();
  const head = useMessengerStore((s) => s.pending[0]);
  const unseenRef = useRef(unseen);
  useEffect(() => {
    unseenRef.current = unseen;
  }, [unseen]);

  useEffect(() => {
    if (!head) return;
    const store = useMessengerStore.getState();
    const raw = head.textKey ? t.raw(head.textKey) : "";
    if (typeof raw !== "string" || raw.trim() === "") {
      store.deliverNext({ skip: true });
      return;
    }
    const delay = typingDelayMs(t(head.textKey, head.values).length, { reducedMotion: reduced });
    if (delay > 0) store.setTyping(true);
    const timer = setTimeout(
      () => useMessengerStore.getState().deliverNext({ unread: unseenRef.current }),
      delay,
    );
    return () => {
      clearTimeout(timer);
      useMessengerStore.getState().setTyping(false);
    };
  }, [head, reduced, t]);
}

/**
 * DouglasOS Messenger (DESKTOP-INTERFACE-SPEC §14): a scripted chat with
 * Douglas in one window with two views — the contact list and the
 * conversation. Scripted end to end (no LLM, no network); the only thing that
 * leaves the page is the visitor's own message, through their mail app or
 * WhatsApp.
 */
export default function MessengerApp() {
  const view = useMessengerStore((s) => s.view);
  const greeted = useMessengerStore((s) => s.greeted);
  const inFront = useInFront();
  const conversation = view === "conversation";
  useDelivery(!(inFront && conversation));

  // The opening lines play the first time the conversation shows (from the
  // contact list, the tray icon or the toast).
  useEffect(() => {
    if (!conversation || greeted) return;
    const store = useMessengerStore.getState();
    if (store.openConversation()) store.queueReply(greetingReply());
  }, [conversation, greeted]);

  // Reading the conversation clears the unread badge.
  const unread = useMessengerStore((s) => s.unread);
  useEffect(() => {
    if (inFront && conversation && unread > 0) useMessengerStore.getState().markRead();
  }, [inFront, conversation, unread]);

  return conversation ? <Conversation /> : <ContactList />;
}
