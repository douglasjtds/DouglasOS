import { describe, expect, it } from "vitest";
import { LAUNCHERS } from "@/lib/apps/registry";
import { PROJECTS } from "@/lib/content/projects";
import { resolveRun, runKey, searchRun, sameTarget, type RunTarget } from "@/lib/run/resolver";

const target = (input: string, labels = {}) => {
  const r = resolveRun(input, labels);
  return r?.kind === "target" ? r.target : r;
};

describe("runKey", () => {
  it("ignores case, accents, quotes, punctuation and fun extensions", () => {
    expect(runKey("  \"Currículo.PDF\" ")).toBe("curriculo");
    expect(runKey("whatsapp.exe")).toBe("whatsapp");
    expect(runKey("How I Work With AI")).toBe("howiworkwithai");
  });
});

describe("resolveRun", () => {
  it("returns null for empty input", () => {
    expect(resolveRun("   ")).toBeNull();
  });

  it("resolves every launcher by its id (data-driven from the registry)", () => {
    for (const l of LAUNCHERS) {
      expect(target(l.id)).toEqual({ kind: "launcher", id: l.id });
    }
  });

  it("resolves the CV by cv / resume / currículo / resume.pdf", () => {
    for (const q of ["cv", "CV", "resume", "currículo", "resume.pdf"]) {
      expect(target(q)).toEqual({ kind: "launcher", id: "resume" });
    }
  });

  it("resolves app names, PT aliases and the localized titles passed in", () => {
    expect(target("contato")).toEqual({ kind: "launcher", id: "contact" });
    expect(target("projects")).toEqual({ kind: "launcher", id: "projects" });
    expect(target("lixeira")).toEqual({ kind: "launcher", id: "recycle-bin" });
    expect(target("linkedin")).toEqual({ kind: "launcher", id: "linkedin" });
    expect(target("zap")).toEqual({ kind: "launcher", id: "whatsapp" });
    expect(target("Sobre o Douglas", { about: "Sobre o Douglas" })).toEqual({ kind: "launcher", id: "about" });
  });

  it("resolves the Media Player and Retro Cam by their classic names (stages 8–9)", () => {
    for (const q of ["music", "Player", "radio", "música", "media-player"]) {
      expect(target(q)).toEqual({ kind: "launcher", id: "media-player" });
    }
    for (const q of ["cam", "webcam", "Camera", "retro cam"]) {
      expect(target(q)).toEqual({ kind: "launcher", id: "camera" });
    }
  });

  it("resolves every project by slug, brand name and address", () => {
    for (const p of PROJECTS) {
      expect(target(p.slug)).toEqual({ kind: "launcher", id: "projects", route: p.slug });
      expect(target(p.name)).toEqual({ kind: "launcher", id: "projects", route: p.slug });
    }
    expect(target("C:\\DouglasOS\\Projects\\gasolinha")).toEqual({
      kind: "launcher",
      id: "projects",
      route: "gasolinha",
    });
    expect(target("gasolinha.exe")).toEqual({ kind: "launcher", id: "projects", route: "gasolinha" });
  });

  it("prefers the WhatsApp shortcut over the 'Link to WhatsApp' project for 'whatsapp'", () => {
    expect(target("whatsapp")).toEqual({ kind: "launcher", id: "whatsapp" });
    expect(target("link to whatsapp")).toEqual({ kind: "launcher", id: "projects", route: "link-to-whatsapp" });
  });

  it("understands confident free-text questions through the shared intent matcher", () => {
    expect(target("I want to hire you")).toEqual({ kind: "launcher", id: "contact" });
    expect(target("quero baixar o currículo")).toEqual({ kind: "launcher", id: "resume" });
    expect(target("show me the gasolinha project")).toEqual({
      kind: "launcher",
      id: "projects",
      route: "gasolinha",
    });
  });

  it("runs the cmd easter egg", () => {
    expect(target("cmd")).toEqual({ kind: "command", id: "cmd" });
    expect(target("terminal")).toEqual({ kind: "command", id: "cmd" });
  });

  it("reports unknown names (and weak matches) as not found, keeping the query", () => {
    expect(resolveRun("xyz")).toEqual({ kind: "notFound", query: "xyz" });
    expect(resolveRun("  coffe ")).toEqual({ kind: "notFound", query: "coffe" });
    expect(resolveRun("code")).toEqual({ kind: "notFound", query: "code" });
  });
});

describe("searchRun", () => {
  const keys = (q: string, labels = {}) => searchRun(q, labels).map((s) => s.key);

  it("lists launchers then projects for an empty query, never the fun commands", () => {
    const all = searchRun("", {}, 100);
    expect(all[0].key).toBe(`launcher:${LAUNCHERS[0].id}`);
    expect(all.some((s) => s.type === "command")).toBe(false);
    expect(all.filter((s) => s.type === "project")).toHaveLength(PROJECTS.length);
  });

  it("suggests the Media Player and Retro Cam in the palette by alias", () => {
    expect(keys("music")[0]).toBe("launcher:media-player");
    expect(keys("webcam")[0]).toBe("launcher:camera");
  });

  it("puts the exact match first, then prefix matches", () => {
    expect(keys("cv")[0]).toBe("launcher:resume");
    const con = keys("con");
    expect(con[0]).toBe("launcher:contact");
  });

  it("autocompletes projects by brand prefix", () => {
    expect(keys("gaso")[0]).toBe("project:gasolinha");
    expect(keys("wedd")).toContain("project:the-wedding-post");
  });

  it("matches localized titles by word prefix", () => {
    expect(keys("trab", { "how-i-work-with-ai": "Como trabalho com IA" })).toContain(
      "launcher:how-i-work-with-ai",
    );
  });

  it("leads with the intent matcher's answer for questions", () => {
    expect(keys("hire me")[0]).toBe("launcher:contact");
  });

  it("every suggestion's command resolves back to the same target", () => {
    for (const s of searchRun("", {}, 100)) {
      const r = resolveRun(s.command);
      expect(r?.kind).toBe("target");
      expect(sameTarget((r as { target: RunTarget }).target, s.target)).toBe(true);
    }
  });

  it("returns nothing for gibberish", () => {
    expect(searchRun("xyzzy")).toEqual([]);
  });
});
