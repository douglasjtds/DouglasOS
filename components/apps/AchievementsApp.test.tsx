import { beforeEach, describe, expect, it } from "vitest";
import { act, fireEvent, screen, within } from "@testing-library/react";
import { renderWithIntl } from "@/test/renderWithIntl";
import AchievementsApp from "@/components/apps/AchievementsApp";
import { useEasterEggStore } from "@/lib/store/easterEggStore";
import { EASTER_EGG_IDS } from "@/lib/easter-eggs/registry";

const eggs = () => useEasterEggStore.getState();

describe("AchievementsApp", () => {
  beforeEach(() => eggs().reset());

  it("lists found eggs with title + date and missing ones as ??? with a hint", () => {
    eggs().discover("protected-file", Date.UTC(2026, 10, 20, 12));
    eggs().discover("trash-rescue", Date.UTC(2026, 10, 21, 12));
    renderWithIntl(<AchievementsApp />);

    expect(screen.getByText("Easter eggs found: 2 of 13")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "2");

    const items = document.querySelectorAll("[data-egg]");
    expect(items).toHaveLength(13);
    const found = document.querySelector('[data-egg="protected-file"]') as HTMLElement;
    expect(found).toHaveAttribute("data-found");
    expect(within(found).getByText("Protected file")).toBeInTheDocument();
    expect(within(found).getByText(/Found on .*2026/)).toBeInTheDocument();

    const missing = document.querySelector('[data-egg="run-cmd"]') as HTMLElement;
    expect(missing).not.toHaveAttribute("data-found");
    expect(within(missing).getByText("???")).toBeInTheDocument();
    expect(within(missing).getByText("Some commands get typed on muscle memory.")).toBeInTheDocument();
    expect(missing).not.toHaveTextContent("Old habits");
  });

  it("resets progress only after the XP confirmation", () => {
    eggs().discover("protected-file", 1);
    renderWithIntl(<AchievementsApp />);

    fireEvent.click(screen.getByRole("button", { name: "Reset progress" }));
    const dialog = screen.getByTestId("reset-achievements-dialog");
    // Cancel is the default (focused) button; cancelling keeps everything.
    expect(within(dialog).getByRole("button", { name: "Cancel" })).toHaveFocus();
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(eggs().found).toHaveProperty("protected-file");

    fireEvent.click(screen.getByRole("button", { name: "Reset progress" }));
    fireEvent.click(within(screen.getByTestId("reset-achievements-dialog")).getByRole("button", { name: "Reset" }));
    expect(eggs().found).toEqual({});
    expect(screen.getByText("Easter eggs found: 0 of 13")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset progress" })).toBeDisabled();
  });

  it("announces the unlocked wallpaper once everything is found", () => {
    renderWithIntl(<AchievementsApp />);
    expect(document.querySelector("[data-achievements-complete]")).toBeNull();
    act(() => EASTER_EGG_IDS.forEach((id, i) => eggs().discover(id, i + 1)));
    expect(document.querySelector("[data-achievements-complete]")).toHaveTextContent("secret wallpaper is unlocked");
  });
});
