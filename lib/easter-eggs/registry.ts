/**
 * The canonical list of DouglasOS easter eggs (stage 11, DESKTOP-INTERFACE-SPEC
 * → Easter eggs). Pure data: the ids are a **contract** — the stage that owns
 * each hook calls `useEasterEggStore.getState().discover(id)` with them, and
 * they are what `localStorage` keeps — so never rename or reuse one. Copy
 * lives in `messages/{en,pt}.json` under `easterEggs.eggs.<id>.{title,hint}`.
 */

/** v1.5 stage that ships the hook calling `discover()` for an egg. */
export type EasterEggStage = "1" | "5" | "5b" | "6" | "7" | "8" | "10" | "13" | "14";

export interface EasterEgg {
  id: string;
  stage: EasterEggStage;
}

export const EASTER_EGGS = [
  /** `F2` on a desktop icon → the "protected file" message box. */
  { id: "protected-file", stage: "1" },
  /** Click mini Douglas (he dances; under reduced motion the click still counts). */
  { id: "assistant-dance", stage: "5" },
  /** Click mini Douglas several times quickly → "Do a Kickflip!" (he kickflips instead). */
  { id: "assistant-kickflip", stage: "5" },
  /** "Nudge" in the DouglasOS Messenger. */
  { id: "messenger-nudge", stage: "5b" },
  /** Throw one icon in the Recycle Bin (drag, `Delete` or the context menu). */
  { id: "trash-rescue", stage: "6" },
  /** Throw several icons in at once. */
  { id: "trash-cleanup", stage: "6" },
  /** Type `cmd` in Run…. */
  { id: "run-cmd", stage: "7" },
  /** Desktop context menu → New ▸ joke. */
  { id: "desktop-new", stage: "7" },
  /** mini Douglas dancing to the media player. */
  { id: "music-dance", stage: "8" },
  /** DON'T OPEN THIS.exe → the 404 blue screen. */
  { id: "egg-404", stage: "10" },
  /** DON'T OPEN THIS.exe → the desktop runs away. */
  { id: "egg-runaway", stage: "10" },
  /** DON'T OPEN THIS.exe → mini Douglas scolds. */
  { id: "egg-scold", stage: "10" },
  /** Visiting the real 404 page. */
  { id: "real-404", stage: "10" },
  /** Any line starting with `sudo` in cmd.exe. */
  { id: "cmd-sudo", stage: "14" },
  /** `format` (with any args) in cmd.exe. */
  { id: "cmd-format", stage: "14" },
] as const satisfies readonly EasterEgg[];

export type EasterEggId = (typeof EASTER_EGGS)[number]["id"];

export const EASTER_EGG_IDS: readonly EasterEggId[] = EASTER_EGGS.map((egg) => egg.id);

/** How many eggs exist (the "/15" of the counter). */
export const EASTER_EGG_TOTAL = EASTER_EGG_IDS.length;

const ID_SET = new Set<string>(EASTER_EGG_IDS);

/** Runtime guard for untyped callers and persisted data. */
export function isEasterEggId(value: unknown): value is EasterEggId {
  return typeof value === "string" && ID_SET.has(value);
}

/** Full next-intl key of an egg's title ("Protected file"). */
export function easterEggTitleKey(id: EasterEggId): string {
  return `easterEggs.eggs.${id}.title`;
}

/** Full next-intl key of an egg's vague hint, shown while it's still "???". */
export function easterEggHintKey(id: EasterEggId): string {
  return `easterEggs.eggs.${id}.hint`;
}
