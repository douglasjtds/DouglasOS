import type { AppId, DesktopIconId } from "@/lib/apps/registry";
import type { ShellAction } from "@/lib/assistant/actions";
import type { AssistantMessage } from "@/lib/assistant/script";

/**
 * Recycle Bin rescue lines (stage 6, DESKTOP-INTERFACE-SPEC §3 → Recycle
 * Bin). Pure: picks the next-intl key, the variation and the shortcuts; the
 * copy lives in `messages/{en,pt}.json` under `assistant.trash.*`. Only type
 * imports, so the desktop store can use it without pulling the assistant
 * script (intents, projects) into the shell bundle.
 */

/** next-intl segment of each icon's lines and how many variations it has. */
export const TRASH_LINES: Record<DesktopIconId, { key: string; variants: number }> = {
  about: { key: "about", variants: 3 },
  resume: { key: "resume", variants: 3 },
  contact: { key: "contact", variants: 3 },
  projects: { key: "projects", variants: 3 },
  experience: { key: "experience", variants: 2 },
  skills: { key: "skills", variants: 2 },
  "how-i-work-with-ai": { key: "aiWorkflow", variants: 2 },
  messenger: { key: "messenger", variants: 2 },
  linkedin: { key: "linkedin", variants: 2 },
  github: { key: "github", variants: 2 },
  whatsapp: { key: "whatsapp", variants: 2 },
  email: { key: "email", variants: 2 },
  "media-player": { key: "mediaPlayer", variants: 2 },
  camera: { key: "camera", variants: 2 },
  paint: { key: "paint", variants: 2 },
};

/** Batch lines ("cleanup"); the CV variant wins whenever the CV was in the batch. */
export const CLEANUP_LINES = {
  cleanup: { key: "cleanup", variants: 2 },
  cleanupWithCv: { key: "cleanupWithCv", variants: 2 },
} as const;

/** Line for an id with no entry of its own (a launcher added later). */
export const GENERIC_LINE_KEY = "generic";

/** Every trash line shares one id, so a new rescue replaces the previous one. */
export const TRASH_MESSAGE_ID = "trash";

/** How many times each line key was already used this session (rotation). */
export type TrashLineCounts = Readonly<Record<string, number>>;

const CV: ShellAction = { kind: "downloadCv" };
const CONTACT: ShellAction = { kind: "openApp", app: "contact" };

/** Apps whose rescue line also offers to open them (they have a shortcut label). */
const OPENABLE: readonly AppId[] = ["about", "projects", "experience", "skills", "how-i-work-with-ai"];

/** Shortcuts under a single-icon rescue line: CV and Contact always one click away. */
export function trashActions(id: DesktopIconId | null): readonly ShellAction[] {
  if (id === "resume") return [CV, CONTACT];
  if (id && (OPENABLE as readonly string[]).includes(id)) return [{ kind: "openApp", app: id as AppId }, CV];
  if (id === null) return [CV, CONTACT];
  return [CONTACT, CV];
}

/** Key of the line `ids` (deduplicated, never empty) should get. */
export function trashLineKey(ids: readonly DesktopIconId[]): { key: string; variants: number } {
  if (ids.length > 1) {
    return ids.includes("resume") ? CLEANUP_LINES.cleanupWithCv : CLEANUP_LINES.cleanup;
  }
  return TRASH_LINES[ids[0]] ?? { key: GENERIC_LINE_KEY, variants: 1 };
}

/**
 * The assistant line for icons dropped in the bin. One icon → its own line
 * (rotating through 2–3 variations); several → the "cleanup" line with the
 * count, and the CV version (Download CV first) if the CV was among them.
 */
export function trashMessage(ids: readonly DesktopIconId[], counts: TrashLineCounts = {}): AssistantMessage {
  const unique = [...new Set(ids)];
  const { key, variants } = trashLineKey(unique);
  const variant = ((counts[key] ?? 0) % variants) + 1;
  const batch = unique.length > 1;
  const textKey =
    key === GENERIC_LINE_KEY ? "assistant.trash.lines.generic" : `assistant.trash.lines.${key}.v${variant}`;
  return {
    id: TRASH_MESSAGE_ID,
    titleKey: batch ? "assistant.trash.titleCleanup" : "assistant.trash.title",
    textKey,
    values: batch ? { count: String(unique.length) } : undefined,
    actions: batch ? (unique.includes("resume") ? [CV, CONTACT] : [CONTACT, CV]) : trashActions(unique[0]),
    // A reaction, not a conversation: never takes focus, closes itself.
    auto: true,
  };
}

/** Counts after using the line for `ids` once (for the next rotation). */
export function bumpTrashCount(counts: TrashLineCounts, ids: readonly DesktopIconId[]): TrashLineCounts {
  const { key } = trashLineKey([...new Set(ids)]);
  return { ...counts, [key]: (counts[key] ?? 0) + 1 };
}

/** mini Douglas's comment when the (always empty) Recycle Bin window opens. */
export function recycleBinOpenedMessage(): AssistantMessage {
  return {
    id: "recycleBin",
    titleKey: "assistant.trash.binTitle",
    textKey: "assistant.trash.binOpened",
    actions: [CV, CONTACT],
    auto: true,
  };
}
