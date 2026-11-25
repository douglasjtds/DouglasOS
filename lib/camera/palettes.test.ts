import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_PALETTE,
  DOUGLASOS_PALETTE_TOKENS,
  PALETTES,
  PALETTE_IDS,
  hexToRgb,
  isPaletteId,
} from "@/lib/camera/palettes";

const globalsCss = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");

/** Value of a `--<token>: #rrggbb;` declaration in globals.css. */
function cssToken(token: string): string | undefined {
  const m = new RegExp(`--${token}:\\s*(#[0-9a-fA-F]{6})\\s*;`).exec(globalsCss);
  return m?.[1].toLowerCase();
}

describe("Retro Cam palettes", () => {
  it("parses #rrggbb", () => {
    expect(hexToRgb("#316AC5")).toEqual([0x31, 0x6a, 0xc5]);
    expect(() => hexToRgb("blue")).toThrow();
  });

  it("the DouglasOS palette mirrors real Luna tokens from globals.css (single source)", () => {
    for (const [token, hex] of Object.entries(DOUGLASOS_PALETTE_TOKENS)) {
      expect(cssToken(token), token).toBe(hex);
    }
  });

  it("offers DouglasOS, 16 colors, CGA and Original, DouglasOS first", () => {
    expect(PALETTE_IDS).toEqual(["douglasos", "classic16", "cga", "original"]);
    expect(DEFAULT_PALETTE).toBe("douglasos");
    expect(PALETTES.douglasos).toHaveLength(Object.keys(DOUGLASOS_PALETTE_TOKENS).length);
    expect(PALETTES.classic16).toHaveLength(16);
    expect(PALETTES.cga).toHaveLength(4);
    expect(PALETTES.original).toBeNull();
  });

  it("every palette has black and white, and no duplicates", () => {
    for (const id of ["douglasos", "classic16", "cga"] as const) {
      const colors = PALETTES[id]!.map((c) => c.join(","));
      expect(new Set(colors).size).toBe(colors.length);
      expect(colors).toContain("0,0,0");
      expect(colors).toContain("255,255,255");
    }
  });

  it("CGA is black, cyan, magenta and white", () => {
    expect(PALETTES.cga).toEqual([
      [0, 0, 0],
      [0x55, 0xff, 0xff],
      [0xff, 0x55, 0xff],
      [0xff, 0xff, 0xff],
    ]);
  });

  it("validates ids from the dropdown", () => {
    expect(isPaletteId("cga")).toBe(true);
    expect(isPaletteId("sepia")).toBe(false);
  });
});
