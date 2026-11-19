import { describe, expect, it } from "vitest";
import { ADDRESS_ROOT, formatAddress, resolveAddress } from "@/lib/content/projectAddress";
import { PROJECTS_HOME_ROUTE } from "@/lib/content/projects";

const route = (r: string) => ({ kind: "route", route: r });

describe("formatAddress", () => {
  it("formats the home page and a case study under C:\\DouglasOS\\Projects\\", () => {
    expect(formatAddress(PROJECTS_HOME_ROUTE)).toBe("C:\\DouglasOS\\Projects\\");
    expect(formatAddress("gasolinha")).toBe("C:\\DouglasOS\\Projects\\gasolinha");
  });

  it("round-trips through the resolver", () => {
    for (const r of [PROJECTS_HOME_ROUTE, "gasolinha", "douglasos", "the-wedding-post"]) {
      expect(resolveAddress(formatAddress(r))).toEqual(route(r));
    }
  });
});

describe("resolveAddress", () => {
  it("resolves a bare slug", () => {
    expect(resolveAddress("gasolinha")).toEqual(route("gasolinha"));
    expect(resolveAddress("the-wedding-post")).toEqual(route("the-wedding-post"));
  });

  it("ignores case and surrounding spaces/quotes", () => {
    expect(resolveAddress("  GASOLINHA  ")).toEqual(route("gasolinha"));
    expect(resolveAddress('"DouglasOS"')).toEqual(route("douglasos"));
  });

  it("matches the brand name with spaces and punctuation", () => {
    expect(resolveAddress("The Wedding Post")).toEqual(route("the-wedding-post"));
    expect(resolveAddress("the_wedding.post")).toEqual(route("the-wedding-post"));
  });

  it("accepts aliases", () => {
    expect(resolveAddress("wedding")).toEqual(route("the-wedding-post"));
    expect(resolveAddress("gasolinha.com.br")).toEqual(route("gasolinha"));
    expect(resolveAddress("Douglas OS")).toEqual(route("douglasos"));
  });

  it("accepts the full or partial path, either slash, and a fun extension", () => {
    expect(resolveAddress("C:\\DouglasOS\\Projects\\Gasolinha")).toEqual(route("gasolinha"));
    expect(resolveAddress("c:/douglasos/projects/gasolinha/")).toEqual(route("gasolinha"));
    expect(resolveAddress("Projects\\douglasos")).toEqual(route("douglasos"));
    expect(resolveAddress("gasolinha.exe")).toEqual(route("gasolinha"));
  });

  it("resolves empty input, the root and 'home' to the project list", () => {
    for (const input of ["", "   ", ADDRESS_ROOT, "C:\\", "C:\\DouglasOS", "home", "Projects"]) {
      expect(resolveAddress(input)).toEqual(route(PROJECTS_HOME_ROUTE));
    }
  });

  it("reports unknown names and deeper paths as not found, keeping what was typed", () => {
    expect(resolveAddress("  netflix  ")).toEqual({ kind: "notFound", query: "netflix" });
    expect(resolveAddress("C:\\DouglasOS\\Projects\\gasolinha\\secret")).toEqual({
      kind: "notFound",
      query: "C:\\DouglasOS\\Projects\\gasolinha\\secret",
    });
    expect(resolveAddress("C:\\Other\\gasolinha").kind).toBe("notFound");
  });
});
