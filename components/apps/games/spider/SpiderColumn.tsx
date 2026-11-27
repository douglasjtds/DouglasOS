"use client";

import { memo, type MouseEvent } from "react";
import { useTranslations } from "next-intl";
import { CardSlot, PlayingCard, useCardLabel } from "@/components/apps/games/shared/PlayingCard";
import { fanOffsets, fanPositions } from "@/components/apps/games/spider/layout";
import type { Column } from "@/lib/games/spider/engine";
import { cn } from "@/lib/utils";

export interface SpiderColumnProps {
  column: Column;
  index: number;
  cardH: number;
  /** Height the column should fit in (0 = unknown). */
  available: number;
  /** Index of the first selected card, or null. */
  selectedFrom: number | null;
  /** Index of the first hinted card, or null. */
  hintFrom: number | null;
  /** Whether this column is the hinted destination. */
  hintTarget: boolean;
  /** Roving focus: the card index (-1 = empty slot) that is tabbable, or null. */
  focusIndex: number | null;
  onActivate: (column: number, index: number) => void;
  onAutoMove: (column: number, index: number) => void;
  onColumnClick: (column: number) => void;
}

/** One tableau column: face-down cards (not focusable) under face-up card buttons. */
export const SpiderColumn = memo(function SpiderColumn({
  column,
  index: col,
  cardH,
  available,
  selectedFrom,
  hintFrom,
  hintTarget,
  focusIndex,
  onActivate,
  onAutoMove,
  onColumnClick,
}: SpiderColumnProps) {
  const t = useTranslations("games.spider");
  const cardLabel = useCardLabel();
  const { tops, height } = fanPositions(column, cardH, fanOffsets(column, cardH, available));
  const faceDown = column.filter((c) => !c.faceUp).length;
  const number = col + 1;

  const stop = (e: MouseEvent, fn: () => void) => {
    e.stopPropagation();
    fn();
  };

  return (
    <div
      role="group"
      aria-label={
        faceDown > 0
          ? `${t("column", { column: number })}, ${t("faceDown", { count: faceDown })}`
          : t("column", { column: number })
      }
      data-spider-column={col}
      onClick={() => onColumnClick(col)}
      className={cn(
        "relative w-[var(--card-w)] shrink-0 rounded-card",
        hintTarget && "outline-2 outline-offset-2 outline-highlight",
      )}
      style={{ height }}
    >
      {column.length === 0 ? (
        <button
          type="button"
          data-spider-index={-1}
          aria-label={t("emptyColumn", { column: number })}
          tabIndex={focusIndex === -1 ? 0 : -1}
          onClick={(e) => stop(e, () => onActivate(col, -1))}
          className="absolute left-0 top-0 block rounded-card focus-light"
        >
          <CardSlot aria-hidden />
        </button>
      ) : (
        column.map((entry, i) => {
          const style = { top: tops[i] };
          if (!entry.faceUp) {
            return (
              <PlayingCard
                key={entry.card.id}
                card={entry.card}
                faceDown
                aria-hidden
                className="absolute left-0"
                style={style}
              />
            );
          }
          const selected = selectedFrom !== null && i >= selectedFrom;
          const hinted = hintFrom !== null && i >= hintFrom;
          return (
            <button
              key={entry.card.id}
              type="button"
              data-spider-index={i}
              aria-label={t("cardInColumn", { card: cardLabel(entry.card), column: number })}
              aria-pressed={selected}
              tabIndex={focusIndex === i ? 0 : -1}
              onClick={(e) => stop(e, () => onActivate(col, i))}
              onDoubleClick={(e) => stop(e, () => onAutoMove(col, i))}
              className="absolute left-0 block rounded-card focus-light"
              style={style}
            >
              <PlayingCard
                card={entry.card}
                selected={selected}
                className={cn(hinted && !selected && "outline-2 outline-highlight")}
              />
            </button>
          );
        })
      )}
    </div>
  );
});
