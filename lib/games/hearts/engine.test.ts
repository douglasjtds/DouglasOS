import { describe, expect, it } from "vitest";
import { createRng } from "@/lib/games/rng";
import type { Card } from "@/lib/games/cards";
import {
  applyPass,
  cardValue,
  collectTrick,
  deal,
  illegalReason,
  isGameOver,
  isTrickComplete,
  legalPlays,
  newGame,
  passDirection,
  passTarget,
  playCard,
  scoreHand,
  startNextHand,
  trickWinner,
  winners,
  type HeartsState,
  type Seat,
} from "./engine";
import { aiChoosePass, aiChoosePlay } from "./ai";
import { card, cards, stateWith, trick } from "./testUtils";

const ids = (list: Card[]) => list.map((c) => c.id).sort();

describe("deal", () => {
  it("deals 13 distinct cards to each seat, sorted", () => {
    const hands = deal(createRng(42));
    expect(hands).toHaveLength(4);
    hands.forEach((h) => expect(h).toHaveLength(13));
    expect(new Set(hands.flat().map((c) => c.id)).size).toBe(52);
  });

  it("is deterministic for a seed and differs across seeds", () => {
    expect(deal(createRng(7))).toEqual(deal(createRng(7)));
    expect(deal(createRng(7))).not.toEqual(deal(createRng(8)));
  });
});

describe("passing cycle", () => {
  it("goes left, right, across, none and repeats", () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7].map(passDirection)).toEqual([
      "left", "right", "across", "none", "left", "right", "across", "none",
    ]);
  });

  it("maps seats to targets (play order South → West → North → East)", () => {
    expect(passTarget(0, "left")).toBe(1);
    expect(passTarget(0, "right")).toBe(3);
    expect(passTarget(0, "across")).toBe(2);
    expect(passTarget(3, "left")).toBe(0);
  });

  it("new game starts in passing (left); the 4th hand skips passing", () => {
    const game = newGame(3);
    expect(game.phase).toBe("passing");
    let state: HeartsState = game;
    for (let i = 0; i < 3; i++) state = startNextHand({ ...state, phase: "handOver" });
    expect(state.handNumber).toBe(3);
    expect(state.phase).toBe("playing");
    expect(state.hands[state.turn].some((c) => c.id === "clubs-2")).toBe(true);
  });

  it("applyPass moves 3 cards from each seat to its target and finds the 2♣ holder", () => {
    const game = newGame(11);
    const passes = game.hands.map((h) => h.slice(0, 3));
    const after = applyPass(game, passes);
    expect(after.phase).toBe("playing");
    after.hands.forEach((h) => expect(h).toHaveLength(13));
    // South's passed cards are now West's (left).
    passes[0].forEach((c) => expect(after.hands[1].map((x) => x.id)).toContain(c.id));
    passes[3].forEach((c) => expect(after.hands[0].map((x) => x.id)).toContain(c.id));
    expect(after.hands[after.turn].some((c) => c.id === "clubs-2")).toBe(true);
  });

  it("applyPass accepts ids and rejects bad passes", () => {
    const game = newGame(11);
    const passes = game.hands.map((h) => h.slice(0, 3).map((c) => c.id));
    expect(applyPass(game, passes).phase).toBe("playing");
    expect(() => applyPass(game, [passes[0].slice(0, 2), passes[1], passes[2], passes[3]])).toThrow();
    expect(() => applyPass(game, [passes[1], passes[1], passes[2], passes[3]])).toThrow();
  });

  it("applyPass is a no-op outside the passing phase", () => {
    const s = stateWith(["2C", "3C", "4C", "5C"]);
    expect(applyPass(s, [])).toBe(s);
  });
});

