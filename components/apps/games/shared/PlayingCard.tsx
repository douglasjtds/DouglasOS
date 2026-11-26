"use client";

import type { CSSProperties, HTMLAttributes } from "react";
import { useTranslations } from "next-intl";
import { SUIT_SYMBOLS, isRed, rankLabel, type Card } from "@/lib/games/cards";
import { cn } from "@/lib/utils";

/**
 * Card size comes from two optional CSS variables a game may set on its
 * table (`--card-w`, `--card-h`), defaulting to the `card-w`/`card-h` tokens
 * on desktop and the `*-touch` tokens under 768px. Text scales with the
 * card's width (it is a size container).
 */
export const cardSizeClass =
  "@container w-[var(--card-w,var(--spacing-card-w))] h-[var(--card-h,var(--spacing-card-h))] max-md:w-[var(--card-w,var(--spacing-card-w-touch))] max-md:h-[var(--card-h,var(--spacing-card-h-touch))]";

/** Text scales with the card's own width (container query units). */
const cornerStyle: CSSProperties = { fontSize: "max(9px, 19cqw)" };
const pipStyle: CSSProperties = { fontSize: "46cqw" };

/** Localized accessible name: "Queen of hearts" / "Dama de copas". */
export function useCardLabel() {
  const t = useTranslations("apps.games.common.cards");
  return (card: Card) => t("name", { rank: t(`ranks.${card.rank}`), suit: t(`suits.${card.suit}`) });
}

/**
 * One original playing card (stage 12): white face with rank + suit corners
 * and a large center pip; Jack/Queen/King show a framed letter (no court
 * art). Face down shows the DouglasOS lattice back. Purely visual — the game
 * wraps it in its own button / drag target and passes the accessible name.
 */
export function PlayingCard({
  card,
  faceDown = false,
  selected = false,
  className,
  style,
  ...rest
}: {
  card: Card;
  faceDown?: boolean;
  selected?: boolean;
} & HTMLAttributes<HTMLDivElement>) {
  if (faceDown) {
    return (
      <div
        data-card-back
        className={cn(
          cardSizeClass,
          "shrink-0 rounded-card border border-card-edge bg-card-face p-[3px]",
          selected && "outline-2 outline-card-selected",
          className,
        )}
        style={style}
        {...rest}
      >
        <div className="size-full rounded-[3px] bg-card-back-pattern" />
      </div>
    );
  }
  const symbol = SUIT_SYMBOLS[card.suit];
  const label = rankLabel(card.rank);
  const court = card.rank >= 11;
  return (
    <div
      data-card={card.id}
      className={cn(
        cardSizeClass,
        "relative shrink-0 select-none rounded-card border border-card-edge bg-card-face font-sans leading-none",
        isRed(card) ? "text-card-red" : "text-card-black",
        selected && "outline-2 outline-offset-0 outline-card-selected brightness-90",
        className,
      )}
      style={style}
      {...rest}
    >
      <span aria-hidden className="absolute left-[6%] top-[4%] flex flex-col items-center font-bold" style={cornerStyle}>
        <span>{label}</span>
        <span>{symbol}</span>
      </span>
      <span
        aria-hidden
        className="absolute bottom-[4%] right-[6%] flex rotate-180 flex-col items-center font-bold"
        style={cornerStyle}
      >
        <span>{label}</span>
        <span>{symbol}</span>
      </span>
      <span aria-hidden className="absolute inset-0 flex items-center justify-center">
        {court ? (
          <span
            className="flex h-[52%] w-[50%] flex-col items-center justify-center rounded-[3px] border border-current font-title font-bold"
            style={{ fontSize: "26cqw" }}
          >
            <span>{label}</span>
            <span>{symbol}</span>
          </span>
        ) : (
          <span style={pipStyle}>{symbol}</span>
        )}
      </span>
    </div>
  );
}

/** An empty pile outline on the felt (foundation, free cell, empty column). */
export function CardSlot({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-card-slot
      className={cn(
        cardSizeClass,
        "flex shrink-0 items-center justify-center rounded-card border-2 border-card-slot text-card-slot",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
