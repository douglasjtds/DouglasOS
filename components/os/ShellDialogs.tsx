"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { AlertDialog } from "radix-ui";
import { useTranslations } from "next-intl";
import { useShellStore } from "@/lib/store/shellStore";
import { useWindowStore } from "@/lib/store/windowStore";
import { launcherTitleKey, type AppId } from "@/lib/apps/registry";
import { InfoIcon, TurnOffIcon, WarningIcon } from "@/components/icons/SystemIcons";
import { IconPropertiesDialog } from "@/components/os/desktop/IconPropertiesDialog";
import { launch } from "@/lib/apps/launch";
import { MessageBox } from "@/components/os/MessageBox";
import { Button } from "@/components/ui/button";
import {
  confirmCloseWindow,
  focusAfterClose,
  focusWindowElement,
  hasUnsavedChanges,
} from "@/lib/windowClose";

// Run… and the command palette (stage 7) load on first use: they pull in the
// resolver and the intent matcher, which the shell bundle doesn't need.
const RunDialog = dynamic(() => import("@/components/os/run/RunDialog"), { ssr: false });
const CommandPalette = dynamic(() => import("@/components/os/run/CommandPalette"), { ssr: false });

/**
 * The shell's modal dialogs: Turn Off confirmation, the F2 joke and (stage 7)
 * Run…, the command palette, an icon's Properties and the desktop menu's
 * "New" joke. One at a time (`shellStore.dialog`).
 */
export function ShellDialogs() {
  const t = useTranslations();
  const dialog = useShellStore((s) => s.dialog);
  const closeDialog = useShellStore((s) => s.closeDialog);
  const shutDown = useShellStore((s) => s.shutDown);

  function onOpenChange(open: boolean) {
    if (!open) closeDialog();
  }

  return (
    <>
      <MessageBox
        testId="turn-off-dialog"
        open={dialog?.kind === "turnOff"}
        onOpenChange={onOpenChange}
        title={t("shutdown.dialogTitle")}
        icon={<TurnOffIcon size={32} />}
        actions={
          <>
            <AlertDialog.Action asChild>
              <Button
                onClick={() => {
                  useWindowStore.getState().closeAll();
                  shutDown();
                }}
              >
                {t("shutdown.confirm")}
              </Button>
            </AlertDialog.Action>
            <AlertDialog.Cancel asChild>
              <Button variant="primary">{t("shutdown.cancel")}</Button>
            </AlertDialog.Cancel>
          </>
        }
      >
        {t("shutdown.dialogBody")}
      </MessageBox>

      <MessageBox
        testId="protected-file-dialog"
        open={dialog?.kind === "protectedFile"}
        onOpenChange={onOpenChange}
        title={t("protectedFile.title")}
        icon={<WarningIcon size={32} />}
        actions={
          <AlertDialog.Cancel asChild>
            <Button variant="primary">{t("protectedFile.ok")}</Button>
          </AlertDialog.Cancel>
        }
      >
        {dialog?.kind === "protectedFile"
          ? t("protectedFile.body", { name: t(launcherTitleKey(dialog.iconId)) })
          : null}
      </MessageBox>

      <MessageBox
        testId="new-item-dialog"
        open={dialog?.kind === "newItem"}
        onOpenChange={onOpenChange}
        title={t("newItem.title")}
        onCloseAutoFocus={(e) => {
          // "Show projects" focused the Explorer: don't pull focus back.
          if (useWindowStore.getState().focusedId === "projects") e.preventDefault();
        }}
        icon={<InfoIcon size={32} />}
        actions={
          <>
            <AlertDialog.Action asChild>
              <Button onClick={() => launch("projects")}>{t("newItem.projects")}</Button>
            </AlertDialog.Action>
            <AlertDialog.Cancel asChild>
              <Button variant="primary">{t("newItem.ok")}</Button>
            </AlertDialog.Cancel>
          </>
        }
      >
        {t("newItem.body")}
      </MessageBox>

      <ConfirmCloseDialog />

      {dialog?.kind === "iconProperties" && (
        <IconPropertiesDialog key={dialog.iconId} iconId={dialog.iconId} />
      )}
      {dialog?.kind === "run" && <RunDialog />}
      {dialog?.kind === "palette" && <CommandPalette />}
    </>
  );
}

/**
 * "Close <app>?" (Yes / No). Yes closes the window and moves focus on; No,
 * Esc, the title-bar X or a click outside cancel and hand focus back to the
 * window. While it is open `overlayOpen()` is true, so a second Esc only
 * cancels it.
 */
function ConfirmCloseDialog() {
  const t = useTranslations();
  const dialog = useShellStore((s) => s.dialog);
  const closeDialog = useShellStore((s) => s.closeDialog);
  const windowId = dialog?.kind === "confirmClose" ? dialog.windowId : null;
  // The dialog state is already cleared when Radix restores focus on close.
  const lastWindowId = useRef<AppId | null>(null);
  useEffect(() => {
    if (windowId) lastWindowId.current = windowId;
  }, [windowId]);
  const app = windowId ? t(`apps.${windowId}.title`) : "";

  return (
    <MessageBox
      testId="confirm-close-dialog"
      open={windowId !== null}
      onOpenChange={(open) => {
        if (!open) closeDialog();
      }}
      dismissOnOverlayClick
      title={t("confirmClose.title", { app })}
      icon={<WarningIcon size={32} />}
      onCloseAutoFocus={(e) => {
        const id = lastWindowId.current;
        if (!id) return;
        e.preventDefault();
        if (useWindowStore.getState().windows[id]) focusWindowElement(id);
        else focusAfterClose(id);
      }}
      actions={
        <>
          <AlertDialog.Action asChild>
            <Button onClick={() => windowId && confirmCloseWindow(windowId)}>
              {t("confirmClose.yes")}
            </Button>
          </AlertDialog.Action>
          <AlertDialog.Cancel asChild>
            <Button variant="primary">{t("confirmClose.no")}</Button>
          </AlertDialog.Cancel>
        </>
      }
    >
      {windowId
        ? t(hasUnsavedChanges(windowId) ? "confirmClose.unsavedBody" : "confirmClose.body", { app })
        : null}
    </MessageBox>
  );
}
