# DouglasOS Command Prompt (`cmd.exe`) — Design


## Context / why

DouglasOS is a simulated desktop OS; a curious visitor (especially a developer)
expects a command prompt, and today typing `cmd` in Run… only shows a joke box
("no terminal in here"). Douglas wants a **limited but real-feeling** command
prompt for authenticity. Messaging Douglas on WhatsApp from it is a nice-to-have
bonus, not the point.

This reverses a recorded scope decision: `MVP-SCOPE.md:76` / `:309` cut a
"functional terminal" (parser, command logic, history) and replaced it with
Run… + command palette (stage 7). The cost argument is weaker now because the
pieces exist: `lib/run/resolver.ts` (launchers/projects/intents),
`lib/messenger/links.ts` (`buildWhatsAppLink`), `lib/apps/launch.ts`, the
easter-egg registry, and all content in `messages/en.json` / `pt.json`.

## Goals

- A `cmd.exe` window app that feels like a period command prompt: black
  console, monospace, blinking cursor, original banner.
- A small **fictional drive `C:\DouglasOS\`** to explore with `dir`, `cd`,
  `type`, `tree` — portfolio content readable as plain text.
- Real commands that do things: open apps/projects, download the CV, open
  Contact, optionally pre-fill a WhatsApp message.
- Unknown commands answer with humor; some commands are easter eggs that
  unlock achievements.
- `help` lists what actually works.

## Non-goals

- No real shell emulation: no pipes, redirection, env vars, scripting, `.bat`.
- No writing to the drive (`mkdir`, `del`, `copy`, `echo >` are jokes or
  "Access is denied"-style original messages).
- No backend, no network, no LLM.

## Anti-goals (failure even if it "works")

- Gating or slowing CV/Contact — the terminal is optional and must offer
  shortcuts to both (`start resume.pdf`, `cv`, `contact`).
- Copying Microsoft text/branding (banner "Microsoft Windows [Version…]",
  "(C) Copyright Microsoft Corp.", verbatim error strings). All copy original.
- Rendering typed input as HTML (XSS) — output is text nodes only.
- Content drift: terminal text duplicated from the apps and going stale.

## Decisions (made with Douglas)

1. **Approach A — explorable drive** (not a thin launcher). Chosen for fidelity.
2. **Command words, file and folder names are English only**, regardless of
   locale (`dir`, `type about.txt`, `C:\DouglasOS\Projects\`). No PT aliases.
3. **Output follows the site locale**: `help` descriptions, messages and file
   contents are EN or PT via next-intl.
4. Work may be split across subagents during implementation.
5. **Terminal achievements count toward the easter-egg total.** New ids (e.g.
   `cmd-sudo`, 1–2 of them) join `EASTER_EGGS`; `EASTER_EGG_TOTAL` rises from
   12 to 13–14. Visitors who had 12/12 (localStorage) now see 12/N and must find
   the new ones — accepted, no migration. Add a new `EasterEggStage` value
   (e.g. `"13"`) and update every place that hardcodes "12" (Achievements copy,
   specs, tests).
6. **The drive is terminal-only** *(my call)*. `lib/cmd/filesystem.ts` is the
   cmd's own tree; `projectAddress.ts`, Explorer and Run are unchanged.
   `start <x>` resolves in this order: the cmd filesystem (relative or absolute
   `C:\DouglasOS\...`) first, then `resolveRun` as fallback. Explorer's
   `C:\DouglasOS\Projects\<slug>` paths stay consistent because the cmd's
   `Projects\` folder is built from the same `PROJECTS` slugs.

## Design

### App registration
- New `AppId` `"cmd"` in `lib/apps/registry.tsx`: `kind: "window"`,
  `folder: "accessories"`, `onDesktop: true` (same pattern as Paint),
  `surface: "bare"` (the app draws its own black console), lazy `Content`
  `components/apps/CmdApp.tsx`, own XP-style SVG icon (no lucide, no MS art).
- Run…: remove the `cmd` fun command joke; `cmd`, `command`, `terminal`,
  `bash`, `sh`, `zsh`, `powershell` become `LAUNCHER_ALIASES.cmd` so they open
  the app. The `run-cmd` easter egg is re-pointed: discovered when the app
  opens from Run (keep id to avoid breaking stored progress).
- i18n: `apps.cmd.*` keys in both `messages/en.json` and `pt.json`.

### Pure core (`lib/cmd/`, unit-tested, no React)
- `filesystem.ts` — a static tree built from data: root `C:\DouglasOS\`
  containing `about.txt`, `experience.txt`, `skills.txt`,
  `how-i-work-with-ai.txt`, `contact.txt`, `resume.pdf`, `readme.txt`,
  `Projects\<slug>.txt` (one per `PROJECTS` entry, so new projects appear
  automatically), `Games\<game>.exe` (from `GAME_IDS`). Nodes carry an id and
  a reference to *where their text comes from* (a message key or project
  slug), not the text itself. Path resolution: case-insensitive, `\` or `/`,
  `..`, `.`, absolute `C:\...`, quotes.
- `parser.ts` — tokenizes a line (whitespace split, quoted args), lowercases
  the command word.
- `commands.ts` — registry of commands → handler returning a list of output
  lines + optional side effect (`launch`, `clear`, `close`, `openUrl`,
  `discoverEgg`). Handlers get a context (cwd, a `t()` translator, content
  readers) so they stay pure and testable.
- `history.ts` / completion helper — ↑/↓ history (session-only), Tab completes
  command names and paths in cwd.

### Commands
| Command | Behavior |
|---|---|
| `help` / `help <cmd>` | Lists commands with localized one-line descriptions |
| `dir` / `ls` | Lists cwd (`<DIR>` entries, files, fake sizes/dates) |
| `cd <path>` / `cd ..` / `cd` | Change / print cwd; prompt shows `C:\DouglasOS\Projects>` |
| `type <file>` / `cat` | Prints file text (localized, from the source of truth) |
| `tree` | ASCII tree of cwd |
| `start <file\|app\|project>` | `.txt` of an app → opens that app's window; project → Explorer at that route; `resume.pdf` → CV download; else falls back to the Run resolver (`resolveRun`) so `start contact`, `start linkedin` work |
| `cv`, `contact` | Shortcuts (CTA golden rule) |
| `msg <text>` | Bonus: opens `buildWhatsAppLink` (new tab, `noopener noreferrer`); empty → usage line. Page never sends anything |
| `whoami`, `ver`, `date`, `time`, `echo <text>`, `cls`/`clear`, `exit` (closes window) | Classics |
| Easter eggs (`sudo`, `format c:`, `rm -rf /`, `hack`, `coffee`, `matrix`, `mkdir`/`del` "denied", …) | Original jokes, `TODO(douglas)` copy; 1–2 register in `lib/easter-eggs/registry.ts` (e.g. `cmd-sudo`) and show in Achievements |
| Unknown | Rotating humorous "not recognized" line + hint `help` |

### Content source of truth
- App `.txt` files are rendered from the same message keys the windows use
  (e.g. `apps.about.headline/summary/stats` → plain-text formatter). One small
  formatter per file type in `lib/cmd/content.ts`. Project files from
  `lib/content/projects.ts`. `readme.txt` and joke text live under `apps.cmd`.

### UI (`components/apps/CmdApp.tsx`)
- Scrollback of output lines (plain text nodes, `white-space: pre-wrap`),
  input line with prompt + blinking caret (static under reduced motion),
  autoscroll, click anywhere focuses input. Original banner, e.g.
  `DouglasOS [Version 1.5]` + localized "Type help to see what works."
- Tokens: add console tokens (`--color-console-bg`, `--color-console-text`,
  font) to the Tailwind v4 `@theme` + `DESIGN-GUIDELINES.md`; no magic values.
- Scrollback capped (e.g. 500 lines). State lives in the component (not the
  persisted window store); reopening starts fresh.
- Accessibility: output region `role="log"` `aria-live="polite"`, labeled
  input; Esc does not close the window while the input has text (clear first).
- Keyboard conflicts: Tab/↑/↓/Ctrl+L handled inside; global shortcuts that
  use typing keys must not fire while focus is in the input.

### Mobile (< 768px)
- Maximized like every window; native keyboard; a row of tappable chips above
  the input (`help`, `dir`, `cv`, `contact`, `cls`) that run the command.

### Docs to update
- `MVP-SCOPE.md` (lines ~76, ~309: terminal now in, as stage 13 or similar;
  roadmap row + definition of done), `DESKTOP-INTERFACE-SPEC.md` (new app
  section, Run resolver order change, easter-egg table, keyboard map),
  `DESIGN-GUIDELINES.md` (console tokens).

### Tests
- Vitest: filesystem path resolution, parser, every command handler, content
  formatters (EN + PT), resolver change (`cmd` now a launcher), easter-egg
  registry.
- Testing Library: CmdApp typing, history, Tab completion, `cls`, `exit`.
- Playwright: open via Run `cmd`, run `help`, `type about.txt`, `start
  resume.pdf` triggers download.

## Approaches considered
- **A. Explorable drive (chosen)** — dir/cd/type over a fictional tree;
  most OS-like; medium cost (tree + formatters).
- **B. Launcher with personality** — help/start/cv/jokes over the Run
  resolver; cheap but shallow ("Run with a black background").

## Implementation sequence (after approval)
1. Copy this doc to `docs/superpowers/specs/2026-11-27-command-prompt-design.md`, commit.
2. Invoke `superpowers:writing-plans` for the detailed plan; execute with
   subagents (Douglas OK'd splitting): pure core (`lib/cmd/*` + tests) ∥
   console tokens + icon ∥ i18n copy, then CmdApp UI, then registry/Run/egg
   wiring, then docs + e2e.

## Left to the builder
- Exact fake sizes/dates in `dir`, banner wording, joke copy (marked
  `TODO(douglas)`), icon art, how many jokes get achievements (1–2).

## Verification
- `pnpm test`, `pnpm lint` (explicit paths), `pnpm build`.
- `pnpm dev` → open cmd from desktop, All Programs and Run `cmd`; run each
  command in EN and PT; check CV download, Contact open, `msg` link; mobile
  viewport chips; reduced-motion caret; Playwright e2e.
