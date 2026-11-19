/**
 * The DouglasOS Messenger script engine (DESKTOP-INTERFACE-SPEC §14). Pure:
 * it turns what the visitor did (typed text, a quick reply, a nudge) into
 * Douglas's scripted lines, as next-intl keys + values + inline actions.
 * Copy lives in `messages/{en,pt}.json` under `messenger.*`, written in the
 * first person. No LLM, no network: free text goes through the shared offline
 * matcher (`lib/assistant/intents.ts`), the same one mini Douglas uses.
 */
import { getProject, FEATURED_PROJECT_SLUG } from "@/lib/content/projects";
import { isFallback, matchIntent, type IntentId, type IntentResult } from "@/lib/assistant/intents";
import {
  DEFAULT_QUICK_REPLIES,
  MESSENGER_TIMING,
  type MessengerAction,
  type QuickReplyId,
  type ScriptLine,
  type ScriptReply,
} from "@/lib/messenger/types";

export * from "@/lib/messenger/types";

/** What a quick reply does when picked. */
export interface QuickReplyTurn {
  /** The visitor's line it posts ("Can I see your projects?"). */
  sayKey: string;
  /** Runs right away (one click: e.g. the CV downloads immediately). */
  effect?: MessengerAction;
  reply: ScriptReply;
}

const KEY = "messenger.replies";
const CV: MessengerAction = { kind: "downloadCv" };
const CONTACT: MessengerAction = { kind: "openApp", app: "contact" };
const LEAVE_MESSAGE: MessengerAction = { kind: "leaveMessage" };
const PROJECT_LIST: MessengerAction = { kind: "openApp", app: "projects" };

function line(key: string, actions?: readonly MessengerAction[], values?: Record<string, string>): ScriptLine {
  return { textKey: `${KEY}.${key}`, ...(actions ? { actions } : {}), ...(values ? { values } : {}) };
}

function projectName(slug: string): string {
  return getProject(slug)?.name ?? slug;
}

/** Quick replies after a topic: the default set without the topic just answered. */
export function suggestionsAfter(topic?: QuickReplyId): readonly QuickReplyId[] {
  const rest = DEFAULT_QUICK_REPLIES.filter((id) => id !== topic);
  // Keep four topics + the message form: swap in the marquee section.
  if (rest.length < DEFAULT_QUICK_REPLIES.length && topic !== "aiWorkflow") {
    return [...rest.slice(0, -1), "aiWorkflow", "leaveMessage"];
  }
  return rest;
}

/** Quick reply that matches an intent, so it's not offered right after. */
const TOPIC_BY_INTENT: Partial<Record<IntentId, QuickReplyId>> = {
  cv: "cv",
  projects: "projects",
  skills: "skills",
  availability: "availability",
  "ai-workflow": "aiWorkflow",
  experience: "experience",
};

/** The automatic opening when the conversation starts. */
export function greetingReply(): ScriptReply {
  return {
    lines: [line("greeting"), line("greetingFollowUp")],
    quickReplies: DEFAULT_QUICK_REPLIES,
  };
}

/** Douglas's answer to a matcher result. */
export function replyToIntent(result: IntentResult): ScriptReply {
  if (isFallback(result)) {
    return { lines: [line("fallback", [LEAVE_MESSAGE, CONTACT])], quickReplies: DEFAULT_QUICK_REPLIES };
  }
  const quickReplies = suggestionsAfter(TOPIC_BY_INTENT[result.intent]);
  switch (result.intent) {
    case "cv":
      return { lines: [line("cv", [CV])], quickReplies };
    case "contact":
      return { lines: [line("contact", [LEAVE_MESSAGE, CONTACT])], quickReplies };
    case "projects":
      if (result.projectSlug) {
        return {
          lines: [
            line("project", [{ kind: "openProject", slug: result.projectSlug }, PROJECT_LIST], {
              project: projectName(result.projectSlug),
            }),
          ],
          quickReplies,
        };
      }
      return {
        lines: [line("projects", [PROJECT_LIST, { kind: "openProject", slug: FEATURED_PROJECT_SLUG }])],
        quickReplies,
      };
    case "skills":
      return { lines: [line("skills", [{ kind: "openApp", app: "skills" }])], quickReplies };
    case "availability":
      return { lines: [line("availability", [LEAVE_MESSAGE, CONTACT])], quickReplies };
    case "ai-workflow":
      return { lines: [line("aiWorkflow", [{ kind: "openApp", app: "how-i-work-with-ai" }])], quickReplies };
    case "experience":
      return { lines: [line("experience", [{ kind: "openApp", app: "experience" }, CV])], quickReplies };
    case "about":
      return {
        lines: [line("about", [{ kind: "openApp", app: "about" }]), line("aboutPersonal")],
        quickReplies,
      };
  }
}

