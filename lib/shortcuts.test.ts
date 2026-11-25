import { describe, expect, it } from "vitest";
import {
  SHORTCUTS,
  createMetaTapTracker,
  isApplePlatform,
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

  it("opens Run with Alt+Shift+R everywhere and Meta+R only off Apple platforms", () => {
    expect(matchShortcut(key({ key: "®", code: "KeyR", altKey: true, shiftKey: true }), idle)).toBe("openRun");
    expect(matchShortcut(key({ key: "r", code: "KeyR", metaKey: true }), idle)).toBe("openRun");
    // Cmd+R keeps reloading the page on macOS.
    expect(
      matchShortcut(key({ key: "r", code: "KeyR", metaKey: true }), { ...idle, applePlatform: true }),
    ).toBeNull();
    // Plain Ctrl+R (reload) is never taken.
    expect(matchShortcut(key({ key: "r", code: "KeyR", ctrlKey: true }), idle)).toBeNull();
  });

  it("opens the command palette with Ctrl+K or Cmd+K, but not while typing", () => {
    expect(matchShortcut(key({ key: "k", code: "KeyK", ctrlKey: true }), idle)).toBe("openPalette");
    expect(matchShortcut(key({ key: "k", code: "KeyK", metaKey: true }), idle)).toBe("openPalette");
    expect(
      matchShortcut(key({ key: "k", code: "KeyK", ctrlKey: true }), { ...idle, inTextField: true }),
    ).toBeNull();
  });

  it("maps Shift+F10 and the ContextMenu key to the context menu", () => {
    expect(matchShortcut(key({ key: "F10", shiftKey: true }), idle)).toBe("openContextMenu");
    expect(matchShortcut(key({ key: "ContextMenu" }), idle)).toBe("openContextMenu");
    expect(matchShortcut(key({ key: "F10" }), idle)).toBeNull();
  });

  it("detects Apple platforms", () => {
    expect(isApplePlatform({ platform: "MacIntel", userAgent: "" })).toBe(true);
    expect(isApplePlatform({ platform: "", userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)" })).toBe(true);
    expect(isApplePlatform({ platform: "Win32", userAgent: "" })).toBe(false);
    expect(isApplePlatform(undefined)).toBe(false);
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
