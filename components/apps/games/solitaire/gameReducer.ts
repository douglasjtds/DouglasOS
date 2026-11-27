import {
  applyMove,
  autoComplete,
  autoCompleteStep,
  autoMoveToFoundation,
  clickStock,
  deal,
  flip,
  undo,
  type DrawCount,
  type Move,
  type SolitaireState,
  type Source,
} from "@/lib/games/solitaire/engine";

export type GameAction =
  | { type: "new"; seed: number; drawCount: DrawCount }
  | { type: "stock" }
  | { type: "move"; move: Move }
  | { type: "flip"; index: number }
  | { type: "toFoundation"; from: Source }
  | { type: "autoStep" }
  | { type: "autoAll" }
  | { type: "undo" };

/** Thin reducer over the pure engine: the UI only dispatches these. */
export function gameReducer(state: SolitaireState, action: GameAction): SolitaireState {
  switch (action.type) {
    case "new":
      return deal(action.seed, action.drawCount);
    case "stock":
      return clickStock(state);
    case "move":
      return applyMove(state, action.move);
    case "flip":
      return flip(state, action.index);
    case "toFoundation":
      return autoMoveToFoundation(state, action.from);
    case "autoStep":
      return autoCompleteStep(state);
    case "autoAll":
      return autoComplete(state);
    case "undo":
      return undo(state);
  }
}
