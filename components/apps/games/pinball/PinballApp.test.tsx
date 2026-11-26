import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PinballApp from "@/components/apps/games/PinballApp";
import { renderWithIntl } from "@/test/renderWithIntl";
import { useWindowStore, Z_BASE } from "@/lib/store/windowStore";

/** jsdom has no canvas: every 2D context method is a no-op spy. */
function installFakeCanvas() {
  const ctx = new Proxy({} as Record<string | symbol, unknown>, {
    get(target, prop) {
      if (!(prop in target)) {
        target[prop] =
          prop === "createRadialGradient" ? vi.fn(() => ({ addColorStop: vi.fn() })) : vi.fn();
      }
      return target[prop];
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    },
  });
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    (() => ctx) as unknown as HTMLCanvasElement["getContext"],
  );
  return ctx;
}

/** Manual requestAnimationFrame: `frames(n)` runs n frames of 1/60 s. */
function installFakeRaf() {
  let queue: FrameRequestCallback[] = [];
  let now = 0;
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
    queue.push(cb);
    return queue.length;
  });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {
    queue = [];
  });
  return {
    pending: () => queue.length,
    frames(n: number) {
      act(() => {
        for (let i = 0; i < n; i++) {
          const run = queue;
          queue = [];
          now += 1000 / 60;
          for (const cb of run) cb(now);
        }
      });
    },
  };
}

const root = () => document.querySelector<HTMLElement>("[data-pinball]")!;
const canvas = () => document.querySelector<HTMLCanvasElement>("[data-pinball-canvas]")!;
const score = () => Number(document.querySelector("[data-pinball-score]")!.textContent);

