/**
 * DouglasOS Messenger emoticons: text codes the chat turns into our own SVG
 * faces (`components/apps/messenger/Emoticon.tsx`). The codes are the
 * universal ASCII smileys plus a few `(word)` codes; the artwork is original
 * (never another messenger's emoticon set).
 */
export const EMOTICON_IDS = [
  "smile",
  "grin",
  "wink",
  "tongue",
  "surprised",
  "sad",
  "cool",
  "heart",
  "thumbsUp",
  "coffee",
] as const;

export type EmoticonId = (typeof EMOTICON_IDS)[number];

/** Codes per emoticon; the first one is what the picker inserts. */
export const EMOTICON_CODES: Record<EmoticonId, readonly string[]> = {
  smile: [":)", ":-)"],
  grin: [":D", ":-D"],
  wink: [";)", ";-)"],
  tongue: [":P", ":-P", ":p"],
  surprised: [":O", ":-O", ":o"],
  sad: [":(", ":-("],
  cool: ["(cool)"],
  heart: ["<3"],
  thumbsUp: ["(y)", "(Y)"],
  coffee: ["(coffee)"],
};

export type MessagePart =
  | { kind: "text"; text: string }
  | { kind: "emoticon"; id: EmoticonId; code: string };

const ID_BY_CODE = new Map<string, EmoticonId>(
  EMOTICON_IDS.flatMap((id) => EMOTICON_CODES[id].map((code) => [code, id] as const)),
);

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Longest codes first (so `:-)` wins over `:-`), and never glued to a
 * following letter or digit: `lang:pt` and `item:Done` stay text.
 */
const PATTERN = new RegExp(
  `(${[...ID_BY_CODE.keys()]
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
    .join("|")})(?![A-Za-z0-9])`,
  "g",
);

/** Split a chat line into text runs and emoticons (never parses HTML). */
export function splitEmoticons(text: string): MessagePart[] {
  const parts: MessagePart[] = [];
  let last = 0;
  for (const match of text.matchAll(PATTERN)) {
    const index = match.index ?? 0;
    if (index > last) parts.push({ kind: "text", text: text.slice(last, index) });
    const code = match[0];
    parts.push({ kind: "emoticon", id: ID_BY_CODE.get(code)!, code });
    last = index + code.length;
  }
  if (last < text.length) parts.push({ kind: "text", text: text.slice(last) });
  return parts;
}

/** The code the picker inserts for an emoticon. */
export function emoticonCode(id: EmoticonId): string {
  return EMOTICON_CODES[id][0];
}

/**
 * Insert `code` into `text` at the caret (`start`–`end` selection), padding
 * it with spaces so it never glues to a word. Returns the new text and caret.
 */
export function insertAtCaret(
  text: string,
  code: string,
  start = text.length,
  end = start,
): { text: string; caret: number } {
  const before = text.slice(0, start);
  const after = text.slice(end);
  const lead = before && !/\s$/.test(before) ? " " : "";
  const trail = after && /^\s/.test(after) ? "" : " ";
  const inserted = `${lead}${code}${trail}`;
  return { text: before + inserted + after, caret: before.length + inserted.length };
}
