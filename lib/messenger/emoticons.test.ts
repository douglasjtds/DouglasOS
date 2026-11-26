import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import pt from "@/messages/pt.json";
import { EMOTICON_IDS, emoticonCode, insertAtCaret, splitEmoticons } from "@/lib/messenger/emoticons";

describe("splitEmoticons", () => {
  it("turns codes into emoticons and keeps the text around them", () => {
    expect(splitEmoticons("Hi :) coffee? (coffee)")).toEqual([
      { kind: "text", text: "Hi " },
      { kind: "emoticon", id: "smile", code: ":)" },
      { kind: "text", text: " coffee? " },
      { kind: "emoticon", id: "coffee", code: "(coffee)" },
    ]);
  });

  it("prefers the longest code and accepts the variants", () => {
    expect(splitEmoticons(":-D")).toEqual([{ kind: "emoticon", id: "grin", code: ":-D" }]);
    expect(splitEmoticons("<3 (y) ;)").filter((p) => p.kind === "emoticon").map((p) => p.kind === "emoticon" && p.id)).toEqual([
      "heart",
      "thumbsUp",
      "wink",
    ]);
  });

  it("leaves codes glued to a word alone", () => {
    expect(splitEmoticons("lang:pt and item:Done")).toEqual([{ kind: "text", text: "lang:pt and item:Done" }]);
  });

  it("returns plain text untouched (never parses markup)", () => {
    expect(splitEmoticons("<b>oi</b>")).toEqual([{ kind: "text", text: "<b>oi</b>" }]);
    expect(splitEmoticons("")).toEqual([]);
  });
});

describe("insertAtCaret", () => {
  it("pads the code with spaces so it never glues to a word", () => {
    expect(insertAtCaret("oi", ":)")).toEqual({ text: "oi :) ", caret: 6 });
    expect(insertAtCaret("oi tudo", ":)", 2)).toEqual({ text: "oi :) tudo", caret: 5 });
    expect(insertAtCaret("", ":)")).toEqual({ text: ":) ", caret: 3 });
  });

  it("replaces a selection", () => {
    expect(insertAtCaret("oi XX tchau", "<3", 3, 5)).toEqual({ text: "oi <3 tchau", caret: 5 });
  });
});

describe("emoticon names", () => {
  it("every emoticon has a picker code and an EN + PT name", () => {
    for (const id of EMOTICON_IDS) {
      expect(splitEmoticons(emoticonCode(id))).toEqual([{ kind: "emoticon", id, code: emoticonCode(id) }]);
      expect(en.messenger.emoticons[id]).toEqual(expect.any(String));
      expect(pt.messenger.emoticons[id]).toEqual(expect.any(String));
    }
  });
});
