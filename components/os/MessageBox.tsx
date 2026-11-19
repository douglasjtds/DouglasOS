"use client";

import type { ReactNode } from "react";
import { AlertDialog } from "radix-ui";
import { useTranslations } from "next-intl";
import { TitleBarButton } from "@/components/os/window/WindowControls";

/**
 * XP message box (DESKTOP-INTERFACE-SPEC §7): window chrome with close only,
 * a 32px semantic icon, message text and right-aligned buttons. Radix
 * AlertDialog traps focus, focuses the Cancel/default button and maps Esc to
 * Cancel. No dimming scrim — just a transparent click-blocker, like the original.
 */
export function MessageBox({
  open,
  onOpenChange,
  title,
  icon,
  children,
  actions,
  testId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  icon: ReactNode;
  children: ReactNode;
  /** Buttons; wrap the default one in `AlertDialog.Cancel asChild` for focus. */
  actions: ReactNode;
  testId?: string;
}) {
  const t = useTranslations("window");
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-1400" />
        <AlertDialog.Content
          data-testid={testId}
          className="fixed left-1/2 top-1/2 z-1400 flex w-[min(420px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 flex-col rounded-t-window border-x-[3px] border-b-[3px] border-window-frame bg-window-frame shadow-window outline-none"
        >
          <div className="flex h-titlebar items-center gap-1.5 rounded-t-window bg-titlebar-gradient px-1.5 pt-0.5">
            <AlertDialog.Title className="min-w-0 flex-1 truncate pl-1 font-title text-title font-bold text-titlebar-text">
              {title}
            </AlertDialog.Title>
            <AlertDialog.Cancel asChild>
              <TitleBarButton glyph="close" aria-label={t("close")} />
            </AlertDialog.Cancel>
          </div>
          <div className="flex flex-col gap-4 bg-button-face p-3">
            <div className="flex items-start gap-3">
              <span className="shrink-0">{icon}</span>
              <AlertDialog.Description className="pt-1 text-body text-text">
                {children}
              </AlertDialog.Description>
            </div>
            <div className="flex justify-end gap-1.5">{actions}</div>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
