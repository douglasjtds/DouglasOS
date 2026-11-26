"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { XpDialog } from "@/components/os/XpDialog";
import { Button } from "@/components/ui/button";
import { SEATS, type HandResult } from "@/lib/games/hearts/engine";

/**
 * Score sheet: one row per finished hand plus the totals, an optional
 * message (moon, winner) and one action (Next hand / Play again / Close).
 */
export function ScoreSheet({
  open,
  onOpenChange,
  names,
  history,
  totals,
  message,
  actionLabel,
  onAction,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  names: string[];
  history: HandResult[];
  totals: number[];
  message?: ReactNode;
  actionLabel: string;
  onAction: () => void;
}) {
  const t = useTranslations("games.hearts.scoreSheet");
  const cell = "border border-bevel-shadow px-1.5 py-0.5 text-right tabular-nums";
  return (
    <XpDialog open={open} onOpenChange={onOpenChange} title={t("title")} testId="hearts-score-sheet">
      {message && (
        <p data-hearts-result className="text-body font-bold text-text">
          {message}
        </p>
      )}
      <div className="max-h-64 overflow-auto bg-surface shadow-bevel-sunken">
        <table className="w-full border-collapse text-system text-text">
          <thead>
            <tr>
              <th scope="col" className={cell}>
                {t("hand")}
              </th>
              {SEATS.map((seat) => (
                <th key={seat} scope="col" className={cell}>
                  {names[seat]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {history.length === 0 && (
              <tr>
                <td colSpan={5} className="px-1.5 py-1 text-text-muted">
                  {t("empty")}
                </td>
              </tr>
            )}
            {history.map((result, i) => (
              <tr key={i} data-hearts-score-row={i}>
                <th scope="row" className={cell}>
                  {i + 1}
                </th>
                {result.points.map((points, seat) => (
                  <td key={seat} className={cell}>
                    {points}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-bold">
              <th scope="row" className={cell}>
                {t("total")}
              </th>
              {totals.map((total, seat) => (
                <td key={seat} className={cell} data-hearts-total={seat}>
                  {total}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="flex justify-end">
        <Button variant="primary" data-hearts-action="sheet" onClick={onAction}>
          {actionLabel}
        </Button>
      </div>
    </XpDialog>
  );
}

const RULE_KEYS = ["goal", "pass", "play", "limits", "moon", "end"] as const;

/** A short original summary of the rules (Help ▸ Rules). */
export function RulesDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("games.hearts.rules");
  const common = useTranslations("apps.games.common");
  return (
    <XpDialog open={open} onOpenChange={onOpenChange} title={t("title")} testId="hearts-rules">
      <ul className="flex list-disc flex-col gap-1.5 pl-4 text-body text-text">
        {RULE_KEYS.map((key) => (
          <li key={key}>{t(key)}</li>
        ))}
      </ul>
      <div className="flex justify-end">
        <Button variant="primary" onClick={() => onOpenChange(false)}>
          {common("close")}
        </Button>
      </div>
    </XpDialog>
  );
}
