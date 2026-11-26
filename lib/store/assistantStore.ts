import { create } from "zustand";
import { afterDanceMessage, tipMessage, type AssistantMessage } from "@/lib/assistant/script";

/**
 * mini Douglas, the scripted desktop assistant (DESKTOP-INTERFACE-SPEC §13).
 * Pure state + actions; the UI lives in `components/os/assistant/` and only
 * reads this store. Public API for later stages:
 * - `say(message)` — queue a line (stage 6: Recycle Bin rescue jokes);
 * - `dance()` / `stopDance()` — stage 8 syncs the dance with the music.
 */
export type AssistantState = "idle" | "talking" | "dancing";

/** Automatic appearances, each at most once per session. */
export type AssistantTrigger = "greeting" | "projects" | "idle";

/** sessionStorage key: `{ dismissed, fired }` for the current browser session. */
export const ASSISTANT_SESSION_KEY = "douglasos-assistant";

interface SessionSnapshot {
  dismissed: boolean;
  fired: AssistantTrigger[];
}

type SessionStorageLike = Pick<Storage, "getItem" | "setItem">;

function sessionStore(): SessionStorageLike | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

/** Read the session snapshot; anything unreadable counts as a fresh session. */
export function readAssistantSession(storage: Pick<Storage, "getItem"> | null): SessionSnapshot {
  try {
    const raw = storage?.getItem(ASSISTANT_SESSION_KEY);
    if (!raw) return { dismissed: false, fired: [] };
    const parsed = JSON.parse(raw) as Partial<SessionSnapshot>;
    return {
      dismissed: parsed.dismissed === true,
      fired: Array.isArray(parsed.fired) ? parsed.fired.filter((f) => typeof f === "string") : [],
    };
  } catch {
    return { dismissed: false, fired: [] };
  }
}

function writeSession(snapshot: SessionSnapshot) {
  try {
    sessionStore()?.setItem(ASSISTANT_SESSION_KEY, JSON.stringify(snapshot));
  } catch {
    // Non-fatal: the assistant may simply greet again on the next load.
  }
}

/** `talking` while a line is queued, unless the dance takes precedence. */
function settle(dancing: boolean, queue: readonly AssistantMessage[]): AssistantState {
  if (dancing) return "dancing";
  return queue.length > 0 ? "talking" : "idle";
}

interface AssistantStoreState {
  /** The character is on screen (it appears after logon, on a trigger or a dance). */
  visible: boolean;
  /** "Not now" was picked: hidden for the rest of the browser session. */
  dismissed: boolean;
  state: AssistantState;
  /** Lines waiting to be shown; the head is the one in the bubble. */
  queue: readonly AssistantMessage[];
  /** Triggers that already fired this session. */
  fired: readonly AssistantTrigger[];
  /** Next tip of the rotation `nextTip()` shows. */
  tipIndex: number;

  /** Put the character on screen without saying anything. */
  show: () => void;
  /** Queue a line (dropped if the same `id` is already queued or after dismiss). */
  say: (message: AssistantMessage) => void;
  /** Swap the line in the bubble for `message` (e.g. the answer to a search). */
  replace: (message: AssistantMessage) => void;
  /** Close the line in the bubble; the next queued one (if any) follows. */
  closeMessage: () => void;
  /** Replace the line in the bubble with the next tip. */
  nextTip: () => void;
  /** Hide the assistant for the rest of the session (persisted). */
  dismiss: () => void;
  /**
   * Start dancing. With `durationMs` the dance stops on its own (a click on
   * the character); without it, it lasts until `stopDance()` (stage 8 music).
   */
  dance: (options?: { durationMs?: number }) => void;
  /** Stop dancing; says the after-dance line unless `quiet`. */
  stopDance: (options?: { quiet?: boolean }) => void;
  /**
   * Fire an automatic appearance once per session: shows the character and
   * queues `message`. Returns false when it already fired or was dismissed.
   */
  trigger: (id: AssistantTrigger, message?: AssistantMessage) => boolean;
  /** Mark a trigger as spent without saying anything. */
  markFired: (id: AssistantTrigger) => void;
}

let danceTimer: ReturnType<typeof setTimeout> | null = null;

function clearDanceTimer() {
  if (danceTimer) clearTimeout(danceTimer);
  danceTimer = null;
}

/** Initial state for a page load, from the session snapshot. */
export function initialAssistantState(storage: Pick<Storage, "getItem"> | null) {
  const session = readAssistantSession(storage);
  return {
    visible: false,
    dismissed: session.dismissed,
    state: "idle" as AssistantState,
    queue: [] as readonly AssistantMessage[],
    fired: session.fired as readonly AssistantTrigger[],
    tipIndex: 0,
  };
}

export const useAssistantStore = create<AssistantStoreState>()((set, get) => ({
  ...initialAssistantState(sessionStore()),

  show: () => set((s) => (s.dismissed || s.visible ? s : { visible: true })),

  say: (message) =>
    set((s) => {
      if (s.dismissed || s.queue.some((m) => m.id === message.id)) return s;
      const queue = [...s.queue, message];
      return { visible: true, queue, state: settle(s.state === "dancing", queue) };
    }),

  closeMessage: () =>
    set((s) => {
      if (s.queue.length === 0) return s;
      const queue = s.queue.slice(1);
      return { queue, state: settle(s.state === "dancing", queue) };
    }),

  replace: (message) =>
    set((s) => {
      if (s.dismissed) return s;
      const queue = [message, ...s.queue.slice(1).filter((m) => m.id !== message.id)];
      return { visible: true, queue, state: settle(s.state === "dancing", queue) };
    }),

  nextTip: () => {
    if (get().dismissed) return;
    const index = get().tipIndex;
    get().replace(tipMessage(index));
    set({ tipIndex: index + 1 });
  },

  dismiss: () => {
    clearDanceTimer();
    set({ dismissed: true, visible: false, queue: [], state: "idle" });
    writeSession({ dismissed: true, fired: [...get().fired] });
  },

  dance: (options) => {
    if (get().dismissed) return;
    clearDanceTimer();
    set({ visible: true, state: "dancing" });
    if (options?.durationMs !== undefined) {
      danceTimer = setTimeout(() => get().stopDance(), options.durationMs);
    }
  },

  stopDance: (options) => {
    clearDanceTimer();
    if (get().state !== "dancing") return;
    set((s) => ({ state: settle(false, s.queue) }));
    if (!options?.quiet) get().say(afterDanceMessage());
  },

  trigger: (id, message) => {
    const s = get();
    if (s.dismissed || s.fired.includes(id)) return false;
    get().markFired(id);
    get().show();
    if (message) get().say(message);
    return true;
  },

  markFired: (id) => {
    const s = get();
    if (s.fired.includes(id)) return;
    const fired = [...s.fired, id];
    set({ fired });
    writeSession({ dismissed: s.dismissed, fired });
  },
}));
