"use client";

import { useTranslations } from "next-intl";

/** Placeholder until the freecell game is built (stage 12). */
export default function FreeCellApp() {
  const t = useTranslations("apps.freecell");
  return (
    <div data-game="freecell" className="flex h-full items-center justify-center bg-button-face p-4 text-body">
      {t("title")}
    </div>
  );
}
