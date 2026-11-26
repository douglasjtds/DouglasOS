/**
 * Klondike solitaire engine (stage 12). Pure and immutable: every action
 * takes a state and returns a new one (or the same object when the action is
 * illegal), so the React layer is a thin reducer over these functions.
 *
 * Piles keep their top card LAST. A tableau column is split into its
 * face-down part and its face-up run.
 */
import { alternatesColor, shuffledDeck, type Card } from "@/lib/games/cards";
import { createRng } from "@/lib/games/rng";

export type DrawCount = 1 | 3;

export interface Column {
  faceDown: Card[];
  faceUp: Card[];
}

/** Everything that undo restores (the history itself lives beside it). */
export interface Board {
  drawCount: DrawCount;
  stock: Card[];
  waste: Card[];
  foundations: Card[][];
  tableau: Column[];
  score: number;
  moves: number;
}

export interface SolitaireState extends Board {
  /** Previous boards, oldest first. */
  history: Board[];
}

/** Where a move picks cards up. `start` indexes into the column's face-up run. */
export type Source =
  | { kind: "waste" }
  | { kind: "foundation"; index: number }
  | { kind: "tableau"; index: number; start: number };

export type Target = { kind: "foundation"; index: number } | { kind: "tableau"; index: number };

export interface Move {
  from: Source;
  to: Target;
}

export const FOUNDATION_COUNT = 4;
export const COLUMN_COUNT = 7;

/** Standard scoring. */
export const SCORE = {
  wasteToTableau: 5,
  wasteToFoundation: 10,
  tableauToFoundation: 10,
  flip: 5,
  foundationToTableau: -15,
  recycleDrawOne: -100,
  recycleDrawThree: -20,
} as const;

/** Deal a new game from a seed: columns of 1..7 cards, the top one face up. */
export function deal(seed: number, drawCount: DrawCount = 1): SolitaireState {
  const deck = shuffledDeck(createRng(seed));
  let next = 0;
  const tableau: Column[] = [];
  for (let col = 0; col < COLUMN_COUNT; col++) {
    const cards = deck.slice(next, next + col + 1);
    next += col + 1;
    tableau.push({ faceDown: cards.slice(0, -1), faceUp: cards.slice(-1) });
  }
  return {
    drawCount,
    stock: deck.slice(next),
    waste: [],
    foundations: Array.from({ length: FOUNDATION_COUNT }, () => []),
    tableau,
    score: 0,
    moves: 0,
    history: [],
  };
}

function boardOf(state: SolitaireState): Board {
  const { history: _history, ...board } = state;
  void _history;
  return board;
}

/** Commit a change: push the current board to history, bump moves, clamp score. */
function commit(state: SolitaireState, change: Partial<Board>, scoreDelta = 0): SolitaireState {
  return {
    ...state,
    ...change,
    score: Math.max(0, state.score + scoreDelta),
    moves: state.moves + 1,
    history: [...state.history, boardOf(state)],
  };
}

const last = <T>(items: readonly T[]): T | undefined => items[items.length - 1];

/** The cards a source would pick up (empty when the source is invalid). */
export function cardsAt(state: Board, from: Source): Card[] {
  if (from.kind === "waste") {
    const top = last(state.waste);
    return top ? [top] : [];
  }
  if (from.kind === "foundation") {
    const top = last(state.foundations[from.index] ?? []);
    return top ? [top] : [];
  }
  const column = state.tableau[from.index];
  if (!column || from.start < 0 || from.start >= column.faceUp.length) return [];
  return column.faceUp.slice(from.start);
}

/** Can `card` go on foundation pile `pile`? (Ace on empty, then same suit +1.) */
export function fitsFoundation(card: Card, pile: readonly Card[]): boolean {
  const top = last(pile);
  if (!top) return card.rank === 1;
  return top.suit === card.suit && card.rank === top.rank + 1;
}

/** Can a run led by `card` go on tableau column `column`? */
export function fitsTableau(card: Card, column: Column): boolean {
  const top = last(column.faceUp);
  if (!top) return column.faceDown.length === 0 && card.rank === 13;
  return alternatesColor(card, top) && card.rank === top.rank - 1;
}

function sameSource(from: Source, to: Target): boolean {
  return from.kind === to.kind && from.index === to.index;
}

export function canMove(state: Board, move: Move): boolean {
  const { from, to } = move;
  if (from.kind !== "waste" && sameSource(from, to)) return false;
  const cards = cardsAt(state, from);
  if (cards.length === 0) return false;
  if (to.kind === "foundation") {
    const pile = state.foundations[to.index];
    return !!pile && cards.length === 1 && fitsFoundation(cards[0], pile);
  }
  const column = state.tableau[to.index];
  return !!column && fitsTableau(cards[0], column);
}

function moveScore(from: Source, to: Target): number {
  if (from.kind === "waste") return to.kind === "foundation" ? SCORE.wasteToFoundation : SCORE.wasteToTableau;
  if (from.kind === "tableau") return to.kind === "foundation" ? SCORE.tableauToFoundation : 0;
  return to.kind === "tableau" ? SCORE.foundationToTableau : 0;
}

