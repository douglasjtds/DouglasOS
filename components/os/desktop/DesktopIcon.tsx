"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { RefObject } from "react";
import { useWindowStore } from "@/lib/store/windowStore";
import { downloadFile } from "@/lib/download";
import type { LauncherConfig } from "@/lib/apps/registry";
import { cn } from "@/lib/utils";

export function DesktopIcon({
  launcher,
  wasDragged,
}: {
  launcher: LauncherConfig;
  /** When set, a press that turned into a drag suppresses the activating click. */
  wasDragged?: RefObject<boolean>;
}) {
  const t = useTranslations();
  const Icon = launcher.icon;
  const openWindow = useWindowStore((s) => s.openWindow);

  // The filename label (e.g. "about.app") sits under the icon.
  const filename =
    launcher.kind === "download"
      ? t("resume.title")
      : t(`apps.${launcher.id}.title`);

  function handleClick() {
    // A drag just ended on this icon — don't also open/download it.
    if (wasDragged?.current) return;
    if (launcher.kind === "download") {
      downloadFile(launcher.href, launcher.download);
    } else {
      openWindow(launcher.id);
    }
  }

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      aria-label={filename}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="group flex w-24 flex-col items-center gap-1.5 rounded-lg p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span
        className={cn(
          "flex size-14 items-center justify-center rounded-xl border border-white/[0.06] bg-gradient-to-br from-base-2 to-base-1 text-text-secondary shadow-card transition-shadow",
          "group-hover:text-accent group-hover:shadow-glow-subtle",
          launcher.kind === "download" && "text-accent",
        )}
      >
        <Icon className="size-7" aria-hidden />
      </span>
      <span className="font-mono text-xs font-medium text-text-secondary">
        {filename}
      </span>
    </motion.button>
  );
}
