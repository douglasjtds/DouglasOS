"use client";

import { memo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import type { Card } from "@/lib/games/cards";
import { PlayingCard, useCardLabel } from "@/components/apps/games/shared/PlayingCard";
import { cn } from "@/lib/utils";

export type HandMode = "pass" | "play" | "idle";

/**
 * Overlap so `--n` cards of `--card-w` always fit the hand's width (it is a
 * size container): a small gap when there is room, a tight overlap on phones.
 */
const overlapStyle: CSSProperties = {
  marginLeft: "min(var(--spacing), calc((100cqw - var(--n) * var(--card-w)) / (var(--n) - 1)))",
};

/**
 * The human's hand, fanned along the bottom. A roving tab stop: Left/Right
 * (and Home/End) move between cards, Enter/Space plays the card (or toggles
 * it for passing). Unplayable cards stay focusable but dimmed and
 * `aria-disabled`; activating one asks the parent to explain why.
 */
export const PlayerHand = memo(function PlayerHand({
  cards,
  mode,
  selected,
  legalIds,
  onActivate,
}: {
  cards: Card[];
  mode: HandMode;
  selected: ReadonlySet<string>;
  legalIds: ReadonlySet<string>;
  onActivate: (card: Card) => void;
}) {
  const t = useTranslations("games.hearts");
  const cardLabel = useCardLabel();
  const [focusIndex, setFocusIndex] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const active = Math.min(focusIndex, Math.max(cards.length - 1, 0));

  function move(index: number) {
    const next = (index + cards.length) % cards.length;
    setFocusIndex(next);
    buttons.current[next]?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (cards.length === 0) return;
    const keys: Record<string, number> = {
      ArrowLeft: active - 1,
      ArrowRight: active + 1,
      Home: 0,
      End: cards.length - 1,
    };
    if (event.key in keys) {
      event.preventDefault();
      move(keys[event.key]);
    }
  }

  return (
    <div
      role="group"
      aria-label={t("hand")}
      data-hearts-hand
      onKeyDown={onKeyDown}
      className="@container flex w-full shrink-0 justify-center pt-3 [--card-h:var(--spacing-card-h)] [--card-w:var(--spacing-card-w)]"
      style={{ "--n": cards.length } as CSSProperties}
    >
      {cards.map((card, i) => {
        const isSelected = selected.has(card.id);
        const disabled = mode === "idle" || (mode === "play" && !legalIds.has(card.id));
        return (
          <button
            key={card.id}
            ref={(el) => {
              buttons.current[i] = el;
            }}
            type="button"
            data-hand-card={card.id}
            data-legal={mode === "play" && !disabled ? "" : undefined}
            aria-label={cardLabel(card)}
            aria-pressed={mode === "pass" ? isSelected : undefined}
            aria-disabled={disabled || undefined}
            tabIndex={i === active ? 0 : -1}
            onFocus={() => setFocusIndex(i)}
            onClick={() => onActivate(card)}
            style={i === 0 ? undefined : overlapStyle}
            className={cn(
              "relative shrink-0 rounded-card outline-none transition-transform duration-100 motion-reduce:transition-none",
              "focus-visible:z-10 focus-visible:-translate-y-1.5 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus-ring-inverse",
              isSelected && "-translate-y-3",
              mode === "play" && !disabled && "hover:-translate-y-1.5",
            )}
          >
            <PlayingCard card={card} selected={isSelected} className={cn(disabled && mode === "play" && "brightness-75")} />
          </button>
        );
      })}
    </div>
  );
});
