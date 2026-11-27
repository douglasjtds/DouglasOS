import { describe, expect, it } from "vitest";
import { aiChoosePass, aiChoosePlay } from "./ai";
import { cards, stateWith, trick } from "./testUtils";
import type { Card } from "@/lib/games/cards";

const ids = (list: Card[]) => list.map((c) => c.id);

describe("aiChoosePass", () => {
  it("dumps the queen/king/ace of spades first", () => {
    const hand = cards("QS KS AS AH KH 2C 3C 4D 5D 6D 7D 8D 9D");
    expect(ids(aiChoosePass(hand))).toEqual(["spades-1", "spades-13", "spades-12"]);
  });

  it("then high hearts", () => {
    const hand = cards("QS AH JH 10H 2C 3C 4C 5D 6D 7D 8D 9D 2S");
    expect(ids(aiChoosePass(hand))).toEqual(["spades-12", "hearts-1", "hearts-11"]);
  });

  it("voids a short side suit when it fits", () => {
    const hand = cards("KC 2D 3D 4D 5D 6D 7D 8D 2S 3S 4S 2H 3H");
    expect(ids(aiChoosePass(hand))).toEqual(["clubs-13", "diamonds-8", "diamonds-7"]);
  });

  it("otherwise passes the highest cards, always exactly 3 distinct", () => {
    const hand = cards("2C 3C 4C 5C 2D 3D 4D 5D 9D 2S 3S 4S 10S");
    expect(ids(aiChoosePass(hand))).toEqual(["spades-10", "diamonds-9", "clubs-5"]);
  });
});

describe("aiChoosePlay", () => {
  it("leads 2♣ on the first trick", () => {
    const s = stateWith(["2C 9C AH", "", "", ""], { tricksPlayed: 0 });
    expect(aiChoosePlay(s, 0).id).toBe("clubs-2");
  });

  it("leads low in a safe suit (no hearts, no Q♠, no A/K♠ while the queen is out)", () => {
    const s = stateWith(["AS 2H 9D 5C QS", "", "", ""], { heartsBroken: true });
    expect(aiChoosePlay(s, 0).id).toBe("clubs-5");
    const s2 = stateWith(["AS 2H", "", "", ""], { heartsBroken: true });
    expect(aiChoosePlay(s2, 0).id).toBe("hearts-2");
  });

  it("follows with the highest card that still loses", () => {
    const s = stateWith(["", "3D 8D JD KD", "", ""], { turn: 1, trick: trick([0, "10D"]) });
    expect(aiChoosePlay(s, 1).id).toBe("diamonds-8");
  });

  it("plays the highest when every card wins, but keeps the queen back", () => {
    const s = stateWith(["", "QS KS", "", ""], { turn: 1, trick: trick([0, "5S"]) });
    expect(aiChoosePlay(s, 1).id).toBe("spades-13");
    const s2 = stateWith(["", "JD KD", "", ""], { turn: 1, trick: trick([0, "5D"]) });
    expect(aiChoosePlay(s2, 1).id).toBe("diamonds-13");
  });

  it("drops the queen under a higher spade", () => {
    const s = stateWith(["", "QS 3S", "", ""], { turn: 1, trick: trick([0, "AS"]) });
    expect(aiChoosePlay(s, 1).id).toBe("spades-12");
  });

  it("when void: sloughs Q♠, then the highest heart, then big spades", () => {
    const base = { turn: 1 as const, trick: trick([0, "5C"]) };
    expect(aiChoosePlay(stateWith(["", "QS AH 9D", "", ""], base), 1).id).toBe("spades-12");
    expect(aiChoosePlay(stateWith(["", "3H KH 9D", "", ""], base), 1).id).toBe("hearts-13");
    expect(aiChoosePlay(stateWith(["", "AS 9D", "", ""], base), 1).id).toBe("spades-1");
    expect(aiChoosePlay(stateWith(["", "4S 9D", "", ""], base), 1).id).toBe("diamonds-9");
  });

  it("respects the first-trick restriction when void", () => {
    const s = stateWith(["", "QS AH 4D", "", ""], { turn: 1, trick: trick([0, "2C"]), tricksPlayed: 0 });
    expect(aiChoosePlay(s, 1).id).toBe("diamonds-4");
  });

  it("throws when it has nothing legal", () => {
    expect(() => aiChoosePlay(stateWith(["5C", "", "", ""]), 1)).toThrow();
  });
});
