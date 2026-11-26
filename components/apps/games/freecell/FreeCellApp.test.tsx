import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FreeCellApp from "@/components/apps/games/FreeCellApp";
import { renderWithIntl } from "@/test/renderWithIntl";
import { legalMoves, newGame, type Location } from "@/lib/games/freecell/engine";

const GAME = 1234;

const pile = (loc: Location) => document.querySelector<HTMLElement>(`[data-pile="${loc.kind}-${loc.index}"]`)!;
const statusBar = () => document.querySelector<HTMLElement>("[data-game-status]")!;
const columnCards = (i: number) => pile({ kind: "column", index: i }).querySelectorAll("[data-card]").length;

/** A column → column move available in the opening deal (falls back to column → free cell). */
function firstMove() {
  const { state } = newGame(GAME);
  const moves = legalMoves(state).filter((m) => m.from.kind === "column");
  return moves.find((m) => m.to.kind === "column") ?? moves.find((m) => m.to.kind === "free")!;
}

async function openGameMenuItem(id: string) {
  const user = userEvent.setup();
  await user.click(document.querySelector<HTMLElement>('[data-game-menu="game"]')!);
  await user.click(await screen.findByText((_, el) => el?.getAttribute("data-game-menu-item") === id));
}

describe("FreeCellApp", () => {
  it("renders the numbered deal: 4 free cells, 4 foundations, 8 columns", () => {
    renderWithIntl(<FreeCellApp initialGameNumber={GAME} />);
    expect(document.querySelectorAll('[data-pile^="free-"]')).toHaveLength(4);
    expect(document.querySelectorAll('[data-pile^="foundation-"]')).toHaveLength(4);
    expect(document.querySelectorAll('[data-pile^="column-"]')).toHaveLength(8);
    expect(statusBar()).toHaveTextContent(`Game #${GAME}`);
    expect(statusBar()).toHaveTextContent("Moves: 0");
    expect(pile({ kind: "column", index: 0 })).toHaveAccessibleName(/^Column 1, \d+ cards, top: /);
  });

  it("plays a legal move by click-select then click-destination, and undoes it", async () => {
    renderWithIntl(<FreeCellApp initialGameNumber={GAME} />);
    const move = firstMove();
    const before = columnCards(move.from.index);
    fireEvent.click(pile(move.from));
    expect(pile(move.from)).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(pile(move.to));
    expect(statusBar()).toHaveTextContent("Moves: 1");
    expect(columnCards(move.from.index)).toBeLessThan(before);

    fireEvent.keyDown(pile(move.to), { key: "z", ctrlKey: true });
    expect(statusBar()).toHaveTextContent("Moves: 0");
    expect(columnCards(move.from.index)).toBe(before);
  });

  it("rejects an illegal drop with a status hint", () => {
    renderWithIntl(<FreeCellApp initialGameNumber={GAME} />);
    // A card can never go onto an empty foundation unless it's an Ace; pick a non-ace top.
    const { state } = newGame(GAME);
    const from = state.columns.findIndex((c) => c.at(-1)!.rank !== 1);
    fireEvent.click(pile({ kind: "column", index: from }));
    fireEvent.click(pile({ kind: "foundation", index: 0 }));
    expect(statusBar()).toHaveTextContent("That move isn't allowed.");
    expect(statusBar()).toHaveTextContent("Moves: 0");
  });

  it("double-click sends a card to a free cell", () => {
    renderWithIntl(<FreeCellApp initialGameNumber={GAME} />);
    const card = pile({ kind: "column", index: 0 }).querySelectorAll("[data-card]");
    fireEvent.doubleClick(card[card.length - 1]);
    expect(statusBar()).toHaveTextContent("Moves: 1");
    expect(pile({ kind: "free", index: 0 }).querySelector("[data-card]")).not.toBeNull();
  });

  it("works from the keyboard: arrows rove, Enter picks and drops, Esc cancels", async () => {
    const user = userEvent.setup();
    renderWithIntl(<FreeCellApp initialGameNumber={GAME} />);
    const col1 = pile({ kind: "column", index: 0 });
    expect(col1).toHaveAttribute("tabindex", "0");
    col1.focus();
    await user.keyboard("{Enter}");
    expect(col1).toHaveAttribute("aria-pressed", "true");
    await user.keyboard("{Escape}");
    expect(col1).toHaveAttribute("aria-pressed", "false");

    // Pick column 1's top card, go up to free cell 1 and drop it there.
    await user.keyboard("{Enter}{ArrowUp}");
    expect(pile({ kind: "free", index: 0 })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(statusBar()).toHaveTextContent("Moves: 1");
    expect(pile({ kind: "free", index: 0 })).toHaveAccessibleName(/^Free cell 1, 1 card, top: /);

    await user.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}");
    expect(pile({ kind: "foundation", index: 0 })).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(pile({ kind: "column", index: 4 })).toHaveFocus();
  });

  it("New game (F2) and Restart reset the board", async () => {
    renderWithIntl(<FreeCellApp initialGameNumber={GAME} />);
    const card = pile({ kind: "column", index: 0 }).querySelectorAll("[data-card]");
    fireEvent.doubleClick(card[card.length - 1]);
    expect(statusBar()).toHaveTextContent("Moves: 1");

    await openGameMenuItem("restart");
    expect(statusBar()).toHaveTextContent("Moves: 0");
    expect(statusBar()).toHaveTextContent(`Game #${GAME}`);

    fireEvent.doubleClick(pile({ kind: "column", index: 0 }).querySelectorAll("[data-card]")[card.length - 1]);
    fireEvent.keyDown(pile({ kind: "column", index: 0 }), { key: "F2" });
    expect(statusBar()).toHaveTextContent("Moves: 0");
    expect(pile({ kind: "free", index: 0 }).querySelector("[data-card]")).toBeNull();
  });

  it("Select game… validates the number and deals that game", async () => {
    const user = userEvent.setup();
    renderWithIntl(<FreeCellApp initialGameNumber={GAME} />);
    await openGameMenuItem("select");
    const dialog = await screen.findByTestId("freecell-select-game");
    const input = within(dialog).getByRole("textbox");
    await user.clear(input);
    await user.type(input, "40000{Enter}");
    expect(within(dialog).getByRole("alert")).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, "77");
    await user.click(within(dialog).getByText("OK"));
    await waitFor(() => expect(screen.queryByTestId("freecell-select-game")).toBeNull());
    expect(statusBar()).toHaveTextContent("Game #77");
  });
});
