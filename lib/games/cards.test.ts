import { describe, expect, it } from "vitest";
import {
  alternatesColor,
  cardColor,
  createDeck,
  rankLabel,
  shuffledDeck,
  type Card,
} from "@/lib/games/cards";
import { createRng } from "@/lib/games/rng";

describe("cards", () => {
  it("builds a standard 52-card deck with unique ids", () => {
    const deck = createDeck();
    expect(deck).toHaveLength(52);
    expect(new Set(deck.map((c) => c.id)).size).toBe(52);
  });

  it("builds Spider decks: two decks of 1, 2 or 4 suits are always 104 cards", () => {
    for (const suits of [["spades"], ["spades", "hearts"], undefined] as const) {
      const deck = createDeck({ decks: 2, suits });
      expect(deck).toHaveLength(104);
      expect(new Set(deck.map((c) => c.id)).size).toBe(104);
    }
    expect(createDeck({ decks: 2, suits: ["spades"] }).every((c) => c.suit === "spades")).toBe(true);
  });

  it("rejects suit sets that don't divide the deck", () => {
    expect(() => createDeck({ suits: ["spades", "hearts", "clubs"] })).toThrow();
  });

  it("knows colors and labels", () => {
    expect(cardColor("hearts")).toBe("red");
    expect(cardColor("clubs")).toBe("black");
    const redSeven: Card = { id: "a", suit: "diamonds", rank: 7 };
    const blackSix: Card = { id: "b", suit: "spades", rank: 6 };
    expect(alternatesColor(redSeven, blackSix)).toBe(true);
    expect(alternatesColor(redSeven, { ...redSeven, id: "c" })).toBe(false);
    expect([1, 10, 11, 12, 13].map((r) => rankLabel(r as Card["rank"]))).toEqual(["A", "10", "J", "Q", "K"]);
  });

  it("shuffles deterministically per seed", () => {
    expect(shuffledDeck(createRng(3))).toEqual(shuffledDeck(createRng(3)));
    expect(shuffledDeck(createRng(3))).not.toEqual(shuffledDeck(createRng(4)));
  });
});
