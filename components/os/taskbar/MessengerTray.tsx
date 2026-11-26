"use client";

import { useTranslations } from "next-intl";
import { launch } from "@/lib/apps/launch";
import { useMessengerStore } from "@/lib/store/messengerStore";
import { MessengerIcon } from "@/components/icons/MessengerIcons";
import { Tooltip } from "@/components/ui/tooltip";

/**
 * Tray icon "Douglas is online" (DESKTOP-INTERFACE-SPEC §4, §14): opens (or
 * focuses) DouglasOS Messenger. A red dot marks lines Douglas "sent" while
 * the window was in the background; with unread lines it jumps straight to
 * the conversation.
 */
export function MessengerTray() {
  const t = useTranslations("messenger.tray");
  const unread = useMessengerStore((s) => s.unread);
  const label = unread > 0 ? t("unread", { count: unread }) : t("label");

  function open() {
    if (useMessengerStore.getState().unread > 0) useMessengerStore.getState().setView("conversation");
    launch("messenger");
  }

  return (
    <Tooltip content={label}>
      <button
        type="button"
        aria-label={label}
        data-tray-messenger
        data-unread={unread > 0 || undefined}
        onClick={open}
        className="relative flex size-task-button items-center justify-center rounded-button hover:bg-task-button-hover focus-inverse max-md:size-touch-target"
      >
        <MessengerIcon size={16} />
        {unread > 0 && (
          <span
            aria-hidden
            className="absolute top-0.5 right-0.5 size-2 rounded-full border border-surface bg-icon-error max-md:top-2.5 max-md:right-2.5"
          />
        )}
      </button>
    </Tooltip>
  );
}
