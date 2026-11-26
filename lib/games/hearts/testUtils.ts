/** Test helpers for the Hearts engine: compact card + state builders. */
import type { Card, Rank, Suit } from "@/lib/games/cards";
import type { HeartsState, Seat, TrickPlay } from "./engine";

const SUIT_CODES: Record<string, Suit> = { S: "spades", H: "hearts", D: "diamonds", C: "clubs" };
const RANK_CODES: Record<string, Rank> = { A: 1, J: 11, Q: 12, K: 13 };

/** "QS" → queen of spades, "10H" → ten of hearts, "2C" → two of clubs. */
export function card(code: string): Card {
  const suit = SUIT_CODES[code.slice(-1)];
  const r = code.slice(0, -1);
  const rank = (RANK_CODES[r] ?? Number(r)) as Rank;
  if (!suit || !rank) throw new Error(`bad card code ${code}`);
  return { id: `${suit}-${rank}`, suit, rank };
}

export function cards(codes: string): Card[] {
  return codes.split(/\s+/).filter(Boolean).map(card);
}

export function trick(...plays: [Seat, string][]): TrickPlay[] {
  return plays.map(([seat, code]) => ({ seat, card: card(code) }));
}

/** A mid-hand playing state with the given hands; everything else overridable. */
export function stateWith(hands: string[], overrides: Partial<HeartsState> = {}): HeartsState {
  return {
    seed: 1,
    handNumber: 0,
    phase: "playing",
    hands: hands.map(cards),
    taken: [[], [], [], []],
    trick: [],
    turn: 0,
    tricksPlayed: 1,
    heartsBroken: false,
    lastTrick: null,
    history: [],
    totals: [0, 0, 0, 0],
    ...overrides,
  };
}
