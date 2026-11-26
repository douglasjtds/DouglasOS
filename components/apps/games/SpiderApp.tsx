"use client";

import { useTranslations } from "next-intl";

/** Placeholder until the spider game is built (stage 12). */
export default function SpiderApp() {
  const t = useTranslations("apps.spider");
  return (
    <div data-game="spider" className="flex h-full items-center justify-center bg-button-face p-4 text-body">
      {t("title")}
    </div>
  );
}
