import { describe, expect, it } from "vitest";
import { renderFile } from "@/lib/cmd/content";
import { en, pt } from "@/lib/cmd/testTranslator";
import { PROJECTS } from "@/lib/content/projects";
import { PROFILE } from "@/lib/profile";
import enMessages from "@/messages/en.json";
import ptMessages from "@/messages/pt.json";

function flatten(node: unknown, prefix = ""): Record<string, unknown> {
  if (node && !Array.isArray(node) && typeof node === "object") {
    return Object.entries(node).reduce<Record<string, unknown>>(
      (acc, [k, v]) => Object.assign(acc, flatten(v, prefix ? `${prefix}.${k}` : k)),
      {},
    );
  }
  return { [prefix]: node };
}

describe("renderFile", () => {
  it("about.txt starts with name and headline from the About window copy", () => {
    const lines = renderFile({ kind: "app", app: "about" }, en);
    expect(lines.slice(0, 2)).toEqual([en("apps.about.name"), en("apps.about.headline")]);
  });

  it("follows the locale", () => {
    expect(renderFile({ kind: "app", app: "about" }, pt)).toContain(pt("apps.about.headline"));
  });

  it("contact.txt takes URLs from lib/profile.ts", () => {
    const text = renderFile({ kind: "app", app: "contact" }, en).join("\n");
    expect(text).toContain(PROFILE.linkedin);
    expect(text).toContain(PROFILE.github);
    expect(text).toContain(PROFILE.email);
  });

  it("renders every text app without throwing", () => {
    for (const app of ["about", "experience", "skills", "how-i-work-with-ai", "contact"] as const) {
      expect(renderFile({ kind: "app", app }, en).length).toBeGreaterThan(0);
    }
  });

  it("renders every project without throwing, with its name first", () => {
    for (const p of PROJECTS) {
      expect(renderFile({ kind: "project", slug: p.slug }, en)[0]).toContain(p.name);
    }
  });

  it("uses the Explorer coming-soon copy for empty case-study sections", () => {
    const text = renderFile({ kind: "project", slug: "gasolinha" }, en).join("\n");
    expect(text).toContain(en("apps.projects.explorer.page.comingSoon"));
  });

  it("readme renders the apps.cmd.readme lines", () => {
    expect(renderFile({ kind: "readme" }, en)).toEqual(enMessages.apps.cmd.readme);
  });
});

describe("apps.cmd copy", () => {
  it("has the same keys in EN and PT, none empty", () => {
    const a = flatten(enMessages.apps.cmd);
    const b = flatten(ptMessages.apps.cmd);
    expect(Object.keys(b).sort()).toEqual(Object.keys(a).sort());
    for (const catalog of [a, b]) {
      for (const [key, value] of Object.entries(catalog)) {
        if (Array.isArray(value)) {
          expect(value.length, key).toBeGreaterThan(0);
          for (const line of value) expect(String(line).length, key).toBeGreaterThan(0);
        } else {
          expect(String(value).length, key).toBeGreaterThan(0);
        }
      }
    }
  });

  it("covers a help line for every command and keeps help clear of sudo/format", () => {
    const commands = ["help", "dir", "cd", "type", "tree", "start", "cv", "contact", "msg",
      "whoami", "ver", "date", "time", "echo", "cls", "exit"];
    for (const locale of [enMessages, ptMessages]) {
      const help = locale.apps.cmd.help as Record<string, string>;
      for (const c of commands) expect(help[c], c).toBeTruthy();
      expect(JSON.stringify(help).toLowerCase()).not.toMatch(/sudo|format/);
    }
  });
});
