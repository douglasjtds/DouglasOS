import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");

describe("cmd.exe styles", () => {
  it("defines the console tokens and the caret blink animation CmdApp uses", () => {
    for (const token of ["--color-console-bg", "--color-console-text", "--color-console-prompt"]) {
      expect(css).toContain(`${token}:`);
    }
    expect(css).toContain("--animate-caret-blink:");
    expect(css).toMatch(/@keyframes caret-blink/);
  });
});
