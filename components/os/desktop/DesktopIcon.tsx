"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Download } from "lucide-react";
import type { RefObject } from "react";
import { useWindowStore } from "@/lib/store/windowStore";
import { downloadFile } from "@/lib/download";
import type { LauncherConfig, LauncherTint } from "@/lib/apps/registry";
import { cn } from "@/lib/utils";

const TINT_CLASSES: Record<LauncherTint, string> = {
  neutral:
    "from-base-2/90 to-base-1/90 text-text-secondary group-hover:text-accent",
  purple:
    "from-accent-purple/25 to-base-1/90 text-accent-purple group-hover:text-accent-purple group-hover:shadow-[0_0_16px_var(--color-accent-purple-glow)]",
  accent:
    "from-accent/25 to-accent-muted/10 text-accent ring-1 ring-accent/25",
};

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
      className="group flex w-26 flex-col items-center gap-1.5 rounded-lg p-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span
        className={cn(
          "relative flex size-14 items-center justify-center rounded-xl border border-white/[0.06] bg-gradient-to-br shadow-card transition-shadow",
          "group-hover:shadow-glow-subtle",
          TINT_CLASSES[launcher.tint],
        )}
      >
        <Icon className="size-7" aria-hidden />
        {/* Download affordance on the resume icon (spec: hover hint). */}
        {launcher.kind === "download" && (
          <span
            aria-hidden
            className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-accent text-base-0 opacity-0 shadow-glow-subtle transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
          >
            <Download className="size-3" />
          </span>
        )}
      </span>
      <span className="rounded bg-base-0/50 px-1 py-0.5 text-center font-mono text-xs font-medium leading-tight text-text-secondary backdrop-blur-sm">
        {filename}
      </span>
    </motion.button>
  );
}
