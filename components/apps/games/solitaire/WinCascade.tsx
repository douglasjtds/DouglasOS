"use client";

import { motion } from "framer-motion";
import { PlayingCard } from "@/components/apps/games/shared/PlayingCard";
import type { Card } from "@/lib/games/cards";
import { columnX, type TableMetrics } from "@/lib/games/solitaire/layout";

const STAGGER = 0.035;
const DURATION = 1.1;

/** How long the cascade lasts, in ms (the win dialog waits for it). */
export function cascadeDuration(cardCount: number): number {
  return Math.round(((cardCount - 1) * STAGGER + DURATION) * 1000);
}

/**
 * Original win flourish: the foundations peel off King first, round-robin,
 * each card drifting sideways and dropping off the table with a little spin.
 * Decorative only (aria-hidden); not rendered at all under reduced motion.
 */
export function WinCascade({
  foundations,
  metrics: m,
  height,
}: {
  foundations: Card[][];
  metrics: TableMetrics;
  height: number;
}) {
  const order: { card: Card; pile: number }[] = [];
  for (let depth = 12; depth >= 0; depth--) {
    foundations.forEach((pile, index) => {
      if (pile[depth]) order.push({ card: pile[depth], pile: index });
    });
  }
  return (
    <div aria-hidden data-solitaire-cascade className="pointer-events-none absolute inset-0 overflow-hidden">
      {order.map(({ card, pile }, i) => {
        const drift = (pile + 1) * m.cardW * 0.8 + (i % 3) * m.cardW * 0.35;
        return (
          <motion.div
            key={card.id}
            className="absolute"
            style={{ left: columnX(m, 3 + pile), top: m.pad, zIndex: 300 + i }}
            initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
            animate={{ x: -drift, y: height, rotate: (i % 2 ? 1 : -1) * 25, opacity: 0.85 }}
            transition={{ delay: i * STAGGER, duration: DURATION, ease: "easeIn" }}
          >
            <PlayingCard card={card} />
          </motion.div>
        );
      })}
    </div>
  );
}
