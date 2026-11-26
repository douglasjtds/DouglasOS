import { LAUNCHERS, type LauncherId } from "@/lib/apps/registry";
import { FEATURED_PROJECT_SLUG, PROJECTS, PROJECTS_HOME_ROUTE } from "@/lib/content/projects";
import { resolveAddress } from "@/lib/content/projectAddress";
import { isFallback, matchIntent } from "@/lib/assistant/intents";
import { actionsForIntent, type ShellAction } from "@/lib/assistant/actions";

/**
 * Run… and the command palette (DESKTOP-INTERFACE-SPEC §5 → Run, §12): one
 * pure resolver behind both, built on the same brain as mini Douglas and the
 * Messenger. Resolution order for a typed command:
 *
 * 1. A fun command (`cmd`, `terminal`…) → a light easter egg.
 * 2. A launcher by id, localized title or alias (`contact`, `cv`, `lixeira`,
 *    `resume.pdf`, `whatsapp.exe`…). Launchers come from the registry, so an
 *    app added by a later stage is runnable by its id and title right away.
 * 3. A project through the Explorer address resolver (`gasolinha`,
 *    `C:\DouglasOS\Projects\poupensa`, `the wedding post.exe`…).
 * 4. A free-text question through the intent matcher (`hire me`, `quero o
 *    currículo`) when it's confident (score ≥ `MIN_INTENT_SCORE`).
 * 5. Otherwise: not found ("DouglasOS couldn't find '<x>'…").
 *
 * TODO(stage 10 integration): add aliases to `LAUNCHER_ALIASES` when the
 * apps merge — "paint", "mspaint", "draw" → `paint`; "dontopen",
 * "dont open this" → `dont-open-this`. Their ids and titles already work
 * without this table. (Stages 8 and 9 are wired: `media-player`, `camera`.)
 */

/** Something Run / the palette can execute. */
export type RunTarget =
  | { kind: "launcher"; id: LauncherId; route?: string }
  | { kind: "command"; id: FunCommandId };

/** Fun commands: harmless, never in the way of the CV/Contact. */
export type FunCommandId = "cmd";

export type RunResolution =
  | { kind: "target"; target: RunTarget }
  | { kind: "notFound"; query: string };

/** Localized titles per launcher (the visible labels), passed in by the UI. */
export type LauncherLabels = Partial<Record<LauncherId, string>>;

/** One autocomplete entry. */
export interface RunSuggestion {
  /** Stable, unique key (`launcher:contact`, `project:gasolinha`, `command:cmd`). */
  key: string;
  target: RunTarget;
  /** Text Run puts in its field; it resolves back to this same target. */
  command: string;
  /** What kind of thing it is (drives the hint and the icon). */
  type: "app" | "download" | "link" | "project" | "command";
}

/** Intent matches below this score are too weak to act on (e.g. "code"). */
export const MIN_INTENT_SCORE = 3;

/** Extensions people may type after a name (`resume.pdf`, `contact.exe`). */
const EXTENSION = /\.(exe|pdf|url|eml|lnk|app|cpl|com|bat)$/i;

