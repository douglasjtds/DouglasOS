/**
 * Hearts engine (stage 12): pure, immutable state transitions. The UI only
 * renders a `HeartsState` and dispatches `applyPass` / `playCard` /
 * `collectTrick` / `startNextHand`.
 *
 * Seats, in play order (clockwise): 0 = South (the human), 1 = West,
 * 2 = North, 3 = East. Passing "left" sends cards to the next seat in play
 * order, "right" to the previous one, "across" to the seat opposite.
 */
import { createDeck, type Card, type Suit } from "@/lib/games/cards";
import { createRng, shuffle, type Rng } from "@/lib/games/rng";

export type Seat = 0 | 1 | 2 | 3;
export const SEATS: readonly Seat[] = [0, 1, 2, 3];
export const HUMAN: Seat = 0;
export const PASS_COUNT = 3;
export const GAME_OVER_SCORE = 100;
export const MOON_POINTS = 26;

export type PassDirection = "left" | "right" | "across" | "none";
export type Phase = "passing" | "playing" | "handOver" | "gameOver";

export interface TrickPlay {
  seat: Seat;
  card: Card;
}

export interface HandResult {
  /** Points added to each seat's total for this hand (after the moon rule). */
  points: number[];
  /** The seat that took every point card, if any. */
  moon: Seat | null;
}

export interface HeartsState {
  seed: number;
  /** 0-based hand counter; drives the passing cycle and the deal's seed. */
  handNumber: number;
  phase: Phase;
  hands: Card[][];
  /** Cards each seat has won this hand. */
  taken: Card[][];
  trick: TrickPlay[];
  /** Whose turn it is (meaningless while a full trick waits to be collected). */
  turn: Seat;
  tricksPlayed: number;
  heartsBroken: boolean;
  /** The last collected trick and who took it (for the status line). */
  lastTrick: { plays: TrickPlay[]; winner: Seat } | null;
  /** One entry per finished hand. */
  history: HandResult[];
  totals: number[];
}

export const QUEEN_OF_SPADES_ID = "spades-12";
export const TWO_OF_CLUBS_ID = "clubs-2";

/** Ace is high in Hearts. */
export function cardValue(card: Card): number {
  return card.rank === 1 ? 14 : card.rank;
}

export function isQueenOfSpades(card: Card): boolean {
  return card.suit === "spades" && card.rank === 12;
}

export function cardPoints(card: Card): number {
  if (card.suit === "hearts") return 1;
  return isQueenOfSpades(card) ? 13 : 0;
}

const SUIT_ORDER: Record<Suit, number> = { clubs: 0, diamonds: 1, spades: 2, hearts: 3 };

/** Hand sort for display: clubs, diamonds, spades, hearts; low to high. */
export function sortHand(cards: readonly Card[]): Card[] {
  return cards
    .slice()
    .sort((a, b) => SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit] || cardValue(a) - cardValue(b));
}

/** Shuffle a fresh deck and deal 13 sorted cards to each seat. */
export function deal(rng: Rng): Card[][] {
  const deck = shuffle(createDeck(), rng);
  return SEATS.map((seat) => sortHand(deck.slice(seat * 13, seat * 13 + 13)));
}

/** Left, right, across, hold — repeating. */
export function passDirection(handIndex: number): PassDirection {
  return (["left", "right", "across", "none"] as const)[((handIndex % 4) + 4) % 4];
}

/** The seat that receives `from`'s passed cards. */
export function passTarget(from: Seat, direction: PassDirection): Seat {
  const offset = { left: 1, right: 3, across: 2, none: 0 }[direction];
  return ((from + offset) % 4) as Seat;
}

function handSeed(seed: number, handNumber: number): number {
  return (seed + Math.imul(handNumber, 0x9e3779b9)) >>> 0;
}

function holderOfTwoOfClubs(hands: Card[][]): Seat {
  const seat = hands.findIndex((hand) => hand.some((c) => c.id === TWO_OF_CLUBS_ID));
  return (seat < 0 ? 0 : seat) as Seat;
}

function dealHand(
  seed: number,
  handNumber: number,
  history: HandResult[],
  totals: number[],
): HeartsState {
  const hands = deal(createRng(handSeed(seed, handNumber)));
  const holding = passDirection(handNumber) === "none";
  return {
    seed,
    handNumber,
    phase: holding ? "playing" : "passing",
    hands,
    taken: [[], [], [], []],
    trick: [],
    turn: holderOfTwoOfClubs(hands),
    tricksPlayed: 0,
    heartsBroken: false,
    lastTrick: null,
    history,
    totals,
  };
}

/** A new game: the first hand dealt from `seed`, everyone at 0. */
export function newGame(seed: number): HeartsState {
  return dealHand(seed, 0, [], [0, 0, 0, 0]);
}

/** Deal the following hand once the score sheet has been seen. */
export function startNextHand(state: HeartsState): HeartsState {
  if (state.phase !== "handOver") return state;
  return dealHand(state.seed, state.handNumber + 1, state.history, state.totals);
}

/**
 * Exchange the passed cards. `passes[seat]` holds that seat's 3 cards (ids
 * or cards). Throws on an invalid pass so bugs surface in tests.
 */
