"use client";

import { useRef, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { animate } from "framer-motion";
import { ArrowLeft, PencilLine } from "lucide-react";
import { useMessengerStore } from "@/lib/store/messengerStore";
import { useEasterEggStore } from "@/lib/store/easterEggStore";
import {
  MESSENGER_TIMING,
  messageSentReply,
  nudgeReply,
  quickReplyTurn,
  replyToText,
  type QuickReplyId,
} from "@/lib/messenger/engine";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useKeyboardInset } from "@/hooks/useKeyboardInset";
import { UserAvatar, InfoIcon } from "@/components/icons/SystemIcons";
import { ContactIcon, ResumeIcon } from "@/components/icons/AppIcons";
import { Button } from "@/components/ui/button";
import { OnlineDot } from "@/components/apps/messenger/ContactList";
import { MessageText } from "@/components/apps/messenger/MessageText";
import { MessageLog } from "@/components/apps/messenger/MessageLog";
import { Composer } from "@/components/apps/messenger/Composer";
import { MessageForm } from "@/components/apps/messenger/MessageForm";
import { closeMessengerWindow, runMessengerAction } from "@/components/apps/messenger/shell";
import { cn } from "@/lib/utils";

/** Nudge shake keyframes (px): a quick decaying side-to-side wobble. */
const SHAKE_X = [0, -9, 9, -7, 7, -4, 4, 0];

/**
 * The conversation view: header (Douglas, status, CV + Contact one click
 * away), the automatic-replies notice, the log, "Douglas is typing…", the
 * suggested replies and the composer — or the "leave a message" form in place
 * of the last two.
 */
