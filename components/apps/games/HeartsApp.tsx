"use client";

import { useTranslations } from "next-intl";

/** Placeholder until the hearts game is built (stage 12). */
export default function HeartsApp() {
  const t = useTranslations("apps.hearts");
  return (
    <div data-game="hearts" className="flex h-full items-center justify-center bg-button-face p-4 text-body">
      {t("title")}
    </div>
  );
}
