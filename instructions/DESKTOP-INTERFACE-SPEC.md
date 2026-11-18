# DouglasOS — Desktop Interface Specification ("DouglasOS XP")

> Structural specification for the DouglasOS interface from v1.5 onward. This is **not** a landing page — the interface itself is the experience. This document defines the structure, layout and behavior of every interface element. Visual values (colors, sizes, motion) come from `DESIGN-GUIDELINES.md`; this doc never redefines them.
>
> **Status:** target spec for v1.5, written in stage 0 (docs only). Stage 1 implements the desktop shell, stage 2 the touch (mobile) shell; later stages add the features marked with their stage number (e.g. *(stage 6)*). Until stage 1 lands, the code still runs the v1 shell (menu bar + dock + linear mobile fallback). The stage plan lives in `MVP-SCOPE.md` → Post-MVP Roadmap.

---

## Foundational Principles

1. **Recruiter-first.** A recruiter downloads the CV and reaches Contact in under 60 seconds. CV and Contact are always at most 1–2 clicks away (Start menu, Quick Launch, desktop icons).
2. **Faithful to the Luna-era desktop, branded DouglasOS.** Familiar mechanics, original name/logo/icons/wallpapers/copy (see `DESIGN-GUIDELINES.md` → What NOT to use).
3. **Fun never blocks.** Assistant, messenger, recycle-bin jokes, music, webcam, Paint and easter eggs never cover, delay or gate the CV or Contact.
4. **Mobile = touchable XP.** Phones get the same desktop adapted to touch — not a different site and not a degraded one.
5. **Performance and accessibility are features.** Keyboard-complete, screen-reader friendly, reduced-motion aware, fast on mid-range hardware.

---

## Interface Anatomy (Desktop, ≥ 768px)

```
┌───────────────────────────────────────────────────────────────────────┐
│ [icon]                                                                │
│ About Douglas         ┌── About Douglas ─────────────── [_][□][X] ┐  │
│                       │ File  View  Help                            │  │
│ [icon]                │ ┌─────────────────────────────────────────┐ │  │
│ resume.pdf            │ │  content pane (white, sunken)            │ │  │
│                       │ │                                          │ │  │
│ [icon]                │ └─────────────────────────────────────────┘ │  │
│ Contact               │ status bar                                   │  │
│                       └─────────────────────────────────────────────┘  │
│ [icon]                                                                 │
│ My Projects                         wallpaper ("Morning Hills")        │
│ [icon] Experience                                                      │
│ [icon] Skills                                                          │
│ [icon] How I Work With AI                                [Recycle Bin] │
├───────────────────────────────────────────────────────────────────────┤
│[◉ Start]│[CV][@]│ [About Douglas] [My Projects]          │EN │ 14:32 │ ← Taskbar
└───────────────────────────────────────────────────────────────────────┘
  Start    Quick     window buttons                          tray
  button   Launch
```

