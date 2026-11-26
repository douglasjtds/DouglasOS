"use client";

import { useTranslations } from "next-intl";

/** Placeholder until the mines game is built (stage 12). */
export default function MinesApp() {
  const t = useTranslations("apps.mines");
  return (
    <div data-game="mines" className="flex h-full items-center justify-center bg-button-face p-4 text-body">
      {t("title")}
    </div>
  );
}
