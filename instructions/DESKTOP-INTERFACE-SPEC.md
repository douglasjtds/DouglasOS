# DouglasOS — Desktop Interface Specification ("DouglasOS XP")

> Structural specification for the DouglasOS interface from v1.5 onward. This is **not** a landing page — the interface itself is the experience. This document defines the structure, layout and behavior of every interface element. Visual values (colors, sizes, motion) come from `DESIGN-GUIDELINES.md`; this doc never redefines them.
>
> **Status:** v1.5 spec. **Stage 1 (desktop shell, ≥ 768px) is implemented** — boot, logon, taskbar, Start menu, Luna windows, XP icons, wallpapers + Display Properties, stage-1 keyboard map, welcome balloon. **Stage 2 (touchable XP, < 768px) is implemented** — the linear `MobileFallback` is gone; phones get the same shell adapted to touch ([§11](#11-mobile-touchable-xp)). **Stage 3 (external shortcuts), stage 4 (DouglasOS Explorer: projects as case studies), stage 5 (the scripted "mini Douglas" assistant, [§13](#13-mini-douglas-assistant-stage-5)) and stage 5b (DouglasOS Messenger, [§14](#14-douglasos-messenger-stage-5b)) are implemented.** Later stages add the features marked with their stage number (e.g. *(stage 6)*). The stage plan lives in `MVP-SCOPE.md` → Post-MVP Roadmap. Decisions taken by Douglas after stage 0 (single-click icons, `F2` joke, Quick Launch kept) are recorded inline below.

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
│ My Projects                         wallpaper ("Morning Waves")        │
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
- Default: static original "Morning Waves" (abstract blue ribbons + DouglasOS mark; replaced the stage-1 "Morning Hills", which read too close to the famous hill photograph). Alternatives and the optional "DouglasOS 3D (animated)" are chosen in **Display Properties** ([§8](#8-display-properties-app)).
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
| `messenger` *(stage 5b)* | DouglasOS Messenger | DouglasOS Messenger |
| `linkedin` *(stage 3, link)* | linkedin.url | linkedin.url |
| `github` *(stage 3, link)* | github.url | github.url |
| `whatsapp` *(stage 3, link)* | whatsapp.exe | whatsapp.exe |
| `email` *(stage 3, link)* | write-me.eml | me-escreva.eml |

- **Default order** (CTA hierarchy): About Douglas, resume.pdf, Contact, My Projects, Experience, Skills, How I Work With AI, DouglasOS Messenger *(5b — last of the apps, see [§14](#14-douglasos-messenger-stage-5b) → Placement)*. Recycle Bin *(stage 6)* pinned to the bottom-right cell. External shortcuts follow the apps.

### External shortcuts *(stage 3 — done)*
- Four `kind: "link"` launchers in `lib/apps/registry.tsx` (`LinkConfig { id, kind, titleKey, icon, href, external }`): `linkedin`, `github`, `whatsapp`, `email`. The ids are **stable** (they are the Recycle Bin rescue targets in stage 6). URLs come only from `lib/profile.ts`; `email` is `mailto:`.
- **Opening:** same single click / tap / `Enter` as any icon, through `launch()` → `lib/openLink.ts`. External links open in a **new tab** with `rel="noopener noreferrer"`; `mailto:` is followed in place (hands off to the mail app, no blank tab). No window, no taskbar button. `F2` shows the same "protected file" joke.
- **Labels** are fun file names (table above), so each icon also carries a hover hint / accessible description (`links.<id>.description`, e.g. "LinkedIn profile (opens in a new tab)").
- **Icons:** own generic glyphs (globe + "in" monogram tag, dark code tile with `</>` and a branch, green chat bubble with typing dots, envelope with an "@" seal), each with the DouglasOS **shortcut-arrow overlay** bottom-left (`components/icons/LinkIcons.tsx`). No official logos.
- **Placement (decision):** the desktop icons form two layout groups (`DESKTOP_ICON_GROUPS`). The apps + CV fill the first column as before; the links **start their own second column** (rows 0–3) instead of trailing under the apps (on a 1440×900 screen that would have split them across the bottom of column 1 and the top of column 2). A single "Links" folder was considered and rejected: it would add a click and a folder window (stage-4 territory) in front of contact routes recruiters should reach in one click.
- **Saved layouts:** no persist version bump. `mergeIconCells` keeps every saved cell and backfills the new ids at their default cell (or the nearest free one if a saved icon already sits there) — unit-tested with a pre-stage-3 layout.
- **Mobile:** the links start a **fresh row** below the apps (`mobileIconLayout` with groups), so About, resume.pdf and Contact keep the first row. On a 390px phone that's rows 0–1 for the apps and row 2 for the four links — everything on the first screen. Tap opens the new tab.
- **Start menu:** All Programs lists the links after a separator, below the apps (cascading submenu on desktop, inline list on phones). They are not pinned and not in Quick Launch (Quick Launch stays CV + Contact only).
- **Interaction (pointer):** **a single click opens** the icon (decision by Douglas after stage 0 — a deliberate deviation from the classic double-click: recruiters shouldn't have to know the convention, and it matches touch). Pressing an icon shows the selection (blue label highlight, tinted glyph) and the icon stays selected; click on empty desktop clears the selection. Dragging is unaffected: the existing `useDesktopIconDrag` `wasDragged` guard means a press that became a drag never opens.
- **Interaction (keyboard):** the desktop is one tab stop (roving tabindex on a `listbox` of `option`s); focus = selection; arrows move the selection across the grid (nearest icon in that direction, `neighborIcon` in `lib/store/desktopGrid.ts`); `Enter` opens; Home/End jump to first/last icon; `F2` shows the "protected file" joke (see [Keyboard](#12-keyboard--accessibility)).
- **Drag:** drag moves the icon and snaps to the nearest free cell (existing guard: a drag never counts as a click).
- `resume.pdf` opening = **download** (no window), via `lib/download.ts`.
- Future: lasso and multi-select *(stage 6)*, Recycle Bin with icon rescue jokes *(stage 6)*, desktop context menu *(stage 7)*, no rename (`F2` is a joke by design, see [Keyboard](#12-keyboard--accessibility)).

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
   - **Messenger "online"** icon *(stage 5b — done; left of the language toggle, see [§14](#14-douglasos-messenger-stage-5b))*, **now-playing** note *(stage 8)*.
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
- Separator, then **All Programs ▸** opening a cascading submenu with every launcher (all apps, resume.pdf, then — after a separator — the external shortcuts *(stage 3, done)*; Messenger *(5b — done, after How I Work With AI)*; later: folders **Accessories ▸** — Paint *(10)*, Retro Cam *(9)* — and **Entertainment ▸** — Media Player *(8)*; "DON'T OPEN THIS.exe" lives in Accessories *(10)*).

**Right column (light blue):**
- **My Projects ▸** *(stage 4 — done)* — a cascading submenu: **All projects** (the Explorer home), separator, then one entry per case study (16px page icon + brand name), each calling `launch("projects", { route })`. The pinned **My Projects** on the left still opens the window in one click. Touch: no submenu (no cascading menus on a phone, and three extra rows would push Résumé (CV) down) — the place opens the Explorer, whose home lists the projects.
- **Résumé (CV)** — downloads the PDF (no window).
- **Contact** — opens Contact.
- separator
- **Display Properties** — opens the `display` app.
- **Help** — opens About Douglas (v1.5 has no separate help app; the assistant covers tips — [§13](#13-mini-douglas-assistant-stage-5)).
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
2. **Menu bar** *(optional per app)*: `File / Edit / View / Help` — **only menus with real, useful items** (e.g. File → Download CV, Close; View → text size; Help → About this app). Never fake menus. Projects/Explorer gets File + Favorites *(stage 4 — done, see [§10](#my-projects-projects))*.
3. **Toolbar** *(optional)*: e.g. Back/Forward/Home + address bar in DouglasOS Explorer *(stage 4 — done)*.
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
- **Window icon menu** (click on the 16px title icon): Restore / Minimize / Maximize / Close — shipped in stage 1 (radix DropdownMenu).
- **Stage 1 implementation notes:** windows live in one isolated stacking layer (`z-100`, `isolate`) so their ever-growing z-indexes never climb above the taskbar; the per-app **menu bar** and **status bar** shipped only where they have real items — so far just DouglasOS Explorer (stage 4), which draws its own bars through the registry's `surface: "bare"` body; the Display Properties window uses the beige `dialog` body (`surface: "dialog"` in the registry) instead of the white content pane.

### Window apps (stage 1)
`about`, `experience`, `projects`, `skills`, `how-i-work-with-ai`, `contact`, plus the new `display` (Display Properties). `resume` stays a download action.

---

## 7. Dialogs, Balloons, Tooltips & Menus

- **Message boxes** (shutdown, errors such as "DouglasOS can't find '…'", confirmations): window chrome with close only, 32px semantic icon (own SVG: error / warning / info / question), message text, right-aligned buttons (`OK`, `Cancel`, …). Modal: focus trapped, initial focus on the default button, `Esc` = Cancel/close, `role="alertdialog"` for errors and confirmations.
- **Tray balloons**: yellow rounded bubble with a tail pointing at the tray icon, bold title + 16px icon, text, close ×. `aria-live="polite"`, never steals focus, auto-dismiss ~8s (paused on hover/focus). **Max one balloon at a time**; queued otherwise.
  - Stage 1 ships one: on the first logon of a session, "Welcome to DouglasOS — Click any icon to open it. Your CV is one click away on the taskbar." (EN/PT), once per session (`douglasos-welcomed` sessionStorage flag).
  - **Single balloon slot** *(stage 5)*: the welcome balloon, the assistant bubble and (stage 5b) the Messenger toast share one first-come-first-served slot, `lib/store/balloonStore.ts` (`request(owner)` / `release(owner)`, head of the line = on screen). Each shows only while it holds the slot; see [Layering](#layering-z-index-policy).
- **Protected-file dialog** (`F2` on a desktop icon): warning message box, original humorous copy (EN: "“{name}” refused to be renamed. It says it took ages to pick that name and recruiters already know it by heart." / PT equivalent), one button ("Fair enough" / "Justo"). Never renames.
- **Tooltips**: yellow rectangles, ~500ms delay, on every icon-only control (Quick Launch, tray, window controls).
- **Menus** (window menus, context menus, submenus): white, blue highlight, keyboard-complete (radix).

---

## 8. Display Properties app

New `display` window app (kind `"window"`), opened from the Start menu (and the desktop context menu, stage 7).

- **Desktop tab:** a small monitor preview + a list of wallpapers: "Morning Waves" (default), "Dusk Hills", "Blueprint", "Solid color" (swatches), "DouglasOS 3D (animated)". `Apply` / `OK` / `Cancel` buttons, XP-style.
- The 3D option is disabled with a reason when unavailable (reduced motion, Save-Data, mobile): "Animated wallpapers are off because your system prefers reduced motion."
- **Screen Saver tab:** omitted in stage 1 (not cheap enough to do well; no dead tab). Listed as a future idea in `MVP-SCOPE.md`.
- The choice persists locally in a new `displayStore` (`lib/store/displayStore.ts`, key `douglasos:display`; catalog + pure helpers in `lib/wallpapers.ts`). Solid colors are five fixed swatches (`--color-swatch-*` tokens).

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
**DouglasOS Explorer** *(stage 4 — done)*: the `projects` window is a small browser for case studies. Original name and glyphs (round green Back/Forward badges, a house for Home, a "case study" page icon, the DouglasOS tile as the brand mark) — never the name or logo of a real browser. The window title stays "My Projects" (same label on the desktop icon, Start menu and taskbar); the brand shows in the status bar.

- **Content:** typed static source `lib/content/projects.ts` (slug, brand name, year, aliases, stack tags, repo/demo links, images in `public/projects/<slug>/`) + prose in `messages/*.json` → `apps.projects.caseStudies.<slug>` (category, status, summary, and the sections **Problem → Approach → Role & stack → Result**). No MDX. An empty section string renders "Douglas is still writing this part. Coming soon." (EN/PT) — nothing is invented; open items are marked `TODO(douglas)`. A unit test enforces EN/PT parity per section. The crawlable `StaticContent` lists the same projects with only the written sections.
- **Anatomy (desktop):** menu bar — **File** (Project list, Contact Douglas, Download CV, Close) and **Favorites** (one entry per project), brand tile at the right; toolbar — **Back** (with label), **Forward**, **Home** (disabled when there's nowhere to go); address row — "Address" label, field with the folder glyph (`font-mono`), **Go**; white sunken content pane; status bar — "Done" / "Concluído" and "DouglasOS Explorer".
- **Address format (decided):** `C:\DouglasOS\Projects\<slug>`; home is `C:\DouglasOS\Projects\`. `resolveAddress()` (`lib/content/projectAddress.ts`, pure, unit-tested) ignores case, surrounding spaces/quotes, `/` vs `\`, the whole or partial prefix and a fun extension (`gasolinha.exe`), and matches slug, brand name or alias with punctuation/spacing removed ("the wedding POST" → `the-wedding-post`). Empty input, the root, `home`, `Projects` → home. Anything else (or a deeper path) is not found.
- **Not found:** an error message box ("DouglasOS Explorer", red error icon): "Can't find “{address}”. Either Douglas hasn't built it yet, or it's still a sticky note on his monitor…" (EN/PT) with **Project list**, **Contact Douglas** and **OK** (default; `Esc` = OK). The page stays where it was; OK/Esc return focus to the address field.
- **Pages:** home = "My Projects" heading, one-line hint and the project list (page icon, linked name, category · status · year, summary, tags). Case study = header (48px page icon, name, meta line), summary, Live site / Source code links (new tab, `noopener noreferrer`), images when present, the four sections (Role & stack also lists the stack tags), footer with **All projects** and **Want to talk about this project? Contact Douglas**.
- **State:** the route and Back/Forward history live in `windowStore` as the window's `history` (`{ entries, index }`, max 50, persisted with the window and sanitized by `reconcilePersisted`: removed projects drop out, windows saved before stage 4 open on home). API for other surfaces (assistant stage 5, Run/palette stage 7, Start menu): `openWindow("projects", { route: "<slug>" | "home" })` (also `launch(id, destination)`); an already-open window pushes the route on its history; unknown routes are ignored. Plus `navigateWindow(id, route)`, `windowBack(id)`, `windowForward(id)`. Routed apps declare `routes: { home, isValid }` in the registry.
- **A11y:** the field has a visible `<label>` ("Address"); `Enter`/Go navigates, `Esc` in the field reverts it to the current address (the global Esc-closes-window shortcut never fires while typing); toolbar is a labelled group with named icon buttons; on a page change focus moves to the page's `h3` (sections are `h4`) and a polite live region announces "{title} — DouglasOS Explorer". Pages swap instantly (no transition at all, so reduced motion needs no alternative).
- **Mobile:** the window is full-screen like every window; the menu bar folds into a **More (⋯)** menu (Favorites + File items) and the toolbar is a single compact row — Back, Forward, Home (44px icon buttons), the address field (16px text so iOS doesn't zoom; the label is visually hidden; the keyboard's Go key submits; it scrolls to show the slug) and More.
- **Desktop icons per project:** none (decision: keep the desktop uncluttered); projects are reached through My Projects (icon, pinned Start item, `My Projects ▸` submenu).

### Skills (`skills`)
**Window:** ~650×550
- Categories as group boxes: Backend, Frontend, Databases, Cloud/DevOps, AI Tooling, Methodology. Tags as XP chips. No star ratings.

### How I Work With AI (`how-i-work-with-ai`)
**Window:** ~700×600 — the marquee section (slightly more vivid icon, pinned in Start).
- Opening stance, then: Daily tooling · Discovery-first workflow · Productivity multipliers · What AI doesn't replace. Concrete examples over buzzwords (source material: `AI-WORKFLOW-LOG.md`).

### resume.pdf (`resume`, no window)
- Opening it (desktop click/Enter, Start → Résumé (CV), Quick Launch, assistant/messenger/Run actions) **downloads** `public/resume.pdf` via `lib/download.ts`.
- Document icon with a generic PDF band; tooltip "Download CV".

### Contact (`contact`)
**Window:** ~500×500
- Header ("Let's talk" / localized), contact rows for LinkedIn, GitHub, Email (mailto + copy button), WhatsApp — URLs only from `lib/profile.ts`, external links in a new tab with `rel="noopener noreferrer"`.
- Optional availability line ("Open to remote opportunities").

### Display Properties (`display`)
See [§8](#8-display-properties-app).

### Later apps (specified in their stages)
External shortcuts (3, done — not windows, see [Desktop → External shortcuts](#external-shortcuts-stage-3--done)), DouglasOS Explorer (4, done), mini Douglas assistant (5, done — a desktop companion, not a window, see [§13](#13-mini-douglas-assistant-stage-5)), DouglasOS Messenger (5b, done — see [§14](#14-douglasos-messenger-stage-5b)), Recycle Bin (6), Run + command palette (7), DouglasOS Media Player (8), Retro Cam (9), DouglasOS Paint + "DON'T OPEN THIS.exe" (10). Each stage must update this section.

---

## 11. Mobile (touchable XP)

> Replaced the v1 "linear mobile fallback". Applies below 768px (Tailwind `md`; `useIsMobile()` / `DESKTOP_QUERY` in `hooks/useIsMobile.ts`). **Implemented in stage 2.**

One shell for every width: `ShellGate` always mounts `DesktopShell`, and components adapt through `useIsMobile()` plus `max-md:` classes. The size tokens themselves switch to their mobile values under `@media (width < 48rem)` in `globals.css` (taskbar 48px + bottom safe-area inset, title bar 36px, control buttons 32px, task buttons 40px, desktop cell 96 × 104 with an 88px label), so `h-taskbar`, `bottom-taskbar`, `h-titlebar`… just work on phones. The Zustand stores are shared and unchanged: the touch shell is a different **presentation** of the same state.

- **Layout:** full-screen desktop (`100dvh`, `viewport-fit=cover`, safe-area padding on the desktop, windows and session screens), taskbar at the bottom, no horizontal scroll (e2e-checked). `touch-manipulation` on the shell removes the double-tap-zoom delay.
- **Icon grid:** like a phone home screen — larger cells, filled **row-first** and centered (`mobileIconLayout` in `lib/store/desktopGrid.ts`, unit-tested for no overlap at 320–767px), so About, **resume.pdf** and Contact share the first row. The layout is derived from the container width (ResizeObserver) and **never persisted**, so it can't disturb the desktop arrangement in `desktopStore`. If a short screen can't fit every row, the desktop scrolls vertically instead of stacking icons.
- **Taskbar:** Start (88px), **Quick Launch kept** (CV + Contact as 44px targets — the golden-rule shortcut stays), window buttons icon-only at 44px in a list that scrolls sideways inside the taskbar when crowded, and the tray with the clock plus a **single language button** showing the current locale ("EN"), which switches to the other one (two buttons didn't leave room for window buttons on a 360px phone). Everything on the taskbar is ≥ 44 × 44px (e2e-checked).
- **Start menu:** a full-width panel up to 85% of the viewport height; header and footer stay fixed while the body scrolls. Sections stack in spec order: pinned apps, places (My Projects, **Résumé (CV)**, Contact, Display Properties, Help), then **All Programs as an inline list** (no cascading submenu on a phone). Items are 44px tall. CV = 2 taps from the desktop (Start → Résumé (CV)).
- **Windows:** always full-screen (the work area above the taskbar), no drag/resize, no double-tap maximize. Compact 36px title bar: icon, title, **Minimize + Close** (32px glyphs, 44px hit areas). Only the focused window is visible; the others stay mounted but `inert` + `aria-hidden` until picked on the taskbar. Closing shows the next open window, else the desktop. The stored window rects are untouched, so rotating to a wide screen brings the desktop geometry back. In-app "Back" lives in the Explorer toolbar (stage 4; see [§10](#my-projects-projects) → Mobile).
- **Gestures:** single tap opens an icon. **Long-press** is reserved for the stage-7 context menu: icons already suppress text selection and the iOS callout so the gesture is free, but nothing is bound to it yet (no dead menu). **No icon drag on touch** (decision: dragging would compete with scrolling and taps, and a phone home-screen layout doesn't need it). No hover-only affordance: every icon-only control has an accessible name, and tooltips are extras.
- **Boot/logon:** boot ~1s (`BOOT_MOBILE_MS`; reduced motion stays at 0.6s), Skip is a 44px button; the logon stacks (brand above the user tile, thinner bands) and its hint says "Tap Douglas to come in." Same once-per-session rule.
- **Welcome balloon:** same once-per-session balloon with "tap" copy; on every width it now dismisses itself as soon as the Start menu or a window opens, so it never covers the menu or a window's buttons.
- **3D wallpaper:** **not offered on mobile** (Display Properties shows it disabled with the reason). Stage 2 decision: no exception. The static wallpaper already scores 98–99 on Lighthouse mobile; the R3F chunk plus a WebGL context on mid-range phones isn't worth the battery and LCP risk for an ambient effect.
- **Content, SEO and screen readers:** the page also server-renders `StaticContent` (`components/os/StaticContent.tsx`), a server component with no client JS: every app's EN/PT content as real text with an `h1` (name + headline) → `h2` per app → `h3` outline, CV link and contact links. It's visually hidden but stays in the DOM for crawlers and for screen-reader users who want a linear read, and a `<noscript>` style makes it the visible page when JavaScript is off. Inside windows the title bar is the `h2` and in-app headings are `h3`.
- **Performance:** the server-rendered placeholder paints the default wallpaper over the same box as the shell's wallpaper, and the page preloads that SVG, so the LCP is the first paint instead of a post-hydration background. Lighthouse mobile (production build, simulated throttling): performance 98–99, LCP 1.8–2.3s, CLS 0.
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
| Desktop: `F2` on selected icon | `F2` → "protected file" dialog (no rename) | — | 1 |
| Close menu/dialog/balloon | `Esc` (topmost transient first) | — | 1 |
| Context menu | `Shift+F10` / `ContextMenu` key | — | 7 |
| Select all / toggle / delete icon | `Ctrl+A`, `Space`/`Ctrl+Space`, `Delete` | — | 6 |
| Run… | `Meta+R` (best effort) | `Alt+Shift+R` | 7 |
| Command palette | `Ctrl+K` / `Cmd+K` | — | 7 |
| Messenger: send / new line | `Enter` / `Shift+Enter` | — | 5b |
| Messenger: close form / window | `Esc` (form first; from the composer it closes the window) | — | 5b |

- A single shortcut registry (pure, in `lib/`, unit-tested) owns this map so later stages can't introduce conflicts.
- **`F2` decided by Douglas: option (c)** — no rename; `F2` opens the humorous "protected file" message box ([§7](#7-dialogs-balloons-tooltips--menus)).
- **Stage 1 implementation:** the registry is `lib/shortcuts.ts` (`matchShortcut`, `createMetaTapTracker`, unit-tested); `hooks/useShellShortcuts.ts` wires it to the shell. The Meta tap fires on keyup only when no other key was pressed and the page didn't lose focus in between (so `Cmd+Tab` away and back never opens Start). After `Esc`/`Alt+F4` closes a window, focus goes to the next window, else that app's desktop icon, else the Start button.

### Screen readers
- Landmarks: desktop (`region` "Desktop", a `listbox`/grid of icons with `aria-selected`), each window a `dialog`-less `region`/`section` labelled by its title, taskbar landmark, Start menu `menu`.
- Window controls have localized `aria-label`s; focused-window state is exposed via the taskbar button's `aria-pressed`.
- Live regions: balloons and assistant (`polite`), messenger log (`role="log"`).

---

## 13. mini Douglas assistant *(stage 5)*

**Purpose:** a scripted desktop companion — tips, CV/Contact/project shortcuts and an offline "ask me something" search — with personality (he dances when clicked). No LLM, no network, no backend. Never blocks the golden rule: every bubble offers CV/Contact in one click, and he never covers what a recruiter needs.

### Pieces
| Piece | Where | Notes |
|-------|-------|-------|
| State + actions | `lib/store/assistantStore.ts` | `visible`, `dismissed`, `state` (`idle` \| `talking` \| `dancing`), `queue` of messages, `fired` triggers, `tipIndex`. Pure Zustand, no UI |
| Script | `lib/assistant/script.ts` | Every line as data (`AssistantMessage { id, titleKey, textKey, values?, actions[], search?, auto? }`), tip rotation, answers per intent, `ASSISTANT_TIMING` |
| Intent matcher | `lib/assistant/intents.ts` | Pure, UI-agnostic; reused by Messenger (5b) and Run/palette (7) |
| Shell actions | `lib/assistant/actions.ts` | `ShellAction` (`openProject` / `openApp` / `downloadCv`), `runShellAction()` through `launch()`, `INTENT_ACTIONS`, `actionsForIntent()` |
| Placement | `lib/assistant/layout.ts` | Character/bubble rects, `assistantClearance()` (golden-rule check) |
| Asset contract | `lib/assistant/media.ts` + `instructions/full-refactor/ASSISTANT-ASSETS.md` | `idle/talk/dance` clips (VP9-alpha WebM + HEVC-alpha .mov for Safari/iOS) + `poster.png`; `ASSISTANT_MEDIA.ready` switches from the placeholder |
| UI | `components/os/assistant/` | `LazyAssistant` (dynamic import, mounted after the desktop is idle), `Assistant` (layer, triggers, Esc, slot), `AssistantBubble`, `AssistantCharacter` (one interface: `PlaceholderCharacter` SVG now, `VideoCharacter` once the clips exist) |
| Triggers | `hooks/useAssistantTriggers.ts` | See below |

### Public API for later stages
- `say(message)` — queue a line (stage 6 Recycle Bin rescue jokes). Dropped after "Not now" and when a line with the same `id` is already queued. Lines said during a dance wait until it ends.
- `dance(options?)` / `stopDance(options?)` — stage 8 calls `dance()` (no duration) when music starts and `stopDance()` when it stops; `stopDance` says the "Phew!" line unless `{ quiet: true }`. A click uses `dance({ durationMs: 3500 })`.
- Also: `show()`, `replace(message)`, `closeMessage()`, `nextTip()`, `dismiss()`, `trigger(id, message?)` (once per session), `markFired(id)`.
- Intents: `matchIntent(text)` → `IntentMatch { intent, score, projectSlug? }` or `IntentFallback { intent: "fallback", score: 0, suggestions }`; `rankIntents`, `normalizeText`, `tokenize`, `findProjectSlug`, `isFallback`, `INTENT_IDS`, `FALLBACK_SUGGESTIONS`. Intents: `cv`, `contact` (incl. hire/contratar), `projects` (+ slug from slug/brand/alias), `skills`/stack, `availability` (remote/location), `ai-workflow`, `experience`, `about`. EN + PT keywords, accent/case/punctuation-insensitive, stems by prefix (`contrat*`), phrases ("entrar em contato"); ties go to CV, then Contact.

### Placement & look
- **Desktop:** the character (96 × 112) stands on the taskbar toward the tray, just left of the icon grid's last column (the bottom-right cell stays free for the stage-6 Recycle Bin). The bubble (300px wide, up to 320px tall, scrolls beyond) sits above him, right-aligned to the screen edge, tail pointing at him. XP balloon look: `info` background, 1px `info-border`, `radius-balloon`, `shadow-balloon`, bold title + 16px info icon + close ×, shortcuts as blue-bullet link options, then "Ask me something:" field + **Search** push button.
- **Phones (< 768px):** smaller character (60 × 70) above the taskbar at the right, hidden while a (full-screen) window is up; the bubble is a **bottom sheet** (full width, above the taskbar, ≤ 60dvh, 44px shortcuts in two columns, 16px input so iOS doesn't zoom).
- Character art: until Douglas records the clips, an **original** SVG figure (round head, dark hair, blue DouglasOS hoodie with the tile on the chest, sneakers) — not modeled on any classic OS assistant. Illustration-local colors live in the component, like `ICON_COLORS`.

### Behavior
- **Click the character:** he dances ~3.5s (bubble hidden), then says "Phew!…" with the standard shortcuts. Under reduced motion: no dance, the click opens the "How can I help?" bubble. Clicking while he dances does nothing.
- **Shortcuts** (standard set): Show me a project → `openWindow("projects", { route: FEATURED_PROJECT_SLUG })`; I want to get in touch → Contact; Download the CV → `lib/download.ts` via `launch("resume")`; Show me another tip → `nextTip()`; Not now, thanks → `dismiss()` (gone for the session, focus moves to Start if it was in the bubble). Window/download shortcuts close the bubble.
- **Search:** the text goes through `matchIntent`; the bubble is replaced by the intent's answer + its shortcuts (never auto-opens anything); unknown → an honest fallback with Projects / CV / Contact.
- **Triggers** (each at most once per session, persisted in `douglasos-assistant`; none fires while a session screen is up; none moves focus):
  1. after logon — greeting, 2.5s desktop / 5s phone (queued behind the welcome balloon, so in practice after it closes); on a reload in the same session he just reappears quietly;
  2. first opening of My Projects — address-bar tip, 1.2s / 2.5s later (skipped if the Explorer was opened from his own shortcut);
  3. 30s desktop / 45s phone without pointer or keyboard input — "Still around?" with Download CV + Contact.
- **Auto lines** close themselves after 15s unless hovered or focused inside; lines the visitor asked for stay until closed.
- **A11y:** the character is a real `button` ("mini Douglas, desktop assistant"); the bubble is a `section` labelled by its title, with the line in a `role="status"` `aria-live="polite"` paragraph; the field has a visible label; shortcuts are buttons in a labelled list. **Esc** closes the bubble (focus returns to the character if it was inside) before the window manager's Esc-closes-window. Auto appearance never steals focus. Reduced motion: still frame (poster), no bob/blink/dance; a static music note marks `dancing` (stage 8).
- **Performance:** the assistant chunk loads only after the desktop is up and the browser is idle (and not at all once dismissed); the videos only once he appears.

## 14. DouglasOS Messenger *(stage 5b)*

**Purpose:** a 2000s-messenger-style chat where the visitor feels they're talking to Douglas. **Scripted** end to end (no LLM, no network, no backend) and it ends in a **real message** the visitor sends from their own mail app or WhatsApp. Independent of mini Douglas (§13). Brand is original: name "DouglasOS Messenger", own buddy-with-speech-bubble icon, own SVG emoticons, no sounds — never another messenger's name, butterfly/two-person logo, nudge/login sounds or emoticons.

### Pieces
| Piece | Where | Notes |
|-------|-------|-------|
| Types + constants | `lib/messenger/types.ts` | `MessengerAction` (`ShellAction` \| `leaveMessage`), `QUICK_REPLY_IDS`, `DEFAULT_QUICK_REPLIES`, `ScriptLine`, `ScriptReply`, `MESSENGER_TIMING`, `canNudge()`. Kept apart from the engine so the store/tray/toast don't pull the matcher into the shell bundle |
| Script engine | `lib/messenger/engine.ts` | Pure: `greetingReply()`, `replyToText(text)` / `replyToIntent(result)` (through `matchIntent`), `quickReplyTurn(id)` (`{ sayKey, effect?, reply }`), `nudgeReply(n)`, `messageSentReply(channel)`, `suggestionsAfter(topic)`, `typingDelayMs(length, { reducedMotion })`, `actionLabel()`, `actionId()` |
| Link builders | `lib/messenger/links.ts` | Pure: `buildMailtoLink`, `buildWhatsAppLink`, `buildMessageLinks`, `whatsappChatUrl`, `cleanMessage`. Destinations only from `lib/profile.ts`; subject/body encoded (CRLF in mail bodies); the visitor's text (never the localized frame) is shortened with "…" to keep links ≤ 2,000 chars, cutting on code points |
| Emoticons | `lib/messenger/emoticons.ts` + `components/icons/MessengerIcons.tsx` | 10 codes (`:)`, `:D`, `;)`, `:P`, `:O`, `:(`, `(cool)`, `<3`, `(y)`, `(coffee)`) → original SVG faces; `splitEmoticons` never parses markup, codes glued to a word stay text |
| State | `lib/store/messengerStore.ts` | `view` (`contacts` \| `conversation`), `messages`, `pending` (lines still to "type"), `typing`, `unread`, `quickReplies`, `formOpen`, `draft`, `greeted`, nudges. Actions: `setView`, `openConversation`, `showContacts`, `postVisitor`, `postSystem`, `queueReply`, `deliverNext({ unread, skip })`, `setTyping`, `markRead`, `openForm`/`closeForm`, `setDraft`, `nudge(now)`, `reset`. Persisted to **sessionStorage** (`douglasos:messenger`, sanitized on load) |
| UI | `components/apps/MessengerApp.tsx` + `components/apps/messenger/` | `ContactList`, `Conversation`, `MessageLog`, `Composer`, `MessageForm`, `MessageText`, `shell.ts` (`runMessengerAction`, `closeMessengerWindow`) |
| Tray + toast | `components/os/taskbar/MessengerTray.tsx`, `MessengerToast.tsx` | |

### Window
- Registry: `messenger`, kind `window`, `surface: "bare"`, ~460×580, on the desktop, in All Programs (not pinned: Start stays CTA-first).
- **Contact list:** brand band (icon + name, "You · Visitor (online)"), group "Online (1)", one row: Douglas's picture with an online dot, "(Online)" in text (never color alone), personal message, unread count. **Single click / tap / Enter** opens the conversation (deliberate deviation from the brief's double-click, consistent with Douglas's single-click decision for every icon). One window, two views — no multi-instance.
- **Conversation:** header (Back to contacts, picture, name/status, personal message, **Download CV** and **Contact** push buttons — the golden rule one click inside the chat), a permanent muted notice ("Automatic replies, written in advance by Douglas himself. For a real answer, leave a message."), the log ("Douglas says:" / "You say:", system lines in italics, link-style buttons under Douglas's lines), a "Douglas is typing…" status line, suggested replies, then the composer (Emoticons picker, Nudge, field, Send).
- **Script:** the first time the conversation shows in a session Douglas types the opening ("Hi! I saw you're looking around my portfolio :)" + how to use it). Free text → `matchIntent` → that intent's answer + buttons (open a project via `openWindow("projects", { route })`, the project list, Skills, Experience, About, How I Work With AI, Contact, CV via `lib/download.ts`, the message form). Unknown → "That one I'll have to answer in person. Leave me a message?" with the form. Quick replies: See projects, **Download CV** (downloads immediately — one click — and posts a backup link), Tech stack, Availability, AI workflow / Experience, **Leave a message**; the topic just answered is swapped out. Lines whose copy is still an empty `TODO(douglas)` are skipped.
- **Typing:** 450ms + 28ms/char, capped at 2.2s; instant under reduced motion. The current suggestions stay up while he types and are replaced when his last line lands. Lines delivered while the window is minimized/unfocused or on the contact list count as **unread** (red dot on the tray icon, count on the contact row); reading the conversation clears them.
- **Nudge:** the window shakes ~0.5s (Framer Motion on the window frame; half amplitude on phones); under reduced motion no shake — the "You sent a nudge." notice marks it. One per 10s ("Easy there!…" otherwise); Douglas answers with a rotating comeback. No sound.
- **Leave a message:** replaces the suggestions + composer: name (optional, 80) + message (required, 1000, counter) + **Send by e-mail** (`mailto:` link, same tab → mail app) / **Send on WhatsApp** (`wa.me`, new tab, `noopener noreferrer`) / Cancel. The links are real `<a href>`s rebuilt as the visitor types; with an empty message they don't navigate and focus the field. After following one, the form closes, the message is logged as "You say:" and Douglas thanks them. Nothing is ever sent by the page itself.

### Tray icon and toast
- **Tray:** 16px buddy icon left of the language toggle (44px target on phones), tooltip/name "Douglas is online. Open DouglasOS Messenger" (with the unread count when there is one); click opens/focuses the window (straight to the conversation when there are unread lines).
- **Toast:** "Douglas says: Hi! Got a minute?…" in a small messenger-style card above the tray (title-bar strip + light-blue body), **at most once per session** (`douglasos-messenger-toast`), 20s after the desktop appears (35s on phones). Takes the shared **balloon slot** (`balloonStore` owner `messenger`), so it never shows with the welcome balloon or the assistant bubble; waits while the Start menu is open or (phones) while a full-screen window is up; skipped for the session once the visitor opened the Messenger on their own. `role="status"` + `aria-live="polite"`, never takes focus, closes itself after 8s unless hovered/focused, × closes it, a click opens the conversation. It never opens the window on its own.

### Placement (decision)
The desktop icon is the **last of the apps group** (after How I Work With AI), not with the external links. Desktop: it ends the first column (row 8 at 1440×900); the links keep their own column. Phones (4 per row at 390px): it completes the apps' second row, so About / resume.pdf / Contact keep the first row and the links still start a fresh row (unit- and e2e-checked). Putting it in the links group would have spilled a fifth link into an extra row on phones; a Start pin would have pushed the CTA-ordered pins down.

### A11y & keyboard
- Log is `role="log"` + `aria-live="polite"` (labelled "Conversation history"); auto-scrolls to the newest line; nothing moves focus on its own except the visitor's own actions (opening the conversation on the pointer desktop focuses the field; opening the form focuses the message).
- Field has a (visually hidden) label; **Enter** sends, **Shift+Enter** adds a line (IME composition respected). Quick replies are a labelled group of buttons (Tab order); emoticons are a Radix menu (arrows, Esc).
- **Esc:** closes the emoticon menu → the form → (from the composer) the window, focus moving to the next window, else the tray icon, else Start. Elsewhere in the window the shell's Esc-closes-window applies.
- Emoticons are `role="img"` with localized names.

### Mobile
Full-screen window like every app; header compacts (icon-only Back and Contact, avatar 32px, personal message hidden); suggestions are a **single row of 44px chips that scrolls sideways**; composer and form fields use 16px text (no iOS zoom); the composer stays above the on-screen keyboard (`hooks/useKeyboardInset.ts` pads by the part of the window the `visualViewport` no longer shows). Tap opens the conversation; the toast waits until no window is up.

### Persistence
`douglasos:messenger` (sessionStorage): conversation, pending lines, view, suggestions, unread, form open, draft, greeted, nudge count — gone when the tab closes. `douglasos-messenger-toast` (sessionStorage): the toast already showed.

---

## Layering (z-index policy)

| Layer | z-index | Notes |
|-------|---------|-------|
| Wallpaper (static or 3D) | 0 | |
| Desktop icons, lasso | 10 | |
| Windows | 100–999 | focus increments; recycled on overflow (existing logic) |
| Assistant character + bubble *(stage 5)* | 1050 | above windows, below the taskbar; never covers the focused window's title bar (see below) |
| Taskbar | 1100 | |
| Start menu, context menus, dropdowns | 1200 | |
| Tray balloons, messenger toast *(5b — done)* | 1300 | one at a time, shared slot with the assistant bubble |
| Modal dialogs (shutdown, Run, errors) | 1400 | |
| Boot / logon / shutdown screens | 2000 | |

**Stage 5 rules (balloon slot + assistant):**
- The bubble lives in the assistant layer (1050), not at 1300: it sits above the character, away from the taskbar, so it never needs to cover menus. Menus (1200) and dialogs (1400) always win over it.
- **One balloon on screen at a time.** Welcome balloon, assistant bubble and Messenger toast *(5b)* take turns through `balloonStore` (first come, first served). While another owner holds the slot, the assistant's line waits in his queue **and the character itself hides**, so he never stands under the welcome balloon.
- **Focused window first.** Desktop: if the focused window's title bar (controls) would intersect the character, he steps aside entirely; if it would intersect only the bubble's reserved area, the line waits until the window moves (`assistantClearance` in `lib/assistant/layout.ts`, unit-tested). Phones: the character hides while any window is up (they're full-screen); the bottom sheet may show above the window's lower part, never over its title bar.
- CV, Contact and Quick Launch are on the taskbar (1100), above the assistant layer by construction; the character stands left of the grid's last column, clear of the default icon columns and of the bottom-right cell reserved for the Recycle Bin *(stage 6)*.
- Esc closes the topmost transient first: an open menu/dialog, then the assistant bubble, then (shell shortcut) the focused window.

---

## CTA Hierarchy

1. **Download CV** — desktop `resume.pdf` (2nd icon), Quick Launch (1 click), Start → Résumé (CV) (2 clicks), About window button, assistant bubble (stage 5), Messenger header + quick reply + answers (5b), later Run.
2. **Contact** — desktop (3rd icon), Quick Launch, Start (left pinned + right column).
3. **How I Work With AI** and **Experience** — pinned in Start / desktop.
4. Everything else (About, Projects, Skills, fun apps).

Fun apps live in **All Programs** submenus and never above the CTAs.

---

## Persistence

| Key | Storage | Owner | Contents |
|-----|---------|-------|----------|
| `douglasos:windows` | localStorage | `windowStore` | Open windows, rects, z-order, minimized/maximized, Explorer route + Back/Forward history (reconciled on load) |
| `douglasos:desktop-icons` | localStorage | `desktopStore` | Icon cells (merge fills new launchers) |
| `douglasos:display` | localStorage | `displayStore` *(stage 1)* | Wallpaper + solid-color swatch |
| `douglasos-booted` | sessionStorage | `shellStore` *(stage 1)* | Boot + logon seen: skip them for the rest of the session |
| `douglasos-welcomed` | sessionStorage | `WelcomeBalloon` *(stage 1)* | Welcome balloon already shown this session |
| `douglasos-assistant` | sessionStorage | `assistantStore` *(stage 5)* | `{ dismissed, fired }`: "Not now" picked, and which automatic appearances already played |
| `douglasos:messenger` | sessionStorage | `messengerStore` *(stage 5b)* | Conversation history, pending lines, view, suggestions, unread, draft, form open, greeted |
| `douglasos-messenger-toast` | sessionStorage | `MessengerToast` *(stage 5b)* | The tray toast already showed this session |
| locale | URL (`/en`, `/pt`) + localStorage | `LocaleToggle` | Language |

Later stages add their own keys here (volume).

---

## Empty / Edge States

| State | Behavior |
|-------|----------|
| No JavaScript | The server-rendered text version (`StaticContent`) becomes the visible page via `<noscript>`; the desktop metaphor is unavailable |
| Slow connection | Boot never exceeds ~3s; wallpaper paints over the solid color when ready; 3D never blocks |
| Reduced motion | No 3D, no marquee/fades/minimize tweens; static alternatives for every animation (assistant: still frame/poster, no dance — a click offers help instead) |
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
| 2 | Mobile touchable XP (§11), replaces `MobileFallback` — **done** |
| 3 | External shortcuts (LinkedIn/GitHub/WhatsApp/e-mail) on desktop and All Programs — **done** |
| 4 | DouglasOS Explorer for projects (address bar, history, not-found dialog), `openWindow` with a route — **done** |
| 5 | "mini Douglas" scripted assistant (layer + single balloon slot, §13) — **done** |
| 5b | DouglasOS Messenger (scripted chat, real message via mailto/WhatsApp, tray icon, toast, §14) — **done** |
| 6 | Recycle Bin rescue + lasso/multi-select |
| 7 | Run…, command palette, desktop context menu |
| 8 | DouglasOS Media Player + synced dance, tray volume/now-playing |
| 9 | Retro Cam (pixelated webcam) |
| 10 | DouglasOS Paint + "DON'T OPEN THIS.exe" |

Every stage updates this document (and `MVP-SCOPE.md` when status changes).
