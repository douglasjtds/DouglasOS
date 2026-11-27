import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen, within } from "@testing-library/react";
import { renderWithIntl } from "@/test/renderWithIntl";
import { deal, findHint, type Move } from "@/lib/games/spider/engine";
import SpiderApp from "@/components/apps/games/SpiderApp";

/** First seed whose 1-suit deal has a helpful move, so the UI tests can play it. */
const { SEED, HINT } = (() => {
  for (let seed = 1; ; seed++) {
    const hint = findHint(deal(seed, 1));
    if (hint) return { SEED: seed, HINT: hint as Move };
  }
})();

const seed = vi.hoisted(() => ({ value: 1 }));
seed.value = SEED;

vi.mock("@/lib/games/rng", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/games/rng")>()),
  randomSeed: () => seed.value,
}));

const column = (i: number) => document.querySelector<HTMLElement>(`[data-spider-column="${i}"]`)!;
const cardButton = (col: number, index: number) =>
  column(col).querySelector<HTMLElement>(`[data-spider-index="${index}"]`)!;
const topButton = (col: number) => {
  const buttons = column(col).querySelectorAll<HTMLElement>("[data-spider-index]");
  return buttons[buttons.length - 1];
};
const status = () => document.querySelector<HTMLElement>("[data-game-status]")!;
const stock = () => document.querySelector<HTMLElement>("[data-spider-stock]")!;
const shell = () => document.querySelector<HTMLElement>('[data-game="spider"]')!;

describe("SpiderApp", () => {
  it("renders ten columns, a five-deal stock and the starting score", () => {
    renderWithIntl(<SpiderApp />);
    expect(document.querySelectorAll("[data-spider-column]")).toHaveLength(10);
    expect(stock()).toHaveAttribute("data-spider-stock", "5");
    expect(within(status()).getByText("Score: 500")).toBeInTheDocument();
    expect(within(status()).getByText("Moves: 0")).toBeInTheDocument();
    // Only the top card of each column is a (face-up) card button.
    expect(document.querySelectorAll("[data-spider-index]")).toHaveLength(10);
    expect(screen.getByRole("region", { name: "Spider Solitaire table" })).toBeInTheDocument();
  });

  it("plays a legal move by clicking the run, then the destination", () => {
    renderWithIntl(<SpiderApp />);
    fireEvent.click(cardButton(HINT.from, HINT.index));
    expect(cardButton(HINT.from, HINT.index)).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(topButton(HINT.to));
    expect(within(status()).getByText("Moves: 1")).toBeInTheDocument();
    expect(within(status()).getByText("Score: 499")).toBeInTheDocument();
  });

  it("rejects an illegal drop with a message", () => {
    renderWithIntl(<SpiderApp />);
    const from = HINT.from;
    // Find a column the card can't go to.
    const state = deal(SEED, 1);
    const rank = state.columns[from][HINT.index].card.rank;
    const to = state.columns.findIndex((c, i) => i !== from && c[c.length - 1].card.rank !== rank + 1);
    fireEvent.click(cardButton(from, HINT.index));
    fireEvent.click(topButton(to));
    expect(within(status()).getByText("Moves: 0")).toBeInTheDocument();
    expect(document.querySelector("[data-spider-message]")).toHaveTextContent(/can't go there/);
  });

  it("deals a row from the stock and undoes it with Ctrl+Z", () => {
    renderWithIntl(<SpiderApp />);
    fireEvent.click(stock());
    expect(stock()).toHaveAttribute("data-spider-stock", "4");
    expect(document.querySelectorAll("[data-spider-index]").length).toBeGreaterThanOrEqual(20);
    fireEvent.keyDown(shell(), { key: "z", ctrlKey: true });
    expect(stock()).toHaveAttribute("data-spider-stock", "5");
    expect(within(status()).getByText("Moves: 0")).toBeInTheDocument();
  });

  it("starts a new game with F2", () => {
    renderWithIntl(<SpiderApp />);
    fireEvent.keyDown(shell(), { key: "d" });
    expect(within(status()).getByText("Moves: 1")).toBeInTheDocument();
    fireEvent.keyDown(shell(), { key: "F2" });
    expect(within(status()).getByText("Moves: 0")).toBeInTheDocument();
    expect(stock()).toHaveAttribute("data-spider-stock", "5");
  });

  it("highlights a hint with H", () => {
    renderWithIntl(<SpiderApp />);
    fireEvent.keyDown(shell(), { key: "h" });
    expect(document.querySelector("[data-spider-message]")).toHaveTextContent(`to column ${HINT.to + 1}`);
  });

  it("double-click sends a card to its best column", () => {
    renderWithIntl(<SpiderApp />);
    fireEvent.doubleClick(cardButton(HINT.from, HINT.index));
    expect(within(status()).getByText("Moves: 1")).toBeInTheDocument();
  });

  it("plays a move with the keyboard: arrows, Enter to pick up and drop, Esc to cancel", () => {
    renderWithIntl(<SpiderApp />);
    const first = topButton(0);
    expect(first).toHaveAttribute("tabindex", "0");
    act(() => first.focus());
    const press = (key: string) => fireEvent.keyDown(document.activeElement!, { key });
    for (let i = 0; i < HINT.from; i++) press("ArrowRight");
    expect(document.activeElement).toBe(topButton(HINT.from));
    // Escape cancels a pick-up.
    press("Enter");
    expect(topButton(HINT.from)).toHaveAttribute("aria-pressed", "true");
    press("Escape");
    expect(topButton(HINT.from)).toHaveAttribute("aria-pressed", "false");
    press("Enter");
    const steps = (HINT.to - HINT.from + 10) % 10;
    for (let i = 0; i < steps; i++) press("ArrowRight");
    expect(document.activeElement).toBe(topButton(HINT.to));
    press(" ");
    expect(within(status()).getByText("Moves: 1")).toBeInTheDocument();
    expect(document.activeElement).toBe(topButton(HINT.to));
  });
});
