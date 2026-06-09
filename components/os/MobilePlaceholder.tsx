"use client";

import { useTranslations } from "next-intl";

export function MobilePlaceholder() {
  const t = useTranslations("mobile");
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-base-0 px-8 text-center">
      <p className="font-mono text-sm font-semibold tracking-wide">
        <span className="text-text-primary">Douglas</span>
        <span className="text-accent">OS</span>
      </p>
      <h1 className="text-2xl font-semibold text-text-primary">{t("title")}</h1>
      <p className="max-w-xs text-sm text-text-secondary">{t("body")}</p>
    </main>
  );
}