describe("legal plays", () => {
  const firstTrick = { tricksPlayed: 0 };

  it("the 2♣ holder must lead it on the first trick", () => {
    const s = stateWith(["2C 5C AH QS", "3C", "4C", "6C"], firstTrick);
    expect(ids(legalPlays(s, 0))).toEqual(["clubs-2"]);
    expect(illegalReason(s, 0, card("AH"))).toBe("mustLeadTwoOfClubs");
  });

  it("only the seat to play has legal cards", () => {
    const s = stateWith(["2C", "3C", "4C", "6C"], firstTrick);
    expect(legalPlays(s, 1)).toEqual([]);
    expect(illegalReason(s, 1, card("3C"))).toBe("notYourTurn");
  });

  it("must follow suit when possible", () => {
    const s = stateWith(["KD", "5D 9C AH", "", ""], { turn: 1, trick: trick([0, "KD"]) });
    expect(ids(legalPlays(s, 1))).toEqual(["diamonds-5"]);
    expect(illegalReason(s, 1, card("9C"))).toBe("mustFollowSuit");
  });

  it("void players may play anything after the first trick", () => {
    const s = stateWith(["", "9C AH QS", "", ""], { turn: 1, trick: trick([0, "KD"]) });
    expect(ids(legalPlays(s, 1))).toEqual(["clubs-9", "hearts-1", "spades-12"]);
  });

  it("no hearts or Q♠ on the first trick when void, if anything else is held", () => {
    const s = stateWith(["", "9D AH QS", "", ""], { turn: 1, trick: trick([0, "2C"]), ...firstTrick });
    expect(ids(legalPlays(s, 1))).toEqual(["diamonds-9"]);
    expect(illegalReason(s, 1, card("QS"))).toBe("noPointsFirstTrick");
    expect(illegalReason(s, 1, card("AH"))).toBe("noPointsFirstTrick");
  });

  it("points are allowed on the first trick when the hand has nothing else", () => {
    const s = stateWith(["", "AH QS 3H", "", ""], { turn: 1, trick: trick([0, "2C"]), ...firstTrick });
    expect(ids(legalPlays(s, 1))).toEqual(["hearts-1", "hearts-3", "spades-12"]);
  });

  it("hearts can't be led until broken", () => {
    const s = stateWith(["5H 9C QS", "", "", ""]);
    expect(ids(legalPlays(s, 0))).toEqual(["clubs-9", "spades-12"]);
    expect(illegalReason(s, 0, card("5H"))).toBe("heartsNotBroken");
    expect(ids(legalPlays({ ...s, heartsBroken: true }, 0))).toHaveLength(3);
  });

  it("hearts may be led when only hearts remain", () => {
    const s = stateWith(["5H 9H", "", "", ""]);
    expect(ids(legalPlays(s, 0))).toEqual(["hearts-5", "hearts-9"]);
  });

  it("nothing is legal while a full trick waits or outside play", () => {
    const full = stateWith(["5C", "", "", ""], {
      trick: trick([1, "2C"], [2, "3C"], [3, "4C"], [0, "6C"]),
    });
    expect(legalPlays(full, 0)).toEqual([]);
    expect(legalPlays({ ...stateWith(["5C"]), phase: "handOver" }, 0)).toEqual([]);
  });
});

describe("playing and collecting tricks", () => {
  it("trick winner is the highest card of the led suit (ace high)", () => {
    expect(trickWinner(trick([0, "5C"], [1, "KC"], [2, "AH"], [3, "2C"]))).toBe(1);
    expect(trickWinner(trick([2, "10D"], [3, "AD"], [0, "QS"], [1, "KD"]))).toBe(3);
    expect(trickWinner(trick([1, "3S"]))).toBe(1);
    expect(() => trickWinner([])).toThrow();
    expect(cardValue(card("AS"))).toBe(14);
  });

  it("playCard removes the card, advances the turn and breaks hearts", () => {
    const s = stateWith(["9C", "", "", ""], { turn: 1, trick: trick([0, "2C"]) });
    const s2 = { ...s, hands: [[], cards("AH 3D"), [], []] };
    const next = playCard(s2, 1, "hearts-1");
    expect(next.hands[1].map((c) => c.id)).toEqual(["diamonds-3"]);
    expect(next.trick).toHaveLength(2);
    expect(next.turn).toBe(2);
    expect(next.heartsBroken).toBe(true);
  });

  it("illegal or unknown plays leave the state unchanged", () => {
    const s = stateWith(["5H 9C", "", "", ""]);
    expect(playCard(s, 0, "hearts-5")).toBe(s);
    expect(playCard(s, 0, "spades-1")).toBe(s);
    expect(playCard(s, 1, "clubs-9")).toBe(s);
  });

  it("a full trick waits, then goes to the winner who leads next", () => {
    let s = stateWith(["9C 4D", "KC 5D", "3C 6D", "AH 7D"], { tricksPlayed: 2, heartsBroken: true });
    s = playCard(s, 0, "clubs-9");
    s = playCard(s, 1, "clubs-13");
    s = playCard(s, 2, "clubs-3");
    s = playCard(s, 3, "hearts-1");
    expect(isTrickComplete(s)).toBe(true);
    expect(legalPlays(s, 0)).toEqual([]);
    const after = collectTrick(s);
    expect(after.trick).toEqual([]);
    expect(after.turn).toBe(1);
    expect(after.tricksPlayed).toBe(3);
    expect(after.taken[1]).toHaveLength(4);
    expect(after.lastTrick?.winner).toBe(1);
    expect(collectTrick(after)).toBe(after);
  });
});

