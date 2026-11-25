"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { RecycleBinIcon } from "@/components/icons/RecycleBinIcons";
import { useAssistantStore } from "@/lib/store/assistantStore";
import { recycleBinOpenedMessage } from "@/lib/assistant/trash";
import { useIsMobile } from "@/hooks/useIsMobile";

/**
 * The Recycle Bin window (stage 6): always empty, because mini Douglas
 * brings back everything that's dropped in. Nothing here can delete, empty
 * or restore anything — there's nothing to act on. Opening it makes mini
 * Douglas comment (if he's around; `say()` is a no-op after "Not now", and
 * the window's own note says the same thing).
 */
export default function RecycleBinApp() {
  const t = useTranslations("apps.recycle-bin");
  const mobile = useIsMobile();

  useEffect(() => {
    useAssistantStore.getState().say(recycleBinOpenedMessage());
  }, []);

  return (
    <div data-recycle-bin-window className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
      <span className="opacity-60">
        <RecycleBinIcon size={48} />
      </span>
      <p className="text-body font-bold">{t("empty")}</p>
      <p className="max-w-80 text-body text-text-muted">{t(mobile ? "noteTouch" : "note")}</p>
    </div>
  );
}
