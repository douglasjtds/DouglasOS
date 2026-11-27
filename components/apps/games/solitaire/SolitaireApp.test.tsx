import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SolitaireApp from "@/components/apps/games/SolitaireApp";
import { renderWithIntl } from "@/test/renderWithIntl";
import { canMove, deal, type Move, type SolitaireState } from "@/lib/games/solitaire/engine";
import type { Rank, Suit } from "@/lib/games/cards";

// Reduced motion: auto-finish is instant and the win skips the cascade.
vi.mock("@/hooks/useReducedMotion", () => ({ useReducedMotion: () => true }));
import { columnX, tableMetrics } from "@/lib/games/solitaire/layout";

/** First seed whose deal has a tableau → tableau move, and that move. */
function seedWithTableauMove(): { seed: number; move: Move } {
  for (let seed = 1; seed < 500; seed++) {
    const s = deal(seed);
    for (let from = 0; from < 7; from++) {
      for (let to = 0; to < 7; to++) {
        const move: Move = { from: { kind: "tableau", index: from, start: 0 }, to: { kind: "tableau", index: to } };
        if (canMove(s, move)) return { seed, move };
      }
    }
  }
  throw new Error("no seed found");
}

/** First seed with a face-up Ace on the table, and its column. */
function seedWithAce(): { seed: number; column: number } {
  for (let seed = 1; seed < 500; seed++) {
    const column = deal(seed).tableau.findIndex((c) => c.faceUp[0].rank === 1);
    if (column >= 0) return { seed, column };
  }
  throw new Error("no seed found");
}

const status = () => document.querySelector("[data-game-status]")!;
const stockButton = () => document.querySelector<HTMLElement>('[data-focus-key="p0"]')!;
const wasteButton = () => document.querySelector<HTMLElement>('[data-focus-key="p1"]')!;
const movesCount = () => Number(document.querySelector("[data-solitaire-moves]")!.getAttribute("data-solitaire-moves"));

