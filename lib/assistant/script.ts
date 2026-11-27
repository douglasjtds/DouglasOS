import { getProject, FEATURED_PROJECT_SLUG } from "@/lib/content/projects";
import { actionsForIntent, type ShellAction } from "@/lib/assistant/actions";
import { isFallback, type IntentId, type IntentResult } from "@/lib/assistant/intents";

/**
 * The mini Douglas script: every line the assistant can say, as data. Copy
 * lives in `messages/{en,pt}.json` under `assistant.*`; this module only picks
 * keys, interpolation values and shortcuts, so it stays pure and testable.
 */

/** A bubble shortcut: a shell action, or an assistant-only control. */
export type AssistantAction = ShellAction | { kind: "nextTip" } | { kind: "dismiss" };

export interface AssistantMessage {
  /**
   * Stable id of the line (`greeting`, `tip`, `answer`…). The queue never
   * holds two messages with the same id, so a repeated trigger can't stack.
   */
  id: string;
  /** Full next-intl key of the bold title (e.g. `assistant.messages.greeting.title`). */
  titleKey: string;
  /** Full next-intl key of the body text. */
  textKey: string;
  /** ICU values for the title/text. */
  values?: Record<string, string>;
  actions: readonly AssistantAction[];
  /** Show the "ask me something" field under the shortcuts. */
  search?: boolean;
  /**
   * Appeared on its own (a trigger, not a click): never takes focus and
   * auto-hides after a while unless the visitor is hovering/using it.
   */
  auto?: boolean;
}

/** Tips shown by "Show me another tip", in rotation order. */
export const TIP_KEYS = [
  "singleClick",
  "quickLaunch",
  "addressBar",
  "aiWorkflow",
  "startMenu",
  "language",
] as const;
export type TipKey = (typeof TIP_KEYS)[number];

const NEXT_TIP: AssistantAction = { kind: "nextTip" };
const DISMISS: AssistantAction = { kind: "dismiss" };

/** The standard shortcut set (spec order: project, contact, CV, tip, not now). */
export const STANDARD_ACTIONS: readonly AssistantAction[] = [
  { kind: "openProject" },
  { kind: "openApp", app: "contact" },
  { kind: "downloadCv" },
  NEXT_TIP,
  DISMISS,
];

function message(
  id: string,
  key: string,
  actions: readonly AssistantAction[],
  extra: Partial<AssistantMessage> = {},
): AssistantMessage {
  return {
    id,
    titleKey: `assistant.messages.${key}.title`,
    textKey: `assistant.messages.${key}.text`,
    actions,
    ...extra,
  };
}

function featuredName(): string {
  return getProject(FEATURED_PROJECT_SLUG)?.name ?? FEATURED_PROJECT_SLUG;
}

/** First line of the session, shortly after logon. */
export function greetingMessage(): AssistantMessage {
  return message("greeting", "greeting", STANDARD_ACTIONS, { search: true, auto: true });
}

/** Clicking the character under reduced motion (no dance). */
export function helpMessage(): AssistantMessage {
  return message("help", "help", STANDARD_ACTIONS, { search: true });
}

/** The line after a dance ends ("Phew!…"). */
export function afterDanceMessage(): AssistantMessage {
  return message("afterDance", "afterDance", STANDARD_ACTIONS, { search: true });
}

/** The line after a kickflip lands ("Do a Kickflip!" easter egg). */
export function afterKickflipMessage(): AssistantMessage {
  return message("afterKickflip", "afterKickflip", STANDARD_ACTIONS, { search: true });
}

/** First time DouglasOS Explorer opens in a session. */
export function projectsTipMessage(): AssistantMessage {
  return message(
    "projectsTip",
    "projectsTip",
    [{ kind: "openProject" }, { kind: "openApp", app: "contact" }, NEXT_TIP],
    { values: { project: featuredName().toLowerCase() }, auto: true },
  );
}

/** After a stretch of inactivity: the recruiter essentials. */
export function idleMessage(): AssistantMessage {
  return message("idle", "idle", [{ kind: "downloadCv" }, { kind: "openApp", app: "contact" }, DISMISS], {
    auto: true,
  });
}

/** Tip `index` of the rotation (wraps around). */
export function tipMessage(index: number): AssistantMessage {
  const key = TIP_KEYS[((index % TIP_KEYS.length) + TIP_KEYS.length) % TIP_KEYS.length];
  return {
    id: "tip",
    titleKey: "assistant.messages.tip.title",
    textKey: `assistant.tips.${key}`,
    actions: STANDARD_ACTIONS,
    search: true,
  };
}

/** next-intl key segment of each intent's answer. */
const ANSWER_KEYS: Record<IntentId, string> = {
  cv: "cv",
  contact: "contact",
  projects: "projects",
  skills: "skills",
  availability: "availability",
  "ai-workflow": "aiWorkflow",
  experience: "experience",
  about: "about",
};

/** The reply to a search, with the intent's shortcuts (+ another tip / not now). */
export function answerMessage(result: IntentResult): AssistantMessage {
  const shortcuts = actionsForIntent(result);
  const base = { id: "answer", titleKey: "assistant.messages.answer.title", search: true };
  if (isFallback(result)) {
    return { ...base, textKey: "assistant.answers.fallback", actions: [...shortcuts, DISMISS] };
  }
  if (result.projectSlug) {
    const name = getProject(result.projectSlug)?.name ?? result.projectSlug;
    return {
      ...base,
      textKey: "assistant.answers.project",
      values: { project: name },
      actions: [...shortcuts, DISMISS],
    };
  }
  return {
    ...base,
    textKey: `assistant.answers.${ANSWER_KEYS[result.intent]}`,
    actions: [...shortcuts, NEXT_TIP, DISMISS],
  };
}

/**
 * next-intl key (+ values) of a shortcut's label. Window shortcuts are named
 * after the app; a project shortcut names the project when it's specific.
 */
export function actionLabel(action: AssistantAction): { key: string; values?: Record<string, string> } {
  switch (action.kind) {
    case "openProject":
      return action.slug
        ? { key: "assistant.actions.openProjectNamed", values: { project: getProject(action.slug)?.name ?? action.slug } }
        : { key: "assistant.actions.openProject" };
    case "openApp":
      return { key: `assistant.actions.apps.${action.app === "how-i-work-with-ai" ? "aiWorkflow" : action.app}` };
    default:
      return { key: `assistant.actions.${action.kind}` };
  }
}

/**
 * When the assistant speaks up on its own (milliseconds). Phones are more
 * conservative: later greeting, longer idle wait.
 */
export const ASSISTANT_TIMING = {
  /** Logon → greeting (queued behind the welcome balloon if it's still up). */
  greetingDelay: { desktop: 2500, mobile: 5000 },
  /** Explorer opened → address-bar tip. */
  projectsDelay: { desktop: 1200, mobile: 2500 },
  /** No pointer/keyboard input for this long → CV + Contact nudge. */
  idleDelay: { desktop: 30_000, mobile: 45_000 },
  /** An automatic line closes itself after this, unless hovered/focused. */
  autoHide: 15_000,
  /** A click on the character dances for this long. */
  clickDance: 3500,
  /** One kickflip, from take-off to landing. */
  kickflip: 1200,
  /** This many clicks on him within `kickflipWindow` → a kickflip. */
  kickflipClicks: 3,
  kickflipWindow: 1500,
} as const;
