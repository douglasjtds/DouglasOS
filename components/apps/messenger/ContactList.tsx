"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { useMessengerStore } from "@/lib/store/messengerStore";
import { UserAvatar } from "@/components/icons/SystemIcons";
import { MessengerIcon } from "@/components/icons/MessengerIcons";
import { MessageText } from "@/components/apps/messenger/MessageText";

/** Small green "online" dot (status shown in text too, never by color alone). */
export function OnlineDot({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block size-2.5 shrink-0 rounded-full border border-surface bg-icon-success shadow-[0_0_0_1px_var(--color-icon-success)] ${className ?? ""}`}
    />
  );
}

/**
 * The contact list: one contact, Douglas, online, with his picture, status
 * and personal message. A click (tap) or Enter opens the conversation —
 * single click on purpose, like every icon on this desktop.
 */
export function ContactList() {
  const t = useTranslations("messenger");
  const unread = useMessengerStore((s) => s.unread);
  const statusId = useId();

  function open() {
    useMessengerStore.getState().setView("conversation");
  }

  return (
    <div data-messenger-view="contacts" className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-2 border-b border-startmenu-right-border bg-startmenu-right px-3 py-2">
        <MessengerIcon size={32} />
        <div className="min-w-0">
          <h3 className="truncate font-title text-title text-startmenu-right-text">{t("name")}</h3>
          <p className="flex items-center gap-1.5 text-system text-text">
            <OnlineDot />
            <span>
              <span className="font-bold">{t("contacts.you")}</span> · {t("contacts.youStatus")}
            </span>
          </p>
        </div>
      </header>

      <div className="m-1 flex min-h-0 flex-1 flex-col overflow-y-auto border border-field-border bg-surface p-2 max-md:m-0.5">
        <h4 className="mb-1 flex items-center gap-1 text-system font-bold text-startmenu-right-text">
          <ChevronDown aria-hidden className="size-3" />
          {t("contacts.group", { count: 1 })}
        </h4>
        <ul aria-label={t("contacts.listLabel")}>
          <li>
            <button
              type="button"
              data-messenger-contact="douglas"
              onClick={open}
              aria-label={t("contacts.open")}
              aria-describedby={statusId}
              className="flex w-full items-center gap-2.5 rounded-button border border-transparent p-1.5 text-left hover:border-startmenu-right-border hover:bg-startmenu-right focus-light max-md:min-h-touch-target"
            >
              <span className="relative">
                <UserAvatar size={40} />
                <OnlineDot className="absolute -right-0.5 -bottom-0.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-1.5">
                  <span className="text-body font-bold text-text">{t("contacts.douglas")}</span>
                  <span className="text-system text-text-muted">({t("contacts.status")})</span>
                  {unread > 0 && (
                    <span className="ml-auto rounded-button bg-icon-error px-1 text-system font-bold text-text-inverse">
                      {unread}
                    </span>
                  )}
                </span>
                <span id={statusId} className="block truncate text-system text-text-muted italic">
                  <MessageText text={t("contacts.personalMessage")} />
                </span>
              </span>
            </button>
          </li>
        </ul>
        <p className="mt-auto pt-3 text-system text-text-muted">{t("contacts.hint")}</p>
      </div>
    </div>
  );
}
