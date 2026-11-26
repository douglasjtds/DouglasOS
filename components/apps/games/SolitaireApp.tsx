"use client";

import { useTranslations } from "next-intl";

/** Placeholder until the solitaire game is built (stage 12). */
export default function SolitaireApp() {
  const t = useTranslations("apps.solitaire");
  return (
    <div data-game="solitaire" className="flex h-full items-center justify-center bg-button-face p-4 text-body">
      {t("title")}
    </div>
  );
}
