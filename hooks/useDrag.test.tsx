import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDrag } from "@/hooks/useDrag";
import { Z_BASE, useWindowStore } from "@/lib/store/windowStore";

function resetStore() {
  useWindowStore.setState({
    windows: {},
    order: [],
    focusedId: null,
    topZ: Z_BASE,
    openCount: 0,
  });
}

/** Build a pointer-event-ish object with the capture API the hook touches. */
function pointerEvent(overrides: Partial<{
  button: number;
  pointerId: number;
  clientX: number;
  clientY: number;
}> = {}) {
  const captured = new Set<number>();
  const target = { closest: () => null };
  return {
    button: 0,
    pointerId: 1,
    clientX: 0,
    clientY: 0,
    target,
    currentTarget: {
      setPointerCapture: (id: number) => captured.add(id),
      releasePointerCapture: (id: number) => captured.delete(id),
      hasPointerCapture: (id: number) => captured.has(id),
    },
    ...overrides,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

describe("useDrag", () => {
  beforeEach(resetStore);

  it("focuses the window and moves it by the pointer delta", () => {
    useWindowStore.getState().openWindow("about");
    const origin = { ...useWindowStore.getState().windows.about.rect };

    const { result } = renderHook(() => useDrag("about"));

    result.current.onPointerDown(pointerEvent({ clientX: 100, clientY: 100 }));
    result.current.onPointerMove(pointerEvent({ clientX: 160, clientY: 140 }));

    const { rect } = useWindowStore.getState().windows.about;
    expect(rect.x).toBe(origin.x + 60);
    expect(rect.y).toBe(origin.y + 40);
    expect(useWindowStore.getState().focusedId).toBe("about");
  });

  it("ignores non-primary mouse buttons", () => {
    useWindowStore.getState().openWindow("about");
    const focusSpy = vi.spyOn(useWindowStore.getState(), "focusWindow");
    const { result } = renderHook(() => useDrag("about"));

    result.current.onPointerDown(pointerEvent({ button: 2 }));

    expect(focusSpy).not.toHaveBeenCalled();
  });

  it("does nothing when disabled", () => {
    useWindowStore.getState().openWindow("about");
    const origin = { ...useWindowStore.getState().windows.about.rect };
    const { result } = renderHook(() => useDrag("about", true));

    result.current.onPointerDown(pointerEvent({ clientX: 0, clientY: 0 }));
    result.current.onPointerMove(pointerEvent({ clientX: 200, clientY: 200 }));

    expect(useWindowStore.getState().windows.about.rect).toEqual(origin);
  });
});
