"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useWindowStore } from "@/lib/store/windowStore";
import { downloadFile } from "@/lib/download";
import type { LauncherConfig } from "@/lib/apps/registry";
import { cn } from "@/lib/utils";

export function DockItem({ launcher }: { launcher: LauncherConfig }) {
  const t = useTranslations();
  const Icon = launcher.icon;
  const openWindow = useWindowStore((s) => s.openWindow);

  const isOpen = useWindowStore((s) =>
    launcher.kind === "window" ? Boolean(s.windows[launcher.id]) : false,
  );
  const isMinimized = useWindowStore((s) =>
    launcher.kind === "window"
      ? Boolean(s.windows[launcher.id]?.minimized)
      : false,
  );

  const label =
    launcher.kind === "download"
      ? t("resume.label")
      : t(`apps.${launcher.id}.label`);

  function handleClick() {
    if (launcher.kind === "download") {
      downloadFile(launcher.href, launcher.download);
    } else {
      openWindow(launcher.id);
    }
  }

  return (
    <li className="relative flex flex-col items-center">
      <motion.button
        type="button"
        onClick={handleClick}
        aria-label={label}
        aria-pressed={isOpen}
        title={label}
        data-dock-app={launcher.kind === "window" ? launcher.id : undefined}
        whileHover={{ scale: 1.25, y: -6 }}
        whileTap={{ scale: 1.1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={cn(
          "flex size-11 items-center justify-center rounded-xl border border-white/[0.06] bg-base-2/60 text-text-secondary",
          "hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          launcher.kind === "download" && "text-accent",
        )}
      >
        <Icon className="size-6" aria-hidden />
      </motion.button>
      <span
        aria-hidden
        className={cn(
          "absolute -bottom-1.5 size-1 rounded-full transition-all",
          isOpen ? "opacity-100" : "opacity-0",
          isMinimized ? "bg-text-muted" : "bg-accent",
        )}
      />
    </li>
  );
}