describe("SolitaireApp", () => {
  it("renders the dealt table with accessible piles", () => {
    renderWithIntl(<SolitaireApp seed={1} />);
    expect(screen.getByRole("group", { name: "Solitaire table" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Stock, 24 cards/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Waste, empty" })).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /Foundation \d, empty/ })).toHaveLength(4);
    expect(document.querySelectorAll("[data-solitaire-card]:not([data-solitaire-card=''])").length).toBeGreaterThanOrEqual(7);
    expect(status().textContent).toContain("Score: 0");
    expect(status().textContent).toContain("Moves: 0");
  });

  it("clicking the stock turns a card onto the waste", async () => {
    renderWithIntl(<SolitaireApp seed={1} />);
    await userEvent.click(stockButton());
    expect(stockButton().getAttribute("aria-label")).toMatch(/23 cards/);
    expect(wasteButton().getAttribute("aria-label")).toMatch(/^Waste: /);
    expect(movesCount()).toBe(1);
  });

  it("moves a card by click-to-select then click-to-drop", async () => {
    const { seed, move } = seedWithTableauMove();
    if (move.from.kind !== "tableau") throw new Error("unexpected");
    const s = deal(seed);
    const card = s.tableau[move.from.index].faceUp[0];
    const target = s.tableau[move.to.index].faceUp[0];
    renderWithIntl(<SolitaireApp seed={seed} />);

    const source = document.querySelector<HTMLElement>(`[data-solitaire-card="${card.id}"]`)!;
    await userEvent.click(source);
    expect(source.getAttribute("aria-pressed")).toBe("true");
    await userEvent.click(document.querySelector<HTMLElement>(`[data-solitaire-card="${target.id}"]`)!);

    const moved = document.querySelector<HTMLElement>(`[data-solitaire-card="${card.id}"]`)!;
    expect(moved.getAttribute("aria-label")).toContain(`column ${move.to.index + 1}`);
    expect(moved.getAttribute("aria-pressed")).toBe("false");
    expect(movesCount()).toBe(1);
    // The source column now shows its face-down card, ready to turn over (+5).
    const flipButton = document.querySelector<HTMLElement>(`[data-solitaire-flip="${move.from.index}"]`);
    if (flipButton) {
      await userEvent.click(flipButton);
      expect(status().textContent).toContain("Score: 5");
    }
  });

  it("an illegal drop just moves the selection", async () => {
    renderWithIntl(<SolitaireApp seed={1} />);
    const cards = [...document.querySelectorAll<HTMLElement>("[data-solitaire-card]")].filter((el) => el.dataset.solitaireCard);
    const s = deal(1);
    // Two columns whose tops can't stack either way.
    let a = -1;
    let b = -1;
    for (let i = 0; i < 7 && a < 0; i++)
      for (let j = 0; j < 7; j++)
        if (i !== j && !canMove(s, { from: { kind: "tableau", index: i, start: 0 }, to: { kind: "tableau", index: j } })) {
          a = i;
          b = j;
          break;
        }
    const first = cards.find((el) => el.dataset.solitaireCard === s.tableau[a].faceUp[0].id)!;
    const second = cards.find((el) => el.dataset.solitaireCard === s.tableau[b].faceUp[0].id)!;
    await userEvent.click(first);
    await userEvent.click(second);
    expect(first.getAttribute("aria-pressed")).toBe("false");
    expect(second.getAttribute("aria-pressed")).toBe("true");
    expect(movesCount()).toBe(0);
  });

  it("double-click sends an Ace to a foundation (+10)", async () => {
    const { seed, column } = seedWithAce();
    const ace = deal(seed).tableau[column].faceUp[0];
    renderWithIntl(<SolitaireApp seed={seed} />);
    await userEvent.dblClick(document.querySelector<HTMLElement>(`[data-solitaire-card="${ace.id}"]`)!);
    expect(screen.getByRole("button", { name: /^Foundation 1: Ace of / })).toBeTruthy();
    expect(status().textContent).toContain("Score: 10");
  });

  it("F2 deals a new game and Ctrl+Z undoes", async () => {
    renderWithIntl(<SolitaireApp seed={1} />);
    await userEvent.click(stockButton());
    await userEvent.click(stockButton());
    expect(movesCount()).toBe(2);
    await userEvent.keyboard("{Control>}z{/Control}");
    expect(movesCount()).toBe(1);
    await userEvent.keyboard("{F2}");
    expect(movesCount()).toBe(0);
    expect(wasteButton().getAttribute("aria-label")).toBe("Waste, empty");
    expect(stockButton().getAttribute("aria-label")).toMatch(/24 cards/);
  });

  it("is playable from the keyboard: roving focus, Enter, Escape and A", async () => {
    const { seed, column } = seedWithAce();
    renderWithIntl(<SolitaireApp seed={seed} />);
    stockButton().focus();
    await userEvent.keyboard("{Enter}");
    expect(movesCount()).toBe(1);
    expect(document.activeElement).toBe(stockButton());

    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(wasteButton());
    await userEvent.keyboard("{Enter}");
    expect(wasteButton().getAttribute("aria-pressed")).toBe("true");
    await userEvent.keyboard("{Escape}");
    expect(wasteButton().getAttribute("aria-pressed")).toBe("false");

    // Down to column 1 (from the stock), then across to the Ace's column, then A.
    await userEvent.keyboard("{ArrowLeft}{ArrowDown}");
    expect((document.activeElement as HTMLElement).dataset.focusKey).toBe("p6-c0");
    for (let i = 0; i < column; i++) await userEvent.keyboard("{ArrowRight}");
    expect((document.activeElement as HTMLElement).dataset.focusKey).toBe(`p${6 + column}-c0`);
    await userEvent.keyboard("a");
    expect(screen.getByRole("button", { name: /^Foundation 1: Ace of / })).toBeTruthy();
  });

  it("Draw three from the Game menu starts a new game turning three cards", async () => {
    renderWithIntl(<SolitaireApp seed={1} />);
    await userEvent.click(stockButton());
    const trigger = document.querySelector<HTMLElement>('[data-game-menu="game"]')!;
    await userEvent.click(trigger);
    const item = await screen.findByText("Draw three");
    await act(async () => {
      fireEvent.click(item);
    });
    expect(document.querySelector("[data-solitaire-draw]")!.getAttribute("data-solitaire-draw")).toBe("3");
    expect(movesCount()).toBe(0);
    await userEvent.click(stockButton());
    expect(stockButton().getAttribute("aria-label")).toMatch(/21 cards/);
  });

  it("drags a card onto a legal column with the mouse", () => {
    const { seed, move } = seedWithTableauMove();
    if (move.from.kind !== "tableau") throw new Error("unexpected");
    const card = deal(seed).tableau[move.from.index].faceUp[0];
    renderWithIntl(<SolitaireApp seed={seed} />);
    const m = tableMetrics(560); // jsdom: the fallback play-area width
    const source = document.querySelector<HTMLElement>(`[data-solitaire-card="${card.id}"]`)!;
    const x = columnX(m, move.to.index) + m.cardW / 2;
    const y = m.tableauTop + 20;
    const pointer = { pointerId: 1, pointerType: "mouse", button: 0 };
    fireEvent.pointerDown(source, { ...pointer, clientX: 5, clientY: 5 });
    fireEvent.pointerMove(source, { ...pointer, clientX: x, clientY: y });
    fireEvent.pointerUp(source, { ...pointer, clientX: x, clientY: y });
    const moved = document.querySelector<HTMLElement>(`[data-solitaire-card="${card.id}"]`)!;
    expect(moved.getAttribute("aria-label")).toContain(`column ${move.to.index + 1}`);
    expect(movesCount()).toBe(1);
  });

  it("offers Finish when everything is face up, then shows the win dialog", async () => {
    const suits: Suit[] = ["spades", "hearts", "diamonds", "clubs"];
    const tableau = Array.from({ length: 7 }, (_, i) => ({
      faceDown: [],
      faceUp:
        i < 4
          ? Array.from({ length: 13 }, (_, r) => ({ id: `${suits[i]}-${13 - r}`, suit: suits[i], rank: (13 - r) as Rank }))
          : [],
    }));
    const state: SolitaireState = {
      drawCount: 1,
      stock: [],
      waste: [],
      foundations: [[], [], [], []],
      tableau,
      score: 0,
      moves: 0,
      history: [],
    };
    renderWithIntl(<SolitaireApp initialState={state} />);
    await userEvent.click(document.querySelector<HTMLElement>('[data-solitaire-action="finish"]')!);
    expect(await screen.findByTestId("game-over")).toBeTruthy();
    expect(screen.getByTestId("game-over").textContent).toContain("Score: 520");
    expect(document.querySelector('[data-solitaire-action="finish"]')).toBeNull();
    await userEvent.click(document.querySelector<HTMLElement>('[data-game-action="play-again"]')!);
    expect(stockButton().getAttribute("aria-label")).toMatch(/24 cards/);
  });
});
