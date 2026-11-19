import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  DEFAULT_QUICK_REPLIES,
  QUICK_REPLY_IDS,
  canNudge,
  type MessengerAction,
  type QuickReplyId,
  type ScriptLine,
  type ScriptReply,
} from "@/lib/messenger/types";

/**
 * DouglasOS Messenger state (DESKTOP-INTERFACE-SPEC §14): the conversation,
 * the lines Douglas still has to "type", unread count and the current view.
 * A plain container: the script engine (`lib/messenger/engine.ts`) decides
 * what Douglas says and the UI (`components/apps/MessengerApp.tsx`) paces the
 * delivery ("Douglas is typing…"). It never imports the engine's matcher, so
 * the tray icon and toast can read it without pulling the script into the
 * shell bundle.
 *
 * History lives in sessionStorage (`douglasos:messenger`): it survives a
 * reload and is gone when the tab closes.
 */

export type MessengerView = "contacts" | "conversation";

export type ChatMessage =
  | {
      id: number;
      from: "douglas";
      textKey: string;
      values?: Record<string, string>;
      actions?: readonly MessengerAction[];
    }
  /** The visitor: their own words (`text`) or a quick reply's line (`textKey`). */
  | { id: number; from: "visitor"; text?: string; textKey?: string }
  /** System notices ("You sent a nudge."). */
  | { id: number; from: "system"; textKey: string };

/** A line waiting to be "typed", with the quick replies to offer after it. */
export interface PendingLine extends ScriptLine {
  quickReplies?: readonly QuickReplyId[];
}

export const MESSENGER_SESSION_KEY = "douglasos:messenger";
/** History cap (oldest messages drop first). */
export const MAX_MESSAGES = 200;

interface MessengerData {
  view: MessengerView;
  messages: readonly ChatMessage[];
  /** Douglas's lines still to deliver; the head is being "typed". */
  pending: readonly PendingLine[];
  /** "Douglas is typing…" is showing. */
  typing: boolean;
  /** Douglas's lines that arrived while the window wasn't in front. */
  unread: number;
  quickReplies: readonly QuickReplyId[];
  /** The "leave a message" form is open in the conversation. */
  formOpen: boolean;
  /** What's in the composer (kept across Esc / closing the window). */
  draft: string;
  /** The opening lines were queued (once per session). */
  greeted: boolean;
  lastNudgeAt: number | null;
  nudges: number;
  /** Last message id handed out. */
  seq: number;
}

interface MessengerState extends MessengerData {
  setView: (view: MessengerView) => void;
  /**
   * Show the conversation. Returns true the first time in the session, so
   * the caller queues the opening (`greetingReply()`).
   */
  openConversation: () => boolean;
  showContacts: () => void;
  /** Post the visitor's own words. Empty text is ignored. */
  postVisitor: (message: { text?: string; textKey?: string }) => void;
  postSystem: (textKey: string) => void;
  /** Queue Douglas's turn; its quick replies replace the current ones once the last line lands. */
  queueReply: (reply: ScriptReply) => void;
  /**
   * Deliver the line being typed. `unread`: the window wasn't in front.
   * `skip`: drop it silently (its copy is still an empty TODO).
   */
  deliverNext: (options?: { unread?: boolean; skip?: boolean }) => void;
  setTyping: (typing: boolean) => void;
  markRead: () => void;
  openForm: () => void;
  closeForm: () => void;
  setDraft: (draft: string) => void;
  /** Record a nudge at `now`; false (and nothing recorded) while cooling down. */
  nudge: (now: number) => boolean;
  reset: () => void;
}

export function initialMessengerData(): MessengerData {
  return {
    view: "contacts",
    messages: [],
    pending: [],
    typing: false,
    unread: 0,
    quickReplies: DEFAULT_QUICK_REPLIES,
    formOpen: false,
    draft: "",
    greeted: false,
    lastNudgeAt: null,
    nudges: 0,
    seq: 0,
  };
}

/** Omit applied to each member of a union (a message before it gets its id). */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

function append(state: MessengerData, message: DistributiveOmit<ChatMessage, "id">) {
  const seq = state.seq + 1;
  const messages = [...state.messages, { ...message, id: seq } as ChatMessage].slice(-MAX_MESSAGES);
  return { seq, messages };
}

