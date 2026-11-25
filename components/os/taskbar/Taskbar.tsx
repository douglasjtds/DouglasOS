"use client";

import { useTranslations } from "next-intl";
import { StartMenu } from "@/components/os/start-menu/StartMenu";
import { QuickLaunch } from "@/components/os/taskbar/QuickLaunch";
import { TaskButtons } from "@/components/os/taskbar/TaskButtons";
import { LocaleToggle } from "@/components/os/taskbar/LocaleToggle";
import { Clock } from "@/components/os/taskbar/Clock";
import { MessengerTray } from "@/components/os/taskbar/MessengerTray";
import { MediaTray } from "@/components/os/taskbar/MediaTray";

/**
 * The persistent system bar: Start (+ menu), Quick Launch (CV, Contact),
 * window buttons and the tray (Media Player now-playing + volume while it's open,
 * Messenger "online" icon, language, clock). Always above windows.
 * On touch screens the `taskbar` token grows to 48px + the bottom safe-area
 * inset (the padding keeps the controls clear of the home indicator).
 */
export function Taskbar() {
  const t = useTranslations("taskbar");
  return (
    <nav
      aria-label={t("label")}
      data-taskbar
      className="absolute inset-x-0 bottom-0 z-1100 flex h-taskbar items-center bg-taskbar-gradient max-md:pb-safe-bottom"
    >
      <StartMenu />
      <QuickLaunch />
      <TaskButtons />
      <div
        role="group"
        aria-label={t("tray")}
        data-tray
        className="flex h-full shrink-0 items-center gap-2 border-l border-tray-edge bg-tray-gradient px-2.5 shadow-[inset_1px_0_var(--color-tray-highlight)] max-md:gap-0 max-md:px-0.5"
      >
        <MediaTray />
        <MessengerTray />
        <LocaleToggle />
        <Clock />
      </div>
    </nav>
  );
}
