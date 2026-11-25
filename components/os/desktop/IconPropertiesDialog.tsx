"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { getLauncher, launcherTitleKey, type LauncherConfig } from "@/lib/apps/registry";
import { launch } from "@/lib/apps/launch";
import { useShellStore } from "@/lib/store/shellStore";
import type { DesktopItemId } from "@/lib/store/desktopStore";
import { XpDialog } from "@/components/os/XpDialog";
import { Button } from "@/components/ui/button";

type Translate = ReturnType<typeof useTranslations>;

/** Kind of file the icon pretends to be. */
function typeKey(l: LauncherConfig): string {
  if (l.kind === "download") return "download";
  if (l.kind === "link") return l.external ? "link" : "mail";
  return l.id === "recycle-bin" ? "system" : "app";
}

/** What opening it does. */
function opensKey(l: LauncherConfig): string {
  if (l.kind === "download") return "opensDownload";
  if (l.kind === "link") return l.external ? "opensTab" : "opensMail";
  return "opensWindow";
}

/** One-line description, from the copy every other surface already uses. */
function description(l: LauncherConfig, t: Translate): string {
  if (l.kind === "download") return t("resume.download");
  if (l.kind === "link") return t(`links.${l.id}.description`);
  return t(`apps.${l.id}.description`);
}

/**
 * An icon's Properties (stage 7, right-click / long-press → Properties): a mini
 * XP property box with the icon, its name, type, description, location and
 * what opening it does, plus **Open** and **OK**. Read-only by design (no
 * renaming: F2 stays the "protected file" joke).
 */
export function IconPropertiesDialog({ iconId }: { iconId: DesktopItemId }) {
  const t = useTranslations();
  const closeDialog = useShellStore((s) => s.closeDialog);
  const launcher = getLauncher(iconId);
  const name = t(launcherTitleKey(iconId));
  const Icon = launcher.icon;
  const opened = useRef(false);
  const okRef = useRef<HTMLButtonElement>(null);

  const rows: [string, string][] = [
    [t("properties.type"), t(`properties.types.${typeKey(launcher)}`)],
    [t("properties.description"), description(launcher, t)],
    [t("properties.location"), t("properties.desktop")],
    [t("properties.opens"), t(`properties.${opensKey(launcher)}`)],
  ];

  return (
    <XpDialog
      open
      testId="icon-properties-dialog"
      onOpenChange={(open) => {
        if (!open) closeDialog();
      }}
      title={t("properties.title", { name })}
      onOpenAutoFocus={(e) => {
        // The default button, like any XP property box.
        e.preventDefault();
        okRef.current?.focus();
      }}
      onCloseAutoFocus={(e) => {
        // "Open" moved focus to a new window; don't pull it back to the icon.
        if (opened.current && launcher.kind === "window") e.preventDefault();
      }}
    >
      <div className="flex flex-col gap-3 border border-bevel-shadow bg-button-face p-3 shadow-[inset_1px_1px_0_var(--color-surface)]">
        <div className="flex items-center gap-3 border-b border-bevel-shadow pb-3">
          <Icon size={32} />
          <span className="min-w-0 break-words text-body font-bold text-text">{name}</span>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-system text-text">
          {rows.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-text-muted">{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="flex justify-end gap-1.5">
        <Button
          type="button"
          onClick={() => {
            opened.current = true;
            closeDialog();
            launch(iconId);
          }}
        >
          {t("properties.open")}
        </Button>
        <Button type="button" variant="primary" onClick={closeDialog} ref={okRef}>
          {t("properties.ok")}
        </Button>
      </div>
    </XpDialog>
  );
}
