/**
 * FreeCell engine (stage 12): pure and immutable. The React layer renders a
 * `FreeCellGame` and dispatches `play` / `undo` / `newGame`.
 *
 * Deals are numbered 1–32000 and produced from our own seeded RNG, so the same
 * number always gives the same deal (no claim of compatibility with any other
 * numbering scheme).
 */
import { SUITS, alternatesColor, cardColor, createDeck, type Card, type Suit } from "@/lib/games/cards";
import { createRng, randomInt, shuffle, type Rng } from "@/lib/games/rng";

export const MIN_GAME_NUMBER = 1;
export const MAX_GAME_NUMBER = 32000;
export const FREE_CELL_COUNT = 4;
export const COLUMN_COUNT = 8;

export interface FreeCellState {
  gameNumber: number;
  /** Four cells holding at most one card each. */
  freeCells: (Card | null)[];
  /** One pile per suit, in `SUITS` order, Ace at index 0. */
  foundations: Card[][];
  /** Eight tableau columns; the last card is the exposed (top) one. */
  columns: Card[][];
  /** User moves made (auto-moves don't count). */
  moves: number;
}

export type PileKind = "free" | "foundation" | "column";

export interface Location {
  kind: PileKind;
  index: number;
}

export interface Move {
  from: Location;
  to: Location;
  /** Cards moved (> 1 only between columns: a supermove). */
  count: number;
}

export interface FreeCellGame {
  state: FreeCellState;
  /** Snapshots before each user move (with its auto-moves), oldest first. */
  past: FreeCellState[];
}

export function isValidGameNumber(n: number): boolean {
  return Number.isInteger(n) && n >= MIN_GAME_NUMBER && n <= MAX_GAME_NUMBER;
}

export function randomGameNumber(rng: Rng = Math.random): number {
  return MIN_GAME_NUMBER + randomInt(rng, MAX_GAME_NUMBER - MIN_GAME_NUMBER + 1);
}

/** The deal for a game number: 52 face-up cards, left to right over 8 columns. */
export function deal(gameNumber: number): FreeCellState {
  if (!isValidGameNumber(gameNumber)) throw new RangeError(`invalid game number ${gameNumber}`);
  const deck = shuffle(createDeck(), createRng(gameNumber));
  const columns: Card[][] = Array.from({ length: COLUMN_COUNT }, () => []);
  deck.forEach((card, i) => columns[i % COLUMN_COUNT].push(card));
  return {
    gameNumber,
    freeCells: Array(FREE_CELL_COUNT).fill(null),
    foundations: SUITS.map(() => []),
    columns,
    moves: 0,
  };
}

export function foundationIndex(suit: Suit): number {
  return SUITS.indexOf(suit);
}

export function emptyFreeCells(state: FreeCellState): number {
  return state.freeCells.filter((c) => c === null).length;
}

export function emptyColumns(state: FreeCellState): number {
  return state.columns.filter((c) => c.length === 0).length;
}

/**
 * Largest run that can move at once: (empty free cells + 1) × 2^(empty
 * columns), not counting the destination when it is itself an empty column.
 */
export function maxMovable(state: FreeCellState, toEmptyColumn = false): number {
  const columns = Math.max(0, emptyColumns(state) - (toEmptyColumn ? 1 : 0));
  return (emptyFreeCells(state) + 1) * 2 ** columns;
}

/** Whether `lower` can sit on `upper` in the tableau (one rank down, other color). */
export function stacksOn(lower: Card, upper: Card): boolean {
  return lower.rank === upper.rank - 1 && alternatesColor(lower, upper);
}

/** Length of the ordered run (descending, alternating colors) at a column's top. */
export function runLength(column: readonly Card[]): number {
  if (column.length === 0) return 0;
  let n = 1;
  for (let i = column.length - 1; i > 0; i--) {
    if (!stacksOn(column[i], column[i - 1])) break;
    n++;
  }
  return n;
}

