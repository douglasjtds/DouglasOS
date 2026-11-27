/**
 * Spider Solitaire game with undo (stage 12): the current state plus the
 * snapshots before each move or row deal. States are immutable, so a snapshot
 * is just a reference. Undoing a move that completed a run restores both.
 */
import {
  applyMove,
  deal,
  dealRow,
  type Move,
  type SpiderState,
  type SuitCount,
} from "@/lib/games/spider/engine";

export interface SpiderGame {
  state: SpiderState;
  /** Earlier states, oldest first. */
  history: readonly SpiderState[];
}

export type SpiderAction =
  | { type: "new"; seed: number; suitCount: SuitCount }
  | { type: "move"; move: Move }
  | { type: "deal" }
  | { type: "undo" };

export function newGame(seed: number, suitCount: SuitCount = 1): SpiderGame {
  return { state: deal(seed, suitCount), history: [] };
}

/** Record `next` if it differs from the current state (illegal actions are no-ops). */
function advance(game: SpiderGame, next: SpiderState): SpiderGame {
  if (next === game.state) return game;
  return { state: next, history: [...game.history, game.state] };
}

export function canUndo(game: SpiderGame): boolean {
  return game.history.length > 0;
}

export function undo(game: SpiderGame): SpiderGame {
  if (!canUndo(game)) return game;
  return { state: game.history[game.history.length - 1], history: game.history.slice(0, -1) };
}

/** Reducer for `useReducer`. */
export function spiderReducer(game: SpiderGame, action: SpiderAction): SpiderGame {
  switch (action.type) {
    case "new":
      return newGame(action.seed, action.suitCount);
    case "move":
      return advance(game, applyMove(game.state, action.move));
    case "deal":
      return advance(game, dealRow(game.state));
    case "undo":
      return undo(game);
  }
}