Layering, bottom → top: wallpaper → desktop icons → windows → assistant → taskbar → menus → balloons/toasts → modal dialogs → boot/logon (see [Layering](#layering-z-index-policy)).

---

## 1. Boot Screen

**Purpose:** set the brand tone and mask initial loading.

**Elements:**
- Black background, centered DouglasOS logo + "DouglasOS" wordmark.
- XP-style progress track below it with 3 blue blocks looping (`DESIGN-GUIDELINES.md` → Motion).
- A visible **"Skip"** button (focusable from the first frame) and a footer line with an original tagline (EN/PT).

**Behavior:**
- Plays **once per browser session** (sessionStorage flag, as in v1). Returning in the same session goes straight to the desktop.
- Duration ~2s; never longer than 3s even on slow connections — the desktop renders without waiting for optional assets (3D, assistant media).
- `Skip`, `Esc`, `Enter` or a click skip the boot **and** the logon, landing on the desktop.
- Reduced motion: no marquee; static "Starting DouglasOS…" label, shortened duration.
- No sound (startup sounds are banned and sound is opt-in anyway).

---

## 2. Logon Screen

**Purpose:** the classic "welcome" moment, in one click.

**Elements:**
- Luna logon layout: dark top/bottom bands, blue body, DouglasOS logo + an original welcome line on the left, a thin divider, and on the right a single **user tile**: avatar + "Douglas" + a short subtitle ("AI-First Fullstack Developer").
- Bottom band: a "Turn off" affordance is **not** included (it would be a dead end); instead a small hint "Click your user name to begin" (EN/PT).

**Behavior:**
- Shown once per session, right after the boot (same flag lifecycle).
- The user tile is a real `button` and receives focus on mount; **click or Enter** logs on. No password, no auto-advance.
- Skippable: the boot's Skip also skips logon; `Esc` on the logon screen also logs on.
- Transition to the desktop: crossfade (`duration-slow`); instant under reduced motion.
- "Log Off" in the Start menu returns here (windows stay as they are, no data lost).
- Screen readers: the logon screen is a `main` landmark with a heading; the tile's accessible name is "Log on as Douglas".

**Budget:** first visit, boot + logon must not delay a decided recruiter by more than ~3s + one click; a returning visitor in the same session sees the desktop immediately.

---

## 3. Desktop

**Purpose:** surface the launchers on a wallpaper, like a real desktop.

### Wallpaper
- Default: static original "Morning Hills". Alternatives and the optional "DouglasOS 3D (animated)" are chosen in **Display Properties** ([§8](#8-display-properties-app)).
- The solid `desktop` color paints first; the wallpaper never blocks interaction.

### Desktop icons
- Grid-based, **column-first from the top-left** (the classic arrangement), snapping to the nearest free cell (existing `desktopStore` + `desktopGrid` logic; pitch from the `desktop-cell` size token).
- Each icon: 48px own SVG glyph + white label with shadow (max 2 lines, full text when selected).
- **Labels** are friendly names (XP convention), with an extension only where it means something:

| Launcher | Label (EN) | Label (PT) |
|----------|-----------|------------|
| `about` | About Douglas | Sobre o Douglas |
| `resume` | resume.pdf | curriculo.pdf |
| `contact` | Contact | Contato |
| `projects` | My Projects | Meus Projetos |
| `experience` | Experience | Experiência |
| `skills` | Skills | Habilidades |
| `how-i-work-with-ai` | How I Work With AI | Como Trabalho com IA |

- **Default order** (CTA hierarchy): About Douglas, resume.pdf, Contact, My Projects, Experience, Skills, How I Work With AI. Recycle Bin *(stage 6)* pinned to the bottom-right cell. External shortcuts *(stage 3)* follow the apps.
- **Interaction (pointer):** single click **selects** (blue label highlight, tinted glyph); **double click opens**; click on empty desktop clears the selection. This is the faithful behavior; it is safe for the golden rule because CV and Contact are also one click away in Quick Launch and two clicks in the Start menu, and the first-logon tray balloon says "Double-click an icon to open it".
- **Interaction (keyboard):** the desktop is one tab stop (roving tabindex); arrows move the selection across the grid; `Enter` opens; Home/End jump to first/last icon.
- **Drag:** drag moves the icon and snaps to the nearest free cell (existing guard: a drag never counts as a click).
- `resume.pdf` opening = **download** (no window), via `lib/download.ts`.
- Future: lasso and multi-select *(stage 6)*, Recycle Bin with icon rescue jokes *(stage 6)*, desktop context menu *(stage 7)*, rename with `F2` (see [Keyboard](#12-keyboard--accessibility)).

### Desktop context menu *(stage 7)*
Right-click on empty desktop (long-press on touch): **Arrange Icons** (= `resetLayout`), **Refresh** (brief flash), **New ▸** (optional joke), separator, **Properties** (= Display Properties). On an icon: **Open**, **Delete** (recycle-bin joke, stage 6), **Properties** (mini dialog with the app description).

---

## 4. Taskbar

**Purpose:** persistent system bar — Start, window switching, tray. Replaces the v1 menu bar + dock.

**Layout (left → right), height from the `taskbar` token:**

1. **Start button** — green, flush left, pill-rounded right, DouglasOS logo + "Start" / "Iniciar". Click toggles the Start menu; pressed look while open.
2. **Quick Launch** — two small 16px buttons with tooltips: **Download CV** and **Contact**. One click each. (Golden-rule shortcut; no other items.)
3. **Window buttons** — one per open window (windows are singletons per app), in opening order. Icon + title, 40–160px wide, shrinking to icon-only when crowded (tooltip shows the title). **No grouping** in v1.5 (few apps, singleton windows); revisit only if buttons overflow at 1024px.
   - Focused window: pressed button (`task-button-active`).
   - Click: if minimized → restore + focus; if focused → minimize; otherwise → focus.
   - Buttons are the minimize/restore animation target.
4. **Tray (notification area)** — separated by the tray edge, right-aligned:
   - **Language** `EN` / `PT` toggle (reuses `LocaleToggle`; switches locale in place, windows stay).
   - **Volume** — only once something plays sound *(stage 8)*.
   - **Messenger "online"** icon *(stage 5b)*, **now-playing** note *(stage 8)*.
   - **Clock** (HH:mm, reuses `Clock`); tooltip with the full localized date.
   - Tray icons can anchor **balloons** ([§7](#7-dialogs-balloons-tooltips--menus)).

**Behavior:** always visible on top of windows (maximized windows end at the taskbar). `role="toolbar"` per area isn't required; the taskbar is a `nav`-like landmark ("Taskbar") containing a Start `button` (`aria-haspopup="menu"`, `aria-expanded`), the Quick Launch group and a window `list` (buttons with `aria-pressed` for the focused window).

---

## 5. Start Menu

**Purpose:** the main navigation, two columns, with CV and Contact one click inside.

```
┌──────────────────────────────────────────┐
│ (avatar) Douglas                          │ ← header (blue gradient)
├──────────────────────────────────────────┤ ← orange accent line
│ [32] About Douglas      │ [24] My Projects ▸     │
│ [32] My Projects        │ [24] Résumé (CV)       │
│ [32] How I Work With AI │ [24] Contact           │
│ [32] Contact            │ ───────────────        │
│                         │ [24] Display Properties│
│                         │ [24] Help              │
│ ───────────────         │ [24] Run…   (stage 7)  │
│ All Programs ▸          │                        │
├──────────────────────────────────────────┤
│                        [Log Off] [Turn Off]│ ← footer (blue gradient)
└──────────────────────────────────────────┘
```

**Left column (white):**
- Pinned apps: **About Douglas**, **My Projects**, **How I Work With AI**, **Contact** (32px icons, bold name + optional one-line description in muted text).
- Separator, then **All Programs ▸** opening a cascading submenu with every launcher (all apps, resume.pdf, and later: external shortcuts *(stage 3)*, Messenger *(5b)*, and folders **Accessories ▸** — Paint *(10)*, Retro Cam *(9)* — and **Entertainment ▸** — Media Player *(8)*; "DON'T OPEN THIS.exe" lives in Accessories *(10)*).

**Right column (light blue):**
- **My Projects ▸** — opens the Projects window; from stage 4, a submenu lists each case study (opens `projects` at that route).
- **Résumé (CV)** — downloads the PDF (no window).
- **Contact** — opens Contact.
- separator
- **Display Properties** — opens the `display` app.
- **Help** — opens About Douglas (v1.5 has no separate help app; the assistant covers tips from stage 5).
- **Run…** — *(stage 7)* opens the Run dialog. **Items appear only when their stage ships — no dead entries.**

**Footer:**
- **Log Off** — back to the logon screen (no state lost).
- **Turn Off** — opens a "Turn off DouglasOS" dialog with **Cancel** and **Turn Off**. Turn Off closes all windows, shows a short original "DouglasOS is shutting down…" → "See you soon" screen with a **Turn on** button that returns to the boot/logon (or directly to the desktop under reduced motion). Copy is original; never the classic "safe to turn off" text.

**Copy (EN / PT):** Start / Iniciar · All Programs / Todos os programas · My Projects / Meus Projetos · Résumé (CV) / Currículo (CV) · Contact / Contato · Display Properties / Propriedades de Vídeo · Help / Ajuda · Run… / Executar… · Log Off / Fazer logoff · Turn Off / Desligar.

**Behavior & a11y:**
- Built on radix (DropdownMenu or Popover + menu roles) for focus management.
- Opens above the Start button; closes on outside click, `Esc`, selecting an item, or toggling Start again; focus returns to the Start button.
- Arrow keys move within a column; `→`/`←` cross columns and open/close submenus; `Enter`/`Space` activate; type-ahead by first letter.
- Mobile: see [§11](#11-mobile-touchable-xp).

---

## 6. Windows

**Purpose:** display app content in draggable, manageable Luna windows. Window state stays in the Zustand `windowStore` (singleton per app, persisted, reconciled to the viewport).

### Anatomy (top → bottom)
1. **Title bar** (`titlebar` height, `gradient-titlebar` / inactive variant, rounded top corners): 16px app icon, bold title (ellipsis), then **Minimize**, **Maximize/Restore**, **Close** on the right (21px, own glyphs, close in red).
2. **Menu bar** *(optional per app)*: `File / Edit / View / Help` — **only menus with real, useful items** (e.g. File → Download CV, Close; View → text size; Help → About this app). Never fake menus. Projects/Explorer gets Favorites *(stage 4)*.
3. **Toolbar** *(optional)*: e.g. Back/Forward/Home + address bar in DouglasOS Explorer *(stage 4)*.
4. **Content**: `button-face` body framing a white sunken content pane, scrollable; shadcn components with the XP treatment.
5. **Status bar** *(optional)*: sunken panes with short status text (e.g. "Done", item counts).
6. **Frame**: 3px sides/bottom; resize handles on all 8 edges/corners (existing `useResize`).

### Behaviors
- **Open**: centered on first open, cascading offsets afterwards (existing logic); quick fade-in.
- **Focus**: click anywhere in a window brings it to front; inactive windows show the inactive title bar.
- **Drag**: title bar (not the control buttons); clamped so the title bar stays reachable.
- **Double-click on the title bar**: maximize ↔ restore.
- **Maximize**: fills the whole work area (full width, from the top edge down to the taskbar) — the faithful behavior (v1 used ~90%). Restore returns to the previous rect. Maximized windows can't be dragged or resized.
- **Minimize**: animates into its taskbar button; the button stays.
- **Close**: removes the window from the store; focus returns to the previously focused window, or to the launcher that opened it.
- **Sizes**: default per app (registry `defaultSize`), min 400×300, max = work area.
- **Window icon menu** (click on the 16px title icon): Restore / Minimize / Maximize / Close — optional in stage 1, cheap with radix.

### Window apps (stage 1)
`about`, `experience`, `projects`, `skills`, `how-i-work-with-ai`, `contact`, plus the new `display` (Display Properties). `resume` stays a download action.

---

## 7. Dialogs, Balloons, Tooltips & Menus

- **Message boxes** (shutdown, errors such as "DouglasOS can't find '…'", confirmations): window chrome with close only, 32px semantic icon (own SVG: error / warning / info / question), message text, right-aligned buttons (`OK`, `Cancel`, …). Modal: focus trapped, initial focus on the default button, `Esc` = Cancel/close, `role="alertdialog"` for errors and confirmations.
- **Tray balloons**: yellow rounded bubble with a tail pointing at the tray icon, bold title + 16px icon, text, close ×. `aria-live="polite"`, never steals focus, auto-dismiss ~8s (paused on hover/focus). **Max one balloon at a time**; queued otherwise.
  - Stage 1 ships one: on the first logon of a session, "Welcome to DouglasOS — double-click an icon to open it. Your CV is one click away in the taskbar." (EN/PT), once per session.
- **Tooltips**: yellow rectangles, ~500ms delay, on every icon-only control (Quick Launch, tray, window controls).
- **Menus** (window menus, context menus, submenus): white, blue highlight, keyboard-complete (radix).

---

## 8. Display Properties app

New `display` window app (kind `"window"`), opened from the Start menu (and the desktop context menu, stage 7).

- **Desktop tab:** a small monitor preview + a list of wallpapers: "Morning Hills" (default), "Dusk Hills", "Blueprint", "Solid color" (swatches), "DouglasOS 3D (animated)". `Apply` / `OK` / `Cancel` buttons, XP-style.
- The 3D option is disabled with a reason when unavailable (reduced motion, Save-Data, mobile): "Animated wallpapers are off because your system prefers reduced motion."
- **Screen Saver tab:** optional, only if cheap (stage 1 decides); otherwise omitted (no dead tab).
- The choice persists locally (new store or `desktopStore` extension, key `douglasos:display`).

---

## 9. Log Off & Turn Off

See the Start menu footer ([§5](#5-start-menu)). Neither clears persisted data; both are reversible in one click. Under reduced motion all transitions are instant.

---

## 10. App-by-App Content Structure

Content is unchanged from v1 (static, in-repo, EN/PT); only the presentation moves to XP (white content panes, group boxes, blue underlined links, XP push buttons). Window titles use the friendly labels.

### About Douglas (`about`)
**Window:** ~600×550 · Menus: File (Download CV, Close), Help.
- Profile photo (~120px), name + headline ("Douglas Tertuliano" — "AI-First Fullstack Developer"), location.
- 2–3 paragraph summary (from the CV, refined).
- Quick-stat row as a group box: years of experience, current role, domain focus.
- Primary push button: **Download CV**; secondary link: Contact.

### Experience (`experience`)
**Window:** ~700×600
- Vertical timeline (or one group box per role): period, company, role, 2–3 sentence description, tech tags. Current role (Serasa Experian) highlighted (bold + "Current" tag, not color alone).
- Roles: Serasa Experian → ClearSale → Zup IT Innovation → DTI Digital → Rumo IT Solutions.

### My Projects (`projects`)
**Window:** ~700×600
- v1.5 stage 1: grid/list of project cards in white panes (name, one-liner, tags, links, status).
- Stage 4: becomes **DouglasOS Explorer** — browser-style window with Back/Forward/Home, an editable address bar (`C:\DouglasOS\Projects\<slug>`-style; exact format chosen in stage 4), home page listing projects, case-study pages (Problem → Approach → Role & stack → Result), themed "not found" dialog. Route lives in the window's payload in `windowStore`.

### Skills (`skills`)
**Window:** ~650×550
- Categories as group boxes: Backend, Frontend, Databases, Cloud/DevOps, AI Tooling, Methodology. Tags as XP chips. No star ratings.

### How I Work With AI (`how-i-work-with-ai`)
**Window:** ~700×600 — the marquee section (slightly more vivid icon, pinned in Start).
- Opening stance, then: Daily tooling · Discovery-first workflow · Productivity multipliers · What AI doesn't replace. Concrete examples over buzzwords (source material: `AI-WORKFLOW-LOG.md`).

### resume.pdf (`resume`, no window)
- Opening it (desktop double-click/Enter, Start → Résumé (CV), Quick Launch, assistant/messenger/Run actions) **downloads** `public/resume.pdf` via `lib/download.ts`.
- Document icon with a generic PDF band; tooltip "Download CV".

### Contact (`contact`)
**Window:** ~500×500
- Header ("Let's talk" / localized), contact rows for LinkedIn, GitHub, Email (mailto + copy button), WhatsApp — URLs only from `lib/profile.ts`, external links in a new tab with `rel="noopener noreferrer"`.
- Optional availability line ("Open to remote opportunities").

### Display Properties (`display`)
See [§8](#8-display-properties-app).

### Later apps (specified in their stages)
External shortcuts (3), DouglasOS Explorer (4), mini Douglas assistant (5, a desktop companion, not a window), DouglasOS Messenger (5b), Recycle Bin (6), Run + command palette (7), DouglasOS Media Player (8), Retro Cam (9), DouglasOS Paint + "DON'T OPEN THIS.exe" (10). Each stage must update this section.

---

## 11. Mobile (touchable XP)

> Replaces the v1 "linear mobile fallback". Applies below 768px. Implemented in stage 2.

- **Layout:** full-screen desktop with the icon grid (fewer columns, larger cells — `desktop-cell` mobile token), taskbar at the bottom (48px + safe-area inset), `100dvh`, no horizontal scroll. A **resume.pdf** icon is visible on the first screen.
- **Taskbar:** Start button, window buttons (icon-only if needed), tray with language + clock. Quick Launch may be dropped if space is tight (CV stays 2 taps away: Start → Résumé (CV)).
- **Start menu:** a panel of ~85% viewport height (or full screen), scrollable, same two sections stacked (pinned apps, then places), footer with Log Off / Turn Off.
- **Windows:** always maximized; no drag/resize; compact title bar (title, minimize, close; back where it applies). Only one window visible at a time; the taskbar switches between open ones.
- **Gestures:** single tap opens an icon (no double-tap needed on touch); **press-and-hold (~500ms) = right-click** (context menu, stage 7). No hover-only affordances. Icon drag on mobile is off by default (stage 2 may enable long-press drag if cheap; documented there).
- **Boot/logon:** shorter (~1s) and skippable; same once-per-session rule.
- **3D wallpaper:** not offered on mobile by default.
- **Content:** real text in the DOM (no canvas-only content), proper headings, crawlable.
- Every later feature must state its mobile behavior in its stage.

---

## 12. Keyboard & Accessibility

### Principles
- Everything reachable and operable by keyboard; visible focus everywhere (`DESIGN-GUIDELINES.md` → Focus States).
- Tab order: desktop (one stop, arrows inside) → open windows (focused window content) → taskbar (Start, Quick Launch, window buttons, tray).
- The host OS and browser reserve some classic shortcuts (the Windows/Super key, `Alt+Tab`, `Alt+F4` on Windows, `Win+R`). DouglasOS supports them **where the browser lets them through** and always provides a documented alternative. The DouglasOS alternative modifier is **`Alt+Shift`** (matched with `event.code`, so macOS Option characters don't interfere).
- Global shortcuts are ignored while focus is in a text field, except `Esc`.

### Shortcut map

| Action | Primary (classic) | Always-available alternative | Stage |
|--------|-------------------|------------------------------|-------|
| Open/close Start menu | `Ctrl+Esc`; tap of the `Meta`/Windows key (on keyup, only if no other key was pressed) | `Alt+Shift+S` | 1 |
| Cycle windows | `Alt+Tab` (OS-owned; not intercepted) | `Alt+Shift+W` (next), `Alt+Shift+Q` (previous); or Tab to the taskbar buttons | 1 |
| Close focused window | `Alt+F4` (best effort) | `Esc` when no menu/dialog/balloon is open and focus is not in a text field (v1 behavior kept) | 1 |
| Maximize/restore focused window | double-click title | `Alt+Shift+↑` / `Alt+Shift+↓` | 1 |
| Desktop: move selection | `←↑→↓`, Home/End | — | 1 |
| Desktop: open selected | `Enter` | — | 1 |
| Desktop: rename selected | `F2` | — | open question (see below) |
| Close menu/dialog/balloon | `Esc` (topmost transient first) | — | 1 |
| Context menu | `Shift+F10` / `ContextMenu` key | — | 7 |
| Select all / toggle / delete icon | `Ctrl+A`, `Space`/`Ctrl+Space`, `Delete` | — | 6 |
| Run… | `Meta+R` (best effort) | `Alt+Shift+R` | 7 |
| Command palette | `Ctrl+K` / `Cmd+K` | — | 7 |
| Messenger: send / new line | `Enter` / `Shift+Enter` | — | 5b |

- A single shortcut registry (pure, in `lib/`, unit-tested) owns this map so later stages can't introduce conflicts.
- **`F2` (rename) is an open question for Douglas** — options: (a) inline rename of the label, session-only; (b) inline rename persisted in `desktopStore`, reset by "Arrange Icons"; (c) skip rename and make `F2` show a playful "this file is protected" message. Until decided, `F2` does nothing.

### Screen readers
- Landmarks: desktop (`region` "Desktop", a `listbox`/grid of icons with `aria-selected`), each window a `dialog`-less `region`/`section` labelled by its title, taskbar landmark, Start menu `menu`.
- Window controls have localized `aria-label`s; focused-window state is exposed via the taskbar button's `aria-pressed`.
- Live regions: balloons and assistant (`polite`), messenger log (`role="log"`).

---

## Layering (z-index policy)

| Layer | z-index | Notes |
|-------|---------|-------|
| Wallpaper (static or 3D) | 0 | |
| Desktop icons, lasso | 10 | |
| Windows | 100–999 | focus increments; recycled on overflow (existing logic) |
| Assistant character + bubble *(stage 5)* | 1050 | above windows, below the taskbar; never covers the focused window's controls |
| Taskbar | 1100 | |
| Start menu, context menus, dropdowns | 1200 | |
| Tray balloons, messenger toast *(5b)* | 1300 | one at a time, shared queue with the assistant bubble |
| Modal dialogs (shutdown, Run, errors) | 1400 | |
| Boot / logon / shutdown screens | 2000 | |

Stage 5 refines the assistant/balloon queue; changes are recorded here.

---

## CTA Hierarchy

1. **Download CV** — desktop `resume.pdf` (2nd icon), Quick Launch (1 click), Start → Résumé (CV) (2 clicks), About window button, later assistant/messenger/Run.
2. **Contact** — desktop (3rd icon), Quick Launch, Start (left pinned + right column).
3. **How I Work With AI** and **Experience** — pinned in Start / desktop.
4. Everything else (About, Projects, Skills, fun apps).

Fun apps live in **All Programs** submenus and never above the CTAs.

---

## Persistence

| Key | Storage | Owner | Contents |
|-----|---------|-------|----------|
| `douglasos:windows` | localStorage | `windowStore` | Open windows, rects, z-order, minimized/maximized (reconciled on load) |
| `douglasos:desktop-icons` | localStorage | `desktopStore` | Icon cells (merge fills new launchers) |
| `douglasos:display` | localStorage | display store *(stage 1)* | Wallpaper choice |
| boot/logon seen | sessionStorage | boot/logon *(stage 1)* | Skip boot + logon for the rest of the session |
| locale | URL (`/en`, `/pt`) + localStorage | `LocaleToggle` | Language |

Later stages add their own keys here (assistant dismissal, messenger history, volume).

---

## Empty / Edge States

| State | Behavior |
|-------|----------|
| No JavaScript | Server-rendered content readable (stage 2 guarantees real text in the DOM); the desktop metaphor is unavailable |
| Slow connection | Boot never exceeds ~3s; wallpaper paints over the solid color when ready; 3D never blocks |
| Reduced motion | No 3D, no marquee/fades/minimize tweens; static alternatives for every animation |
| Screen reader | Logical order: desktop icons → windows → taskbar; metaphor never hides content |
| Window off-screen after resize | `reconcilePersisted` snaps it back into the work area |
| All windows open | Taskbar buttons shrink to icon-only; performance maintained |
| sessionStorage unavailable | Boot/logon may replay; never blocks |
| Unknown persisted app id | Dropped on load (existing reconciliation) |

---

## Stage Map (where each part of this spec is built)

| Stage | Interface work |
|-------|----------------|
| 1 | Tokens, boot, logon, taskbar (Start, Quick Launch, window buttons, tray), Start menu, Luna windows, XP icons, wallpaper + Display Properties, keyboard map (stage-1 rows), welcome balloon |
| 2 | Mobile touchable XP (§11), replaces `MobileFallback` |
| 3 | External shortcuts (LinkedIn/GitHub/WhatsApp/e-mail) on desktop and All Programs |
| 4 | DouglasOS Explorer for projects (address bar, history, not-found dialog), `openWindow` with a route |
| 5 | "mini Douglas" scripted assistant (layer + queue) |
| 5b | DouglasOS Messenger (scripted chat, real message via mailto/WhatsApp, tray icon, toast) |
| 6 | Recycle Bin rescue + lasso/multi-select |
| 7 | Run…, command palette, desktop context menu |
| 8 | DouglasOS Media Player + synced dance, tray volume/now-playing |
| 9 | Retro Cam (pixelated webcam) |
| 10 | DouglasOS Paint + "DON'T OPEN THIS.exe" |

Every stage updates this document (and `MVP-SCOPE.md` when status changes).
