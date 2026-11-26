import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PaintApp from "@/components/apps/PaintApp";
import { renderWithIntl } from "@/test/renderWithIntl";
import { useWindowStore } from "@/lib/store/windowStore";

/**
 * jsdom has no canvas, so each canvas gets a tiny fake 2D context backed by a
 * real RGBA buffer: fillRect/strokes paint "something" and get/putImageData
 * round-trip, which is enough to drive the history and the bucket.
 */
function installFakeCanvas() {
  const contexts = new Map<HTMLCanvasElement, ReturnType<typeof makeContext>>();

  function makeContext(canvas: HTMLCanvasElement) {
    let pixels = new Uint8ClampedArray(canvas.width * canvas.height * 4);
    const ensure = () => {
      if (pixels.length !== canvas.width * canvas.height * 4) {
        pixels = new Uint8ClampedArray(canvas.width * canvas.height * 4);
      }
    };
    const set = (x: number, y: number, rgba: number[]) => {
      ensure();
      if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return;
      pixels.set(rgba, (Math.floor(y) * canvas.width + Math.floor(x)) * 4);
    };
    const parse = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).concat(255);
    const ctx = {
      fillStyle: "#000000",
      strokeStyle: "#000000",
      lineWidth: 1,
      lineCap: "butt",
      lineJoin: "miter",
      fillRect: vi.fn((x: number, y: number, w: number, h: number) => {
        for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) set(i, j, parse(ctx.fillStyle));
      }),
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn((x: number, y: number) => set(x, y, parse(ctx.strokeStyle))),
      stroke: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      strokeRect: vi.fn(),
      getImageData: vi.fn((_x: number, _y: number, w: number, h: number) => {
        ensure();
        return { data: new Uint8ClampedArray(pixels), width: w, height: h };
      }),
      putImageData: vi.fn((image: { data: Uint8ClampedArray }) => {
        ensure();
        pixels = new Uint8ClampedArray(image.data);
      }),
      pixel: (x: number, y: number) => [...pixels.slice((y * canvas.width + x) * 4, (y * canvas.width + x) * 4 + 4)],
    };
    return ctx;
  }

  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(function (this: HTMLCanvasElement) {
    if (!contexts.has(this)) contexts.set(this, makeContext(this));
    return contexts.get(this) as unknown as CanvasRenderingContext2D;
  } as unknown as HTMLCanvasElement["getContext"]);

  return {
    main: () => contexts.get(document.querySelector("[data-paint-canvas]") as HTMLCanvasElement)!,
  };
}

function surface() {
  return document.querySelector("[data-paint-surface]") as HTMLCanvasElement;
}

function stroke(from: [number, number], to: [number, number]) {
  const el = surface();
  fireEvent.pointerDown(el, { pointerId: 1, button: 0, pointerType: "mouse", clientX: from[0], clientY: from[1] });
  fireEvent.pointerMove(el, { pointerId: 1, pointerType: "mouse", clientX: to[0], clientY: to[1] });
  fireEvent.pointerUp(el, { pointerId: 1, pointerType: "mouse", clientX: to[0], clientY: to[1] });
}

const undoButton = () => document.querySelector('[data-paint-action="undo"]') as HTMLButtonElement;
const redoButton = () => document.querySelector('[data-paint-action="redo"]') as HTMLButtonElement;

