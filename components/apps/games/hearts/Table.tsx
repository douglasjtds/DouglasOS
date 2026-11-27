"use client";

import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { Card } from "@/lib/games/cards";
import type { Seat, TrickPlay } from "@/lib/games/hearts/engine";
import { PlayingCard, useCardLabel } from "@/components/apps/games/shared/PlayingCard";
import { cn } from "@/lib/utils";

/** Any card works for drawing a back; it is never revealed. */
const BACK: Card = { id: "back", suit: "spades", rank: 1 };

/**
 * A computer player: name, a small card back with the cards-left count, and
 * the running total. Highlighted while it is their turn.
 */
export function Opponent({
  seat,
  name,
  score,
  count,
  active,
}: {
  seat: Seat;
  name: string;
  score: number;
  count: number;
  active: boolean;
}) {
  const t = useTranslations("games.hearts");
  return (
    <div
      role="group"
      aria-label={t("opponent", { name, score, count })}
      data-hearts-opponent={seat}
      data-active={active ? "" : undefined}
      className="flex w-16 shrink-0 flex-col items-center gap-1 text-system text-text-inverse [--card-h:var(--spacing-card-h-touch)] [--card-w:var(--spacing-card-w-touch)]"
    >
      <span aria-hidden className={cn("max-w-full truncate rounded-button px-1 font-bold", active && "bg-highlight text-highlight-text")}>
        {name}
      </span>
      <span aria-hidden className="relative">
        <PlayingCard card={BACK} faceDown selected={active} />
        <span className="absolute -bottom-1 -right-2 min-w-5 rounded-button border border-card-edge bg-card-face px-1 text-center font-bold text-card-black">
          {count}
        </span>
      </span>
      <span aria-hidden data-hearts-score={seat}>
        {score}
      </span>
    </div>
  );
}

/** Where each seat's card sits inside the trick area. */
const PLACEMENT: Record<Seat, string> = {
  0: "bottom-0 left-1/2 -translate-x-1/2",
  1: "left-0 top-1/2 -translate-y-1/2",
  2: "top-0 left-1/2 -translate-x-1/2",
  3: "right-0 top-1/2 -translate-y-1/2",
};

/** Slide-in offsets: each card comes from its player's side of the table. */
const FROM: Record<Seat, { x: number; y: number }> = {
  0: { x: 0, y: 24 },
  1: { x: -24, y: 0 },
  2: { x: 0, y: -24 },
  3: { x: 24, y: 0 },
};

const areaStyle: CSSProperties = {
  width: "calc(var(--card-w) * 3 + var(--spacing) * 4)",
  height: "calc(var(--card-h) * 2 + var(--spacing) * 6)",
};

/** The current trick in the middle of the felt, each card near its player. */
export function TrickArea({
  trick,
  names,
  reducedMotion,
}: {
  trick: TrickPlay[];
  names: string[];
  reducedMotion: boolean;
}) {
  const t = useTranslations("games.hearts");
  const cardLabel = useCardLabel();
  return (
    <div
      role="group"
      aria-label={t("trick")}
      data-hearts-trick
      className="relative shrink-0 [--card-h:var(--spacing-card-h)] [--card-w:var(--spacing-card-w)] max-md:[--card-h:var(--spacing-card-h-touch)] max-md:[--card-w:var(--spacing-card-w-touch)]"
      style={areaStyle}
    >
      {trick.map(({ seat, card }) => (
        <div key={card.id} className={cn("absolute", PLACEMENT[seat])}>
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, ...FROM[seat] }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            <PlayingCard
              card={card}
              role="img"
              data-trick-seat={seat}
              aria-label={t("played", { name: names[seat], card: cardLabel(card) })}
            />
          </motion.div>
        </div>
      ))}
    </div>
  );
}
