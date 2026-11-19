"use client";

import { AlertDialog } from "radix-ui";
import { useTranslations } from "next-intl";
import { useShellStore } from "@/lib/store/shellStore";
import { useWindowStore } from "@/lib/store/windowStore";
import { launcherTitleKey } from "@/lib/apps/registry";
import { TurnOffIcon, WarningIcon } from "@/components/icons/SystemIcons";
import { MessageBox } from "@/components/os/MessageBox";
import { Button } from "@/components/ui/button";

/** The shell's modal dialogs: Turn Off confirmation and the F2 joke. */
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
    </>
  );
}