/** Lowercase, no accents, no extension, letters and digits only. */
export function runKey(value: string): string {
  return value
    .trim()
    .replace(/^["']+|["']+$/g, "")
    .replace(EXTENSION, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Extra names per launcher (EN + PT + classic run names), on top of the id
 * and the localized title. Keys are normalized with `runKey`.
 */
export const LAUNCHER_ALIASES: Partial<Record<LauncherId, readonly string[]>> = {
  about: ["sobre", "about me", "sobre mim", "whoami", "bio", "douglas"],
  resume: ["cv", "curriculo", "curriculum", "resume pdf", "download cv", "baixar cv", "pdf"],
  contact: ["contato", "contact me", "hire", "hire me", "contratar"],
  projects: ["projetos", "my projects", "meus projetos", "explorer", "portfolio", "cases"],
  experience: ["experiencia", "career", "carreira", "jobs"],
  skills: ["habilidades", "stack", "tech"],
  "how-i-work-with-ai": ["ai", "ia", "how i work with ai", "como trabalho com ia", "ai workflow"],
  messenger: ["msn", "chat", "messenger", "mensageiro"],
  linkedin: ["linked in"],
  github: ["git hub", "repos"],
  whatsapp: ["zap", "wpp", "whats"],
  email: ["e-mail", "mail", "mailto", "write me"],
  display: ["display properties", "propriedades de video", "wallpaper", "papel de parede", "desk.cpl", "desk"],
  "recycle-bin": ["bin", "trash", "lixeira", "lixo"],
  "media-player": ["music", "player", "radio", "musica", "media player", "wmplayer"],
  camera: ["cam", "webcam", "camera", "retro cam", "camera retro"],
};

/** Fun commands and their names. */
const FUN_COMMANDS: Record<FunCommandId, readonly string[]> = {
  cmd: ["cmd", "command", "terminal", "bash", "sh", "zsh", "powershell"],
};

/** Launcher id → its suggestion type. */
function launcherType(id: LauncherId): RunSuggestion["type"] {
  const launcher = LAUNCHERS.find((l) => l.id === id);
  if (launcher?.kind === "download") return "download";
  if (launcher?.kind === "link") return "link";
  return "app";
}

interface Entry extends RunSuggestion {
  /** Normalized names (exact match / prefix match). */
  keys: string[];
  /** Normalized words of the names (word-prefix match). */
  words: string[];
}

function makeEntry(
  key: string,
  target: RunTarget,
  command: string,
  type: RunSuggestion["type"],
  names: readonly string[],
): Entry {
  const keys = [...new Set(names.map(runKey).filter(Boolean))];
  const words = [
    ...new Set(
      names.flatMap((n) =>
        n
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .split(/[^a-z0-9]+/)
          .filter(Boolean),
      ),
    ),
  ];
  return { key, target, command, type, keys, words };
}

/**
 * Every runnable thing, in default order: launchers in registry order (CTA
 * order: About, CV, Contact…), then the case studies, then fun commands.
 */
function buildEntries(labels: LauncherLabels): Entry[] {
  const launchers = LAUNCHERS.map((l) =>
    makeEntry(`launcher:${l.id}`, { kind: "launcher", id: l.id }, l.id, launcherType(l.id), [
      l.id,
      ...(labels[l.id] ? [labels[l.id] as string] : []),
      ...(LAUNCHER_ALIASES[l.id] ?? []),
    ]),
  );
  const projects = PROJECTS.map((p) =>
    makeEntry(
      `project:${p.slug}`,
      { kind: "launcher", id: "projects", route: p.slug },
      p.slug,
      "project",
      [p.slug, p.name, ...p.aliases],
    ),
  );
  const commands = (Object.keys(FUN_COMMANDS) as FunCommandId[]).map((id) =>
    makeEntry(`command:${id}`, { kind: "command", id }, id, "command", FUN_COMMANDS[id]),
  );
  return [...launchers, ...projects, ...commands];
}

/** Map a shared assistant action onto a Run target. */
export function targetForAction(action: ShellAction): RunTarget {
  switch (action.kind) {
    case "openProject":
      return { kind: "launcher", id: "projects", route: action.slug ?? FEATURED_PROJECT_SLUG };
    case "openApp":
      return { kind: "launcher", id: action.app };
    case "downloadCv":
      return { kind: "launcher", id: "resume" };
  }
}

/** Resolve what was typed in Run (or picked in the palette) to a target. */
export function resolveRun(input: string, labels: LauncherLabels = {}): RunResolution | null {
  const query = input.trim();
  const key = runKey(query);
  if (!key) return null;

  const entries = buildEntries(labels);
  const funOrLauncher = entries.find(
    (e) => e.type !== "project" && e.keys.includes(key),
  );
  if (funOrLauncher) return { kind: "target", target: funOrLauncher.target };

  const address = resolveAddress(query);
  if (address.kind === "route") {
    return {
      kind: "target",
      target:
        address.route === PROJECTS_HOME_ROUTE
          ? { kind: "launcher", id: "projects" }
          : { kind: "launcher", id: "projects", route: address.route },
    };
  }

  const intent = matchIntent(query);
  if (!isFallback(intent) && intent.score >= MIN_INTENT_SCORE) {
    return { kind: "target", target: targetForAction(actionsForIntent(intent)[0]) };
  }
  return { kind: "notFound", query };
}

/** Two targets are the same thing to run. */
export function sameTarget(a: RunTarget, b: RunTarget): boolean {
  if (a.kind !== b.kind || a.id !== b.id) return false;
  const routeA = a.kind === "launcher" ? a.route : undefined;
  const routeB = b.kind === "launcher" ? b.route : undefined;
  return (routeA ?? null) === (routeB ?? null);
}

function matchScore(entry: Entry, key: string, words: string[]): number {
  if (entry.keys.includes(key)) return 4;
  if (entry.keys.some((k) => k.startsWith(key))) return 3;
  const lastWord = words[words.length - 1] ?? "";
  if (words.length === 1 && lastWord && entry.words.some((w) => w.startsWith(lastWord))) return 2;
  if (key.length >= 3 && entry.keys.some((k) => k.includes(key))) return 1;
  return 0;
}

/**
 * Autocomplete: entries whose names match the query (exact, then prefix,
 * then word-prefix, then substring), in default order on ties. If the query
 * is a question the intent matcher understands ("hire me"), its answer leads.
 * An empty query lists everything except the fun commands (palette default).
 */
export function searchRun(
  input: string,
  labels: LauncherLabels = {},
  limit = 8,
): RunSuggestion[] {
  const entries = buildEntries(labels);
  const strip = ({ key, target, command, type }: Entry): RunSuggestion => ({ key, target, command, type });
  const key = runKey(input);
  if (!key) return entries.filter((e) => e.type !== "command").slice(0, limit).map(strip);

  const words = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  const ranked = entries
    .map((entry, index) => ({ entry, index, score: matchScore(entry, key, words) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((r) => r.entry);

  const resolved = resolveRun(input, labels);
  if (resolved?.kind === "target") {
    const i = ranked.findIndex((e) => sameTarget(e.target, resolved.target));
    if (i > 0) ranked.unshift(...ranked.splice(i, 1));
    if (i < 0) {
      const entry = entries.find((e) => sameTarget(e.target, resolved.target));
      if (entry) ranked.unshift(entry);
    }
  }
  return ranked.slice(0, limit).map(strip);
}
