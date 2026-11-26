import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "@/test/renderWithIntl";
import Assistant from "@/components/os/assistant/Assistant";
import { WelcomeBalloon } from "@/components/os/taskbar/WelcomeBalloon";
import { initialAssistantState, useAssistantStore } from "@/lib/store/assistantStore";
import { useBalloonStore } from "@/lib/store/balloonStore";
import { useShellStore } from "@/lib/store/shellStore";
import { Z_BASE, useWindowStore } from "@/lib/store/windowStore";
import { greetingMessage } from "@/lib/assistant/script";
import { bubbleRect } from "@/lib/assistant/layout";
import { downloadFile } from "@/lib/download";
import { FEATURED_PROJECT_SLUG } from "@/lib/content/projects";

vi.mock("@/lib/download", () => ({ downloadFile: vi.fn() }));

const motion = vi.hoisted(() => ({ reduced: false }));
vi.mock("@/hooks/useReducedMotion", () => ({ useReducedMotion: () => motion.reduced }));

function bubble() {
  return document.querySelector("[data-assistant-bubble]");
}

function greet() {
  act(() => useAssistantStore.getState().say(greetingMessage()));
}

describe("Assistant", () => {
  beforeEach(() => {
    vi.mocked(downloadFile).mockClear();
    motion.reduced = false;
    useAssistantStore.getState().stopDance({ quiet: true });
    useAssistantStore.setState(initialAssistantState(null));
    useBalloonStore.setState({ queue: [] });
    useWindowStore.setState({ windows: {}, order: [], focusedId: null, topZ: Z_BASE, openCount: 0 });
    useShellStore.setState({ phase: "desktop", startMenuOpen: false, dialog: null });
    sessionStorage.setItem("douglasos-welcomed", "1");
  });

  it("stays out of sight until he has something to do", () => {
    renderWithIntl(<Assistant />);
    expect(document.querySelector("[data-assistant]")).toBeNull();
  });

  it("shows the character and the greeting without taking focus", () => {
    renderWithIntl(<Assistant />);
    greet();
    expect(screen.getByRole("button", { name: "mini Douglas, desktop assistant" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("pocket-sized Douglas");
    expect(document.activeElement).toBe(document.body);
  });

  it('"I want to get in touch" opens Contact and closes the bubble', async () => {
    renderWithIntl(<Assistant />);
    greet();
    await userEvent.click(screen.getByRole("button", { name: "I want to get in touch" }));
    expect(useWindowStore.getState().focusedId).toBe("contact");
    expect(bubble()).toBeNull();
  });

  it('"Show me a project" opens the featured case study in the Explorer', async () => {
    renderWithIntl(<Assistant />);
    greet();
    await userEvent.click(screen.getByRole("button", { name: "Show me a project" }));
    const projects = useWindowStore.getState().windows.projects;
    expect(projects?.history?.entries[projects.history.index]).toBe(FEATURED_PROJECT_SLUG);
    // Opened from here, so the "first time in Projects" tip is spent.
    expect(useAssistantStore.getState().fired).toContain("projects");
  });

  it('"Download the CV" reuses the download helper', async () => {
    renderWithIntl(<Assistant />);
    greet();
    await userEvent.click(screen.getByRole("button", { name: "Download the CV" }));
    expect(downloadFile).toHaveBeenCalledWith("/resume.pdf", expect.stringContaining(".pdf"));
  });

  it('"Show me another tip" swaps the line', async () => {
    renderWithIntl(<Assistant />);
    greet();
    await userEvent.click(screen.getByRole("button", { name: "Show me another tip" }));
    expect(screen.getByRole("heading", { name: "Did you know?" })).toBeInTheDocument();
  });

  it('"Not now, thanks" hides him for the session', async () => {
    renderWithIntl(<Assistant />);
    greet();
    await userEvent.click(screen.getByRole("button", { name: "Not now, thanks" }));
    expect(document.querySelector("[data-assistant]")).toBeNull();
    expect(useAssistantStore.getState().dismissed).toBe(true);
  });

  it("answers a search offline", async () => {
    renderWithIntl(<Assistant />);
    greet();
    await userEvent.type(screen.getByLabelText("Ask me something:"), "trabalha remoto?{Enter}");
    expect(screen.getByRole("status")).toHaveTextContent("Lagoa Santa");
    expect(screen.getByRole("button", { name: "I want to get in touch" })).toBeInTheDocument();
  });

  it("Esc closes the bubble before the window manager sees it", () => {
    renderWithIntl(<Assistant />);
    greet();
    const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
    act(() => {
      document.body.dispatchEvent(event);
    });
    expect(event.defaultPrevented).toBe(true);
    expect(bubble()).toBeNull();
    // The character stays.
    expect(document.querySelector("[data-assistant-character]")).not.toBeNull();
  });

  it("clicking the character dances, then says the after-dance line", () => {
    renderWithIntl(<Assistant />);
    act(() => useAssistantStore.getState().show());
    fireEvent.click(screen.getByRole("button", { name: "mini Douglas, desktop assistant" }));
    expect(useAssistantStore.getState().state).toBe("dancing");
    expect(bubble()).toBeNull();
    act(() => useAssistantStore.getState().stopDance());
    expect(screen.getByRole("heading", { name: "Phew!" })).toBeInTheDocument();
  });

  it("waits for the welcome balloon: one balloon at a time", async () => {
    sessionStorage.removeItem("douglasos-welcomed");
    renderWithIntl(
      <>
        <WelcomeBalloon />
        <Assistant />
      </>,
    );
    greet();
    expect(document.querySelector('[data-balloon="welcome"]')).not.toBeNull();
    expect(bubble()).toBeNull();
    expect(document.querySelector("[data-assistant-character]")).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(document.querySelector('[data-balloon="welcome"]')).toBeNull();
    expect(bubble()).not.toBeNull();
  });

  it("holds the bubble while the focused window's title bar is under it", () => {
    const vp = { width: window.innerWidth, height: window.innerHeight };
    const area = bubbleRect(vp);
    renderWithIntl(<Assistant />);
    act(() => {
      useWindowStore.getState().openWindow("about");
      useWindowStore.getState().moveWindow("about", area.x - 50, area.y + 40);
    });
    greet();
    expect(bubble()).toBeNull();
    expect(useAssistantStore.getState().queue).toHaveLength(1);
    act(() => useWindowStore.getState().moveWindow("about", 300, 40));
    expect(bubble()).not.toBeNull();
  });

  describe("cursor gaze", () => {
    function character() {
      return document.querySelector<HTMLElement>("[data-assistant-character]")!;
    }
    function expression() {
      return document.querySelector("[data-expression]")?.getAttribute("data-expression");
    }
    function pointAt(x: number, y: number) {
      act(() => {
        window.dispatchEvent(new MouseEvent("pointermove", { clientX: x, clientY: y }));
      });
      return act(() => new Promise((resolve) => setTimeout(resolve, 40)));
    }
    function placeCharacter() {
      character().getBoundingClientRect = () =>
        ({ left: 800, top: 500, width: 96, height: 112, x: 800, y: 500, right: 896, bottom: 612, toJSON() {} }) as DOMRect;
    }

    it("lights up when the cursor is over him", async () => {
      renderWithIntl(<Assistant />);
      act(() => useAssistantStore.getState().show());
      placeCharacter();
      expect(expression()).toBe("neutral");
      await pointAt(848, 556);
      expect(expression()).toBe("happy");
      await pointAt(10, 10);
      expect(expression()).toBe("neutral");
    });

    it("doesn't react while dancing", async () => {
      renderWithIntl(<Assistant />);
      act(() => useAssistantStore.getState().dance());
      placeCharacter();
      await pointAt(848, 556);
      expect(expression()).toBe("neutral");
    });

    it("stays still under reduced motion", async () => {
      motion.reduced = true;
      renderWithIntl(<Assistant />);
      act(() => useAssistantStore.getState().show());
      placeCharacter();
      await pointAt(848, 556);
      expect(expression()).toBe("neutral");
    });
  });
});
