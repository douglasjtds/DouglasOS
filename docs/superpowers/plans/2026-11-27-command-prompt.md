# DouglasOS Command Prompt (`cmd.exe`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `cmd.exe` window app with an explorable fictional drive `C:\DouglasOS\`, real commands (open apps/projects, CV, contact, WhatsApp message), jokes and two new easter eggs.

**Architecture:** A pure, unit-tested core in `lib/cmd/` (filesystem tree, parser, content formatters, command engine returning output lines + effects) and a thin React window `components/apps/CmdApp.tsx` that renders lines and executes effects through the existing `executeRunTarget` / `openLink` / easter-egg store. Run… stops showing the "no terminal" joke and opens the app instead.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4 `@theme` tokens, next-intl, Zustand, Vitest + Testing Library, Playwright. pnpm.

**Spec:** `docs/superpowers/specs/2026-11-27-command-prompt-design.md`

## Global Constraints

- Command words, file and folder names are **English only**, in every locale. No PT aliases inside the terminal.
- All output text (help descriptions, errors, file contents, jokes) is localized EN/PT through next-intl; every new key exists in both `messages/en.json` and `messages/pt.json`.
- No Microsoft names/text: banner, errors and jokes are original copy. Joke copy marked `TODO(douglas)` in a JSON-adjacent code comment list (`lib/cmd/commands.ts` header).
- Output is rendered as text nodes only — never `dangerouslySetInnerHTML`.
- No new dependencies. Colors/fonts from tokens (`app/globals.css` `@theme`), no magic values.
- Code identifiers in English; comments/docs in English (project CLAUDE.md).
- CV and Contact stay one command away (`cv`, `contact`, `start resume.pdf`).
- Lint explicit paths (`pnpm exec eslint lib/cmd components/apps/CmdApp.tsx …`), not the whole repo (worktree `.next` noise).

## Review Focus

