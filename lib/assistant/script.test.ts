import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import pt from "@/messages/pt.json";
import { INTENT_IDS, matchIntent } from "@/lib/assistant/intents";
import { INTENT_ACTIONS, actionsForIntent } from "@/lib/assistant/actions";
import {
  STANDARD_ACTIONS,
  TIP_KEYS,
  actionLabel,
  afterDanceMessage,
  answerMessage,
  greetingMessage,
  helpMessage,
  idleMessage,
  projectsTipMessage,
  tipMessage,
  type AssistantMessage,
} from "@/lib/assistant/script";
import { FEATURED_PROJECT_SLUG } from "@/lib/content/projects";

function lookup(catalog: unknown, key: string): unknown {
  return key.split(".").reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], catalog);
}

function everyMessage(): AssistantMessage[] {
  return [
    greetingMessage(),
    helpMessage(),
    afterDanceMessage(),
    projectsTipMessage(),
    idleMessage(),
    ...TIP_KEYS.map((_, i) => tipMessage(i)),
    ...INTENT_IDS.map((intent) => answerMessage({ intent, score: 1 })),
    answerMessage({ intent: "projects", score: 4, projectSlug: "gasolinha" }),
    answerMessage(matchIntent("zzz")),
  ];
}

describe("assistant script", () => {
  it("every line and shortcut label exists in EN and PT", () => {
    for (const message of everyMessage()) {
      const keys = [message.titleKey, message.textKey, ...message.actions.map((a) => actionLabel(a).key)];
      for (const key of keys) {
        expect(typeof lookup(en, key), `en: ${key}`).toBe("string");
        expect(typeof lookup(pt, key), `pt: ${key}`).toBe("string");
      }
    }
    for (const key of ["characterLabel", "close", "shortcuts", "search.label", "search.placeholder", "search.submit"]) {
      expect(typeof lookup(en.assistant, key)).toBe("string");
      expect(typeof lookup(pt.assistant, key)).toBe("string");
    }
  });

  it("offers the spec shortcuts by default: project, contact, CV, another tip, not now", () => {
    expect(STANDARD_ACTIONS.map((a) => a.kind)).toEqual([
      "openProject",
      "openApp",
      "downloadCv",
      "nextTip",
      "dismiss",
    ]);
    expect(greetingMessage()).toMatchObject({ auto: true, search: true });
  });

  it("rotates through the tips and wraps around", () => {
    expect(tipMessage(0).textKey).toBe(`assistant.tips.${TIP_KEYS[0]}`);
    expect(tipMessage(TIP_KEYS.length).textKey).toBe(tipMessage(0).textKey);
    expect(tipMessage(-1).textKey).toBe(`assistant.tips.${TIP_KEYS[TIP_KEYS.length - 1]}`);
  });

  it("answers a search with the intent's shortcuts", () => {
    const answer = answerMessage(matchIntent("baixar currículo"));
    expect(answer.textKey).toBe("assistant.answers.cv");
    expect(answer.actions[0]).toEqual({ kind: "downloadCv" });
  });

  it("answers a named project with that case study first", () => {
    const answer = answerMessage(matchIntent("gasolinha"));
    expect(answer.textKey).toBe("assistant.answers.project");
    expect(answer.values).toEqual({ project: "Gasolinha" });
    expect(answer.actions[0]).toEqual({ kind: "openProject", slug: "gasolinha" });
  });

  it("falls back to the recruiter essentials", () => {
    const answer = answerMessage(matchIntent("banana"));
    expect(answer.textKey).toBe("assistant.answers.fallback");
    expect(answer.actions.map((a) => a.kind)).toEqual(["openApp", "downloadCv", "openApp", "dismiss"]);
  });

  it("names the featured project in the Explorer tip", () => {
    expect(projectsTipMessage().values?.project).toBe(FEATURED_PROJECT_SLUG);
  });
});

describe("actionsForIntent", () => {
  it("has shortcuts for every intent", () => {
    for (const intent of INTENT_IDS) expect(INTENT_ACTIONS[intent].length).toBeGreaterThan(0);
  });

  it("leads with the named project", () => {
    expect(actionsForIntent({ intent: "projects", score: 3, projectSlug: "douglasos" })[0]).toEqual({
      kind: "openProject",
      slug: "douglasos",
    });
  });
});
