import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import pt from "@/messages/pt.json";
import {
  EASTER_EGGS,
  EASTER_EGG_IDS,
  EASTER_EGG_TOTAL,
  easterEggHintKey,
  easterEggTitleKey,
  isEasterEggId,
} from "@/lib/easter-eggs/registry";

function lookup(messages: unknown, key: string): unknown {
  return key
    .split(".")
    .reduce<unknown>(
      (node, part) => (node && typeof node === "object" ? (node as Record<string, unknown>)[part] : undefined),
      messages,
    );
}

describe("easter egg registry", () => {
  it("keeps the contract ids, in order (other stages call these)", () => {
    expect(EASTER_EGG_IDS).toEqual([
      "protected-file",
      "assistant-dance",
      "assistant-kickflip",
      "messenger-nudge",
      "trash-rescue",
      "trash-cleanup",
      "run-cmd",
      "desktop-new",
      "music-dance",
      "egg-404",
      "egg-runaway",
      "egg-scold",
      "real-404",
    ]);
    expect(EASTER_EGG_TOTAL).toBe(13);
  });

  it("has unique ids", () => {
    expect(new Set(EASTER_EGG_IDS).size).toBe(EASTER_EGG_IDS.length);
  });

  it("records which stage provides each egg", () => {
    const byStage = Object.fromEntries(EASTER_EGGS.map((egg) => [egg.id, egg.stage]));
    expect(byStage).toMatchObject({
      "protected-file": "1",
      "assistant-dance": "5",
      "assistant-kickflip": "5",
      "messenger-nudge": "5b",
      "trash-rescue": "6",
      "trash-cleanup": "6",
      "run-cmd": "7",
      "desktop-new": "7",
      "music-dance": "8",
      "real-404": "10",
    });
  });

  it("gives every egg a non-empty EN + PT title and hint", () => {
    for (const id of EASTER_EGG_IDS) {
      for (const messages of [en, pt]) {
        expect(lookup(messages, easterEggTitleKey(id))).toEqual(expect.stringMatching(/\S/));
        expect(lookup(messages, easterEggHintKey(id))).toEqual(expect.stringMatching(/\S/));
      }
    }
  });

  it("has the toast and counter copy in both languages", () => {
    expect(lookup(en, "easterEggs.toast.title")).toBe("🎉 Easter egg found! ({count}/{total})");
    expect(lookup(pt, "easterEggs.toast.title")).toBe("🎉 Easter egg encontrado! ({count}/{total})");
    for (const messages of [en, pt]) {
      expect(lookup(messages, "apps.achievements.title")).toEqual(expect.any(String));
      expect(lookup(messages, "easterEggs.counter")).toBe("{count}/{total}");
      expect(lookup(messages, "assistant.messages.eggsComplete.text")).toEqual(expect.any(String));
      expect(lookup(messages, "apps.display.wallpapers.golden-egg")).toEqual(expect.any(String));
    }
  });

  it("guards ids at runtime", () => {
    expect(isEasterEggId("run-cmd")).toBe(true);
    expect(isEasterEggId("konami")).toBe(false);
    expect(isEasterEggId(42)).toBe(false);
  });
});
