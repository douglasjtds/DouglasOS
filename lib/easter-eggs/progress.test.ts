import { describe, expect, it } from "vitest";
import { EASTER_EGG_IDS } from "@/lib/easter-eggs/registry";
import {
  EMPTY_PROGRESS,
  countFound,
  discoverEgg,
  discoveryOrdinal,
  isComplete,
  sanitizeProgress,
  type EggProgress,
} from "@/lib/easter-eggs/progress";

function allButLast(): EggProgress {
  let progress = EMPTY_PROGRESS;
  EASTER_EGG_IDS.slice(0, -1).forEach((id, i) => {
    progress = discoverEgg(progress, id, 1000 + i).progress;
  });
  return { ...progress, pending: [] };
}

describe("discoverEgg", () => {
  it("records a new egg and queues its toast", () => {
    const { progress, isNew } = discoverEgg(EMPTY_PROGRESS, "protected-file", 1234);
    expect(isNew).toBe(true);
    expect(progress.found).toEqual({ "protected-file": 1234 });
    expect(progress.pending).toEqual(["protected-file"]);
  });

  it("is idempotent", () => {
    const first = discoverEgg(EMPTY_PROGRESS, "protected-file", 1).progress;
    const again = discoverEgg(first, "protected-file", 2);
    expect(again.isNew).toBe(false);
    expect(again.progress).toBe(first);
  });

  it("ignores unknown ids from untyped callers", () => {
    const result = discoverEgg(EMPTY_PROGRESS, "konami", 1);
    expect(result.isNew).toBe(false);
    expect(result.progress).toBe(EMPTY_PROGRESS);
  });

  it("queues the reward right after the last egg", () => {
    const { progress } = discoverEgg(allButLast(), "cmd-format", 9999);
    expect(isComplete(progress.found)).toBe(true);
    expect(progress.pending).toEqual(["cmd-format", "complete"]);
  });

  it("doesn't queue the reward before the end", () => {
    const { progress } = discoverEgg(EMPTY_PROGRESS, "run-cmd", 1);
    expect(progress.pending).not.toContain("complete");
    expect(countFound(progress.found)).toBe(1);
  });
});

describe("discoveryOrdinal", () => {
  it("is the count at the moment the egg was found", () => {
    const found = { "trash-rescue": 10, "protected-file": 30, "run-cmd": 20 };
    expect(discoveryOrdinal(found, "trash-rescue")).toBe(1);
    expect(discoveryOrdinal(found, "run-cmd")).toBe(2);
    expect(discoveryOrdinal(found, "protected-file")).toBe(3);
  });

  it("breaks ties in registry order", () => {
    const found = { "trash-cleanup": 5, "trash-rescue": 5 };
    expect(discoveryOrdinal(found, "trash-rescue")).toBe(1);
    expect(discoveryOrdinal(found, "trash-cleanup")).toBe(2);
  });
});

describe("sanitizeProgress", () => {
  it("drops unknown ids and bad timestamps", () => {
    const clean = sanitizeProgress({
      found: { "protected-file": 100, "retired-egg": 200, "run-cmd": "yesterday", "egg-404": -1 },
      pending: ["retired-egg", "protected-file", "protected-file", "run-cmd"],
    });
    expect(clean).toEqual({ found: { "protected-file": 100 }, pending: ["protected-file"] });
  });

  it("keeps the reward pending only while everything is found", () => {
    expect(sanitizeProgress({ found: { "run-cmd": 1 }, pending: ["complete"] }).pending).toEqual([]);
    const full = discoverEgg(allButLast(), "cmd-format", 2).progress;
    expect(sanitizeProgress(full).pending).toEqual(["cmd-format", "complete"]);
  });

  it("survives garbage", () => {
    expect(sanitizeProgress(null)).toEqual(EMPTY_PROGRESS);
    expect(sanitizeProgress("oops")).toEqual(EMPTY_PROGRESS);
    expect(sanitizeProgress({ found: [], pending: "x" })).toEqual(EMPTY_PROGRESS);
  });
});