/** Keep only well-formed persisted values (sessionStorage is user-editable). */
export function sanitizeMessengerData(persisted: unknown): Partial<MessengerData> {
  if (!persisted || typeof persisted !== "object") return {};
  const p = persisted as Partial<MessengerData>;
  const out: Partial<MessengerData> = {};
  if (p.view === "contacts" || p.view === "conversation") out.view = p.view;
  if (Array.isArray(p.messages)) {
    out.messages = p.messages
      .filter(
        (m): m is ChatMessage =>
          !!m &&
          typeof m === "object" &&
          typeof m.id === "number" &&
          (m.from === "douglas" || m.from === "visitor" || m.from === "system"),
      )
      .slice(-MAX_MESSAGES);
  }
  if (Array.isArray(p.pending)) out.pending = p.pending.filter((l) => typeof l?.textKey === "string");
  if (Array.isArray(p.quickReplies)) {
    out.quickReplies = p.quickReplies.filter((id) => (QUICK_REPLY_IDS as readonly string[]).includes(id));
  }
  if (typeof p.unread === "number" && p.unread >= 0) out.unread = p.unread;
  if (typeof p.draft === "string") out.draft = p.draft;
  if (typeof p.greeted === "boolean") out.greeted = p.greeted;
  if (typeof p.formOpen === "boolean") out.formOpen = p.formOpen;
  if (typeof p.nudges === "number") out.nudges = p.nudges;
  const maxId = Math.max(0, ...(out.messages ?? []).map((m) => m.id));
  out.seq = typeof p.seq === "number" && p.seq >= maxId ? p.seq : maxId;
  return out;
}

export const useMessengerStore = create<MessengerState>()(
  persist(
    (set, get) => ({
      ...initialMessengerData(),

      setView: (view) => set({ view }),

      openConversation: () => {
        const first = !get().greeted;
        set({ view: "conversation", greeted: true });
        return first;
      },

      showContacts: () => set({ view: "contacts", formOpen: false }),

      postVisitor: ({ text, textKey }) =>
        set((s) => {
          const trimmed = text?.trim();
          if (!trimmed && !textKey) return s;
          return append(s, trimmed ? { from: "visitor", text: trimmed } : { from: "visitor", textKey });
        }),

      postSystem: (textKey) => set((s) => append(s, { from: "system", textKey })),

      queueReply: ({ lines, quickReplies }) =>
        set((s) => {
          if (lines.length === 0) return { quickReplies };
          const queued: PendingLine[] = lines.map((l, i) =>
            i === lines.length - 1 ? { ...l, quickReplies } : { ...l },
          );
          // The current suggestions stay up while he types; the new set
          // replaces them once his last line lands.
          return { pending: [...s.pending, ...queued] };
        }),

      deliverNext: ({ unread = false, skip = false } = {}) =>
        set((s) => {
          const [head, ...rest] = s.pending;
          if (!head) return { typing: false };
          const { quickReplies, ...lineData } = head;
          const post = !skip && lineData.textKey !== "";
          return {
            ...(post ? append(s, { from: "douglas", ...lineData }) : {}),
            pending: rest,
            typing: false,
            unread: post && unread ? s.unread + 1 : s.unread,
            ...(quickReplies ? { quickReplies } : {}),
          };
        }),

      setTyping: (typing) => set({ typing }),

      markRead: () => set((s) => (s.unread === 0 ? s : { unread: 0 })),

      openForm: () => set({ formOpen: true, view: "conversation" }),
      closeForm: () => set({ formOpen: false }),
      setDraft: (draft) => set({ draft }),

      nudge: (now) => {
        if (!canNudge(get().lastNudgeAt, now)) return false;
        set((s) => ({ lastNudgeAt: now, nudges: s.nudges + 1 }));
        return true;
      },

      reset: () => set(initialMessengerData()),
    }),
    {
      name: MESSENGER_SESSION_KEY,
      version: 1,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({
        view: s.view,
        messages: s.messages,
        pending: s.pending,
        unread: s.unread,
        quickReplies: s.quickReplies,
        formOpen: s.formOpen,
        draft: s.draft,
        greeted: s.greeted,
        nudges: s.nudges,
        seq: s.seq,
      }),
      merge: (persisted, current) => ({ ...current, ...sanitizeMessengerData(persisted) }),
    },
  ),
);

/** Selector: anything Douglas said that the visitor hasn't seen. */
export function selectHasUnread(state: Pick<MessengerData, "unread">): boolean {
  return state.unread > 0;
}