/** The top card of a pile (or null). */
export function topCard(state: FreeCellState, loc: Location): Card | null {
  if (loc.kind === "free") return state.freeCells[loc.index] ?? null;
  const pile = loc.kind === "column" ? state.columns[loc.index] : state.foundations[loc.index];
  return pile?.at(-1) ?? null;
}

/** Cards `count` from the top of the source, bottom-most first. */
function movingCards(state: FreeCellState, from: Location, count: number): Card[] | null {
  if (count < 1) return null;
  if (from.kind === "free") {
    const card = state.freeCells[from.index];
    return card && count === 1 ? [card] : null;
  }
  if (from.kind === "foundation") return null; // cards never leave the foundations
  const column = state.columns[from.index];
  if (!column || count > runLength(column)) return null;
  return column.slice(column.length - count);
}

function canPlaceOnFoundation(state: FreeCellState, card: Card): boolean {
  return state.foundations[foundationIndex(card.suit)].length === card.rank - 1;
}

export function isLegalMove(state: FreeCellState, move: Move): boolean {
  const { from, to, count } = move;
  if (from.kind === to.kind && from.index === to.index) return false;
  const cards = movingCards(state, from, count);
  if (!cards) return false;
  const bottom = cards[0];
  switch (to.kind) {
    case "free":
      return count === 1 && to.index >= 0 && to.index < FREE_CELL_COUNT && state.freeCells[to.index] === null;
    case "foundation":
      // Any foundation slot accepts the card: it lands on its suit's pile.
      return count === 1 && canPlaceOnFoundation(state, bottom);
    case "column": {
      const target = state.columns[to.index];
      if (!target) return false;
      if (target.length === 0) return count <= maxMovable(state, true);
      return stacksOn(bottom, target[target.length - 1]) && count <= maxMovable(state, false);
    }
  }
}

/** Apply a legal move (no auto-moves, no move count); throws if illegal. */
export function applyMove(state: FreeCellState, move: Move): FreeCellState {
  if (!isLegalMove(state, move)) throw new Error("illegal move");
  const cards = movingCards(state, move.from, move.count)!;
  const freeCells = state.freeCells.slice();
  const foundations = state.foundations.slice();
  const columns = state.columns.slice();

  if (move.from.kind === "free") freeCells[move.from.index] = null;
  else columns[move.from.index] = columns[move.from.index].slice(0, -move.count);

  if (move.to.kind === "free") freeCells[move.to.index] = cards[0];
  else if (move.to.kind === "foundation") {
    const i = foundationIndex(cards[0].suit);
    foundations[i] = [...foundations[i], cards[0]];
  } else columns[move.to.index] = [...columns[move.to.index], ...cards];

  return { ...state, freeCells, foundations, columns };
}

/** The rank currently topping the foundation of `suit` (0 when empty). */
function foundationRank(state: FreeCellState, suit: Suit): number {
  return state.foundations[foundationIndex(suit)].length;
}

/**
 * Whether a card may go up automatically: it fits its foundation and no
 * tableau card could still need it (rank ≤ 2, or both opposite-color cards of
 * rank − 1 are already up).
 */
export function isSafeAutoMove(state: FreeCellState, card: Card): boolean {
  if (!canPlaceOnFoundation(state, card)) return false;
  if (card.rank <= 2) return true;
  const color = cardColor(card.suit);
  return SUITS.filter((s) => cardColor(s) !== color).every((s) => foundationRank(state, s) >= card.rank - 1);
}

/** Every exposed card's location: free cells, then column tops. */
function sources(state: FreeCellState): Location[] {
  return [
    ...state.freeCells.map((_, index) => ({ kind: "free" as const, index })),
    ...state.columns.map((_, index) => ({ kind: "column" as const, index })),
  ];
}

