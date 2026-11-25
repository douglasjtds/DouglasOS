"use client";

import type { ReactNode } from "react";
import { Dialog } from "radix-ui";
import { useTranslations } from "next-intl";
import { TitleBarButton } from "@/components/os/window/WindowControls";
import { cn } from "@/lib/utils";

/**
 * XP dialog box (DESKTOP-INTERFACE-SPEC §7): the message-box chrome (title bar
 * with close only, beige body) for small modal forms — Run…, an icon's
 * Properties. Radix Dialog traps focus, maps Esc to close and restores focus
 * on close. Layer 1400 (modal dialogs). On phones it docks near the top so
 * the on-screen keyboard never covers its field.
 */
export function XpDialog({
  open,
  onOpenChange,
  title,
  icon,
  children,
  testId,
  className,
  onOpenAutoFocus,
  onCloseAutoFocus,
  onEscapeKeyDown,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Optional 16px icon in the title bar. */
  icon?: ReactNode;
  children: ReactNode;
  testId?: string;
  className?: string;
  onOpenAutoFocus?: (event: Event) => void;
  onCloseAutoFocus?: (event: Event) => void;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
}) {
  const t = useTranslations("window");
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-1400" />
        <Dialog.Content
          data-testid={testId}
          aria-describedby={undefined}
          onOpenAutoFocus={onOpenAutoFocus}
          onCloseAutoFocus={onCloseAutoFocus}
          onEscapeKeyDown={onEscapeKeyDown}
          className={cn(
            "fixed left-1/2 top-1/2 z-1400 flex w-[min(420px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 flex-col rounded-t-window border-x-[3px] border-b-[3px] border-window-frame bg-window-frame shadow-window outline-none",
            "max-md:top-[calc(env(safe-area-inset-top)+16px)] max-md:translate-y-0",
            className,
          )}
        >
          <div className="flex h-titlebar items-center gap-1.5 rounded-t-window bg-titlebar-gradient px-1.5 pt-0.5">
            {icon && <span className="shrink-0 pl-0.5">{icon}</span>}
            <Dialog.Title className="min-w-0 flex-1 truncate pl-1 font-title text-title font-bold text-titlebar-text">
              {title}
            </Dialog.Title>
            <Dialog.Close asChild>
              <TitleBarButton glyph="close" aria-label={t("close")} />
            </Dialog.Close>
          </div>
          <div className="flex flex-col gap-3 bg-button-face p-3">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
