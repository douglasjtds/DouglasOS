import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SWATCH_IDS } from "@/lib/wallpapers";

describe("solid-color swatch tokens", () => {
  it("live in a `@theme static` block, so Tailwind emits them even though only inline var() reads them", () => {
    const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");
    const block = /@theme static \{([^}]*)\}/.exec(css)?.[1] ?? "";
    for (const id of SWATCH_IDS) expect(block).toContain(`--color-swatch-${id}:`);
  });
});
