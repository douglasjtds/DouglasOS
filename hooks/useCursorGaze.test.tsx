import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { AssistantState } from "@/lib/store/assistantStore";
import { GAZE_TUNING } from "@/lib/assistant/gaze";
import { useCursorGaze } from "@/hooks/useCursorGaze";

// The character box: 96×112 at (800, 500); center (848, 556).
const BOX = { left: 800, top: 500, width: 96, height: 112 };

function makeTarget() {
  const el = document.createElement("button");
  el.getBoundingClientRect = () =>
    ({ ...BOX, x: BOX.left, y: BOX.top, right: BOX.left + BOX.width, bottom: BOX.top + BOX.height, toJSON() {} }) as DOMRect;
  return { current: el };
}

function move(x: number, y: number, pointerType?: string) {
  const event = new MouseEvent("pointermove", { clientX: x, clientY: y });
  if (pointerType) Object.defineProperty(event, "pointerType", { value: pointerType });
  act(() => {
    window.dispatchEvent(event);
    vi.advanceTimersByTime(20); // flush the frame
  });
}

function setup(initial: { enabled?: boolean; state?: AssistantState } = {}) {
  const target = makeTarget();
  return renderHook(
    ({ enabled, state }: { enabled: boolean; state: AssistantState }) => useCursorGaze(target, { enabled, state }),
    { initialProps: { enabled: initial.enabled ?? true, state: initial.state ?? "idle" } },
  );
}

describe("useCursorGaze", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts neutral and looks toward the cursor", () => {
    const { result } = setup();
    expect(result.current.expression).toBe("neutral");
    move(100, 556); // far to his left
    act(() => vi.advanceTimersByTime(1000)); // let the springs settle
    expect(result.current.x.get()).toBeLessThan(-0.9);
    expect(Math.abs(result.current.y.get())).toBeLessThan(0.05);
    expect(result.current.tilt.get()).toBeLessThan(0);
  });

  it("is happy while hovered and curious when near", () => {
    const { result } = setup();
    move(848, 556);
    expect(result.current.expression).toBe("happy");
    act(() => vi.advanceTimersByTime(GAZE_TUNING.surprisedMs + GAZE_TUNING.surprisedCooldownMs));
    move(848, 556 - 112 / 2 - 100); // 100px above his box, slowly enough
    expect(result.current.expression).toBe("curious");
  });

  it("dozes off after sleepyMs without input and wakes on a move", () => {
    const { result } = setup();
    move(10, 10);
    expect(result.current.expression).toBe("neutral");
    act(() => vi.advanceTimersByTime(GAZE_TUNING.sleepyMs));
    expect(result.current.expression).toBe("sleepy");
    move(12, 12);
    expect(result.current.expression).toBe("neutral");
  });

  it("is startled by a fast pass nearby, then calms down", () => {
    const { result } = setup();
    move(500, 400);
    act(() => {
      window.dispatchEvent(new MouseEvent("pointermove", { clientX: 760, clientY: 400 }));
      vi.advanceTimersByTime(5);
      window.dispatchEvent(new MouseEvent("pointermove", { clientX: 1000, clientY: 400 }));
      vi.advanceTimersByTime(20);
    });
    expect(result.current.expression).toBe("surprised");
    act(() => vi.advanceTimersByTime(GAZE_TUNING.surprisedMs + 10));
    expect(result.current.expression).not.toBe("surprised");
  });

  it("ignores touch input", () => {
    const { result } = setup();
    move(848, 556, "touch");
    expect(result.current.expression).toBe("neutral");
  });

  it("does nothing while disabled and resets when disabled", () => {
    const disabled = setup({ enabled: false });
    move(848, 556);
    expect(disabled.result.current.expression).toBe("neutral");

    const { result, rerender } = setup();
    move(848, 556);
    expect(result.current.expression).toBe("happy");
    rerender({ enabled: false, state: "idle" });
    expect(result.current.expression).toBe("neutral");
  });

  it("follows the assistant state (no curious face while talking)", () => {
    const { result, rerender } = setup();
    move(848, 400); // just above his box
    expect(result.current.expression).toBe("curious");
    rerender({ enabled: true, state: "talking" });
    expect(result.current.expression).toBe("neutral");
  });
});
