import type { ShellAction } from "@/lib/assistant/actions";

/**
 * DouglasOS Messenger shared types and constants. Kept apart from the script
 * engine (`engine.ts`, which pulls in the intent matcher) so the store, the
 * tray icon and the toast stay light in the shell bundle.
 */

/** A button under one of Douglas's lines: a shell action or the message form. */
export type MessengerAction = ShellAction | { kind: "leaveMessage" };

/** Suggested replies, shown as buttons (chips on phones) above the composer. */
export const QUICK_REPLY_IDS = [
  "projects",
  "cv",
  "skills",
  "availability",
  "aiWorkflow",
  "experience",
  "leaveMessage",
] as const;
export type QuickReplyId = (typeof QUICK_REPLY_IDS)[number];

/** The opening set: the recruiter questions, CV and the message form. */
export const DEFAULT_QUICK_REPLIES: readonly QuickReplyId[] = [
  "projects",
  "cv",
  "skills",
  "availability",
  "leaveMessage",
];

/** One line Douglas "types". */
export interface ScriptLine {
  /** Full next-intl key (`messenger.replies.cv`…). An empty string is skipped (TODO copy). */
  textKey: string;
  values?: Record<string, string>;
  actions?: readonly MessengerAction[];
}

/** Douglas's turn: one or more lines, then the quick replies to offer. */
export interface ScriptReply {
  lines: readonly ScriptLine[];
  quickReplies: readonly QuickReplyId[];
}

/** Timing (milliseconds) of the scripted conversation and the tray toast. */
export const MESSENGER_TIMING = {
  /** "Douglas is typing…": base + per character, capped. */
  typingBase: 450,
  typingPerChar: 28,
  typingMax: 2200,
  /** Minimum gap between two nudges. */
  nudgeCooldown: 10_000,
  /** Window shake length (seconds, for Framer Motion). */
  shakeSeconds: 0.5,
  /** Desktop up → tray toast (once per session). */
  toastDelay: { desktop: 20_000, mobile: 35_000 },
  /** The toast closes itself after this, unless hovered/focused. */
  toastAutoHide: 8000,
} as const;

/** Whether a nudge is allowed now (one per `nudgeCooldown`). */
export function canNudge(lastNudgeAt: number | null, now: number): boolean {
  return lastNudgeAt === null || now - lastNudgeAt >= MESSENGER_TIMING.nudgeCooldown;
}
