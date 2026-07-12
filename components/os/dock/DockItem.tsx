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
    <li className="group relative flex flex-col items-center">
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute bottom-full left-1/2 mb-4 -translate-x-1/2 whitespace-nowrap rounded-md",
          "border border-white/[0.08] bg-glass-chrome px-2 py-1 text-xs text-text-primary shadow-dock backdrop-blur-glass-strong",
          "opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100",
        )}
      >
        {label}
      </span>
      <motion.button
        type="button"
        onClick={handleClick}
        aria-label={label}
        aria-pressed={isOpen}
        data-dock-app={launcher.kind === "window" ? launcher.id : undefined}
        whileHover={{ scale: 1.25, y: -6 }}
        whileTap={{ scale: 1.1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={cn(
          "flex size-11 items-center justify-center rounded-xl border border-white/[0.06] bg-base-2/60 text-text-secondary",
          "hover:text-accent hover:shadow-glow-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          launcher.tint === "purple" &&
            "text-accent-purple hover:text-accent-purple hover:shadow-[0_0_16px_var(--color-accent-purple-glow)]",
          launcher.tint === "accent" &&
            "bg-accent/15 text-accent ring-1 ring-accent/25",
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
