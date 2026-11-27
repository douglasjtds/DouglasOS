import { useReducer } from "react";
import { randomSeed } from "@/lib/games/rng";
import {
  DIFFICULTIES,
  activate,
  chord,
  newGame,
  reveal,
  setQuestionMarks,
  toggleFlag,
  type Difficulty,
  type MinesGame,
} from "@/lib/games/mines/engine";

export interface MinesState {
  difficulty: Difficulty;
  game: MinesGame;
}

export type MinesAction =
  | { type: "new"; seed: number; difficulty?: Difficulty }
  | { type: "reveal"; index: number }
  | { type: "activate"; index: number }
  | { type: "chord"; index: number }
  | { type: "flag"; index: number }
  | { type: "marks"; on: boolean };

export function minesReducer(state: MinesState, action: MinesAction): MinesState {
  const { game } = state;
  let next: MinesGame;
  switch (action.type) {
    case "new": {
      const difficulty = action.difficulty ?? state.difficulty;
      return {
        difficulty,
        game: newGame(DIFFICULTIES[difficulty], action.seed, { questionMarks: game.questionMarks }),
      };
    }
    case "reveal":
      next = reveal(game, action.index);
      break;
    case "activate":
      next = activate(game, action.index);
      break;
    case "chord":
      next = chord(game, action.index);
      break;
    case "flag":
      next = toggleFlag(game, action.index);
      break;
    case "marks":
      next = setQuestionMarks(game, action.on);
      break;
  }
  return next === game ? state : { ...state, game: next };
}

function init({ difficulty, seed }: { difficulty: Difficulty; seed?: number }): MinesState {
  return { difficulty, game: newGame(DIFFICULTIES[difficulty], seed ?? randomSeed()) };
}

/** The Mines game state: a reducer over the pure engine. */
export function useMinesGame(initialSeed?: number) {
  return useReducer(minesReducer, { difficulty: "beginner" as Difficulty, seed: initialSeed }, init);
}