/** Repeatedly send safe cards to the foundations; returns the moves made and the result. */
export function autoMoves(state: FreeCellState): { state: FreeCellState; moves: Move[] } {
  const moves: Move[] = [];
  let current = state;
  let progressed = true;
  while (progressed) {
    progressed = false;
    for (const from of sources(current)) {
      const card = topCard(current, from);
      if (card && isSafeAutoMove(current, card)) {
        const move: Move = { from, to: { kind: "foundation", index: foundationIndex(card.suit) }, count: 1 };
        current = applyMove(current, move);
        moves.push(move);
        progressed = true;
      }
    }
  }
  return { state: current, moves };
}

/** Every legal single-card move (used to detect a stuck position). */
export function legalMoves(state: FreeCellState): Move[] {
  const out: Move[] = [];
  const targets: Location[] = [
    ...state.freeCells.map((_, index) => ({ kind: "free" as const, index })),
    { kind: "foundation", index: 0 },
    ...state.columns.map((_, index) => ({ kind: "column" as const, index })),
  ];
  for (const from of sources(state)) {
    for (const to of targets) {
      const move = { from, to, count: 1 };
      if (isLegalMove(state, move)) out.push(move);
    }
  }
  return out;
}

export function hasLegalMoves(state: FreeCellState): boolean {
  return legalMoves(state).length > 0;
}

export function isWon(state: FreeCellState): boolean {
  return state.foundations.every((pile) => pile.length === 13);
}

export function cardsLeft(state: FreeCellState): number {
  return 52 - state.foundations.reduce((sum, pile) => sum + pile.length, 0);
}

/**
 * Turn a "pick up from here, drop there" gesture into a legal move. For a
 * column → non-empty column the run length is found from the target (the one
 * card that fits), so selecting just the top card still moves the whole run;
 * for an empty column the selected count is used.
 */
export function resolveMove(state: FreeCellState, from: Location, to: Location, count = 1): Move | null {
  if (from.kind === "column" && to.kind === "column" && state.columns[to.index]?.length) {
    const run = runLength(state.columns[from.index] ?? []);
    for (let n = 1; n <= run; n++) {
      const move = { from, to, count: n };
      if (isLegalMove(state, move)) return move;
    }
    return null;
  }
  if (to.kind === "column") {
    const move = { from, to, count };
    return isLegalMove(state, move) ? move : null;
  }
  const move = { from, to, count: 1 };
  return isLegalMove(state, move) ? move : null;
}

/** Double-click target: the foundation if legal, else the first empty free cell. */
export function quickMove(state: FreeCellState, from: Location): Move | null {
  const card = topCard(state, from);
  if (!card || from.kind === "foundation") return null;
  const up: Move = { from, to: { kind: "foundation", index: foundationIndex(card.suit) }, count: 1 };
  if (isLegalMove(state, up)) return up;
  if (from.kind === "free") return null;
  const cell = state.freeCells.indexOf(null);
  return cell >= 0 ? { from, to: { kind: "free", index: cell }, count: 1 } : null;
}

/* ---------- game with history ---------- */

export function newGame(gameNumber: number): FreeCellGame {
  return { state: autoMoves(deal(gameNumber)).state, past: [] };
}

/**
 * Play a user move followed by its safe auto-moves, as one undoable step.
 * Returns the game unchanged when the move is illegal.
 */
export function play(game: FreeCellGame, move: Move): FreeCellGame {
  if (!isLegalMove(game.state, move)) return game;
  const moved = applyMove(game.state, move);
  const settled = autoMoves({ ...moved, moves: game.state.moves + 1 }).state;
  return { state: settled, past: [...game.past, game.state] };
}

export function canUndo(game: FreeCellGame): boolean {
  return game.past.length > 0;
}

export function undo(game: FreeCellGame): FreeCellGame {
  if (!canUndo(game)) return game;
  return { state: game.past[game.past.length - 1], past: game.past.slice(0, -1) };
}

/** Back to the opening deal of the same number. */
export function restart(game: FreeCellGame): FreeCellGame {
  return newGame(game.state.gameNumber);
}
