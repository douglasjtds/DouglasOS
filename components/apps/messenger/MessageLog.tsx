"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useMessengerStore, type ChatMessage } from "@/lib/store/messengerStore";
import { actionId, actionLabel, type MessengerAction } from "@/lib/messenger/engine";
import { MessageText } from "@/components/apps/messenger/MessageText";
import { runMessengerAction } from "@/components/apps/messenger/shell";

function ActionButtons({ actions }: { actions: readonly MessengerAction[] }) {
  const t = useTranslations();
  return (
    <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 max-md:flex-col">
      {actions.map((action) => {
        const label = actionLabel(action);
        return (
          <li key={actionId(action)}>
            <button
              type="button"
              data-messenger-action={actionId(action)}
              onClick={() => runMessengerAction(action)}
              className="inline-flex items-center gap-1.5 rounded-button px-0.5 text-left text-link underline focus-light max-md:min-h-touch-target"
            >
              <span aria-hidden className="size-2 shrink-0 rounded-full border border-icon-info bg-icon-info/70" />
              {t(label.key, label.values)}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function Message({ message }: { message: ChatMessage }) {
  const t = useTranslations();
  if (message.from === "system") {
    return (
      <li data-messenger-message="system" className="py-1 text-system text-text-muted italic">
        {t(message.textKey)}
      </li>
    );
  }
  const douglas = message.from === "douglas";
  const text = douglas
    ? t(message.textKey, message.values)
    : (message.text ?? (message.textKey ? t(message.textKey) : ""));
  return (
    <li data-messenger-message={message.from} className="py-1">
      <p className={douglas ? "text-system text-startmenu-right-text" : "text-system text-text-muted"}>
        {t(douglas ? "messenger.conversation.douglasSays" : "messenger.conversation.youSay")}
      </p>
      <div className="pl-3 text-body break-words whitespace-pre-wrap text-text">
        <MessageText text={text} />
        {douglas && message.actions && message.actions.length > 0 && <ActionButtons actions={message.actions} />}
      </div>
    </li>
  );
}

/**
 * The conversation history: a `role="log"` list (polite live region, so new
 * lines are announced without stealing focus), "Douglas says:" / "You say:"
 * headers, and the buttons under Douglas's lines. Keeps the newest line in
 * view.
 */
export function MessageLog() {
  const t = useTranslations("messenger.conversation");
  const messages = useMessengerStore((s) => s.messages);
  const typing = useMessengerStore((s) => s.typing);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, typing]);

  return (
    <div
      ref={scroller}
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain border border-field-border bg-surface px-2.5 py-1.5"
    >
      <ol role="log" aria-live="polite" aria-label={t("logLabel")} data-messenger-log>
        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}
      </ol>
    </div>
  );
}