export function Conversation() {
  const t = useTranslations("messenger");
  const reduced = useReducedMotion();
  const mobile = useIsMobile();
  const root = useRef<HTMLDivElement>(null);
  const keyboardInset = useKeyboardInset(mobile, root);
  const typing = useMessengerStore((s) => s.typing);
  const quickReplies = useMessengerStore((s) => s.quickReplies);
  const formOpen = useMessengerStore((s) => s.formOpen);

  function focusComposer() {
    requestAnimationFrame(() => root.current?.querySelector<HTMLElement>("[data-messenger-input]")?.focus());
  }

  function send(text: string) {
    const reply = replyToText(text);
    if (!reply) return;
    const store = useMessengerStore.getState();
    store.postVisitor({ text });
    store.setDraft("");
    store.queueReply(reply);
  }

  function pickQuickReply(id: QuickReplyId) {
    const turn = quickReplyTurn(id);
    const store = useMessengerStore.getState();
    store.postVisitor({ textKey: turn.sayKey });
    if (turn.effect) runMessengerAction(turn.effect);
    store.queueReply(turn.reply);
  }

  function nudge() {
    const store = useMessengerStore.getState();
    if (!store.nudge(Date.now())) {
      store.postSystem("messenger.conversation.nudgeTooSoon");
      return;
    }
    store.postSystem("messenger.conversation.nudgeSent");
    useEasterEggStore.getState().discover("messenger-nudge");
    // The window shakes (~0.5s); under reduced motion the notice alone marks it.
    const frame = root.current?.closest<HTMLElement>("[data-window]");
    if (frame && !reduced) {
      animate(frame, { x: mobile ? SHAKE_X.map((x) => x / 2) : SHAKE_X }, { duration: MESSENGER_TIMING.shakeSeconds });
    }
    store.queueReply(nudgeReply(useMessengerStore.getState().nudges - 1));
  }

  function onSent(channel: "email" | "whatsapp", message: string) {
    const store = useMessengerStore.getState();
    store.closeForm();
    store.postVisitor({ text: message });
    store.queueReply(messageSentReply(channel));
    focusComposer();
  }

  function cancelForm() {
    useMessengerStore.getState().closeForm();
    focusComposer();
  }

  // Esc: closes the form first; from the composer it closes the window (the
  // shell's own Esc-closes-window is off while typing). Elsewhere the shell
  // handles it as usual.
  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Escape" || e.defaultPrevented || e.ctrlKey || e.altKey || e.metaKey) return;
    if (formOpen) {
      e.preventDefault();
      e.stopPropagation();
      cancelForm();
      return;
    }
    if ((e.target as HTMLElement).matches("[data-messenger-input]")) {
      e.preventDefault();
      e.stopPropagation();
      closeMessengerWindow();
    }
  }

  return (
    <div
      ref={root}
      data-messenger-view="conversation"
      onKeyDown={onKeyDown}
      style={keyboardInset ? { paddingBottom: keyboardInset } : undefined}
      className="flex min-h-0 flex-1 flex-col"
    >
      <header className="flex items-center gap-2 border-b border-startmenu-right-border bg-startmenu-right px-2 py-1.5">
        <button
          type="button"
          data-messenger-back
          onClick={() => useMessengerStore.getState().showContacts()}
          aria-label={t("conversation.back")}
          className="flex h-push-button-h items-center gap-1 rounded-button px-1 text-system text-startmenu-right-text hover:bg-surface focus-light max-md:size-touch-target max-md:justify-center"
        >
          <ArrowLeft aria-hidden className="size-4" />
          <span className="max-md:sr-only">{t("conversation.back")}</span>
        </button>
        <span className="relative shrink-0">
          <UserAvatar size={mobile ? 32 : 36} />
          <OnlineDot className="absolute -right-0.5 -bottom-0.5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-body font-bold text-startmenu-right-text">
            {t("contacts.douglas")} <span className="font-normal text-text-muted">({t("contacts.status")})</span>
          </h3>
          <p className="truncate text-system text-text-muted italic max-md:hidden">
            <MessageText text={t("contacts.personalMessage")} />
          </p>
        </div>
        {/* Golden rule: CV and Contact one click away inside the chat. */}
        <div role="group" aria-label={t("conversation.toolbar")} className="flex shrink-0 gap-1">
          <Button
            data-messenger-shortcut="cv"
            onClick={() => runMessengerAction({ kind: "downloadCv" })}
            className="min-w-0 px-1.5 max-md:h-touch-target"
          >
            <ResumeIcon size={16} />
            <span>{t("conversation.downloadCv")}</span>
          </Button>
          <Button
            data-messenger-shortcut="contact"
            onClick={() => runMessengerAction({ kind: "openApp", app: "contact" })}
            className="min-w-0 px-1.5 max-md:h-touch-target"
          >
            <ContactIcon size={16} />
            <span className="max-md:sr-only">{t("conversation.contact")}</span>
          </Button>
        </div>
      </header>

      <p data-messenger-disclaimer className="flex items-center gap-1.5 border-b border-groupbox-border bg-surface-muted px-2.5 py-1 text-system text-text-muted">
        <InfoIcon size={16} />
        <span>{t("conversation.disclaimer")}</span>
      </p>

      <div className="flex min-h-0 flex-1 flex-col gap-1 p-1 max-md:p-0.5">
        <MessageLog />
        <p data-messenger-typing aria-hidden={!typing} className={cn("flex h-4 items-center gap-1 px-1 text-system text-text-muted", !typing && "invisible")}>
          <PencilLine aria-hidden className="size-3" />
          {t("conversation.typing")}
        </p>

        {formOpen ? (
          <MessageForm onSent={onSent} onCancel={cancelForm} />
        ) : (
          <>
            {quickReplies.length > 0 && (
              <div
                role="group"
                aria-label={t("conversation.quickReplies")}
                data-messenger-quick-replies
                className="flex flex-wrap gap-1 max-md:-mx-0.5 max-md:flex-nowrap max-md:overflow-x-auto max-md:px-0.5 max-md:pb-0.5"
              >
                {quickReplies.map((id) => (
                  <button
                    key={id}
                    type="button"
                    data-quick-reply={id}
                    onClick={() => pickQuickReply(id)}
                    className="shrink-0 rounded-full border border-field-border bg-surface px-2.5 py-0.5 text-system text-link hover:border-hot hover:bg-hot-light focus-light max-md:min-h-touch-target max-md:py-0"
                  >
                    {t(`quickReplies.${id}.label`)}
                  </button>
                ))}
              </div>
            )}
            <Composer onSend={send} onNudge={nudge} autoFocus={!mobile} />
          </>
        )}
      </div>
    </div>
  );
}
