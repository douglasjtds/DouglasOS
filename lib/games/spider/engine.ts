/**
 * Spider Solitaire rules (stage 12): two decks on ten columns, build down
 * regardless of suit, move only same-suit runs, deal a row from the stock
 * (never onto an empty column), and complete King→Ace same-suit runs, which
 * leave the table. Pure and immutable: every function returns a new state.
 */
import { createDeck, type Card, type Suit } from "@/lib/games/cards";
import { createRng, shuffle } from "@/lib/games/rng";

export type SuitCount = 1 | 2 | 4;

export const SUIT_COUNTS: readonly SuitCount[] = [1, 2, 4];
export const COLUMN_COUNT = 10;
export const RUNS_TO_WIN = 8;
export const STARTING_SCORE = 500;
export const RUN_BONUS = 100;
const RUN_LENGTH = 13;

const SUITS_BY_COUNT: Record<SuitCount, readonly Suit[]> = {
  1: ["spades"],
  2: ["spades", "hearts"],
  4: ["spades", "hearts", "diamonds", "clubs"],
};

export interface TableauCard {
  card: Card;
  faceUp: boolean;
}

export type Column = readonly TableauCard[];

export interface SpiderState {
  suitCount: SuitCount;
  /** Ten columns; index 0 is the bottom (first dealt) card. */
  columns: readonly Column[];
  /** Undealt cards; each row deal takes the next ten from the front. */
  stock: readonly Card[];
  /** Suit of each completed King→Ace run, in completion order. */
  completed: readonly Suit[];
  /** Moves made so far (card moves and row deals). */
  moves: number;
}

export interface Move {
  from: number;
  /** Index in the source column of the bottom card of the moved run. */
  index: number;
  to: number;
}

export type DealBlock = "empty-stock" | "empty-column";

/** Suits used by a difficulty level. */
export function suitsFor(suitCount: SuitCount): readonly Suit[] {
  return SUITS_BY_COUNT[suitCount];
}

/**
 * A new seeded game: 104 cards, 54 on the table (the first four columns get
 * six, the other six get five; only each top card is face up), 50 in stock.
 */
export function deal(seed: number, suitCount: SuitCount = 1): SpiderState {
  const cards = shuffle(createDeck({ decks: 2, suits: suitsFor(suitCount) }), createRng(seed));
  const columns: TableauCard[][] = [];
  let next = 0;
  for (let c = 0; c < COLUMN_COUNT; c++) {
    const size = c < 4 ? 6 : 5;
    const column: TableauCard[] = [];
    for (let i = 0; i < size; i++) {
      column.push({ card: cards[next++], faceUp: i === size - 1 });
    }
    columns.push(column);
  }
  return { suitCount, columns, stock: cards.slice(next), completed: [], moves: 0 };
}

/** Whether `upper` can sit directly on `lower` in a movable run (same suit, one lower). */
function continuesRun(lower: TableauCard, upper: TableauCard): boolean {
  return (
    lower.faceUp &&
    upper.faceUp &&
    lower.card.suit === upper.card.suit &&
    lower.card.rank === upper.card.rank + 1
  );
}

/**
 * Whether the card at `index` (and everything above it) can be picked up:
 * all face up, descending by one and of a single suit.
 */
export function canPickUp(column: Column, index: number): boolean {
  if (index < 0 || index >= column.length || !column[index].faceUp) return false;
  for (let i = index; i < column.length - 1; i++) {
    if (!continuesRun(column[i], column[i + 1])) return false;
  }
  return true;
}

/** Index of the lowest card of the movable run on top of `column` (-1 if empty). */
export function movableRunStart(column: Column): number {
  if (column.length === 0) return -1;
  let i = column.length - 1;
  while (i > 0 && continuesRun(column[i - 1], column[i])) i--;
  return i;
}

/** Whether `card` may be dropped on `column`: onto an empty column or a card one rank higher. */
export function canDrop(column: Column, card: Card): boolean {
  if (column.length === 0) return true;
  const top = column[column.length - 1];
  return top.faceUp && top.card.rank === card.rank + 1;
}

/** Whether `move` is legal in `state`. */
export function isLegalMove(state: SpiderState, { from, index, to }: Move): boolean {
  if (from === to) return false;
  const source = state.columns[from];
  const target = state.columns[to];
  if (!source || !target || !canPickUp(source, index)) return false;
  return canDrop(target, source[index].card);
}

/** Flip a face-down top card face up. */
function flipTop(column: TableauCard[]): TableauCard[] {
  const top = column[column.length - 1];
  if (top && !top.faceUp) return [...column.slice(0, -1), { ...top, faceUp: true }];
  return column;
}

/** Remove a complete King→Ace same-suit run from the top of a column, if there is one. */
function takeCompletedRun(column: TableauCard[]): { column: TableauCard[]; suit: Suit | null } {
  if (column.length < RUN_LENGTH) return { column, suit: null };
  const start = column.length - RUN_LENGTH;
  if (column[start].card.rank !== 13 || !canPickUp(column, start)) return { column, suit: null };
  // A movable run from a King spanning 13 cards ends on the Ace.
  return { column: flipTop(column.slice(0, start)), suit: column[start].card.suit };
}

