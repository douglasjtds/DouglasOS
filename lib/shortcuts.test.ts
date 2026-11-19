import { describe, expect, it } from "vitest";
import {
  SHORTCUTS,
  createMetaTapTracker,
  matchShortcut,
  type KeyInput,
} from "@/lib/shortcuts";

function key(partial: Partial<KeyInput>): KeyInput {
  return {
    key: "",
    code: "",
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    metaKey: false,
    ...partial,
  };
}

const idle = { inTextField: false, overlayOpen: false };

describe("matchShortcut", () => {
  it("toggles the Start menu with Ctrl+Esc and Alt+Shift+S", () => {
    expect(matchShortcut(key({ key: "Escape", ctrlKey: true }), idle)).toBe("toggleStartMenu");
    expect(
      matchShortcut(key({ key: "S", code: "KeyS", altKey: true, shiftKey: true }), idle),
    ).toBe("toggleStartMenu");
  });

  it("matches Alt+Shift combos by code, ignoring the produced character", () => {
    // macOS Option+Shift+W types "„" — the code still identifies the key.
    expect(
      matchShortcut(key({ key: "„", code: "KeyW", altKey: true, shiftKey: true }), idle),
    ).toBe("nextWindow");
    expect(
      matchShortcut(key({ key: "Œ", code: "KeyQ", altKey: true, shiftKey: true }), idle),
    ).toBe("previousWindow");
  });

  it("maps maximize/restore and Alt+F4", () => {
    expect(
      matchShortcut(key({ key: "ArrowUp", code: "ArrowUp", altKey: true, shiftKey: true }), idle),
    ).toBe("maximizeWindow");
    expect(
      matchShortcut(key({ key: "ArrowDown", code: "ArrowDown", altKey: true, shiftKey: true }), idle),
    ).toBe("restoreWindow");
    expect(matchShortcut(key({ key: "F4", altKey: true }), idle)).toBe("closeWindow");
  });

  it("closes the focused window on Esc only when no overlay is open", () => {
    expect(matchShortcut(key({ key: "Escape" }), idle)).toBe("closeWindow");
    expect(
      matchShortcut(key({ key: "Escape" }), { ...idle, overlayOpen: true }),
    ).toBeNull();
  });

  it("ignores global shortcuts while typing, except Ctrl+Esc", () => {
    const typing = { inTextField: true, overlayOpen: false };
    expect(matchShortcut(key({ key: "Escape" }), typing)).toBeNull();
    expect(
      matchShortcut(key({ code: "KeyW", altKey: true, shiftKey: true }), typing),
    ).toBeNull();
    expect(matchShortcut(key({ key: "Escape", ctrlKey: true }), typing)).toBe("toggleStartMenu");
  });

  it("ignores unrelated keys", () => {
    expect(matchShortcut(key({ key: "a", code: "KeyA" }), idle)).toBeNull();
    expect(matchShortcut(key({ code: "KeyZ", altKey: true, shiftKey: true }), idle)).toBeNull();
  });

  it("has no duplicate key bindings in the registry", () => {
    const all = SHORTCUTS.flatMap((s) => s.keys);
    expect(new Set(all).size).toBe(all.length);
  });
});

describe("createMetaTapTracker", () => {
  it("reports a clean Meta tap", () => {
    const t = createMetaTapTracker();
    t.keydown({ key: "Meta" });
    expect(t.keyup({ key: "Meta" })).toBe(true);
  });

  it("does not fire when another key was pressed with Meta (e.g. Cmd+C)", () => {
    const t = createMetaTapTracker();
    t.keydown({ key: "Meta" });
    t.keydown({ key: "c" });
    expect(t.keyup({ key: "Meta" })).toBe(false);
  });

  it("does not fire after a reset (page blur, e.g. Cmd+Tab away)", () => {
    const t = createMetaTapTracker();
    t.keydown({ key: "Meta" });
    t.reset();
    expect(t.keyup({ key: "Meta" })).toBe(false);
  });
});