describe("PinballApp", () => {
  let raf: ReturnType<typeof installFakeRaf>;

  beforeEach(() => {
    installFakeCanvas();
    raf = installFakeRaf();
    useWindowStore.setState({ windows: {}, order: [], focusedId: null, topZ: Z_BASE, openCount: 0 });
    useWindowStore.getState().openWindow("pinball");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the table canvas, the score panel and the status bar", () => {
    renderWithIntl(<PinballApp />);
    expect(screen.getByRole("application", { name: "Pinball table" })).toBe(canvas());
    expect(score()).toBe(0);
    expect(document.querySelector("[data-pinball-ball]")).toHaveTextContent("1/3");
    expect(document.querySelector("[data-pinball-high]")).toHaveTextContent("0");
    const status = document.querySelector("[data-game-status]")!;
    expect(status).toHaveTextContent("Score: 0");
    expect(status).toHaveTextContent("Ball 1/3");
    expect(document.querySelector("[data-pinball-launch]")).toBeInTheDocument();
    expect(root()).toHaveAttribute("data-paused", "false");
  });

  it("keyboard flipper keys drive the engine input", () => {
    renderWithIntl(<PinballApp />);
    fireEvent.keyDown(canvas(), { code: "KeyZ", key: "z" });
    expect(root()).toHaveAttribute("data-left-flipper", "down");
    fireEvent.keyDown(canvas(), { code: "ShiftLeft", key: "Shift" });
    fireEvent.keyUp(canvas(), { code: "KeyZ", key: "z" });
    // Left Shift still holds the left flipper.
    expect(root()).toHaveAttribute("data-left-flipper", "down");
    fireEvent.keyUp(canvas(), { code: "ShiftLeft", key: "Shift" });
    expect(root()).toHaveAttribute("data-left-flipper", "up");

    fireEvent.keyDown(canvas(), { code: "Slash", key: "/" });
    expect(root()).toHaveAttribute("data-right-flipper", "down");
    fireEvent.keyUp(canvas(), { code: "Slash", key: "/" });
    fireEvent.keyDown(canvas(), { code: "KeyM", key: "m" });
    expect(root()).toHaveAttribute("data-right-flipper", "down");
    fireEvent.keyUp(canvas(), { code: "KeyM", key: "m" });
    expect(root()).toHaveAttribute("data-right-flipper", "up");
  });

  it("touch halves drive the flippers (multi-touch)", () => {
    renderWithIntl(<PinballApp />);
    vi.spyOn(canvas(), "getBoundingClientRect").mockReturnValue({
      left: 0, top: 0, width: 400, height: 700, right: 400, bottom: 700, x: 0, y: 0, toJSON: () => ({}),
    });
    fireEvent.pointerDown(canvas(), { pointerId: 1, clientX: 50, clientY: 600, pointerType: "touch" });
    fireEvent.pointerDown(canvas(), { pointerId: 2, clientX: 350, clientY: 600, pointerType: "touch" });
    expect(root()).toHaveAttribute("data-left-flipper", "down");
    expect(root()).toHaveAttribute("data-right-flipper", "down");
    fireEvent.pointerUp(canvas(), { pointerId: 1, pointerType: "touch" });
    expect(root()).toHaveAttribute("data-left-flipper", "up");
    expect(root()).toHaveAttribute("data-right-flipper", "down");
  });

  it("Space charges and launches the ball out of the plunger lane", () => {
    renderWithIntl(<PinballApp />);
    fireEvent.keyDown(canvas(), { code: "Space", key: " " });
    expect(root()).toHaveAttribute("data-plunger", "down");
    raf.frames(70);
    fireEvent.keyUp(canvas(), { code: "Space", key: " " });
    raf.frames(90);
    expect(document.querySelector("[data-pinball-launch]")).not.toBeInTheDocument();
  });

  it("New game resets the score and puts a fresh ball on the plunger", async () => {
    const user = userEvent.setup();
    renderWithIntl(<PinballApp />);
    fireEvent.keyDown(canvas(), { code: "Space", key: " " });
    raf.frames(70);
    fireEvent.keyUp(canvas(), { code: "Space", key: " " });
    for (let i = 0; i < 60 && score() === 0; i++) raf.frames(30);
    expect(score()).toBeGreaterThan(0);
    expect(document.querySelector("[data-pinball-high]")!.textContent).not.toBe("0");

    // F2 starts over; the session high score survives.
    fireEvent.keyDown(canvas(), { code: "F2", key: "F2" });
    expect(score()).toBe(0);
    expect(document.querySelector("[data-pinball-launch]")).toBeInTheDocument();
    expect(document.querySelector("[data-pinball-ball]")).toHaveTextContent("1/3");

    // And through Game ▸ New game.
    await user.click(document.querySelector<HTMLElement>('[data-game-menu="game"]')!);
    await user.click(await screen.findByText((_, el) => el?.getAttribute("data-game-menu-item") === "new"));
    expect(score()).toBe(0);
  });

  it("pauses when the window loses focus and resumes on click", async () => {
    const user = userEvent.setup();
    renderWithIntl(<PinballApp />);
    raf.frames(2);
    expect(raf.pending()).toBe(1);

    act(() => useWindowStore.getState().openWindow("about"));
    expect(root()).toHaveAttribute("data-paused", "true");
    expect(raf.pending()).toBe(0);
    expect(document.querySelector("[data-pinball-launch]")).not.toBeInTheDocument();

    act(() => useWindowStore.getState().focusWindow("pinball"));
    // Still paused until the player asks to continue.
    expect(root()).toHaveAttribute("data-paused", "true");
    await user.click(document.querySelector<HTMLElement>("[data-pinball-paused]")!);
    expect(root()).toHaveAttribute("data-paused", "false");
    expect(raf.pending()).toBe(1);
  });

  it("P toggles pause and the tab being hidden pauses", () => {
    renderWithIntl(<PinballApp />);
    fireEvent.keyDown(canvas(), { code: "KeyP", key: "p" });
    expect(root()).toHaveAttribute("data-paused", "true");
    fireEvent.keyDown(canvas(), { code: "KeyP", key: "p" });
    expect(root()).toHaveAttribute("data-paused", "false");

    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(root()).toHaveAttribute("data-paused", "true");
    expect(raf.pending()).toBe(0);
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
  });

  it("Help ▸ Controls lists the keys", async () => {
    const user = userEvent.setup();
    renderWithIntl(<PinballApp />);
    await user.click(document.querySelector<HTMLElement>('[data-game-menu="help"]')!);
    await user.click(await screen.findByText((_, el) => el?.getAttribute("data-game-menu-item") === "controls"));
    const dialog = await screen.findByTestId("pinball-controls");
    expect(dialog).toHaveTextContent("Left flipper: Z or Left Shift");
    expect(dialog).toHaveTextContent("C-O-D-E");
  });
});
