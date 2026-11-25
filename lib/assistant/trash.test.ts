import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import pt from "@/messages/pt.json";
import { DESKTOP_ICON_IDS } from "@/lib/apps/registry";
import {
  CLEANUP_LINES,
  TRASH_LINES,
  TRASH_MESSAGE_ID,
  bumpTrashCount,
  recycleBinOpenedMessage,
  trashMessage,
} from "@/lib/assistant/trash";

function lookup(catalog: unknown, key: string): unknown {
  return key.split(".").reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], catalog);
}

describe("Recycle Bin rescue lines", () => {
  it("has 2–3 EN + PT variations for every desktop icon, plus generic and cleanup lines", () => {
    expect(Object.keys(TRASH_LINES).sort()).toEqual([...DESKTOP_ICON_IDS].sort());
    const all = [...Object.values(TRASH_LINES), ...Object.values(CLEANUP_LINES)];
    for (const { key, variants } of all) {
      expect(variants).toBeGreaterThanOrEqual(2);
      expect(variants).toBeLessThanOrEqual(3);
      for (const catalog of [en, pt]) {
        const node = lookup(catalog, `assistant.trash.lines.${key}`) as Record<string, string>;
        expect(Object.keys(node)).toHaveLength(variants);
        for (let v = 1; v <= variants; v++) expect(node[`v${v}`]).toMatch(/\S/);
      }
    }
    for (const catalog of [en, pt]) {
      expect(lookup(catalog, "assistant.trash.lines.generic")).toMatch(/\S/);
      for (const k of ["title", "titleCleanup", "binTitle", "binOpened"]) {
        expect(lookup(catalog, `assistant.trash.${k}`)).toMatch(/\S/);
      }
    }
  });

  it("rotates an icon's variations", () => {
    let counts = {};
    const seen: string[] = [];
    for (let i = 0; i < 4; i++) {
      seen.push(trashMessage(["whatsapp"], counts).textKey);
      counts = bumpTrashCount(counts, ["whatsapp"]);
    }
    expect(seen).toEqual([
      "assistant.trash.lines.whatsapp.v1",
      "assistant.trash.lines.whatsapp.v2",
      "assistant.trash.lines.whatsapp.v1",
      "assistant.trash.lines.whatsapp.v2",
    ]);
  });

  it("offers the CV first for the résumé, and Contact + CV for the links", () => {
    const cv = trashMessage(["resume"]);
    expect(cv.actions[0]).toEqual({ kind: "downloadCv" });
    expect(trashMessage(["github"]).actions).toEqual([{ kind: "openApp", app: "contact" }, { kind: "downloadCv" }]);
    expect(trashMessage(["skills"]).actions[0]).toEqual({ kind: "openApp", app: "skills" });
    for (const id of DESKTOP_ICON_IDS) {
      const kinds = trashMessage([id]).actions.map((a) => a.kind);
      expect(kinds).toContain("downloadCv");
    }
  });

  it("uses the cleanup line for a batch, preferring the CV version when the CV was in it", () => {
    const batch = trashMessage(["linkedin", "github", "whatsapp"]);
    expect(batch.id).toBe(TRASH_MESSAGE_ID);
    expect(batch.titleKey).toBe("assistant.trash.titleCleanup");
    expect(batch.textKey).toBe("assistant.trash.lines.cleanup.v1");
    expect(batch.values).toEqual({ count: "3" });

    const withCv = trashMessage(["about", "resume"]);
    expect(withCv.textKey).toBe("assistant.trash.lines.cleanupWithCv.v1");
    expect(withCv.actions[0]).toEqual({ kind: "downloadCv" });
    // Duplicates don't inflate the count; a single unique id is not a batch.
    expect(trashMessage(["about", "about"]).textKey).toBe("assistant.trash.lines.about.v1");
  });

  it("is an auto line (never steals focus) and has a bin-opened comment", () => {
    expect(trashMessage(["about"]).auto).toBe(true);
    expect(recycleBinOpenedMessage()).toMatchObject({ id: "recycleBin", auto: true });
  });
});
