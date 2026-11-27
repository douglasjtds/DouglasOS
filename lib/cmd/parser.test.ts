import { describe, expect, it } from "vitest";
import { parseLine } from "./parser";

describe("parseLine", () => {
  it("returns null for blank lines", () => {
    expect(parseLine("")).toBeNull();
    expect(parseLine("   ")).toBeNull();
  });
  it("lowercases the command word and honors quotes", () => {
    expect(parseLine('  TYPE "about.txt"  ')).toEqual({
      name: "type",
      args: ["about.txt"],
      argText: '"about.txt"',
    });
  });
  it("keeps the raw remainder for echo/msg", () => {
    expect(parseLine("msg  hello   Douglas")!.argText).toBe("hello   Douglas");
  });
});
