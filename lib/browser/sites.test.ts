import { describe, expect, it } from "vitest";
import {
  BROWSER_SITES,
  DEFAULT_SITE_IDS,
  formatPageAddress,
  getSite,
  hostOf,
  resolveBrowserAddress,
} from "@/lib/browser/sites";
import { PROFILE } from "@/lib/profile";

const site = (siteId: string) => ({ kind: "site", siteId });

describe("browser sites", () => {
  it("frames the projects and shows local pages for LinkedIn and GitHub", () => {
    expect(getSite("linkedin")).toMatchObject({ render: "local", url: PROFILE.linkedin });
    expect(getSite("github")).toMatchObject({ render: "local", url: PROFILE.github });
    expect(getSite("gasolinha")).toMatchObject({ render: "frame" });
    expect(getSite("poupensa")).toMatchObject({ render: "frame" });
  });

  it("only lists projects that have a public demo", () => {
    expect(getSite("prospecting-tool")).toBeUndefined();
    expect(getSite("douglasos")).toBeUndefined();
    for (const s of BROWSER_SITES) expect(s.url).toMatch(/^https:\/\//);
  });

  it("opens with LinkedIn and gasolinha by default", () => {
    expect(DEFAULT_SITE_IDS).toEqual(["linkedin", "gasolinha"]);
    for (const id of DEFAULT_SITE_IDS) expect(getSite(id)).toBeDefined();
  });

  it("strips www. from hosts", () => {
    expect(hostOf("https://www.gasolinha.com.br/x")).toBe("gasolinha.com.br");
    expect(hostOf("not a url")).toBe("");
  });
});

describe("resolveBrowserAddress", () => {
  it("accepts names and aliases, ignoring case, accents and punctuation", () => {
    expect(resolveBrowserAddress("Gasolinha")).toEqual(site("gasolinha"));
    expect(resolveBrowserAddress("  santo rosário ")).toEqual(site("santo-rosario"));
    expect(resolveBrowserAddress("linked in")).toEqual(site("linkedin"));
    expect(resolveBrowserAddress("poupensa")).toEqual(site("poupensa"));
  });

  it("accepts full URLs, bare hosts, paths and subdomains of allowed sites", () => {
    expect(resolveBrowserAddress("https://www.gasolinha.com.br")).toEqual(site("gasolinha"));
    expect(resolveBrowserAddress("gasolinha.com.br/precos")).toEqual(site("gasolinha"));
    expect(resolveBrowserAddress("https://www.linkedin.com/in/douglasjtds")).toEqual(site("linkedin"));
    expect(resolveBrowserAddress("br.linkedin.com")).toEqual(site("linkedin"));
    expect(resolveBrowserAddress("poupensa.vercel.app")).toEqual(site("poupensa"));
  });

  it("does not let other sites on a shared host through", () => {
    expect(resolveBrowserAddress("vercel.app")).toEqual({ kind: "blocked", query: "vercel.app" });
    expect(resolveBrowserAddress("someone-else.vercel.app").kind).toBe("blocked");
  });

  it("goes home on an empty field or about:start", () => {
    expect(resolveBrowserAddress("")).toEqual({ kind: "home" });
    expect(resolveBrowserAddress("about:start")).toEqual({ kind: "home" });
  });

  it("blocks everything else and keeps the query", () => {
    expect(resolveBrowserAddress(" google.com ")).toEqual({ kind: "blocked", query: "google.com" });
    expect(resolveBrowserAddress("facebook")).toEqual({ kind: "blocked", query: "facebook" });
  });

  it("formats addresses", () => {
    expect(formatPageAddress({ kind: "home" })).toBe("about:start");
    expect(formatPageAddress(site("gasolinha") as never)).toBe("https://www.gasolinha.com.br");
    expect(formatPageAddress({ kind: "blocked", query: "x.com" })).toBe("x.com");
  });
});
