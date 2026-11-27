import type { CmdTranslator } from "@/lib/cmd/content";
import enMessages from "@/messages/en.json";
import ptMessages from "@/messages/pt.json";

function lookup(messages: unknown, key: string): unknown {
  let node: unknown = messages;
  for (const part of key.split(".")) {
    if (node === null || typeof node !== "object" || !(part in node)) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return node;
}

/** Test-only translator over a message catalog: dotted keys and `{x}` interpolation. */
export function createTestTranslator(messages: unknown): CmdTranslator {
  const t = ((key: string, values?: Record<string, string | number>) => {
    const value = lookup(messages, key);
    if (typeof value !== "string") throw new Error(`Missing string message: ${key}`);
    return value.replace(/\{(\w+)\}/g, (match, name: string) =>
      values && name in values ? String(values[name]) : match,
    );
  }) as CmdTranslator;
  t.raw = (key) => {
    const value = lookup(messages, key);
    if (value === undefined) throw new Error(`Missing message: ${key}`);
    return value;
  };
  t.has = (key) => lookup(messages, key) !== undefined;
  return t;
}

export const en = createTestTranslator(enMessages);
export const pt = createTestTranslator(ptMessages);