1. Path input variants — `CD projects`, `cd /`, `cd C:\DouglasOS\Projects\`, `cd "Projects"`, `cd ..\..` above root — must resolve or stay at root, never throw. → Task 1 tests.
2. `type` on a folder, on `resume.pdf` or a game `.exe` (binary) must print a friendly localized error, not crash or dump. → Task 3 tests.
3. Hostile/odd input — empty line, only spaces, `<script>alert(1)</script>`, 5,000-char line — must echo as plain text and never break the console. → Task 3 (engine) + Task 4 (UI renders `<script>` as text).
4. `msg` with no text or only spaces must print usage and open nothing; long text must go through `buildWhatsAppLink`'s length cap. → Task 3 tests.
5. Locale switch while the window is open: new output uses the new locale; prompt and command words unchanged. → Task 4 test (rerender with PT messages).

---

### Task 1: Fictional drive + parser (pure)

**Files:**
- Create: `lib/cmd/filesystem.ts`, `lib/cmd/parser.ts`
- Test: `lib/cmd/filesystem.test.ts`, `lib/cmd/parser.test.ts`

**Interfaces:**
- Consumes: `PROJECTS` (`lib/content/projects.ts`), `GAME_IDS`/`GameId` (`lib/apps/registry.tsx`).
- Produces:
  ```ts
  export type CmdTextApp = "about" | "experience" | "skills" | "how-i-work-with-ai" | "contact";
  export type FsSource =
    | { kind: "app"; app: CmdTextApp }
    | { kind: "project"; slug: string }
    | { kind: "readme" }
    | { kind: "resume" }            // binary
    | { kind: "game"; game: GameId }; // binary
  export interface FsFile { type: "file"; name: string; size: number; source: FsSource }
  export interface FsDir  { type: "dir"; name: string; children: FsNode[] }
  export type FsNode = FsFile | FsDir;
  export const ROOT: FsDir;                       // name "DouglasOS"
  export function isBinary(file: FsFile): boolean; // resume | game
  export function resolvePath(cwd: string[], input: string): { node: FsNode; path: string[] } | null;
  export function formatPath(path: string[]): string; // [] → "C:\\DouglasOS", ["Projects"] → "C:\\DouglasOS\\Projects"
  export function completePath(cwd: string[], partial: string): string[]; // names in that dir starting with the last segment, case-insensitive, dirs suffixed "\\"
  // parser.ts
  export interface ParsedLine { name: string; args: string[]; argText: string }
  export function parseLine(line: string): ParsedLine | null; // null for blank
  ```
- Tree (root children, this order): `Projects\` (one `<slug>.txt` per `PROJECTS` entry, in array order), `Games\` (`<id>.exe` per `GAME_IDS`), `about.txt`, `experience.txt`, `skills.txt`, `how-i-work-with-ai.txt`, `contact.txt`, `readme.txt`, `resume.pdf`. Sizes: any stable fake numbers.
- Path rules: case-insensitive; `\` and `/` equivalent; surrounding quotes stripped; `.`/`..`; `..` at root stays at root; absolute forms `C:`, `C:\`, `\`, `/`, `C:\DouglasOS\...` all start at root (the drive *is* `C:\DouglasOS`); trailing separators ignored. Returned `path` uses the tree's canonical casing.
- Parser: trim; command word = first whitespace token lowercased; args split on whitespace honoring `"double quotes"`; `argText` = raw remainder after the command word, trimmed (used by `echo`/`msg`).

- [ ] **Step 1: Write failing tests**

```ts
// filesystem.test.ts
it("lists one .txt per project and one .exe per game", () => {
  const projects = resolvePath([], "Projects")!.node as FsDir;
  expect(projects.children.map((c) => c.name)).toEqual(PROJECTS.map((p) => `${p.slug}.txt`));
  const games = resolvePath([], "games")!.node as FsDir;
  expect(games.children).toHaveLength(GAME_IDS.length);
});
it.each([
  [[], "PROJECTS", ["Projects"]],
  [[], "/projects/", ["Projects"]],
  [[], '"Projects"', ["Projects"]],
  [["Projects"], "..", []],
  [["Projects"], "..\\..\\..", []],
  [["Projects"], "C:\\", []],
  [["Projects"], "\\", []],
  [[], "C:\\DouglasOS\\Projects\\gasolinha.txt", ["Projects", "gasolinha.txt"]],
])("resolves %j + %s", (cwd, input, path) => {
  expect(resolvePath(cwd, input)?.path).toEqual(path);
});
it("returns null for a missing path", () => expect(resolvePath([], "nope\\x")).toBeNull());
it("formats paths", () => {
  expect(formatPath([])).toBe("C:\\DouglasOS");
  expect(formatPath(["Projects"])).toBe("C:\\DouglasOS\\Projects");
});
it("completes names case-insensitively, dirs with a backslash", () => {
  expect(completePath([], "pro")).toEqual(["Projects\\"]);
  expect(completePath([], "projects\\gas")).toEqual(["Projects\\gasolinha.txt"]);
});
it("marks resume and games as binary", () => {
  expect(isBinary(resolvePath([], "resume.pdf")!.node as FsFile)).toBe(true);
  expect(isBinary(resolvePath([], "about.txt")!.node as FsFile)).toBe(false);
});
// parser.test.ts
it("returns null for blank lines", () => { expect(parseLine("")).toBeNull(); expect(parseLine("   ")).toBeNull(); });
it("lowercases the command word and honors quotes", () => {
  expect(parseLine('  TYPE "about.txt"  ')).toEqual({ name: "type", args: ["about.txt"], argText: '"about.txt"' });
});
it("keeps the raw remainder for echo/msg", () => {
  expect(parseLine("msg  hello   Douglas")!.argText).toBe("hello   Douglas");
});
```

- [ ] **Step 2: Run, expect FAIL** — `pnpm test lib/cmd` → modules not found.
- [ ] **Step 3: Implement both files** per the interfaces above.
- [ ] **Step 4: Run, expect PASS** — `pnpm test lib/cmd`.
- [ ] **Step 5: Commit** — `git commit -m "feat(cmd): add fictional drive and command-line parser"`

---

### Task 2: File content formatters + terminal copy (EN/PT)

Can run in parallel with Task 1 (only shares `FsSource`'s shape — copy it from Task 1's Interfaces block; if Task 1 lands first, import it).

**Files:**
- Create: `lib/cmd/content.ts`, `lib/cmd/content.test.ts`
- Modify: `messages/en.json`, `messages/pt.json` (new `apps.cmd` block)

**Interfaces:**
- Consumes: `FsSource` (Task 1), `PROJECTS`, `CASE_STUDY_SECTIONS` (`lib/content/projects.ts`), `PROFILE` (`lib/profile.ts`).
- Produces:
  ```ts
  /** Root-namespace translator (next-intl `useTranslations()` with no namespace satisfies it). */
  export interface CmdTranslator {
    (key: string, values?: Record<string, string | number>): string;
    raw(key: string): unknown;
    has(key: string): boolean;
  }
  export function renderFile(source: Exclude<FsSource, { kind: "resume" } | { kind: "game" }>, t: CmdTranslator): string[];
  ```
- Formatting, plain text, one array item per line, blank string = blank line:
  - `about`: name, headline, location, blank, each `summary` paragraph separated by blank lines, blank, `statsTitle`: then `- label: value` per stat.
  - `experience`: per role `period  company — role`, description, `[tags joined by ", "]`, blank between roles.
  - `skills`: per category `name: item, item, …`.
  - `how-i-work-with-ai`: intro, then per section `## heading` + body.
  - `contact`: heading, availability, then `LinkedIn: …`, `GitHub: …`, `E-mail: …`, `WhatsApp: …` from `PROFILE` (WhatsApp shown as `whatsappChatUrl()` from `lib/messenger/links.ts`).
  - `project`: `name (year or omitted)`, tags line, then each `CASE_STUDY_SECTIONS` section from `apps.projects.caseStudies.<slug>` with its localized heading; empty section → the existing "coming soon" key used by the Explorer (reuse, don't add a new one); `links.repo`/`links.demo` lines when present.
  - `readme`: `t.raw("apps.cmd.readme")` (string array).
- `apps.cmd` keys (EN shown; PT equivalent, original wording):
  - `title`: "Command Prompt", `description`: "A command line, DouglasOS style", `fileLabel` (desktop label) "cmd.exe"
  - `banner`: "DouglasOS [Version 1.5]", `bannerHint`: "Type help to see what actually works."
  - `inputLabel`: "Command", `chipsLabel`: "Quick commands"
  - `readme`: 4–6 lines welcoming the visitor and pointing at `help`, `type about.txt`, `start resume.pdf`.
  - `help.title` + `help.<command>` one-liners for every command in Task 3's table, `help.footer`.
  - `errors.notFound` ("The system cannot find the path “{path}”."-style but original wording), `errors.notDir`, `errors.notFile`, `errors.binary` ("{name} is a binary file. Try: start {name}"), `errors.usage.{cd,type,start,msg}`, `errors.readOnly` ("This drive is read-only. DouglasOS keeps its files tidy.").
  - `unknown.v1`…`unknown.v4` (each takes `{name}`), `jokes.{sudo,format,rm,hack,coffee,matrix,exit,rmFail}`, `dir.summaryFiles` (`{count} file(s)`), `dir.summaryDirs`, `msg.opening`, `start.opening` (`{name}`), `whoami` value `douglasos\\visitor` is not translated (code constant).
- [ ] **Step 1: Write failing tests** (`content.test.ts`, build `t` from `messages/en.json` / `pt.json` with a small helper that walks dotted keys and does `{x}` interpolation — put it in `lib/cmd/testTranslator.ts`, exported for Task 3/4 tests):
  ```ts
  it("about.txt starts with name and headline from the About window copy", () => {
    const lines = renderFile({ kind: "app", app: "about" }, en);
    expect(lines.slice(0, 2)).toEqual([en("apps.about.name"), en("apps.about.headline")]);
  });
  it("follows the locale", () => {
    expect(renderFile({ kind: "app", app: "about" }, pt)).toContain(pt("apps.about.headline"));
  });
  it("contact.txt takes URLs from lib/profile.ts", () => {
    expect(renderFile({ kind: "app", app: "contact" }, en).join("\n")).toContain(PROFILE.linkedin);
  });
  it("renders every project without throwing, with its name first", () => {
    for (const p of PROJECTS) expect(renderFile({ kind: "project", slug: p.slug }, en)[0]).toContain(p.name);
  });
  it("has the same apps.cmd keys in EN and PT, none empty", () => { /* flatten both, compare key sets, assert all strings non-empty */ });
  ```
- [ ] **Step 2: Run, expect FAIL** — `pnpm test lib/cmd/content`.
- [ ] **Step 3: Implement `content.ts`, `testTranslator.ts`, add JSON copy.**
- [ ] **Step 4: Run, expect PASS.**
- [ ] **Step 5: Commit** — `git commit -m "feat(cmd): render portfolio content as text files, add EN/PT copy"`

---

### Task 3: Command engine + terminal easter eggs

**Files:**
- Create: `lib/cmd/commands.ts`, `lib/cmd/commands.test.ts`
- Modify: `lib/easter-eggs/registry.ts` (+ `registry.test.ts`), `lib/easter-eggs/progress.ts` comment "(n/12)", `messages/{en,pt}.json` (`easterEggs.eggs.cmd-sudo|cmd-format.{title,hint}`), `components/apps/AchievementsApp.test.tsx` (12 → 14)

**Interfaces:**
- Consumes: Task 1 (`ROOT`, `resolvePath`, `formatPath`, `isBinary`, `parseLine`, `FsDir`, `FsFile`), Task 2 (`renderFile`, `CmdTranslator`), `resolveRun`, `RunTarget`, `LauncherLabels` (`lib/run/resolver.ts`), `buildWhatsAppLink` (`lib/messenger/links.ts`), `EasterEggId`.
- Produces:
  ```ts
  export type CmdEffect =
    | { kind: "run"; target: RunTarget }        // executed with executeRunTarget
    | { kind: "openUrl"; url: string }          // new tab, noopener noreferrer
    | { kind: "clear" }
    | { kind: "close" }
    | { kind: "discover"; egg: EasterEggId };
  export interface CmdContext { cwd: string[]; t: CmdTranslator; locale: string; now: Date; labels: LauncherLabels }
  export interface CmdResult { output: string[]; cwd?: string[]; effects?: CmdEffect[] }
  export const COMMANDS: readonly string[]; // every name help lists, for Tab completion
  export function runCommand(line: string, ctx: CmdContext): CmdResult;
  ```
- Easter eggs: append `{ id: "cmd-sudo", stage: "13" }` (any line starting with `sudo`) and `{ id: "cmd-format", stage: "13" }` (`format` with any args) to `EASTER_EGGS`; add `"13"` to `EasterEggStage`. Total becomes **14**.
- Commands (names exact; aliases after `/`):

| Name | Result |
|---|---|
| `help` | `help.title`, then `name — help.<name>` for each in `COMMANDS`, `help.footer`. `help <name>` → that one line; unknown → `unknown.*` |
| `dir` / `ls` [path] | header `Directory of <formatPath>`, dirs as `<DIR>  Name`, files as `<size>  name`, then `dir.summaryFiles`/`dir.summaryDirs` |
| `cd` [path] | no arg → prints `formatPath(cwd)`; dir → `cwd` updated, no output; file → `errors.notDir`; missing → `errors.notFound` |
| `type` / `cat` <file> | text file → `renderFile`; dir → `errors.notFile`; binary → `errors.binary`; missing → `errors.notFound`; no arg → `errors.usage.type` |
| `tree` | ASCII tree of cwd using `├─`, `└─`, `│ ` |
| `start` / `open` <x> | resolve in cwd first: app file → `run {launcher, id: app}`; project file → `run {launcher, "projects", route: slug}`; `resume.pdf` → `run {launcher, "resume"}`; game → `run {launcher, game}`; `Projects`/`Games` dirs → `run projects` / `run games`. Else `resolveRun(argText, labels)` target → `run`. Output `start.opening`. Not found → `errors.notFound` |
| `cv` | `run {launcher, "resume"}` |
| `contact` | `run {launcher, "contact"}` |
| `msg` <text> | blank → `errors.usage.msg`, no effect; else `openUrl(buildWhatsAppLink({ message: argText }))` + `msg.opening` |
| `whoami` | `douglasos\visitor` |
| `ver` | banner |
| `date` / `time` | `Intl.DateTimeFormat(locale, …)` of `now` (date / time) |
| `echo` <text> | `argText` (empty → blank line) |
| `cls` / `clear` | `clear` effect, no output |
| `exit` | `close` effect |
| `mkdir` `md` `del` `rm` `copy` `move` `ren` | `errors.readOnly`; `rm -rf /` (or `rm` with `-rf`) → `jokes.rm` |
| `sudo …` | `jokes.sudo` + `discover cmd-sudo` |
| `format …` | `jokes.format` + `discover cmd-format` |
| `hack`, `coffee`, `matrix` | the matching `jokes.*` |
| anything else | `unknown.v{n}` with `{name}`, n = (sum of char codes of name % 4) + 1 (deterministic) |

- Hidden jokes (`sudo`, `format`, `hack`, `coffee`, `matrix`) are **not** listed by `help` and not in `COMMANDS`.
- Blank line → `{ output: [] }`.

- [ ] **Step 1: Write failing tests** (`commands.test.ts`, ctx from `testTranslator`, `now = new Date("2026-11-27T15:00:00Z")`):
  ```ts
  const run = (line: string, cwd: string[] = []) => runCommand(line, { cwd, t: en, locale: "en", now, labels: {} });
  it("help lists every public command and no hidden joke", () => {
    const out = run("help").output.join("\n");
    for (const c of COMMANDS) expect(out).toContain(c);
    expect(out).not.toMatch(/\bsudo\b|\bformat\b/);
  });
  it("cd changes cwd, cd .. returns, cd on a file errors", () => {
    expect(run("cd projects").cwd).toEqual(["Projects"]);
    expect(run("cd ..", ["Projects"]).cwd).toEqual([]);
    expect(run("cd about.txt").output[0]).toBe(en("apps.cmd.errors.notDir"));
  });
  it("type prints the file, refuses folders and binaries", () => {
    expect(run("type about.txt").output[0]).toBe(en("apps.about.name"));
    expect(run("type projects").output[0]).toBe(en("apps.cmd.errors.notFile"));
    expect(run("type resume.pdf").output[0]).toContain("resume.pdf");
    expect(run("type resume.pdf").effects).toBeUndefined();
  });
  it("start resume.pdf downloads the CV; start gasolinha.txt opens it in the Explorer", () => {
    expect(run("start resume.pdf").effects).toEqual([{ kind: "run", target: { kind: "launcher", id: "resume" } }]);
    expect(run("start gasolinha.txt", ["Projects"]).effects).toEqual([
      { kind: "run", target: { kind: "launcher", id: "projects", route: "gasolinha" } },
    ]);
  });
  it("start falls back to the Run resolver", () => {
    expect(run("start linkedin").effects).toEqual([{ kind: "run", target: { kind: "launcher", id: "linkedin" } }]);
  });
  it("cv and contact are one command away", () => {
    expect(run("cv").effects![0]).toEqual({ kind: "run", target: { kind: "launcher", id: "resume" } });
    expect(run("CONTACT").effects![0]).toEqual({ kind: "run", target: { kind: "launcher", id: "contact" } });
  });
  it("msg needs text and goes through buildWhatsAppLink", () => {
    expect(run("msg   ").effects).toBeUndefined();
    const url = (run("msg hi Douglas").effects![0] as { url: string }).url;
    expect(url).toBe(buildWhatsAppLink({ message: "hi Douglas" }));
    expect((run(`msg ${"a".repeat(5000)}`).effects![0] as { url: string }).url.length).toBeLessThanOrEqual(2000);
  });
  it("sudo and format unlock their eggs", () => {
    expect(run("sudo rm -rf /").effects).toContainEqual({ kind: "discover", egg: "cmd-sudo" });
    expect(run("format c:").effects).toContainEqual({ kind: "discover", egg: "cmd-format" });
  });
  it("writes are refused (read-only drive)", () => expect(run("mkdir x").output[0]).toBe(en("apps.cmd.errors.readOnly")));
  it("unknown commands echo the name as plain text, deterministically", () => {
    const a = run("<script>alert(1)</script>").output[0];
    expect(a).toContain("<script>alert(1)</script>");
    expect(run("<script>alert(1)</script>").output[0]).toBe(a);
  });
  it("cls clears, exit closes, blank does nothing", () => {
    expect(run("cls").effects).toEqual([{ kind: "clear" }]);
    expect(run("exit").effects).toEqual([{ kind: "close" }]);
    expect(run("   ")).toEqual({ output: [] });
  });
  it("output follows the locale", () => {
    const out = runCommand("mkdir x", { cwd: [], t: pt, locale: "pt", now, labels: {} }).output[0];
    expect(out).toBe(pt("apps.cmd.errors.readOnly"));
  });
  ```
  Registry test: `EASTER_EGG_TOTAL` → `14`, ids include `cmd-sudo`, `cmd-format`; existing EN/PT egg-copy parity test covers the new keys.
- [ ] **Step 2: Run, expect FAIL** — `pnpm test lib/cmd lib/easter-eggs components/apps/AchievementsApp`.
- [ ] **Step 3: Implement `commands.ts`, registry entries, egg copy, update "12" → "14" in tests/comments.**
- [ ] **Step 4: Run, expect PASS.**
- [ ] **Step 5: Commit** — `git commit -m "feat(cmd): add command engine and terminal easter eggs"`

---

### Task 4: `cmd.exe` app — registry, icon, tokens, window UI

**Files:**
- Create: `components/apps/CmdApp.tsx`, `components/apps/CmdApp.test.tsx`, `components/icons/CmdIcons.tsx`
- Modify: `lib/apps/registry.tsx` (+ `registry.test.ts`), `app/globals.css` (`@theme` tokens), `lib/assistant/trash.ts` (`cmd: { key: "cmd", variants: 2 }`), `messages/{en,pt}.json` (`assistant.trash.lines.cmd.v1|v2`, desktop/launcher label keys following Paint's pattern)

**Interfaces:**
- Consumes: Task 3 `runCommand`, `CmdEffect`, `COMMANDS`; Task 1 `formatPath`, `completePath`; `executeRunTarget` (`lib/run/execute.ts`), `openLink(href, external)` (`lib/openLink.ts`), `useEasterEggStore.getState().discover`, `useWindowStore.getState().closeWindow("cmd")`, `useLauncherLabels()`, `useIsMobile()`, `useLocale()`/`useTranslations()` (root).
- Produces: `AppId` `"cmd"`; registry entry `{ id: "cmd", kind: "window", icon: CmdIcon, onDesktop: true, folder: "accessories", surface: "bare", defaultSize: { width: 680, height: 440 }, Content: lazy(() => import("@/components/apps/CmdApp")) }` placed right after Paint; `CmdIcon` (original: black console window with a `>_` prompt, shared glossy style via `Svg`/`GroundShadow` from `AppIcons`).
- Tokens in `@theme`: `--color-console-bg: #0c0c0c`, `--color-console-text: #c0c0c0`, `--color-console-prompt: #f0f0f0`; font uses existing `--font-mono`.
- UI behavior:
  - Initial lines: `apps.cmd.banner`, `apps.cmd.bannerHint`, blank.
  - Scrollback = echoed `"<formatPath(cwd)>> <line>"` then the result lines; cap 500 lines (drop oldest). Each line a `<div>` text node, `whitespace-pre-wrap break-words`.
  - Output container `role="log"` `aria-live="polite"`; input `aria-label={t("apps.cmd.inputLabel")}`, `autoComplete="off"`, `spellCheck={false}`, `autoCapitalize="off"`; click on console focuses input; autoscroll to bottom after each run.
  - Keys: Enter runs; ↑/↓ walk session history (component state, no persistence); Tab → `preventDefault`, completes the last token: first token → `COMMANDS` prefix match, else `completePath`; single match replaces, several → prints them as one output line; Esc clears the input (global shortcuts are already suspended in text fields via `matchShortcut` `inTextField`); `Ctrl+L` → clear.
  - Effects: `run` → `executeRunTarget(target)`; `openUrl` → `openLink(url, true)`; `clear` → reset scrollback to `[]`; `close` → `closeWindow("cmd")`; `discover` → `useEasterEggStore.getState().discover(egg)`.
  - Caret: CSS blink via Tailwind `motion-safe:` animation; static under reduced motion.
  - Mobile (`useIsMobile()`): toolbar of chip buttons above the input, `aria-label={t("apps.cmd.chipsLabel")}`, chips `help`, `dir`, `cv`, `contact`, `cls` — each runs the command (echoed like typed).
- [ ] **Step 1: Write failing tests**
  - `registry.test.ts`: "cmd is a window app in All Programs ▸ Accessories with a desktop shortcut and EN + PT labels" (mirror the Paint test at `registry.test.ts:133`).
  - `CmdApp.test.tsx` (render with `renderWithIntl` from `test/renderWithIntl.tsx`, as `PaintApp.test.tsx` does):
    ```ts
    it("shows the banner and runs help", async () => { /* type "help{Enter}", expect log toContain "dir" */ });
    it("cd changes the prompt", async () => { /* "cd projects{Enter}" → prompt text "C:\\DouglasOS\\Projects>" */ });
    it("↑ recalls the previous command", async () => { /* run "dir", press ArrowUp, input value "dir" */ });
    it("Tab completes a path", async () => { /* type "cd pro", Tab → input "cd Projects\\" */ });
    it("cls empties the log", async () => {});
    it("exit closes the window", async () => { /* open cmd in window store first, run exit, expect store has no cmd */ });
    it("renders typed markup as text", async () => { /* "<b>hi</b>{Enter}" → no <b> element in log, text present */ });
    it("start resume.pdf triggers the CV download", async () => { /* spy lib/download downloadFile */ });
    it("uses PT copy when the locale is pt", async () => { /* render with pt messages, mkdir x → pt readOnly */ });
    it("shows quick-command chips on phones", async () => { /* mock useIsMobile true, click "cv" chip → download spy */ });
    ```
- [ ] **Step 2: Run, expect FAIL** — `pnpm test components/apps/CmdApp lib/apps`.
- [ ] **Step 3: Implement registry entry, icon, tokens, trash line + copy, `CmdApp.tsx`.**
- [ ] **Step 4: Run, expect PASS**, then full `pnpm test` (registry-wide tests like desktop-grid/phone-row ordering must still pass — if the phone first-row test fails, check `cmd` sits in the fun group after Paint).
- [ ] **Step 5: Commit** — `git commit -m "feat(cmd): add cmd.exe window app"`

---

### Task 5: Run… opens the app instead of the joke

**Files:**
- Modify: `lib/run/resolver.ts` (+ `resolver.test.ts`), `lib/run/execute.ts`, `components/os/run/RunDialog.tsx` (+ `RunDialog.test.tsx`), `components/os/run/SuggestionOption.tsx`, `messages/{en,pt}.json` (remove `run.cmd`; drop `run.types.command`)

**Interfaces:**
- Consumes: `AppId` `"cmd"` (Task 4).
- Produces: `RunTarget` = `{ kind: "launcher"; id: LauncherId; route?: string }` only — remove `FunCommandId`, `FUN_COMMANDS`, the `command` suggestion type and the `RunError` `cmd` branch. `LAUNCHER_ALIASES.cmd = ["command", "command prompt", "terminal", "bash", "sh", "zsh", "powershell", "prompt"]`.
- Egg: in `RunDialog.run`, when the resolved target is `{ kind: "launcher", id: "cmd" }`, call `useEasterEggStore.getState().discover("run-cmd")` before executing (id kept; hint copy unchanged).
- [ ] **Step 1: Update tests first**
  - `resolver.test.ts:98`: replace with `expect(target("cmd")).toEqual({ kind: "launcher", id: "cmd" }); expect(target("terminal")).toEqual({ kind: "launcher", id: "cmd" }); expect(target("powershell")).toEqual({ kind: "launcher", id: "cmd" });`
  - `RunDialog.test.tsx:85`: "'cmd' opens the Command Prompt and finds the run-cmd egg" — window store has `cmd` open, egg store has `run-cmd`.
- [ ] **Step 2: Run, expect FAIL** — `pnpm test lib/run components/os/run`.
- [ ] **Step 3: Implement** (delete dead branches; `executeRunTarget` no longer checks `command`).
- [ ] **Step 4: Run, expect PASS** + `pnpm exec tsc --noEmit`.
- [ ] **Step 5: Commit** — `git commit -m "feat(run): open cmd.exe from Run instead of the joke box"`

---

### Task 6: E2E + docs

**Files:**
- Create: `e2e/cmd.spec.ts`
- Modify: `e2e/run.spec.ts` (cmd case, if present), `e2e/easter-eggs.spec.ts` (step "Run → cmd" now opens the window and closes it; counters `/12` → `/14`; add `cmd-sudo` via the terminal), `instructions/MVP-SCOPE.md` (lines ~76 and ~309: terminal now in as **stage 13**; roadmap row + done row), `instructions/DESKTOP-INTERFACE-SPEC.md` (new `cmd.exe` app section: drive, commands, keys, mobile chips; Run resolver order without fun commands; easter-egg table + hook table rows for `cmd-sudo`/`cmd-format` and the new `run-cmd` trigger; keyboard map row; total 14), `instructions/DESIGN-GUIDELINES.md` (console tokens), `CLAUDE.md` app count if it lists apps.

- [ ] **Step 1: Write `e2e/cmd.spec.ts`** using `e2e/helpers.ts` boot helpers and role selectors: open via Run `cmd` → window `[data-window="cmd"]` visible; type `help` → log contains `type`; `type about.txt` → log contains the About headline; `start resume.pdf` → `page.waitForEvent("download")`; `sudo x` → achievements counter shows 1 of 14 (or egg store check, mirroring `easter-eggs.spec.ts`).
- [ ] **Step 2: Run** `pnpm test:e2e e2e/cmd.spec.ts e2e/easter-eggs.spec.ts e2e/run.spec.ts --project=chromium` → PASS (use ≤2 workers locally, see WebKit dev-server note).
- [ ] **Step 3: Update the docs** listed above.
- [ ] **Step 4: Full verification** — `pnpm test`, `pnpm exec eslint lib components app e2e`, `pnpm build`, `pnpm test:e2e` → all green.
- [ ] **Step 5: Commit** — `git commit -m "test(cmd): add e2e coverage; docs: record cmd.exe as stage 13"`

## Execution order

Task 1 ∥ Task 2 → Task 3 → Task 4 → Task 5 → Task 6.
