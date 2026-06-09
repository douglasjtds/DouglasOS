"use client";

import { useTranslations } from "next-intl";
import { useWindowStore } from "@/lib/store/windowStore";

export function Logo() {
  const t = useTranslations("menu");
  const closeAll = useWindowStore((s) => s.closeAll);

  return (
    <button
      type="button"
      onClick={closeAll}
      aria-label={t("closeAll")}
      className="rounded-md px-1 font-mono text-sm font-semibold text-text-primary transition hover:drop-shadow-[0_0_8px_var(--color-accent-glow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      Douglas<span className="text-accent">OS</span>
    </button>
  );
}
