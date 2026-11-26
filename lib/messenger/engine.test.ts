import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import pt from "@/messages/pt.json";
import { FEATURED_PROJECT_SLUG, PROJECTS } from "@/lib/content/projects";
import {
  DEFAULT_QUICK_REPLIES,
  MESSENGER_TIMING,
  NUDGE_REPLY_COUNT,
  QUICK_REPLY_IDS,
  actionId,
  actionLabel,
  canNudge,
  greetingReply,
  messageSentReply,
  nudgeReply,
  quickReplyTurn,
  replyToText,
  suggestionsAfter,
  typingDelayMs,
  type MessengerAction,
  type ScriptReply,
} from "@/lib/messenger/engine";

function lookup(messages: unknown, key: string): unknown {
  return key
    .split(".")
    .reduce<unknown>(
      (node, part) => (node && typeof node === "object" ? (node as Record<string, unknown>)[part] : undefined),
      messages,
    );
}

function keys(reply: ScriptReply | null): string[] {
  return reply ? reply.lines.map((l) => l.textKey) : [];
}

function actions(reply: ScriptReply | null): MessengerAction[] {
  return reply ? reply.lines.flatMap((l) => l.actions ?? []) : [];
}

describe("replyToText", () => {
  it.each([
    ["cv", "messenger.replies.cv"],
    ["Pode me mandar seu currículo?", "messenger.replies.cv"],
    ["CURRICULO", "messenger.replies.cv"],
    ["what's your stack?", "messenger.replies.skills"],
    ["quais tecnologias você usa", "messenger.replies.skills"],
    ["are you open to remote work?", "messenger.replies.availability"],
    ["trabalha remoto? onde você mora?", "messenger.replies.availability"],
    ["how do you use AI?", "messenger.replies.aiWorkflow"],
    ["como você usa inteligência artificial", "messenger.replies.aiWorkflow"],
    ["tell me about your career", "messenger.replies.experience"],
    ["quero te contratar", "messenger.replies.contact"],
    ["show me your projects", "messenger.replies.projects"],
    ["quem é você?", "messenger.replies.about"],
  ])("%s → %s", (text, key) => {
    expect(keys(replyToText(text))[0]).toBe(key);
  });

  it("names a project and offers its case study first", () => {
    const project = PROJECTS[0];
    const reply = replyToText(`tell me about ${project.name}`);
    expect(keys(reply)).toEqual(["messenger.replies.project"]);
    expect(reply!.lines[0].values).toEqual({ project: project.name });
    expect(actions(reply)[0]).toEqual({ kind: "openProject", slug: project.slug });
  });

  it("falls back honestly, offering the message form", () => {
    const reply = replyToText("qual seu signo?");
    expect(keys(reply)).toEqual(["messenger.replies.fallback"]);
    expect(actions(reply)[0]).toEqual({ kind: "leaveMessage" });
    expect(reply!.quickReplies).toEqual(DEFAULT_QUICK_REPLIES);
  });

  it("ignores empty text", () => {
    expect(replyToText("   ")).toBeNull();
  });

  it("maps intents to shell actions (CV, Contact, How I Work With AI)", () => {
    expect(actions(replyToText("cv"))).toEqual([{ kind: "downloadCv" }]);
    expect(actions(replyToText("contato"))).toContainEqual({ kind: "openApp", app: "contact" });
    expect(actions(replyToText("AI workflow"))).toEqual([{ kind: "openApp", app: "how-i-work-with-ai" }]);
    expect(actions(replyToText("projetos"))).toEqual([
      { kind: "openApp", app: "projects" },
      { kind: "openProject", slug: FEATURED_PROJECT_SLUG },
    ]);
  });

  it("doesn't suggest the topic it just answered", () => {
    expect(replyToText("stack")!.quickReplies).not.toContain("skills");
    expect(replyToText("stack")!.quickReplies).toContain("leaveMessage");
  });
});

