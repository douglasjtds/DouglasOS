"use client";

import { useMemo, useState } from "react";
import { AlertDialog } from "radix-ui";
import { useLocale, useTranslations } from "next-intl";
import { useEasterEggStore, useEasterEggProgress } from "@/lib/store/easterEggStore";
import { useWindowStore } from "@/lib/store/windowStore";
import { launch } from "@/lib/apps/launch";
import { EASTER_EGG_IDS, easterEggHintKey, easterEggTitleKey } from "@/lib/easter-eggs/registry";
import { AchievementsIcon } from "@/components/icons/AppIcons";
import { QuestionIcon } from "@/components/icons/SystemIcons";
import { MessageBox } from "@/components/os/MessageBox";
import { GroupBox } from "@/components/ui/group-box";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Achievements (stage 11, DESKTOP-INTERFACE-SPEC → Easter eggs): an XP
 * property sheet with the easter-egg progress — a segmented progress bar,
 * then every egg in registry order: found ones with their title and the date,
 * missing ones as "???" with a vague hint. "Reset progress" asks first (XP
 * confirm box, Cancel is the default) and also re-locks the secret wallpaper.
 */
export default function AchievementsApp() {
  const t = useTranslations("easterEggs");
  const tRoot = useTranslations();
  const locale = useLocale();
  const found = useEasterEggStore((s) => s.found);
  const reset = useEasterEggStore((s) => s.reset);
  const { count, total, complete } = useEasterEggProgress();
  const [confirming, setConfirming] = useState(false);
  const dateFormat = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: "medium" }), [locale]);
  const close = () => useWindowStore.getState().closeWindow("achievements");

  return (
    <div data-achievements className="flex h-full flex-col gap-2 text-system">
      <div className="flex items-center gap-3">
        <AchievementsIcon size={32} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="font-bold" data-achievements-count>
            {t("achievements.summary", { count, total })}
          </p>
          <div
            role="progressbar"
            aria-label={t("achievements.progressLabel")}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={count}
            className="flex h-3.5 gap-px border border-field-border bg-surface p-px"
          >
            {EASTER_EGG_IDS.map((id, i) => (
              <span key={id} className={cn("flex-1", i < count && "bg-progress")} />
            ))}
          </div>
        </div>
      </div>

      <GroupBox title={t("achievements.listTitle")} className="flex min-h-0 flex-1 flex-col">
        <ul
          aria-label={t("achievements.listTitle")}
          className="min-h-0 flex-1 overflow-y-auto border border-field-border bg-surface"
        >
          {EASTER_EGG_IDS.map((id) => {
            const at = found[id];
            const isFound = at !== undefined;
            return (
              <li
                key={id}
                data-egg={id}
                data-found={isFound ? "" : undefined}
                className="flex items-start gap-2 border-b border-highlight-inactive px-1.5 py-1 last:border-b-0 max-md:py-2"
              >
                <span className={cn("mt-0.5 shrink-0", !isFound && "opacity-50 grayscale")}>
                  {isFound ? <AchievementsIcon size={16} /> : <QuestionIcon size={16} />}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className={cn("font-bold", !isFound && "text-text-muted")}>
                    {isFound ? tRoot(easterEggTitleKey(id)) : t("achievements.unknown")}
                  </span>
                  <span className="text-text-muted">
                    {isFound
                      ? t("achievements.foundOn", { date: dateFormat.format(new Date(at)) })
                      : tRoot(easterEggHintKey(id))}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </GroupBox>

      {complete && (
        <p data-achievements-complete className="flex flex-wrap items-center gap-x-1">
          {t("achievements.complete")}
          <button
            type="button"
            onClick={() => launch("display")}
            className="text-link underline focus-light max-md:min-h-touch-target"
          >
            {t("achievements.openDisplay")}
          </button>
        </p>
      )}

      <div className="flex justify-between gap-1.5">
        <Button data-achievements-reset disabled={count === 0} onClick={() => setConfirming(true)}>
          {t("achievements.reset")}
        </Button>
        <Button variant="primary" onClick={close}>
          {t("achievements.ok")}
        </Button>
      </div>

      <MessageBox
        testId="reset-achievements-dialog"
        open={confirming}
        onOpenChange={setConfirming}
        title={t("achievements.resetTitle")}
        icon={<QuestionIcon size={32} />}
        actions={
          <>
            <AlertDialog.Action asChild>
              <Button data-confirm-reset onClick={() => reset()}>
                {t("achievements.resetConfirm")}
              </Button>
            </AlertDialog.Action>
            <AlertDialog.Cancel asChild>
              <Button variant="primary">{t("achievements.resetCancel")}</Button>
            </AlertDialog.Cancel>
          </>
        }
      >
        {t("achievements.resetBody")}
      </MessageBox>
    </div>
  );
}