export function applyPass(state: HeartsState, passes: readonly (readonly (Card | string)[])[]): HeartsState {
  if (state.phase !== "passing") return state;
  const direction = passDirection(state.handNumber);
  const outgoing = SEATS.map((seat) => {
    const ids = passes[seat]?.map((c) => (typeof c === "string" ? c : c.id)) ?? [];
    if (ids.length !== PASS_COUNT || new Set(ids).size !== PASS_COUNT) {
      throw new Error(`seat ${seat} must pass ${PASS_COUNT} distinct cards`);
    }
    const cards = ids.map((id) => state.hands[seat].find((c) => c.id === id));
    if (cards.some((c) => !c)) throw new Error(`seat ${seat} passed a card it does not hold`);
    return cards as Card[];
  });
  const hands = state.hands.map((hand, seat) => hand.filter((c) => !outgoing[seat].some((o) => o.id === c.id)));
  SEATS.forEach((from) => hands[passTarget(from, direction)].push(...outgoing[from]));
  const sorted = hands.map(sortHand);
  return { ...state, phase: "playing", hands: sorted, turn: holderOfTwoOfClubs(sorted) };
}

/** Why a card is not playable (for the UI's status line), or null when it is. */
export type IllegalReason =
  | "notYourTurn"
  | "mustLeadTwoOfClubs"
  | "mustFollowSuit"
  | "noPointsFirstTrick"
  | "heartsNotBroken";

export function illegalReason(state: HeartsState, seat: Seat, card: Card): IllegalReason | null {
  if (state.phase !== "playing" || state.turn !== seat || state.trick.length >= 4) return "notYourTurn";
  const hand = state.hands[seat];
  const firstTrick = state.tricksPlayed === 0;
  if (state.trick.length === 0) {
    if (firstTrick) return card.id === TWO_OF_CLUBS_ID ? null : "mustLeadTwoOfClubs";
    if (card.suit === "hearts" && !state.heartsBroken && hand.some((c) => c.suit !== "hearts")) {
      return "heartsNotBroken";
    }
    return null;
  }
  const led = state.trick[0].card.suit;
  if (card.suit !== led && hand.some((c) => c.suit === led)) return "mustFollowSuit";
  if (card.suit !== led && firstTrick && cardPoints(card) > 0 && hand.some((c) => cardPoints(c) === 0)) {
    return "noPointsFirstTrick";
  }
  return null;
}

/** Every card `seat` may play now (empty when it is not their turn). */
export function legalPlays(state: HeartsState, seat: Seat): Card[] {
  return state.hands[seat].filter((card) => illegalReason(state, seat, card) === null);
}

/** Seat that wins a (complete or partial) trick: highest card of the led suit. */
export function trickWinner(trick: readonly TrickPlay[]): Seat {
  if (trick.length === 0) throw new Error("empty trick");
  const led = trick[0].card.suit;
  let best = trick[0];
  for (const play of trick) {
    if (play.card.suit === led && cardValue(play.card) > cardValue(best.card)) best = play;
  }
  return best.seat;
}

/**
 * Play one card. Illegal plays return the state unchanged. A fourth card
 * leaves the full trick on the table; call `collectTrick` to resolve it.
 */
export function playCard(state: HeartsState, seat: Seat, cardId: string): HeartsState {
  const card = state.hands[seat].find((c) => c.id === cardId);
  if (!card || illegalReason(state, seat, card) !== null) return state;
  const hands = state.hands.map((hand, s) => (s === seat ? hand.filter((c) => c.id !== cardId) : hand));
  return {
    ...state,
    hands,
    trick: [...state.trick, { seat, card }],
    turn: ((seat + 1) % 4) as Seat,
    heartsBroken: state.heartsBroken || card.suit === "hearts",
  };
}

/** True when four cards are on the table waiting for `collectTrick`. */
export function isTrickComplete(state: HeartsState): boolean {
  return state.phase === "playing" && state.trick.length === 4;
}

/**
 * Give a full trick to its winner, who leads next. After the 13th trick the
 * hand is scored and the phase becomes `handOver` or `gameOver`.
 */
export function collectTrick(state: HeartsState): HeartsState {
  if (!isTrickComplete(state)) return state;
  const winner = trickWinner(state.trick);
  const taken = state.taken.map((cards, s) => (s === winner ? [...cards, ...state.trick.map((p) => p.card)] : cards));
  const next: HeartsState = {
    ...state,
    taken,
    trick: [],
    turn: winner,
    tricksPlayed: state.tricksPlayed + 1,
    lastTrick: { plays: state.trick, winner },
  };
  if (next.tricksPlayed < 13) return next;
  const result = scoreHand(taken);
  const totals = next.totals.map((total, s) => total + result.points[s]);
  return {
    ...next,
    history: [...next.history, result],
    totals,
    phase: isGameOver(totals) ? "gameOver" : "handOver",
  };
}

/** Points per seat for one hand, with shooting the moon applied. */
export function scoreHand(taken: readonly (readonly Card[])[]): HandResult {
  const raw = taken.map((cards) => cards.reduce((sum, c) => sum + cardPoints(c), 0));
  const moonSeat = raw.findIndex((p) => p === MOON_POINTS);
  if (moonSeat >= 0) {
    return { points: raw.map((_, s) => (s === moonSeat ? 0 : MOON_POINTS)), moon: moonSeat as Seat };
  }
  return { points: raw, moon: null };
}

/** Someone reached the limit (checked at the end of a hand). */
export function isGameOver(totals: readonly number[]): boolean {
  return totals.some((t) => t >= GAME_OVER_SCORE);
}

/** Seats with the lowest total (more than one on a tie). */
export function winners(totals: readonly number[]): Seat[] {
  const low = Math.min(...totals);
  return SEATS.filter((s) => totals[s] === low);
}
