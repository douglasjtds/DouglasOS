import { beforeEach, describe, expect, it } from "vitest";
import {
  MAX_MESSAGES,
  MESSENGER_SESSION_KEY,
  initialMessengerData,
  sanitizeMessengerData,
  useMessengerStore,
} from "@/lib/store/messengerStore";
import { DEFAULT_QUICK_REPLIES, MESSENGER_TIMING, greetingReply, replyToText } from "@/lib/messenger/engine";

const store = () => useMessengerStore.getState();

describe("messengerStore", () => {
  beforeEach(() => {
    useMessengerStore.setState(initialMessengerData());
  });

  it("starts on the contact list with the default suggestions", () => {
    expect(store().view).toBe("contacts");
    expect(store().messages).toEqual([]);
    expect(store().quickReplies).toEqual(DEFAULT_QUICK_REPLIES);
  });

  it("openConversation reports the first time only (the greeting plays once)", () => {
    expect(store().openConversation()).toBe(true);
    expect(store().view).toBe("conversation");
    store().showContacts();
    expect(store().openConversation()).toBe(false);
  });

  it("posts the visitor's words (trimmed) and ignores empty text", () => {
    store().postVisitor({ text: "  oi  " });
    store().postVisitor({ text: "   " });
    store().postVisitor({ textKey: "messenger.quickReplies.cv.say" });
    expect(store().messages).toEqual([
      { id: 1, from: "visitor", text: "oi" },
      { id: 2, from: "visitor", textKey: "messenger.quickReplies.cv.say" },
    ]);
  });

  it("queues Douglas's lines and swaps the suggestions once his last line lands", () => {
    useMessengerStore.setState({ quickReplies: ["cv"] });
    store().queueReply(greetingReply());
    expect(store().pending).toHaveLength(2);
    expect(store().quickReplies).toEqual(["cv"]);

    store().setTyping(true);
    store().deliverNext();
    expect(store().typing).toBe(false);
    expect(store().messages.map((m) => m.from === "douglas" && m.textKey)).toEqual(["messenger.replies.greeting"]);
    expect(store().quickReplies).toEqual(["cv"]);

    store().deliverNext();
    expect(store().pending).toHaveLength(0);
    expect(store().quickReplies).toEqual(DEFAULT_QUICK_REPLIES);
  });

  it("keeps the line's actions on the delivered message", () => {
    store().queueReply(replyToText("cv")!);
    store().deliverNext();
    const [message] = store().messages;
    expect(message).toMatchObject({ from: "douglas", textKey: "messenger.replies.cv", actions: [{ kind: "downloadCv" }] });
  });

  it("skips a TODO line without posting it", () => {
    store().queueReply(replyToText("about")!);
    store().deliverNext();
    store().deliverNext({ skip: true });
    expect(store().messages).toHaveLength(1);
    expect(store().pending).toHaveLength(0);
  });

  it("counts lines delivered in the background as unread until read", () => {
    store().queueReply(greetingReply());
    store().deliverNext({ unread: true });
    store().deliverNext({ unread: true });
    expect(store().unread).toBe(2);
    store().markRead();
    expect(store().unread).toBe(0);
  });

  it("rate-limits nudges", () => {
    expect(store().nudge(1000)).toBe(true);
    expect(store().nudge(2000)).toBe(false);
    expect(store().nudges).toBe(1);
    expect(store().nudge(1000 + MESSENGER_TIMING.nudgeCooldown)).toBe(true);
    expect(store().nudges).toBe(2);
  });

  it("opening the form also shows the conversation", () => {
    store().openForm();
    expect(store()).toMatchObject({ formOpen: true, view: "conversation" });
    store().showContacts();
    expect(store().formOpen).toBe(false);
  });

  it("caps the history", () => {
    for (let i = 0; i < MAX_MESSAGES + 5; i++) store().postVisitor({ text: `m${i}` });
    expect(store().messages).toHaveLength(MAX_MESSAGES);
    expect(store().messages[0]).toMatchObject({ text: "m5" });
  });

  it("persists the conversation in sessionStorage (not localStorage)", () => {
    store().postVisitor({ text: "oi" });
    const saved = JSON.parse(sessionStorage.getItem(MESSENGER_SESSION_KEY)!);
    expect(saved.state.messages).toEqual([{ id: 1, from: "visitor", text: "oi" }]);
    expect(saved.state.typing).toBeUndefined();
    expect(localStorage.getItem(MESSENGER_SESSION_KEY)).toBeNull();
  });

  it("rehydrates a saved conversation", async () => {
    sessionStorage.setItem(
      MESSENGER_SESSION_KEY,
      JSON.stringify({
        state: { view: "conversation", greeted: true, seq: 1, messages: [{ id: 1, from: "visitor", text: "oi" }] },
        version: 1,
      }),
    );
    await useMessengerStore.persist.rehydrate();
    expect(store()).toMatchObject({ view: "conversation", greeted: true });
    expect(store().messages).toHaveLength(1);
  });
});

describe("sanitizeMessengerData", () => {
  it("drops malformed values and keeps ids increasing", () => {
    const data = sanitizeMessengerData({
      view: "nope",
      messages: [{ id: 7, from: "douglas", textKey: "messenger.replies.cv" }, { from: "hacker" }, null],
      quickReplies: ["cv", "bogus"],
      unread: -3,
      seq: 2,
    });
    expect(data.view).toBeUndefined();
    expect(data.messages).toHaveLength(1);
    expect(data.quickReplies).toEqual(["cv"]);
    expect(data.unread).toBeUndefined();
    expect(data.seq).toBe(7);
    expect(sanitizeMessengerData("garbage")).toEqual({});
  });
});
