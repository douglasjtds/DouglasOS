import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ASSISTANT_SESSION_KEY,
  initialAssistantState,
  readAssistantSession,
  useAssistantStore,
} from "@/lib/store/assistantStore";
import { greetingMessage, idleMessage, tipMessage, type AssistantMessage } from "@/lib/assistant/script";

function reset() {
  useAssistantStore.getState().stopDance({ quiet: true });
  useAssistantStore.setState(initialAssistantState(null));
}

const joke: AssistantMessage = {
  id: "recycle-linkedin",
  titleKey: "assistant.messages.answer.title",
  textKey: "assistant.answers.contact",
  actions: [],
};

describe("assistantStore", () => {
  beforeEach(reset);
  afterEach(() => vi.useRealTimers());

  it("starts hidden and idle", () => {
    const s = useAssistantStore.getState();
    expect(s).toMatchObject({ visible: false, dismissed: false, state: "idle", queue: [], fired: [] });
  });

  it("say() shows the character, queues the line and talks; one line per id", () => {
    const { say } = useAssistantStore.getState();
    say(greetingMessage());
    say(greetingMessage());
    say(joke);
    const s = useAssistantStore.getState();
    expect(s.visible).toBe(true);
    expect(s.state).toBe("talking");
    expect(s.queue.map((m) => m.id)).toEqual(["greeting", "recycle-linkedin"]);
  });

  it("closeMessage() advances the queue and goes idle at the end", () => {
    const { say, closeMessage } = useAssistantStore.getState();
    say(greetingMessage());
    say(joke);
    closeMessage();
    expect(useAssistantStore.getState().queue[0].id).toBe("recycle-linkedin");
    closeMessage();
    expect(useAssistantStore.getState()).toMatchObject({ queue: [], state: "idle" });
  });

  it("nextTip() swaps the current line for the next tip in rotation", () => {
    const { say, nextTip } = useAssistantStore.getState();
    say(greetingMessage());
    nextTip();
    expect(useAssistantStore.getState().queue[0].textKey).toBe(tipMessage(0).textKey);
    nextTip();
    expect(useAssistantStore.getState().queue).toHaveLength(1);
    expect(useAssistantStore.getState().queue[0].textKey).toBe(tipMessage(1).textKey);
  });

  it("dismiss() hides everything for the session and ignores later lines", () => {
    const { say, dismiss } = useAssistantStore.getState();
    say(greetingMessage());
    dismiss();
    say(joke);
    useAssistantStore.getState().dance();
    expect(useAssistantStore.getState()).toMatchObject({ visible: false, dismissed: true, queue: [], state: "idle" });
    expect(JSON.parse(sessionStorage.getItem(ASSISTANT_SESSION_KEY)!)).toMatchObject({ dismissed: true });
    // A new page load in the same session stays dismissed.
    expect(initialAssistantState(sessionStorage).dismissed).toBe(true);
  });

  it("dance() without a duration lasts until stopDance(), then says the after-dance line", () => {
    const { dance, stopDance } = useAssistantStore.getState();
    dance();
    expect(useAssistantStore.getState()).toMatchObject({ visible: true, state: "dancing" });
    stopDance();
    const s = useAssistantStore.getState();
    expect(s.state).toBe("talking");
    expect(s.queue[0].id).toBe("afterDance");
  });

  it("dance({ durationMs }) stops on its own; quiet stop says nothing", () => {
    vi.useFakeTimers();
    useAssistantStore.getState().dance({ durationMs: 1000 });
    vi.advanceTimersByTime(999);
    expect(useAssistantStore.getState().state).toBe("dancing");
    vi.advanceTimersByTime(1);
    expect(useAssistantStore.getState().queue[0].id).toBe("afterDance");

    reset();
    useAssistantStore.getState().dance();
    useAssistantStore.getState().stopDance({ quiet: true });
    expect(useAssistantStore.getState()).toMatchObject({ state: "idle", queue: [] });
  });

  it("lines said while dancing wait until the dance ends", () => {
    const { dance, say } = useAssistantStore.getState();
    dance();
    say(joke);
    expect(useAssistantStore.getState().state).toBe("dancing");
    useAssistantStore.getState().stopDance();
    expect(useAssistantStore.getState().queue.map((m) => m.id)).toEqual(["recycle-linkedin", "afterDance"]);
  });

  it("trigger() fires once per session and persists that", () => {
    const { trigger } = useAssistantStore.getState();
    expect(trigger("idle", idleMessage())).toBe(true);
    expect(trigger("idle", idleMessage())).toBe(false);
    expect(useAssistantStore.getState().queue).toHaveLength(1);
    expect(readAssistantSession(sessionStorage).fired).toEqual(["idle"]);
    expect(initialAssistantState(sessionStorage).fired).toEqual(["idle"]);
  });

  it("markFired() spends a trigger silently", () => {
    useAssistantStore.getState().markFired("projects");
    expect(useAssistantStore.getState().trigger("projects", idleMessage())).toBe(false);
    expect(useAssistantStore.getState().queue).toHaveLength(0);
  });

  it("reads a corrupt or missing session as fresh", () => {
    sessionStorage.setItem(ASSISTANT_SESSION_KEY, "{not json");
    expect(readAssistantSession(sessionStorage)).toEqual({ dismissed: false, fired: [] });
    expect(readAssistantSession(null)).toEqual({ dismissed: false, fired: [] });
  });
});
