"use client";

import { useCallback, useEffect, useReducer } from "react";
import { randomSeed } from "@/lib/games/rng";
import { aiChoosePass, aiChoosePlay } from "@/lib/games/hearts/ai";
import {
  HUMAN,
  applyPass,
  collectTrick,
  isTrickComplete,
  newGame,
  playCard,
  startNextHand,
  type HeartsState,
  type Seat,
} from "@/lib/games/hearts/engine";

/** Pacing (ms): each computer play, and the pause before a full trick is collected. */
export const AI_DELAY = 350;
export const AI_DELAY_REDUCED = 0;
export const COLLECT_DELAY = 1000;
export const COLLECT_DELAY_REDUCED = 600;

type Action =
  | { type: "new"; seed: number }
  | { type: "pass"; cardIds: string[] }
  | { type: "play"; seat: Seat; cardId: string }
  | { type: "collect" }
  | { type: "next" };

function reducer(state: HeartsState, action: Action): HeartsState {
  switch (action.type) {
    case "new":
      return newGame(action.seed);
    case "pass":
      return applyPass(
        state,
        state.hands.map((hand, seat) => (seat === HUMAN ? action.cardIds : aiChoosePass(hand))),
      );
    case "play":
      return playCard(state, action.seat, action.cardId);
    case "collect":
      return collectTrick(state);
    case "next":
      return startNextHand(state);
  }
}

/**
 * Hearts state + the computer players' pacing. Timers live in effects keyed
 * on the state, so a new game, a new state or unmounting cancels them.
 */
export function useHeartsGame({ reducedMotion, initialSeed }: { reducedMotion: boolean; initialSeed?: number }) {
  const [state, dispatch] = useReducer(reducer, initialSeed, (seed) => newGame(seed ?? randomSeed()));

  useEffect(() => {
    if (state.phase !== "playing") return;
    let timer: ReturnType<typeof setTimeout>;
    if (isTrickComplete(state)) {
      timer = setTimeout(() => dispatch({ type: "collect" }), reducedMotion ? COLLECT_DELAY_REDUCED : COLLECT_DELAY);
    } else if (state.turn !== HUMAN) {
      const seat = state.turn;
      timer = setTimeout(
        () => dispatch({ type: "play", seat, cardId: aiChoosePlay(state, seat).id }),
        reducedMotion ? AI_DELAY_REDUCED : AI_DELAY,
      );
    } else {
      return;
    }
    return () => clearTimeout(timer);
  }, [state, reducedMotion]);

  const newGameAction = useCallback((seed?: number) => dispatch({ type: "new", seed: seed ?? randomSeed() }), []);
  const pass = useCallback((cardIds: string[]) => dispatch({ type: "pass", cardIds }), []);
  const play = useCallback((cardId: string) => dispatch({ type: "play", seat: HUMAN, cardId }), []);
  const nextHand = useCallback(() => dispatch({ type: "next" }), []);

  return { state, newGame: newGameAction, pass, play, nextHand };
}
