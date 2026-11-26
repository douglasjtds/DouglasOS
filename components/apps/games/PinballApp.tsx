"use client";

import { useTranslations } from "next-intl";

/** Placeholder until the pinball game is built (stage 12). */
export default function PinballApp() {
  const t = useTranslations("apps.pinball");
  return (
    <div data-game="pinball" className="flex h-full items-center justify-center bg-button-face p-4 text-body">
      {t("title")}
    </div>
  );
}
