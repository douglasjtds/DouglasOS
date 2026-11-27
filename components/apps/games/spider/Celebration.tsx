"use client";

import { motion } from "framer-motion";
import { PlayingCard } from "@/components/apps/games/shared/PlayingCard";
import type { Suit } from "@/lib/games/cards";

/** How long the win celebration plays before the result dialog opens. */
export const CELEBRATION_MS = 1600;

/**
 * Original win flourish: the eight completed Kings rise from the completed
 * pile and fan out across the table. Only mounted when motion is allowed.
 */
export function Celebration({ suits }: { suits: readonly Suit[] }) {
  return (
    <div data-spider-celebration aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {suits.map((suit, i) => {
        const spread = (i - (suits.length - 1) / 2) / Math.max(1, suits.length - 1);
        return (
          <motion.div
            key={i}
            className="absolute bottom-[10%] left-1/2"
            initial={{ x: "-50%", y: 0, rotate: 0, opacity: 0, scale: 0.6 }}
            animate={{
              x: `calc(-50% + ${Math.round(spread * 320)}px)`,
              y: [0, -260, -180],
              rotate: spread * 50,
              opacity: [0, 1, 1],
              scale: 1,
            }}
            transition={{ duration: 1.1, delay: i * 0.06, ease: "easeOut" }}
          >
            <PlayingCard card={{ id: `celebrate-${i}`, suit, rank: 13 }} />
          </motion.div>
        );
      })}
    </div>
  );
}