/** Clear completed runs from the given columns, recording them as completed. */
function settle(state: SpiderState, columns: TableauCard[][], touched: readonly number[]): SpiderState {
  const completed = [...state.completed];
  for (const c of touched) {
    const result = takeCompletedRun(columns[c]);
    if (result.suit) {
      columns[c] = result.column;
      completed.push(result.suit);
    }
  }
  return { ...state, columns, completed };
}

/**
 * Apply a legal move (an illegal one returns `state` unchanged): moves the
 * run, flips the newly exposed card, removes a run it completes, counts a move.
 */
export function applyMove(state: SpiderState, move: Move): SpiderState {
  if (!isLegalMove(state, move)) return state;
  const { from, index, to } = move;
  const columns = state.columns.map((c) => c as TableauCard[]);
  const run = columns[from].slice(index);
  columns[from] = flipTop(columns[from].slice(0, index));
  columns[to] = [...columns[to], ...run];
  return settle({ ...state, moves: state.moves + 1 }, columns, [to]);
}

/** Why a row can't be dealt right now, or `null` if it can. */
export function dealBlock(state: SpiderState): DealBlock | null {
  if (state.stock.length === 0) return "empty-stock";
  if (state.columns.some((c) => c.length === 0)) return "empty-column";
  return null;
}

/**
 * Deal one face-up card onto every column (blocked while the stock is empty
 * or any column is empty: returns `state` unchanged). Counts as a move and
 * may complete runs.
 */
export function dealRow(state: SpiderState): SpiderState {
  if (dealBlock(state)) return state;
  const row = state.stock.slice(0, COLUMN_COUNT);
  const columns = state.columns.map((c, i) => [...c, { card: row[i], faceUp: true }]);
  return settle(
    { ...state, stock: state.stock.slice(COLUMN_COUNT), moves: state.moves + 1 },
    columns,
    columns.map((_, i) => i),
  );
}

/** Rows still in the stock (0–5). */
export function dealsLeft(state: SpiderState): number {
  return Math.ceil(state.stock.length / COLUMN_COUNT);
}

/** 500, −1 per move (row deals included), +100 per completed run. */
export function score(state: SpiderState): number {
  return STARTING_SCORE - state.moves + RUN_BONUS * state.completed.length;
}

export function isWon(state: SpiderState): boolean {
  return state.completed.length >= RUNS_TO_WIN;
}

/** Every legal move, in column order. */
export function legalMoves(state: SpiderState): Move[] {
  const moves: Move[] = [];
  state.columns.forEach((column, from) => {
    const start = movableRunStart(column);
    if (start < 0) return;
    for (let index = start; index < column.length; index++) {
      state.columns.forEach((_, to) => {
        const move = { from, index, to };
        if (isLegalMove(state, move)) moves.push(move);
      });
    }
  });
  return moves;
}

/**
 * How useful a move is for hints (null = pointless: it just shuffles cards
 * sideways, e.g. splitting a same-suit run or moving a whole column into an
 * empty one).
 */
function moveValue(state: SpiderState, { from, index, to }: Move): number | null {
  const source = state.columns[from];
  const target = state.columns[to];
  const card = source[index].card;
  const below = index > 0 ? source[index - 1] : null;
  const top = target.length > 0 ? target[target.length - 1].card : null;
  const sameSuit = top !== null && top.suit === card.suit;
  if (below === null && top === null) return null;
  if (below?.faceUp && below.card.rank === card.rank + 1) {
    // The card already sits on a valid base: only worth it to switch to its own suit.
    if (below.card.suit === card.suit || !sameSuit) return null;
  }
  let value = 0;
  if (sameSuit) value += 4;
  if (below && !below.faceUp) value += 3;
  if (below === null) value += 2;
  if (top === null) value -= 1;
  return value;
}

/**
 * One helpful move, preferring same-suit builds and uncovering face-down
 * cards; `null` when only pointless (or no) moves remain.
 */
export function findHint(state: SpiderState): Move | null {
  let best: Move | null = null;
  let bestValue = -Infinity;
  for (const move of legalMoves(state)) {
    const value = moveValue(state, move);
    if (value !== null && value > bestValue) {
      best = move;
      bestValue = value;
    }
  }
  return best;
}

/**
 * Best destination for the run starting at `index` (double-click): a same-suit
 * card one rank higher, then any card one rank higher, then an empty column.
 * `null` if the run can't move anywhere.
 */
export function bestDestination(state: SpiderState, from: number, index: number): number | null {
  const source = state.columns[from];
  if (!source || !canPickUp(source, index)) return null;
  const card = source[index].card;
  let fallback: number | null = null;
  let empty: number | null = null;
  for (let step = 1; step < COLUMN_COUNT; step++) {
    const to = (from + step) % COLUMN_COUNT;
    const target = state.columns[to];
    if (!canDrop(target, card)) continue;
    if (target.length === 0) {
      // Moving a whole column into an empty one changes nothing.
      if (index > 0) empty ??= to;
      continue;
    }
    if (target[target.length - 1].card.suit === card.suit) return to;
    fallback ??= to;
  }
  return fallback ?? empty;
}
