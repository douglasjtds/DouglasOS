import { beforeEach, describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GamesFolderApp from "@/components/apps/GamesFolderApp";
import { renderWithIntl } from "@/test/renderWithIntl";
import { useWindowStore } from "@/lib/store/windowStore";
import { GAME_IDS } from "@/lib/apps/registry";

const launcher = (id: string) =>
  document.querySelector<HTMLButtonElement>(`[data-game-launcher="${id}"]`)!;

describe("GamesFolderApp", () => {
  beforeEach(() => {
    useWindowStore.setState({ windows: {}, order: [] } as never);
  });

  it("lists the six games with their titles and an object count", () => {
    renderWithIntl(<GamesFolderApp />);
    for (const id of GAME_IDS) expect(launcher(id)).toBeInTheDocument();
    expect(screen.getByText("Mines")).toBeInTheDocument();
    expect(screen.getByText("Spider Solitaire")).toBeInTheDocument();
    expect(document.querySelector("[data-games-status]")).toHaveTextContent("6 objects");
  });

  it("click selects, double-click opens the game window", async () => {
    renderWithIntl(<GamesFolderApp />);
    await userEvent.click(launcher("solitaire"));
    expect(launcher("solitaire")).toHaveAttribute("aria-pressed", "true");
    expect(useWindowStore.getState().windows.solitaire).toBeUndefined();
    await userEvent.dblClick(launcher("solitaire"));
    expect(useWindowStore.getState().windows.solitaire).toBeDefined();
  });

  it("arrow keys move the selection and Enter opens", async () => {
    renderWithIntl(<GamesFolderApp />);
    launcher("mines").focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(launcher("solitaire")).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(useWindowStore.getState().windows.solitaire).toBeDefined();
  });
});