/** Apply a legal move; an illegal one returns `state` unchanged. */
export function applyMove(state: SolitaireState, move: Move): SolitaireState {
  if (!canMove(state, move)) return state;
  const { from, to } = move;
  const cards = cardsAt(state, from);
  let waste = state.waste;
  const foundations = state.foundations.slice();
  const tableau = state.tableau.slice();

  if (from.kind === "waste") waste = waste.slice(0, -1);
  else if (from.kind === "foundation") foundations[from.index] = foundations[from.index].slice(0, -1);
  else {
    const column = tableau[from.index];
    tableau[from.index] = { ...column, faceUp: column.faceUp.slice(0, from.start) };
  }

  if (to.kind === "foundation") foundations[to.index] = [...foundations[to.index], ...cards];
  else {
    const column = tableau[to.index];
    tableau[to.index] = { ...column, faceUp: [...column.faceUp, ...cards] };
  }

  return commit(state, { waste, foundations, tableau }, moveScore(from, to));
}

/** Turn `drawCount` cards from the stock onto the waste (no-op on an empty stock). */
export function draw(state: SolitaireState): SolitaireState {
  if (state.stock.length === 0) return state;
  const n = Math.min(state.drawCount, state.stock.length);
  const taken = state.stock.slice(-n).reverse();
  return commit(state, { stock: state.stock.slice(0, -n), waste: [...state.waste, ...taken] });
}

export function canRecycle(state: Board): boolean {
  return state.stock.length === 0 && state.waste.length > 0;
}

/** Turn the waste back over into the stock (unlimited redeals), with its penalty. */
export function recycle(state: SolitaireState): SolitaireState {
  if (!canRecycle(state)) return state;
  const penalty = state.drawCount === 1 ? SCORE.recycleDrawOne : SCORE.recycleDrawThree;
  return commit(state, { stock: state.waste.slice().reverse(), waste: [] }, penalty);
}

/** Clicking the stock: draw, or recycle when it is empty. */
export function clickStock(state: SolitaireState): SolitaireState {
  return state.stock.length > 0 ? draw(state) : recycle(state);
}

export function canFlip(state: Board, index: number): boolean {
  const column = state.tableau[index];
  return !!column && column.faceUp.length === 0 && column.faceDown.length > 0;
}

/** Turn over a column's face-down top card (+5). */
export function flip(state: SolitaireState, index: number): SolitaireState {
  if (!canFlip(state, index)) return state;
  const tableau = state.tableau.slice();
  const column = tableau[index];
  tableau[index] = { faceDown: column.faceDown.slice(0, -1), faceUp: [last(column.faceDown)!] };
  return commit(state, { tableau }, SCORE.flip);
}

/** The foundation a single card from `from` could go to, or null. */
export function foundationTargetFor(state: Board, from: Source): Target | null {
  if (from.kind === "foundation") return null;
  if (from.kind === "tableau") {
    const column = state.tableau[from.index];
    if (!column || from.start !== column.faceUp.length - 1) return null;
  }
  for (let index = 0; index < FOUNDATION_COUNT; index++) {
    const to: Target = { kind: "foundation", index };
    if (canMove(state, { from, to })) return to;
  }
  return null;
}

/** Send the top card of `from` to its foundation if legal (double-click). */
export function autoMoveToFoundation(state: SolitaireState, from: Source): SolitaireState {
  const to = foundationTargetFor(state, from);
  return to ? applyMove(state, { from, to }) : state;
}

/** Stock and waste empty and every tableau card face up: the rest is a formality. */
export function canAutoComplete(state: Board): boolean {
  return (
    !isWon(state) &&
    state.stock.length === 0 &&
    state.waste.length === 0 &&
    state.tableau.every((c) => c.faceDown.length === 0)
  );
}

/** One auto-complete step: the lowest playable tableau top card to its foundation. */
export function autoCompleteStep(state: SolitaireState): SolitaireState {
  let best: Source | null = null;
  let bestRank = Infinity;
  state.tableau.forEach((column, index) => {
    const top = last(column.faceUp);
    if (!top || top.rank >= bestRank) return;
    const from: Source = { kind: "tableau", index, start: column.faceUp.length - 1 };
    if (foundationTargetFor(state, from)) {
      best = from;
      bestRank = top.rank;
    }
  });
  return best ? autoMoveToFoundation(state, best) : state;
}

/** Run auto-complete to the end (used when motion is reduced). */
export function autoComplete(state: SolitaireState): SolitaireState {
  let current = state;
  for (;;) {
    const next = autoCompleteStep(current);
    if (next === current) return current;
    current = next;
  }
}

export function isWon(state: Board): boolean {
  return state.foundations.every((pile) => pile.length === 13);
}

export function canUndo(state: SolitaireState): boolean {
  return state.history.length > 0;
}

/** Restore the previous board, score and move count included. */
export function undo(state: SolitaireState): SolitaireState {
  const previous = last(state.history);
  if (!previous) return state;
  return { ...previous, history: state.history.slice(0, -1) };
}
