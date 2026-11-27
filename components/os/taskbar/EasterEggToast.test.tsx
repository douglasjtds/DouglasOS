import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/renderWithIntl";
import { EASTER_EGG_TOAST_MS, EasterEggToast } from "@/components/os/taskbar/EasterEggToast";
import { useEasterEggStore } from "@/lib/store/easterEggStore";
import { selectActiveBalloon, useBalloonStore } from "@/lib/store/balloonStore";
import { useShellStore } from "@/lib/store/shellStore";
import { useAssistantStore } from "@/lib/store/assistantStore";
import { Z_BASE, useWindowStore } from "@/lib/store/windowStore";
import { EASTER_EGG_IDS } from "@/lib/easter-eggs/registry";

const eggs = () => useEasterEggStore.getState();
const toast = () => document.querySelector("[data-easter-egg-toast]");

describe("EasterEggToast", () => {
  beforeEach(() => {
    eggs().reset();
    useBalloonStore.setState({ queue: [] });
    useShellStore.setState({ phase: "desktop", startMenuOpen: false, dialog: null });
    useAssistantStore.setState({ visible: false, dismissed: true, state: "idle", queue: [], fired: [] });
    useWindowStore.setState({ windows: {}, order: [], focusedId: null, topZ: Z_BASE, openCount: 0 });
  });
  afterEach(() => vi.useRealTimers());

  it("announces a discovery through the balloon slot, without taking focus", () => {
    renderWithIntl(<EasterEggToast />);
    expect(toast()).toBeNull();
    act(() => void eggs().discover("protected-file"));
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("🎉 Easter egg found! (1/15)");
    expect(status).toHaveTextContent("Protected file");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(selectActiveBalloon(useBalloonStore.getState())).toBe("easterEgg");
    expect(status.contains(document.activeElement)).toBe(false);
  });

  it("waits for a balloon already on screen", () => {
    useBalloonStore.getState().request("welcome");
    renderWithIntl(<EasterEggToast />);
    act(() => void eggs().discover("trash-rescue"));
    expect(toast()).toBeNull();
    act(() => useBalloonStore.getState().release("welcome"));
    expect(toast()).toHaveAttribute("data-easter-egg-toast", "trash-rescue");
  });

  it("yields to the reaction that earned it (e.g. the bin's rescue balloon), then comes back", () => {
    renderWithIntl(<EasterEggToast />);
    act(() => void eggs().discover("trash-rescue"));
    expect(toast()).not.toBeNull();
    act(() => useBalloonStore.getState().request("recycleBin"));
    expect(toast()).toBeNull();
    act(() => useBalloonStore.getState().release("recycleBin"));
    expect(toast()).not.toBeNull();
  });

  it("waits while a shell dialog (the F2 message box) or the Start menu is open", () => {
    renderWithIntl(<EasterEggToast />);
    act(() => {
      useShellStore.getState().openDialog({ kind: "protectedFile", iconId: "about" });
      eggs().discover("protected-file");
    });
    expect(toast()).toBeNull();
    act(() => useShellStore.getState().closeDialog());
    expect(toast()).not.toBeNull();
    act(() => useShellStore.getState().setStartMenuOpen(true));
    expect(toast()).toBeNull();
  });

  it("closes itself after a few seconds and shows the next egg with its own count", () => {
    vi.useFakeTimers();
    renderWithIntl(<EasterEggToast />);
    act(() => {
      eggs().discover("protected-file", 1);
      eggs().discover("messenger-nudge", 2);
    });
    expect(screen.getByRole("status")).toHaveTextContent("(1/15)");
    act(() => vi.advanceTimersByTime(EASTER_EGG_TOAST_MS));
    expect(screen.getByRole("status")).toHaveTextContent("(2/15)");
    expect(screen.getByRole("status")).toHaveTextContent("Nudge, nudge");
    act(() => vi.advanceTimersByTime(EASTER_EGG_TOAST_MS));
    expect(toast()).toBeNull();
    expect(eggs().pending).toEqual([]);
    expect(useBalloonStore.getState().queue).toEqual([]);
  });

  it("× closes it", () => {
    renderWithIntl(<EasterEggToast />);
    act(() => void eggs().discover("protected-file"));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(toast()).toBeNull();
    expect(eggs().pending).toEqual([]);
  });

  it("shows, on the next desktop load, an egg found where there was no shell (the real 404 page)", () => {
    eggs().discover("real-404");
    renderWithIntl(<EasterEggToast />);
    expect(toast()).toHaveAttribute("data-easter-egg-toast", "real-404");
  });

  it("is a bottom sheet on phones", () => {
    window.innerWidth = 390;
    renderWithIntl(<EasterEggToast />);
    act(() => void eggs().discover("trash-rescue"));
    expect(toast()?.className).toContain("inset-x-0");
  });

  describe("completion reward", () => {
    function findAll() {
      EASTER_EGG_IDS.forEach((id, i) => eggs().discover(id, i + 1));
      useEasterEggStore.setState({ pending: ["cmd-format", "complete"] });
    }

    it("hands the reward to mini Douglas after the last toast", () => {
      useAssistantStore.setState({ dismissed: false });
      renderWithIntl(<EasterEggToast />);
      act(findAll);
      expect(screen.getByRole("status")).toHaveTextContent("(15/15)");
      fireEvent.click(screen.getByRole("button", { name: "Close" }));
      expect(useAssistantStore.getState().queue.map((m) => m.id)).toEqual(["eggsComplete"]);
      expect(eggs().pending).toEqual([]);
      expect(document.querySelector("[data-easter-egg-reward]")).toBeNull();
    });

    it("shows the reward itself when mini Douglas was dismissed, offering the CV", () => {
      renderWithIntl(<EasterEggToast />);
      act(findAll);
      fireEvent.click(screen.getByRole("button", { name: "Close" }));
      const reward = document.querySelector("[data-easter-egg-reward]");
      expect(reward).toHaveTextContent("You found them all!");
      expect(reward?.querySelector('[data-assistant-action="downloadCv"]')).not.toBeNull();
      fireEvent.click(screen.getByRole("button", { name: "Close" }));
      expect(eggs().pending).toEqual([]);
    });
  });
});