describe("PaintApp", () => {
  let canvas: ReturnType<typeof installFakeCanvas>;

  beforeEach(() => {
    canvas = installFakeCanvas();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts on a white canvas with the pencil, black, and nothing to undo", () => {
    renderWithIntl(<PaintApp />);
    expect(canvas.main().pixel(5, 5)).toEqual([255, 255, 255, 255]);
    expect(document.querySelector('[data-paint-tool="pencil"]')).toHaveAttribute("aria-pressed", "true");
    expect(document.querySelector("[data-paint-current-color]")).toHaveAttribute("data-paint-current-color", "#000000");
    expect(undoButton()).toBeDisabled();
    expect(redoButton()).toBeDisabled();
    expect(document.querySelectorAll("[data-paint-color]")).toHaveLength(28);
    expect(screen.getByRole("img", { name: /Drawing canvas, \d+ by \d+ pixels/ })).toBeInTheDocument();
  });

  it("draws with the pencil, then undo and redo restore the snapshots", async () => {
    renderWithIntl(<PaintApp />);
    stroke([10, 10], [20, 10]);
    expect(canvas.main().pixel(15, 10)).toEqual([0, 0, 0, 255]);
    expect(undoButton()).toBeEnabled();

    undoButton().focus();
    fireEvent.click(undoButton());
    expect(canvas.main().pixel(15, 10)).toEqual([255, 255, 255, 255]);
    expect(undoButton()).toBeDisabled();
    expect(redoButton()).toBeEnabled();
    // The disabled Undo hands focus to Redo so keyboard users stay in Paint.
    await waitFor(() => expect(redoButton()).toHaveFocus());

    fireEvent.click(redoButton());
    expect(canvas.main().pixel(15, 10)).toEqual([0, 0, 0, 255]);
  });

  it("keyboard: Ctrl+Z undoes, Ctrl+Y and Ctrl+Shift+Z redo", () => {
    renderWithIntl(<PaintApp />);
    stroke([10, 10], [12, 10]);
    const app = document.querySelector("[data-paint-app]")!;
    fireEvent.keyDown(app, { key: "z", ctrlKey: true });
    expect(canvas.main().pixel(11, 10)).toEqual([255, 255, 255, 255]);
    fireEvent.keyDown(app, { key: "y", ctrlKey: true });
    expect(canvas.main().pixel(11, 10)).toEqual([0, 0, 0, 255]);
    fireEvent.keyDown(app, { key: "z", ctrlKey: true });
    fireEvent.keyDown(app, { key: "Z", ctrlKey: true, shiftKey: true });
    expect(canvas.main().pixel(11, 10)).toEqual([0, 0, 0, 255]);
  });

  it("picks a color and the bucket fills the canvas with it", () => {
    renderWithIntl(<PaintApp />);
    fireEvent.click(document.querySelector('[data-paint-color="#316ac5"]')!);
    expect(document.querySelector("[data-paint-current-color]")).toHaveAttribute("data-paint-current-color", "#316ac5");
    fireEvent.click(document.querySelector('[data-paint-tool="fill"]')!);
    expect(screen.getByText("Fills an area with the current color.")).toBeInTheDocument();
    fireEvent.pointerDown(surface(), { pointerId: 1, button: 0, pointerType: "mouse", clientX: 30, clientY: 30 });
    expect(canvas.main().pixel(100, 100)).toEqual([0x31, 0x6a, 0xc5, 255]);
    expect(undoButton()).toBeEnabled();
  });

  it("line widths only apply to sized tools", () => {
    renderWithIntl(<PaintApp />);
    const width = () => document.querySelector('[data-paint-size="9"]') as HTMLButtonElement;
    expect(width()).toBeDisabled();
    fireEvent.click(document.querySelector('[data-paint-tool="brush"]')!);
    expect(width()).toBeEnabled();
    fireEvent.click(width());
    expect(width()).toHaveAttribute("aria-pressed", "true");
  });

  it("ignores a second pointer and right clicks", () => {
    renderWithIntl(<PaintApp />);
    const el = surface();
    fireEvent.pointerDown(el, { pointerId: 1, button: 2, pointerType: "mouse", clientX: 5, clientY: 5 });
    expect(undoButton()).toBeDisabled();
    fireEvent.pointerDown(el, { pointerId: 1, pointerType: "touch", clientX: 5, clientY: 5 });
    fireEvent.pointerDown(el, { pointerId: 2, pointerType: "touch", clientX: 50, clientY: 50 });
    fireEvent.pointerUp(el, { pointerId: 2, pointerType: "touch", clientX: 50, clientY: 50 });
    expect(undoButton()).toBeDisabled();
    fireEvent.pointerUp(el, { pointerId: 1, pointerType: "touch", clientX: 5, clientY: 5 });
    expect(undoButton()).toBeEnabled();
  });

  it("Esc mid-stroke cancels the stroke and doesn't reach the window manager", () => {
    renderWithIntl(<PaintApp />);
    const el = surface();
    fireEvent.pointerDown(el, { pointerId: 1, button: 0, pointerType: "mouse", clientX: 10, clientY: 10 });
    fireEvent.pointerMove(el, { pointerId: 1, pointerType: "mouse", clientX: 20, clientY: 10 });
    const windowListener = vi.fn();
    window.addEventListener("keydown", windowListener);
    fireEvent.keyDown(el, { key: "Escape" });
    window.removeEventListener("keydown", windowListener);
    expect(windowListener).not.toHaveBeenCalled();
    expect(canvas.main().pixel(15, 10)).toEqual([255, 255, 255, 255]);
    fireEvent.pointerUp(el, { pointerId: 1, pointerType: "mouse", clientX: 20, clientY: 10 });
    expect(undoButton()).toBeDisabled();
  });

  it("File → New is undoable and Close closes the window", async () => {
    const closeWindow = vi.spyOn(useWindowStore.getState(), "closeWindow");
    renderWithIntl(<PaintApp />);
    stroke([10, 10], [20, 10]);

    const user = userEvent.setup();
    const file = document.querySelector<HTMLElement>('[data-paint-menu="file"]')!;
    await user.click(file);
    await user.click(await screen.findByRole("menuitem", { name: "New" }));
    expect(canvas.main().pixel(15, 10)).toEqual([255, 255, 255, 255]);
    await user.click(undoButton());
    expect(canvas.main().pixel(15, 10)).toEqual([0, 0, 0, 255]);

    await user.click(file);
    await user.click(await screen.findByRole("menuitem", { name: "Close" }));
    expect(closeWindow).toHaveBeenCalledWith("paint");
  });
});
