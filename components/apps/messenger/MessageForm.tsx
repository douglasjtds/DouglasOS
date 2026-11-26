"use client";

import { useEffect, useId, useRef, useState, type MouseEvent } from "react";
import { useTranslations } from "next-intl";
import { Mail, MessageCircle } from "lucide-react";
import {
  MAX_MESSAGE_LENGTH,
  MAX_NAME_LENGTH,
  buildMessageLinks,
  cleanMessage,
} from "@/lib/messenger/links";
import { Button } from "@/components/ui/button";
import { GroupBox } from "@/components/ui/group-box";

export interface MessageFormProps {
  /** The visitor followed one of the links (their app takes it from here). */
  onSent: (channel: "email" | "whatsapp", message: string) => void;
  onCancel: () => void;
}

/**
 * "Leave a message": name (optional) + message, sent for real through the
 * visitor's own mail app (`mailto:`) or WhatsApp (`wa.me`), pre-filled and
 * encoded by the pure builders in `lib/messenger/links.ts`. No backend: the
 * page never sends anything itself.
 */
export function MessageForm({ onSent, onCancel }: MessageFormProps) {
  const t = useTranslations("messenger.form");
  const ids = useId();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const messageField = useRef<HTMLTextAreaElement>(null);

  // Opening the form is always a visitor action: put them in the message field.
  useEffect(() => {
    messageField.current?.focus();
  }, []);

  const trimmedName = name.trim();
  const ready = cleanMessage(message) !== "";
  const links = buildMessageLinks({
    subject: trimmedName ? t("subjectNamed", { name: trimmedName }) : t("subject"),
    message,
    frame: (text) => (trimmedName ? t("bodyNamed", { message: text, name: trimmedName }) : t("body", { message: text })),
  });

  function follow(channel: "email" | "whatsapp") {
    return (e: MouseEvent<HTMLAnchorElement>) => {
      if (!ready) {
        e.preventDefault();
        messageField.current?.focus();
        return;
      }
      onSent(channel, cleanMessage(message));
    };
  }

  return (
    <section aria-labelledby={`${ids}-title`} data-messenger-form className="bg-button-face">
      <GroupBox title={<span id={`${ids}-title`}>{t("title")}</span>}>
        <div className="flex flex-col gap-1.5">
          <p className="text-system text-text-muted">{t("intro")}</p>
          <label htmlFor={`${ids}-name`} className="text-system text-text">
            {t("name")}
          </label>
          <input
            id={`${ids}-name`}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={MAX_NAME_LENGTH}
            autoComplete="name"
            data-messenger-form-name
            className="h-push-button-h border border-field-border bg-surface px-1.5 text-body text-text focus-light max-md:h-touch-target max-md:text-heading max-md:font-normal"
          />
          <div className="flex items-baseline justify-between">
            <label htmlFor={`${ids}-message`} className="text-system text-text">
              {t("message")}
            </label>
            <span aria-hidden className="text-system text-text-muted">
              {t("counter", { count: message.length, max: MAX_MESSAGE_LENGTH })}
            </span>
          </div>
          <textarea
            ref={messageField}
            id={`${ids}-message`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={MAX_MESSAGE_LENGTH}
            rows={4}
            required
            data-messenger-form-message
            className="resize-none border border-field-border bg-surface px-1.5 py-1 text-body text-text focus-light max-md:text-heading max-md:font-normal"
          />
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Button asChild variant="primary" className="max-md:h-touch-target">
              <a
                href={links.mailto}
                data-messenger-send-via="email"
                aria-disabled={!ready}
                onClick={follow("email")}
              >
                <Mail aria-hidden className="size-4" />
                {t("sendEmail")}
              </a>
            </Button>
            <Button asChild className="max-md:h-touch-target">
              <a
                href={links.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                data-messenger-send-via="whatsapp"
                aria-disabled={!ready}
                onClick={follow("whatsapp")}
              >
                <MessageCircle aria-hidden className="size-4" />
                {t("sendWhatsapp")}
              </a>
            </Button>
            <Button type="button" onClick={onCancel} className="ml-auto max-md:h-touch-target">
              {t("cancel")}
            </Button>
          </div>
        </div>
      </GroupBox>
    </section>
  );
}
