/**
 * Simple, deterministic Hearts opponents (stage 12). No look-ahead and no
 * card counting beyond "has the queen of spades been played?" — sensible
 * enough to be a fair coffee-break game, and easy to test.
 */
import type { Card, Suit } from "@/lib/games/cards";
import {
  PASS_COUNT,
  cardPoints,
  cardValue,
  isQueenOfSpades,
  legalPlays,
  type HeartsState,
  type Seat,
} from "./engine";

const byValueDesc = (a: Card, b: Card) => cardValue(b) - cardValue(a);
const byValueAsc = (a: Card, b: Card) => cardValue(a) - cardValue(b);

/**
 * Pick 3 cards to pass: the queen/king/ace of spades, then high hearts
 * (Jack and up), then void the shortest side suit that fits, then the
 * highest cards left.
 */
export function aiChoosePass(hand: readonly Card[]): Card[] {
  const picks: Card[] = [];
  const add = (card: Card) => {
    if (picks.length < PASS_COUNT && !picks.some((p) => p.id === card.id)) picks.push(card);
  };
  hand
    .filter((c) => c.suit === "spades" && cardValue(c) >= 12)
    .sort(byValueDesc)
    .forEach(add);
  hand
    .filter((c) => c.suit === "hearts" && cardValue(c) >= 11)
    .sort(byValueDesc)
    .forEach(add);

  const left = () => hand.filter((c) => !picks.some((p) => p.id === c.id));
  const slots = PASS_COUNT - picks.length;
  if (slots > 0) {
    const sideSuits: Suit[] = ["clubs", "diamonds"];
    const voidable = sideSuits
      .map((suit) => left().filter((c) => c.suit === suit))
      .filter((cards) => cards.length > 0 && cards.length <= slots)
      .sort((a, b) => a.length - b.length);
    if (voidable.length > 0) voidable[0].sort(byValueDesc).forEach(add);
  }
  left().sort(byValueDesc).forEach(add);
  return picks;
}

function queenPlayed(state: HeartsState): boolean {
  const seen = [...state.taken.flat(), ...state.trick.map((p) => p.card)];
  return seen.some(isQueenOfSpades);
}

/** Choose the card `seat` plays now. Assumes it is that seat's turn. */
export function aiChoosePlay(state: HeartsState, seat: Seat): Card {
  const legal = legalPlays(state, seat);
  if (legal.length === 0) throw new Error(`seat ${seat} has no legal play`);
  if (legal.length === 1) return legal[0];

  // Leading: low card in a safe suit (no hearts, no queen; don't lead the
  // spade king/ace while the queen is still out and someone else holds it).
  if (state.trick.length === 0) {
    const holdsQueen = state.hands[seat].some(isQueenOfSpades);
    const queenOut = !queenPlayed(state) && !holdsQueen;
    const safe = legal.filter(
      (c) =>
        c.suit !== "hearts" &&
        !isQueenOfSpades(c) &&
        !(queenOut && c.suit === "spades" && cardValue(c) > 12),
    );
    return (safe.length > 0 ? safe : legal).slice().sort(byValueAsc)[0];
  }

  const led = state.trick[0].card.suit;
  const following = legal.filter((c) => c.suit === led);

  if (following.length > 0) {
    const winning = Math.max(...state.trick.filter((p) => p.card.suit === led).map((p) => cardValue(p.card)));
    const losing = following.filter((c) => cardValue(c) < winning).sort(byValueDesc);
    if (losing.length > 0) return losing[0];
    // Every card wins: play the highest, but never volunteer the queen.
    const sorted = following.slice().sort(byValueDesc);
    return sorted.find((c) => !isQueenOfSpades(c)) ?? sorted[0];
  }

  // Void in the led suit: dump the queen, then the highest heart, then the
  // spade ace/king, then the highest card.
  const queen = legal.find(isQueenOfSpades);
  if (queen) return queen;
  const hearts = legal.filter((c) => c.suit === "hearts").sort(byValueDesc);
  if (hearts.length > 0) return hearts[0];
  const bigSpades = legal.filter((c) => c.suit === "spades" && cardValue(c) > 12).sort(byValueDesc);
  if (bigSpades.length > 0 && !queenPlayed(state)) return bigSpades[0];
  return legal
    .slice()
    .sort((a, b) => cardPoints(b) - cardPoints(a) || byValueDesc(a, b))[0];
}
