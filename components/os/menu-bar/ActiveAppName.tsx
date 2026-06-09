"use client";

import { useTranslations } from "next-intl";
import { useWindowStore } from "@/lib/store/windowStore";

export function ActiveAppName() {
  const focusedId = useWindowStore((s) => s.focusedId);
  const t = useTranslations("apps");

  if (!focusedId) return null;

  return (
    <span className="font-mono text-xs font-medium text-text-secondary">
      {t(`${focusedId}.title`)}
    </span>
  );
}
