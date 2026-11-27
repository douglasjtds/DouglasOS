import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MinesApp from "@/components/apps/games/MinesApp";
import { HOLD_TO_FLAG_MS } from "@/components/apps/games/mines/MinesBoard";
import { renderWithIntl } from "@/test/renderWithIntl";
import { DIFFICULTIES, neighbors, newGame, reveal } from "@/lib/games/mines/engine";

// Queried with `hidden: true`: the win dialog hides the board from the a11y tree.
const grid = () => screen.getByRole("grid", { hidden: true });
const cells = () => within(grid()).getAllByRole("gridcell", { hidden: true });
const cell = (i: number) => cells()[i];
const counter = () => document.querySelector("[data-mines-counter]")!;
const timer = () => document.querySelector("[data-mines-timer]")!;
const revealedCount = () => cells().filter((c) => !["hidden", "flagged", "question"].includes(c.dataset.state!)).length;

const desktopWidth = window.innerWidth;

function setMobile(mobile: boolean) {
  // test/setup.ts evaluates width media queries against innerWidth.
  Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: mobile ? 390 : desktopWidth });
}

afterEach(() => {
  vi.useRealTimers();
  setMobile(false);
});

describe("MinesApp", () => {
  it("renders a 9×9 beginner field with counter and timer", () => {
    renderWithIntl(<MinesApp initialSeed={1} />);
    expect(cells()).toHaveLength(81);
    expect(counter()).toHaveTextContent("010");
    expect(timer()).toHaveTextContent("000");
    expect(cell(0)).toHaveAccessibleName("Row 1, column 1, hidden");
    expect(cell(0)).toHaveAttribute("tabindex", "0");
    expect(cell(1)).toHaveAttribute("tabindex", "-1");
  });

  it("first click reveals a safe opening", async () => {
    const user = userEvent.setup();
    renderWithIntl(<MinesApp initialSeed={5} />);
    await user.click(cell(40));
    expect(cell(40)).toHaveAccessibleName("Row 5, column 5, empty");
    expect(revealedCount()).toBeGreaterThan(1);
    expect(grid()).toHaveAttribute("data-status", "playing");
  });

  it("right-click flags and updates the mine counter", () => {
    renderWithIntl(<MinesApp initialSeed={5} />);
    fireEvent.contextMenu(cell(0));
    expect(cell(0)).toHaveAccessibleName("Row 1, column 1, flagged");
    expect(counter()).toHaveTextContent("009");
    // A flagged cell can't be revealed by a click.
    fireEvent.click(cell(0));
    expect(cell(0)).toHaveAttribute("data-state", "flagged");
    fireEvent.contextMenu(cell(0));
    expect(cell(0)).toHaveAttribute("data-state", "hidden");
  });

  it("chords a number through the UI", async () => {
    const user = userEvent.setup();
    const seed = 11;
    renderWithIntl(<MinesApp initialSeed={seed} />);
    await user.click(cell(40));
    // The engine with the same seed is the oracle for where the mines are.
    const oracle = reveal(newGame(DIFFICULTIES.beginner, seed), 40);
    const { config } = oracle;
    const target = oracle.cells.findIndex(
      (c, i) =>
        c.state === "revealed" &&
        c.adjacent > 0 &&
        neighbors(config, i).some((n) => oracle.cells[n].state === "hidden" && !oracle.cells[n].mine),
    );
    expect(target).toBeGreaterThanOrEqual(0);
    const around = neighbors(config, target);
    for (const n of around) if (oracle.cells[n].mine) fireEvent.contextMenu(cell(n));
    await user.click(cell(target));
    for (const n of around) {
      if (oracle.cells[n].mine) expect(cell(n)).toHaveAttribute("data-state", "flagged");
      else expect(["empty", "number"]).toContain(cell(n).dataset.state);
    }
  });

  it("hitting a mine loses: exploded cell, other mines shown, wrong flags crossed", async () => {
    const user = userEvent.setup();
    const seed = 21;
    renderWithIntl(<MinesApp initialSeed={seed} />);
    await user.click(cell(40));
    const oracle = reveal(newGame(DIFFICULTIES.beginner, seed), 40);
    const mines = oracle.cells.flatMap((c, i) => (c.mine ? [i] : []));
    const wrong = oracle.cells.findIndex((c) => c.state === "hidden" && !c.mine);
    fireEvent.contextMenu(cell(wrong));
    await user.click(cell(mines[0]));
    expect(grid()).toHaveAttribute("data-status", "lost");
    expect(cell(mines[0])).toHaveAttribute("data-state", "exploded");
    expect(cell(mines[1])).toHaveAttribute("data-state", "mine");
    expect(cell(wrong)).toHaveAttribute("data-state", "wrongFlag");
    expect(document.querySelector("[data-mines-face]")).toHaveAttribute("data-mines-face", "lost");
  });

  it("clearing the field wins and shows the dialog", async () => {
    const user = userEvent.setup();
    const seed = 21;
    renderWithIntl(<MinesApp initialSeed={seed} />);
    await user.click(cell(40));
    const oracle = reveal(newGame(DIFFICULTIES.beginner, seed), 40);
    oracle.cells.forEach((c, i) => {
      if (!c.mine && cell(i).dataset.state === "hidden") fireEvent.click(cell(i));
    });
    expect(grid()).toHaveAttribute("data-status", "won");
    expect(counter()).toHaveTextContent("000");
    expect(await screen.findByTestId("game-over")).toBeInTheDocument();
    await user.click(document.querySelector<HTMLElement>('[data-game-action="play-again"]')!);
    expect(grid()).toHaveAttribute("data-status", "ready");
    await waitFor(() => expect(screen.queryByTestId("game-over")).not.toBeInTheDocument());

    // Winning the next game shows the dialog again (Play again must not dismiss it).
    const nextSeed = Number(grid().getAttribute("data-seed"));
    await user.click(cell(40));
    const next = reveal(newGame(DIFFICULTIES.beginner, nextSeed), 40);
    next.cells.forEach((c, i) => {
      if (!c.mine && cell(i).dataset.state === "hidden") fireEvent.click(cell(i));
    });
    expect(grid()).toHaveAttribute("data-status", "won");
    expect(await screen.findByTestId("game-over")).toBeInTheDocument();
  });

  it("New game (face button and F2) resets the board and the timer", async () => {
    const user = userEvent.setup();
    renderWithIntl(<MinesApp initialSeed={5} />);
    await user.click(cell(40));
    expect(revealedCount()).toBeGreaterThan(0);
    await user.click(document.querySelector<HTMLElement>("[data-mines-face]")!);
    expect(revealedCount()).toBe(0);
    expect(grid()).toHaveAttribute("data-status", "ready");

    await user.click(cell(40));
    expect(revealedCount()).toBeGreaterThan(0);
    await user.keyboard("{F2}");
    expect(revealedCount()).toBe(0);
    expect(timer()).toHaveTextContent("000");
  });

  it("changing difficulty from the Game menu starts a new, larger game", async () => {
    const user = userEvent.setup();
    renderWithIntl(<MinesApp initialSeed={5} />);
    await user.click(document.querySelector<HTMLElement>('[data-game-menu="game"]')!);
    await user.click(await screen.findByRole("menuitemcheckbox", { name: "Expert" }));
    expect(cells()).toHaveLength(480);
    expect(counter()).toHaveTextContent("099");
  });

  it("is playable from the keyboard", async () => {
    const user = userEvent.setup();
    renderWithIntl(<MinesApp initialSeed={5} />);
    cell(0).focus();
    await user.keyboard("{ArrowRight}{ArrowDown}");
    expect(cell(10)).toHaveFocus();
    await user.keyboard("f");
    expect(cell(10)).toHaveAttribute("data-state", "flagged");
    await user.keyboard("f{ArrowDown}{ArrowDown}{ArrowDown}{Enter}");
    expect(cell(37)).toHaveFocus();
    expect(cell(37).dataset.state).not.toBe("hidden");
    expect(cell(37)).toHaveAttribute("tabindex", "0");
    await user.keyboard("{End}");
    expect(cell(44)).toHaveFocus();
  });

  it("starts the timer on the first reveal", () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
    renderWithIntl(<MinesApp initialSeed={5} />);
    fireEvent.click(cell(40));
    act(() => {
      vi.advanceTimersByTime(3100);
    });
    expect(timer()).toHaveTextContent("003");
  });

  it("on touch: press-and-hold flags, tap reveals, flag mode flags on tap", () => {
    setMobile(true);
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
    renderWithIntl(<MinesApp initialSeed={5} />);
    expect(screen.getByRole("button", { name: "Flag mode" })).toHaveAttribute("aria-pressed", "false");

    fireEvent.pointerDown(cell(0), { pointerType: "touch", button: 0 });
    act(() => {
      vi.advanceTimersByTime(HOLD_TO_FLAG_MS + 10);
    });
    fireEvent.pointerUp(cell(0), { pointerType: "touch" });
    fireEvent.click(cell(0));
    expect(cell(0)).toHaveAttribute("data-state", "flagged");

    fireEvent.click(screen.getByRole("button", { name: "Flag mode" }));
    fireEvent.click(cell(80));
    expect(cell(80)).toHaveAttribute("data-state", "flagged");
  });
});