/** Douglas's answer to free text (empty text → null: nothing to answer). */
export function replyToText(text: string): ScriptReply | null {
  if (!text.trim()) return null;
  return replyToIntent(matchIntent(text));
}

/** Picking a quick reply: the visitor's line, an immediate effect, the answer. */
export function quickReplyTurn(id: QuickReplyId): QuickReplyTurn {
  const sayKey = `messenger.quickReplies.${id}.say`;
  switch (id) {
    case "cv":
      // One click: the CV downloads right away; the link below is a backup.
      return { sayKey, effect: CV, reply: { lines: [line("cvSent", [CV, CONTACT])], quickReplies: suggestionsAfter("cv") } };
    case "leaveMessage":
      return { sayKey, effect: LEAVE_MESSAGE, reply: { lines: [line("leaveMessage")], quickReplies: suggestionsAfter("leaveMessage") } };
    case "projects":
      return { sayKey, reply: replyToIntent({ intent: "projects", score: 1 }) };
    case "skills":
      return { sayKey, reply: replyToIntent({ intent: "skills", score: 1 }) };
    case "availability":
      return { sayKey, reply: replyToIntent({ intent: "availability", score: 1 }) };
    case "aiWorkflow":
      return { sayKey, reply: replyToIntent({ intent: "ai-workflow", score: 1 }) };
    case "experience":
      return { sayKey, reply: replyToIntent({ intent: "experience", score: 1 }) };
  }
}

/** Number of nudge comebacks in the script (`messenger.replies.nudge.0..n`). */
export const NUDGE_REPLY_COUNT = 3;

/** Douglas's comeback to the `n`-th nudge (rotates). */
export function nudgeReply(count: number): ScriptReply {
  const index = ((count % NUDGE_REPLY_COUNT) + NUDGE_REPLY_COUNT) % NUDGE_REPLY_COUNT;
  return { lines: [line(`nudge.${index}`)], quickReplies: DEFAULT_QUICK_REPLIES };
}

/** After the visitor sends a message through their mail app or WhatsApp. */
export function messageSentReply(channel: "email" | "whatsapp"): ScriptReply {
  return {
    lines: [line(channel === "email" ? "sentEmail" : "sentWhatsapp")],
    quickReplies: suggestionsAfter("leaveMessage"),
  };
}

/** How long "Douglas is typing…" shows before a line of `length` characters. */
export function typingDelayMs(length: number, { reducedMotion = false } = {}): number {
  if (reducedMotion) return 0;
  const { typingBase, typingPerChar, typingMax } = MESSENGER_TIMING;
  return Math.min(typingMax, typingBase + Math.max(0, length) * typingPerChar);
}

/** next-intl key (+ values) of the label of a button under Douglas's line. */
export function actionLabel(action: MessengerAction): { key: string; values?: Record<string, string> } {
  switch (action.kind) {
    case "openProject":
      return {
        key: "messenger.actions.openProject",
        values: { project: projectName(action.slug ?? FEATURED_PROJECT_SLUG) },
      };
    case "openApp":
      return { key: `messenger.actions.apps.${action.app === "how-i-work-with-ai" ? "aiWorkflow" : action.app}` };
    default:
      return { key: `messenger.actions.${action.kind}` };
  }
}

/** Stable id of an action (React key, `data-messenger-action`). */
export function actionId(action: MessengerAction): string {
  switch (action.kind) {
    case "openProject":
      return `open-project-${action.slug ?? FEATURED_PROJECT_SLUG}`;
    case "openApp":
      return `open-${action.app}`;
    default:
      return action.kind;
  }
}