describe("quick replies", () => {
  it("the CV downloads right away (one click) and the line keeps a backup link", () => {
    const turn = quickReplyTurn("cv");
    expect(turn.effect).toEqual({ kind: "downloadCv" });
    expect(actions(turn.reply)).toContainEqual({ kind: "downloadCv" });
    expect(actions(turn.reply)).toContainEqual({ kind: "openApp", app: "contact" });
  });

  it('"Leave a message" opens the form', () => {
    expect(quickReplyTurn("leaveMessage").effect).toEqual({ kind: "leaveMessage" });
  });

  it("every quick reply posts a line and gets an answer", () => {
    for (const id of QUICK_REPLY_IDS) {
      const turn = quickReplyTurn(id);
      expect(turn.sayKey).toBe(`messenger.quickReplies.${id}.say`);
      expect(turn.reply.lines.length).toBeGreaterThan(0);
    }
  });

  it("suggestions keep five buttons and always the message form", () => {
    for (const id of [undefined, ...QUICK_REPLY_IDS]) {
      const next = suggestionsAfter(id);
      expect(next).toHaveLength(5);
      expect(next).toContain("leaveMessage");
      expect(new Set(next).size).toBe(next.length);
    }
  });
});

describe("timing and nudges", () => {
  it("typing time grows with the line, capped, and is instant under reduced motion", () => {
    expect(typingDelayMs(10)).toBeLessThan(typingDelayMs(60));
    expect(typingDelayMs(10_000)).toBe(MESSENGER_TIMING.typingMax);
    expect(typingDelayMs(200, { reducedMotion: true })).toBe(0);
  });

  it("rate-limits nudges", () => {
    expect(canNudge(null, 0)).toBe(true);
    expect(canNudge(1000, 1000 + MESSENGER_TIMING.nudgeCooldown - 1)).toBe(false);
    expect(canNudge(1000, 1000 + MESSENGER_TIMING.nudgeCooldown)).toBe(true);
  });

  it("rotates the nudge comebacks", () => {
    expect(keys(nudgeReply(0))).toEqual(["messenger.replies.nudge.0"]);
    expect(keys(nudgeReply(NUDGE_REPLY_COUNT))).toEqual(["messenger.replies.nudge.0"]);
    expect(keys(nudgeReply(1))).toEqual(["messenger.replies.nudge.1"]);
  });
});

describe("labels", () => {
  it("names actions after the app or project", () => {
    expect(actionLabel({ kind: "openApp", app: "how-i-work-with-ai" }).key).toBe("messenger.actions.apps.aiWorkflow");
    expect(actionLabel({ kind: "openProject", slug: PROJECTS[0].slug }).values).toEqual({ project: PROJECTS[0].name });
    expect(actionLabel({ kind: "leaveMessage" }).key).toBe("messenger.actions.leaveMessage");
    expect(actionId({ kind: "openApp", app: "contact" })).toBe("open-contact");
  });
});

describe("script copy (EN/PT)", () => {
  const replies: ScriptReply[] = [
    greetingReply(),
    messageSentReply("email"),
    messageSentReply("whatsapp"),
    ...Array.from({ length: NUDGE_REPLY_COUNT }, (_, i) => nudgeReply(i)),
    ...QUICK_REPLY_IDS.map((id) => quickReplyTurn(id).reply),
    ...["cv", "contact", "projects", "gasolinha", "stack", "remote", "AI", "career", "about", "zzz"].map(
      (text) => replyToText(text)!,
    ),
  ];

  it("every line, action and quick reply exists in both catalogs", () => {
    for (const messages of [en, pt]) {
      for (const reply of replies) {
        for (const l of reply.lines) {
          expect(lookup(messages, l.textKey), l.textKey).toEqual(expect.any(String));
          for (const a of l.actions ?? []) {
            expect(lookup(messages, actionLabel(a).key), actionLabel(a).key).toEqual(expect.any(String));
          }
        }
      }
      for (const id of QUICK_REPLY_IDS) {
        expect(lookup(messages, `messenger.quickReplies.${id}.label`)).toEqual(expect.any(String));
        expect(lookup(messages, `messenger.quickReplies.${id}.say`)).toEqual(expect.any(String));
      }
    }
  });

  it("a line is written in both languages or left as a TODO in both", () => {
    for (const reply of replies) {
      for (const l of reply.lines) {
        expect(lookup(en, l.textKey) === "", l.textKey).toBe(lookup(pt, l.textKey) === "");
      }
    }
  });

  it("uses the honest fallback the brief asked for", () => {
    expect(pt.messenger.replies.fallback).toBe("Essa eu vou ter que responder pessoalmente — me deixa um recado?");
  });
});