describe("scoring", () => {
  it("each heart is 1 and Q♠ is 13", () => {
    const result = scoreHand([cards("AH 2H QS"), cards("3H"), cards("2C 3C"), []]);
    expect(result).toEqual({ points: [15, 1, 0, 0], moon: null });
  });

  it("shooting the moon: the shooter scores 0, everyone else 26", () => {
    const all = cards("AH 2H 3H 4H 5H 6H 7H 8H 9H 10H JH QH KH QS 2C");
    expect(scoreHand([[], [], all, cards("3C")])).toEqual({ points: [26, 26, 0, 26], moon: 2 });
  });

  it("game over at 100 or more; the lowest total wins (ties share)", () => {
    expect(isGameOver([99, 50, 20, 0])).toBe(false);
    expect(isGameOver([100, 50, 20, 0])).toBe(true);
    expect(winners([100, 50, 20, 20])).toEqual([2, 3]);
    expect(winners([104, 12, 40, 33])).toEqual([1]);
  });

  it("the 13th trick scores the hand and adds to totals", () => {
    const s = stateWith(["QS", "AS", "3S", "2S"], {
      tricksPlayed: 12,
      taken: [cards("AH 2H"), [], [], cards("3H")],
      totals: [10, 20, 30, 40],
    });
    let n = playCard(s, 0, "spades-12");
    n = playCard(n, 1, "spades-1");
    n = playCard(n, 2, "spades-3");
    n = playCard(n, 3, "spades-2");
    const done = collectTrick(n);
    expect(done.phase).toBe("handOver");
    expect(done.history).toEqual([{ points: [2, 13, 0, 1], moon: null }]);
    expect(done.totals).toEqual([12, 33, 30, 41]);
  });

  it("the game ends when a total reaches 100 at the end of a hand", () => {
    const s = stateWith(["QS", "AS", "3S", "2S"], { tricksPlayed: 12, totals: [10, 90, 30, 40] });
    let n = playCard(s, 0, "spades-12");
    n = playCard(n, 1, "spades-1");
    n = playCard(n, 2, "spades-3");
    n = playCard(n, 3, "spades-2");
    const done = collectTrick(n);
    expect(done.phase).toBe("gameOver");
    expect(done.totals[1]).toBe(103);
    expect(startNextHand(done)).toBe(done);
  });

  it("startNextHand keeps totals/history and advances the pass direction", () => {
    const s = { ...newGame(5), phase: "handOver" as const, totals: [3, 4, 5, 14], history: [{ points: [3, 4, 5, 14], moon: null }] };
    const next = startNextHand(s);
    expect(next.handNumber).toBe(1);
    expect(next.totals).toEqual([3, 4, 5, 14]);
    expect(next.history).toHaveLength(1);
    expect(next.phase).toBe("passing");
    expect(next.hands).not.toEqual(s.hands);
  });
});

describe("full simulated game", () => {
  /** Plays whole games with the AI in every seat; checks invariants each step. */
  function simulate(seed: number) {
    let state = newGame(seed);
    let guard = 0;
    while (state.phase !== "gameOver" && guard++ < 5000) {
      if (state.phase === "passing") {
        state = applyPass(state, state.hands.map((h) => aiChoosePass(h)));
      } else if (state.phase === "handOver") {
        const pointsThisHand = state.history[state.history.length - 1].points;
        expect(pointsThisHand.reduce((a, b) => a + b, 0)).toSatisfy((n: number) => n === 26 || n === 78);
        state = startNextHand(state);
      } else if (isTrickComplete(state)) {
        state = collectTrick(state);
      } else {
        const seat = state.turn as Seat;
        const choice = aiChoosePlay(state, seat);
        expect(legalPlays(state, seat).map((c) => c.id)).toContain(choice.id);
        state = playCard(state, seat, choice.id);
      }
    }
    return state;
  }

  it("always finishes with someone at 100+ and is deterministic", () => {
    for (const seed of [1, 2, 3, 99, 12345]) {
      const end = simulate(seed);
      expect(end.phase).toBe("gameOver");
      expect(isGameOver(end.totals)).toBe(true);
      expect(end.totals.reduce((a, b) => a + b, 0) % 26).toBe(0);
    }
    expect(simulate(77).totals).toEqual(simulate(77).totals);
  });
});
