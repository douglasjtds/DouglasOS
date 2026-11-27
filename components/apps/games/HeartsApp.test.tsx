import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen, within } from "@testing-library/react";
import HeartsApp from "@/components/apps/games/HeartsApp";
import { renderWithIntl } from "@/test/renderWithIntl";

vi.mock("@/hooks/useReducedMotion", () => ({ useReducedMotion: () => true }));

const SEED = 2024;

function hand() {
  return screen.getByRole("group", { name: "Your hand" });
}
function handCards() {
  return within(hand()).getAllByRole("button");
}
function status() {
  return document.querySelector("[data-hearts-status]")!;
}
function passButton() {
  return document.querySelector<HTMLButtonElement>("[data-hearts-action='pass']")!;
}

/** Let the computer players run until it is the human's turn (or nothing changes). */
function runUntilHumanTurn() {
  for (let i = 0; i < 40; i++) {
    if (document.querySelector("[data-legal]")) return;
    act(() => {
      vi.advanceTimersByTime(700);
    });
  }
}

function passFirstThree() {
  handCards()
    .slice(0, 3)
    .forEach((button) => fireEvent.click(button));
  fireEvent.click(passButton());
}

describe("HeartsApp", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the table: 13 cards, three opponents and the pass instruction", () => {
    renderWithIntl(<HeartsApp initialSeed={SEED} />);
    expect(handCards()).toHaveLength(13);
    expect(document.querySelectorAll("[data-hearts-opponent]")).toHaveLength(3);
    expect(screen.getByRole("group", { name: /Ada: 0 points, 13 cards left/ })).toBeInTheDocument();
    expect(status()).toHaveTextContent("Pass 3 cards to the left (Ada)");
  });

  it("selects 3 cards to pass, refuses a 4th, then passes", () => {
    renderWithIntl(<HeartsApp initialSeed={SEED} />);
    const cards = handCards();
    fireEvent.click(passButton());
    expect(status()).toHaveTextContent("Select 3 cards to pass");
    cards.slice(0, 3).forEach((button) => fireEvent.click(button));
    expect(cards[0]).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(cards[3]);
    expect(status()).toHaveTextContent("You can only pass 3 cards");
    expect(cards[3]).toHaveAttribute("aria-pressed", "false");
    const passed = cards.slice(0, 3).map((b) => b.getAttribute("data-hand-card"));
    fireEvent.click(passButton());
    expect(passButton()).toBeNull();
    expect(handCards()).toHaveLength(13);
    const now = handCards().map((b) => b.getAttribute("data-hand-card"));
    passed.forEach((id) => expect(now).not.toContain(id));
  });

  it("plays a legal card into the trick and explains an illegal one", () => {
    renderWithIntl(<HeartsApp initialSeed={SEED} />);
    passFirstThree();
    runUntilHumanTurn();
    const illegal = handCards().find((b) => b.getAttribute("aria-disabled") === "true")!;
    expect(illegal).toBeDefined();
    fireEvent.click(illegal);
    expect(handCards()).toHaveLength(13);
    expect(status().textContent).toMatch(/2 of clubs|follow the suit|first trick|broken/);
    const legal = document.querySelector<HTMLButtonElement>("[data-legal]")!;
    const id = legal.getAttribute("data-hand-card")!;
    fireEvent.click(legal);
    expect(handCards()).toHaveLength(12);
    expect(document.querySelector(`[data-hearts-trick] [data-card='${id}']`)).toBeInTheDocument();
  });

  it("plays a whole hand through to the score sheet, then deals the next one", () => {
    renderWithIntl(<HeartsApp initialSeed={SEED} />);
    passFirstThree();
    for (let trick = 0; trick < 13; trick++) {
      runUntilHumanTurn();
      fireEvent.click(document.querySelector<HTMLButtonElement>("[data-legal]")!);
    }
    for (let i = 0; i < 10 && !screen.queryByTestId("hearts-score-sheet"); i++) {
      act(() => {
        vi.advanceTimersByTime(700);
      });
    }
    const sheet = screen.getByTestId("hearts-score-sheet");
    expect(within(sheet).getAllByRole("row")).toHaveLength(3);
    const totals = [0, 1, 2, 3].map((s) => Number(sheet.querySelector(`[data-hearts-total='${s}']`)!.textContent));
    expect(totals.reduce((a, b) => a + b, 0) % 26).toBe(0);
    fireEvent.click(within(sheet).getByRole("button", { name: "Next hand" }));
    expect(screen.queryByTestId("hearts-score-sheet")).toBeNull();
    expect(handCards()).toHaveLength(13);
    expect(status()).toHaveTextContent("Pass 3 cards to the right (Iris)");
  });

  it("New game (F2) resets the hand and the passing phase", () => {
    renderWithIntl(<HeartsApp initialSeed={SEED} />);
    passFirstThree();
    runUntilHumanTurn();
    fireEvent.click(document.querySelector<HTMLButtonElement>("[data-legal]")!);
    expect(handCards()).toHaveLength(12);
    fireEvent.keyDown(hand(), { key: "F2" });
    expect(handCards()).toHaveLength(13);
    expect(passButton()).toBeInTheDocument();
    expect(document.querySelector("[data-hearts-trick] [data-card]")).toBeNull();
  });

  it("keyboard: arrows move across the hand, Enter toggles, Tab reaches Pass", () => {
    renderWithIntl(<HeartsApp initialSeed={SEED} />);
    const cards = handCards();
    expect(cards.filter((b) => b.tabIndex === 0)).toHaveLength(1);
    act(() => cards[0].focus());
    fireEvent.keyDown(cards[0], { key: "ArrowRight" });
    expect(document.activeElement).toBe(cards[1]);
    fireEvent.keyDown(cards[1], { key: "ArrowLeft" });
    fireEvent.keyDown(cards[0], { key: "ArrowLeft" });
    expect(document.activeElement).toBe(cards[12]);
    fireEvent.keyDown(cards[12], { key: "Home" });
    expect(document.activeElement).toBe(cards[0]);
    // Native buttons turn Enter/Space into clicks; jsdom needs the click itself.
    fireEvent.click(document.activeElement!);
    expect(cards[0]).toHaveAttribute("aria-pressed", "true");
    expect(passButton().tabIndex).toBe(0);
    expect(passButton()).toHaveAttribute("aria-disabled", "true");
  });

  it("Help ▸ Rules opens the rules summary", () => {
    renderWithIntl(<HeartsApp initialSeed={SEED} />);
    expect(screen.queryByTestId("hearts-rules")).toBeNull();
    const help = screen.getByRole("menuitem", { name: "Help" });
    fireEvent.pointerDown(help, { button: 0, ctrlKey: false, pointerType: "mouse" });
    fireEvent.click(screen.getByRole("menuitem", { name: "Rules" }));
    expect(screen.getByTestId("hearts-rules")).toHaveTextContent("100 points");
  });
});
