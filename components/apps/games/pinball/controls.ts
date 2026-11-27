/** What a key does on the pinball table (by `KeyboardEvent.code`). */
export type PinballControl = "left" | "right" | "plunger" | "pause" | "newGame";

const KEYMAP: Record<string, PinballControl> = {
  KeyZ: "left",
  ShiftLeft: "left",
  Slash: "right",
  KeyM: "right",
  ShiftRight: "right",
  Space: "plunger",
  ArrowDown: "plunger",
  KeyP: "pause",
  Escape: "pause",
  F2: "newGame",
};

export function controlForKey(code: string): PinballControl | null {
  return KEYMAP[code] ?? null;
}

/** Which flipper a pointer controls: the left or right half of the table. */
export function sideForPointer(clientX: number, rect: { left: number; width: number }): "left" | "right" {
  return clientX - rect.left < rect.width / 2 ? "left" : "right";
}
