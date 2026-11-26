/**
 * Playing cards shared by the card games (stage 12): Solitaire, FreeCell,
 * Hearts and Spider Solitaire. Pure data — rendering lives in
 * `components/apps/games/shared/PlayingCard.tsx`.
 */
import { shuffle, type Rng } from "@/lib/games/rng";

export const SUITS = ["spades", "hearts", "diamonds", "clubs"] as const;
export type Suit = (typeof SUITS)[number];

/** 1 = Ace … 11 = Jack, 12 = Queen, 13 = King. */
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;
export const RANKS: readonly Rank[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

export interface Card {
  /** Unique within a game, stable across moves ("hearts-12", or "hearts-12-1" for the 2nd copy). */
  id: string;
  suit: Suit;
  rank: Rank;
}

export type CardColor = "red" | "black";

export function cardColor(suit: Suit): CardColor {
  return suit === "hearts" || suit === "diamonds" ? "red" : "black";
}

export function isRed(card: Card): boolean {
  return cardColor(card.suit) === "red";
}

/** Opposite colors (Klondike / FreeCell tableau rule). */
export function alternatesColor(a: Card, b: Card): boolean {
  return cardColor(a.suit) !== cardColor(b.suit);
}

/** Short rank label used on the card corners ("A", "2"…"10", "J", "Q", "K"). */
export function rankLabel(rank: Rank): string {
  if (rank === 1) return "A";
  if (rank === 11) return "J";
  if (rank === 12) return "Q";
  if (rank === 13) return "K";
  return String(rank);
}

export const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: "♠",
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
};

/**
 * One or more 52-card decks, in order. `suits` limits the suits used, each
 * repeated so the total is still 52 × decks (Spider's 1- and 2-suit modes).
 */
export function createDeck({
  decks = 1,
  suits = SUITS,
}: { decks?: number; suits?: readonly Suit[] } = {}): Card[] {
  const copiesPerSuit = (decks * SUITS.length) / suits.length;
  if (!Number.isInteger(copiesPerSuit)) throw new Error("suits must divide 4 × decks");
  const cards: Card[] = [];
  for (const suit of suits) {
    for (let copy = 0; copy < copiesPerSuit; copy++) {
      for (const rank of RANKS) {
        cards.push({ id: `${suit}-${rank}${copy ? `-${copy}` : ""}`, suit, rank });
      }
    }
  }
  return cards;
}

/** A shuffled deck (see `createDeck`). */
export function shuffledDeck(rng: Rng, options?: Parameters<typeof createDeck>[0]): Card[] {
  return shuffle(createDeck(options), rng);
}
