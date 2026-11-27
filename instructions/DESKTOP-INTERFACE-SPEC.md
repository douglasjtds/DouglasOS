# DouglasOS — Desktop Interface Specification ("DouglasOS XP")

> Structural specification for the DouglasOS interface from v1.5 onward. This is **not** a landing page — the interface itself is the experience. This document defines the structure, layout and behavior of every interface element. Visual values (colors, sizes, motion) come from `DESIGN-GUIDELINES.md`; this doc never redefines them.
>
> **Status:** v1.5 spec. **Stage 1 (desktop shell, ≥ 768px) is implemented** — boot, logon, taskbar, Start menu, Luna windows, XP icons, wallpapers + Display Properties, stage-1 keyboard map, welcome balloon. **Stage 2 (touchable XP, < 768px) is implemented** — the linear `MobileFallback` is gone; phones get the same shell adapted to touch ([§11](#11-mobile-touchable-xp)). **Stage 3 (external shortcuts), stage 4 (DouglasOS Explorer: projects as case studies), stage 5 (the scripted "mini Douglas" assistant, [§13](#13-mini-douglas-assistant-stage-5)) and stage 5b (DouglasOS Messenger, [§14](#14-douglasos-messenger-stage-5b)) and stage 6 (Recycle Bin rescue + lasso/multi-select, [§3 → Recycle Bin](#recycle-bin-stage-6--done)) are implemented. Stage 7 (Run… + command palette + desktop context menus, [§5](#run-and-the-command-palette-stage-7--done)), stage 8 (DouglasOS Media Player, [§15](#15-douglasos-media-player-stage-8)) stage 9 (Retro Cam, [§16](#16-retro-cam-stage-9)) and stage 10 (DouglasOS Paint, "DON'T OPEN THIS.exe" and the 404 page, [§17](#17-douglasos-paint-stage-10--done)–[§19](#19-404-page-stage-10--done)) are implemented. Stage 11 (easter-egg counter + Achievements, [§20](#20-easter-eggs--achievements-stage-11--done)) is implemented; its stage 7–10 hooks are listed there.** Later stages add the features marked with their stage number (e.g. *(stage 6)*). The stage plan lives in `MVP-SCOPE.md` → Post-MVP Roadmap. Decisions taken by Douglas after stage 0 (single-click icons, `F2` joke, Quick Launch kept) are recorded inline below.

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
│ [icon]                                                  [Recycle Bin] │
│ About Douglas         ┌── About Douglas ─────────────── [_][□][X] ┐  │
│                       │ File  View  Help                            │  │
│ [icon]                │ ┌─────────────────────────────────────────┐ │  │
│ resume.pdf            │ │  content pane (white, sunken)            │ │  │
│                       │ │                                          │ │  │
│ [icon]                │ └─────────────────────────────────────────┘ │  │
│ Contact               │ status bar                                   │  │
│                       └─────────────────────────────────────────────┘  │
│ [icon]                                                                 │
│ My Projects                         wallpaper ("Green Meadow")         │
│ [icon] Experience                                                      │
│ [icon] Skills                                                          │
│ [icon] How I Work With AI                                              │
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
- Default: static "Green Meadow", a CC0 photo of rolling green hills under a blue sky (source in `public/wallpapers/CREDITS.md`). It replaced the abstract "Morning Waves", which stays as an option. Alternatives and the optional "DouglasOS 3D (animated)" are chosen in **Display Properties** ([§8](#8-display-properties-app)).
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

- **Default order** (CTA hierarchy): About Douglas, resume.pdf, Contact, My Projects, Experience, Skills, How I Work With AI, DouglasOS Messenger *(5b — last of the apps, see [§14](#14-douglasos-messenger-stage-5b) → Placement)*. Recycle Bin *(stage 6 — done)* defaults to the top-right cell (draggable, stage 6b). External shortcuts follow the apps.

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
- Lasso, multi-select and the Recycle Bin: see [Recycle Bin](#recycle-bin-stage-6--done) below. Desktop (background) context menu: see [Desktop context menu](#desktop-context-menu-stage-7--done) *(stage 7)*; no rename (`F2` is a joke by design, see [Keyboard](#12-keyboard--accessibility)).

### Recycle Bin *(stage 6 — done)*
The bin never keeps anything: whatever is "deleted" is rescued straight back by mini Douglas with a line of his own. Nothing on the desktop can ever actually be removed.

| Piece | Where | Notes |
|-------|-------|-------|
| Geometry | `lib/store/recycleBin.ts` | `RECYCLE_BIN_ID`, `defaultBinCell(vp)` (top-right cell), `iconRect`, `binHitRect(cell, vp)` (footprint + 8px slop), `hitsBin(point, cell, vp)` (drop hit-test on the **pointer** position, against the bin's **current** cell), `binBalloonPlacement(cell, vp, size)` (where `TrashNotice` goes), `mobileBinPlacement(layout, width)` |
| Selection + group move | `lib/store/desktopSelection.ts` | `lassoRect`, `rectsIntersect`, `iconsInLasso` (touching is enough), `toggleInSelection`, `mergeSelections`, `moveGroup(cells, ids, anchor, dx, dy, vp, reserved)` |
| Store | `lib/store/desktopStore.ts` | Not persisted: `selectedIds`, `drag { ids, dx, dy, overBin }`, `rescue { ids, seq }`, `binFull`, `trashCounts`. Actions: `select`, `toggleSelected`, `selectAll`, `clearSelection`, `setDrag`, `moveIcons(ids, anchor, dx, dy)`, `moveBin(dx, dy)`, `trashIcons(ids)` (returns the line or null). Persisted: `iconCells` + `binCell` (unchanged key, no version bump; `mergeDesktopLayout` backfills a missing bin cell) |
| Lines | `lib/assistant/trash.ts` + `assistant.trash.*` in `messages/{en,pt}.json` | `trashMessage(ids, counts)`: one icon → its own line (`TRASH_LINES`, 2–3 rotating variations per id), several → the "cleanup" line with `{count}` (`cleanupWithCv` + Download CV first when the CV was in the batch), unknown id → generic line. Message id `trash`, `auto: true`; shortcuts always include CV (+ Contact or the app itself). `recycleBinOpenedMessage()` for the window |
| Delivery | `lib/store/trashNoticeStore.ts` | `announceRescue(message)`: see below |
| UI | `components/os/Desktop.tsx`, `desktop/DraggableIcon.tsx`, `desktop/DesktopIcon.tsx`, `desktop/IconContextMenu.tsx`, `desktop/TrashNotice.tsx` (+ `LazyTrashNotice`), `apps/RecycleBinApp.tsx`, `icons/RecycleBinIcons.tsx`; hooks `useRescuePhase`, `useViewport`, `useDesktopIconDrag` | |

- **The bin:** own wire-mesh basket SVG (empty / "full" with crumpled paper), label "Recycle Bin" / "Lixeira". It is a `window` app in the registry (`recycle-bin`, `onDesktop: false`, `inAllPrograms: false`) whose icon the desktop draws itself. **Position (stage 6b, Douglas's call):** it defaults to the **top-right cell** of the grid — the bottom-right corner, where it first sat, was covered by mini Douglas's bubble — and it is **draggable** like any icon (`DraggableRecycleBin` → `useDesktopIconDrag` → `moveBin`): it follows the pointer and snaps to the nearest free cell; its cell is persisted in `desktopStore.binCell`. A layout saved before 6b (no bin cell) gets the top-right default, or the nearest free cell if an icon sits there. "Arrange Icons" (`resetLayout`) puts it back top-right. It always moves **alone**: never lassoed, never part of Ctrl+A or a dragged group, never trashed, and dragging the bin itself never counts as a drop on the bin (no joke; it can't be dropped onto itself). Every other icon treats its current cell as taken (moves, group moves and merged layouts dodge it). A drag never also opens it (same `wasDragged` guard). A single click (or Enter) opens its window: always empty ("This folder is empty." + a note that nothing stays here), and mini Douglas says the "Empty, as always…" line if he's around. Nothing in it can delete or empty anything. Its context menu has **Open** only; `F2` gives the protected-file joke like any icon.
- **Drop:** dragging an icon (or a selected group) over the bin highlights it as the drop target; releasing with the **pointer** inside the bin's footprint (+8px) — on its **current** cell, wherever it was dragged — is a "delete". The icons shrink into the bin (~250ms), the bin shows "full" for 1.4s, and after a beat they fade back in **on their own cells** (they never left them in the store). Reduced motion: no animation, the icons simply stay put; the bin still flips to "full". Anything else is a normal move.
- **The line:** `trashIcons` picks the line and `announceRescue` delivers it. **Decision — "Not now" still gets the joke, without the character:** if mini Douglas is available, `replace()` puts the line in his bubble immediately (a direct reaction takes the bubble over a waiting tip); if he was dismissed this session, the **bin itself** shows the same line in an XP balloon anchored to it (`TrashNotice`, placed by `binBalloonPlacement`: above the bin when there's room, otherwise **below** it — the top-right default — with the tail flipped to point up; shifted left/right to stay on screen, tail on the bin; balloon-slot owner `recycleBin`, layer 1300; bottom sheet on phones), lazy-loaded only when needed. The character never comes back uninvited, and the balloon offers the same CV/Contact shortcuts. Both close themselves after 15s (auto line), × or Esc closes them, neither takes focus.
- **Multi-select (pointer):** single click opens (and selects only that icon); **Ctrl/Cmd+click toggles** without opening (on macOS Ctrl+click is the system context click, so Cmd is the toggle there); pressing an icon that is part of a multi-selection keeps the group, and dragging it moves **the whole group keeping the offsets** (`moveGroup`: dragged icon first, then grid order, against non-moving icons + the bin). A press on empty desktop clears the selection; dragging from empty desktop draws the **lasso** (XP blue translucent rectangle, `lasso-border` / `lasso-fill` tokens, layer 10) and selects every icon it touches, live; Ctrl/Cmd+lasso adds to the selection. The lasso starts only on the desktop surface itself, so it never competes with icon drag (icons stop the press) or windows (a higher layer). A press that left the icon before the drag threshold still starts the drag (window-level watcher until capture).
- **Keyboard:** see [§12](#12-keyboard--accessibility) — arrows move focus + selection (Ctrl/Cmd+arrows move focus only), `Space` selects, `Ctrl/Cmd+Space` toggles, `Ctrl/Cmd+A` selects every icon (not the bin), `Esc` clears the selection (before Esc-closes-window), `Delete` (or `Backspace`, for Mac keyboards) "deletes" the selection — or the focused icon if it isn't selected. The listbox is `aria-multiselectable`; each icon exposes `aria-selected`.
- **Icon context menu (minimal, stage-7 hook point):** `IconContextMenu` (Radix ContextMenu) wraps every icon: right-click, or **press and hold ~700ms on touch**, opens **Open** (bold, default) and **Delete** (same rescue joke; on a multi-selection it deletes the group). Items are data (`IconMenuItem { id, label, onSelect, primary? }`, plus `separatorBefore?` / `items?` for submenus since stage 7), so stage 7 added Properties, `Shift+F10`/ContextMenu key and the desktop-background menu without replacing the mechanism. A long-press that opened the menu never also opens the icon.
- **Mobile:** no lasso and no drag — the bin included (as before). The bin sits on its **own trailing row, right-most column** (`mobileBinPlacement`), below the links, so About / CV / Contact keep the first row. *(6b: unchanged on purpose — a top-right slot on the phone's row-first grid would take a first-row cell and push Contact to the second row; the touch layout is derived, never persisted, so the desktop's `binCell` doesn't apply.)* Long-press → **Delete** plays the rescue in place (the icon shrinks and fades back in on its own slot, since the bin may be scrolled away) and the line appears in mini Douglas's bottom sheet, or in the bin's bottom-sheet balloon when he was dismissed. Menu items are 44px tall.

### Desktop context menu *(stage 7 — done)*
One mechanism for both menus: `IconContextMenu` (Radix ContextMenu, items as data `IconMenuItem { id, label, onSelect?, primary?, separatorBefore?, items? }`, layer 1200, XP white menu with blue highlight, keyboard-complete).

- **Background** (right-click on empty desktop, long-press ~700ms on touch, `Shift+F10` / ContextMenu key when nothing has focus): **Arrange Icons** (= `resetLayout`; the bin goes back top-right), **Refresh** (the icon layer blinks off for 150ms — a single blink, no motion, same under reduced motion), separator, **New ▸** Folder / Shortcut / Text Document → an info message box joke ("DouglasOS is a portfolio, not a file system…" with **Show projects** / OK; nothing is ever created), separator, **Properties** (= Display Properties). `data-desktop-menu`.
- **Icon** (right-click, long-press, `Shift+F10` / ContextMenu key on the focused icon): **Open** (bold), **Delete** (Recycle Bin rescue joke, stage 6; not on the bin), **Rename** (the same "protected file" box as `F2` — the keyboard-free way to it, also on the bin), separator, **Properties** → a mini XP property box (`IconPropertiesDialog`): 32px icon + name, Type (Program / PDF document / Internet shortcut / E-mail shortcut / System folder), Description (the same copy as the Start menu / icon hint), Location (Desktop), Opens (in a window / downloads the file / in a new tab / in your mail app), buttons **Open** and **OK** (default, focused). Read-only: no rename (F2 stays the joke). `data-icon-menu`.
- **No double menus:** the background trigger is a transparent layer *under* the icons (`data-desktop-background`, a sibling, never their ancestor), so a press on an icon can't also arm the background's long-press, and a right-click on an icon opens only its menu. The layer counts as empty desktop for the lasso.
- **Keyboard:** the shell turns `Shift+F10` / the ContextMenu key into a `contextmenu` event on the focused icon, or on the background when focus is on the page itself (`lib/contextMenu.ts`); inside windows the key is left to the browser. Radix then focuses the first item; arrows, Enter, → for New ▸, Esc close.
- **Mobile:** same menus by long-press, 44px items; **Arrange Icons is hidden** (the touch grid is derived from the screen width, so it would do nothing).

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
   - **Volume** *(stage 8 — done)* — only while DouglasOS Media Player is open: speaker icon (red cross when muted) opening a small panel with a slider + Mute; see [§15](#15-douglasos-media-player-stage-8).
   - **Messenger "online"** icon *(stage 5b — done; left of the language toggle, see [§14](#14-douglasos-messenger-stage-5b))*, **now-playing** note *(stage 8 — done; only while music plays, left of the volume icon; click focuses the player)*.
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
│ ───────────────         │ [24] Run…              │
│ All Programs ▸          │                        │
├──────────────────────────────────────────┤
│                        [Log Off] [Turn Off]│ ← footer (blue gradient)
└──────────────────────────────────────────┘
```

**Left column (white):**
- Pinned apps: **About Douglas**, **My Projects**, **How I Work With AI**, **Contact** (32px icons, bold name + optional one-line description in muted text).
- Separator, then **All Programs ▸** opening a cascading submenu with every launcher (all apps, resume.pdf, then — after a separator — the external shortcuts *(stage 3, done)*; Messenger *(5b — done, after How I Work With AI)*; folders **Accessories ▸** — Retro Cam *(9 — done)*, DouglasOS Paint and "DON'T OPEN THIS.exe" *(10 — done)* —, **Entertainment ▸** — Media Player *(8 — done)* — and **Games ▸** — Mines, Solitaire, FreeCell, Hearts, Spider Solitaire, Pinball *(12)*).
- **Folders** *(stages 8–10 — done)*: a launcher (window app or windowless action) joins a folder with `folder: "accessories" | "entertainment" | "games"` in the registry — the single folder API; `PROGRAM_FOLDERS` sets the order, `folderOf()` / `programsInFolder()` read it, and empty folders aren't shown. Desktop: folders are cascading submenus at the top of All Programs (classic layout), then the programs, then — after a separator — the external shortcuts. Touch: each folder is a labelled inline section (folder icon + name, indented 44px items) at the top of the All Programs list. Folder items carry `data-program="<id>"` like every other entry (the submenu itself is `data-program-folder-menu="<folder>"`); fun apps live only there and never above the CTAs.

**Right column (light blue):**
- **My Projects ▸** *(stage 4 — done)* — a cascading submenu: **All projects** (the Explorer home), separator, then one entry per case study (16px page icon + brand name), each calling `launch("projects", { route })`. The pinned **My Projects** on the left still opens the window in one click. Touch: no submenu (no cascading menus on a phone, and three extra rows would push Résumé (CV) down) — the place opens the Explorer, whose home lists the projects.
- **Résumé (CV)** — downloads the PDF (no window).
- **Contact** — opens Contact.
- separator
- **Display Properties** — opens the `display` app.
- **Help** — opens About Douglas (v1.5 has no separate help app; the assistant covers tips — [§13](#13-mini-douglas-assistant-stage-5)).
- **Achievements** *(stage 11 — done)* — normal weight, with a muted `n/12` counter on the row; opens the Achievements window ([§20](#20-easter-eggs--achievements-stage-11--done)).
- **Run…** — *(stage 7 — done)* opens the Run dialog (last item of the places column, so CV/Contact keep their spots; also on phones). **Items appear only when their stage ships — no dead entries.**

### Run… and the command palette *(stage 7 — done)*
- **One brain:** `lib/run/resolver.ts` (pure, unit-tested) resolves what was typed in this order: fun command (`cmd`, `terminal`… → a light "no terminal in here" info box) → a **launcher** by id, localized title or alias (`contact`/`contato`, `cv`/`resume`/`currículo`/`resume.pdf`, `linkedin`, `zap`, `lixeira`, `wallpaper`…) → a **project** through the Explorer address resolver (`gasolinha`, `gasolinha.exe`, `C:\DouglasOS\Projects\poupensa`) → a confident **intent** from the assistant's matcher (`hire me`, `quero o currículo`; score ≥ 3) → **not found**. Launchers come from the registry, so a later app is runnable by its id and title as soon as it is registered; extra aliases go in `LAUNCHER_ALIASES` (TODO list for stages 8–10 in the file). Actions run through `launch()` (`lib/run/execute.ts`), like every other surface.
- **Run dialog** (`RunDialog`, Radix Dialog in the XP message-box chrome, layer 1400, lazy-loaded on first open): Run icon + intro line, **Open:** field (monospace) as an ARIA **combobox** with a **listbox** of up to 6 suggestions (icon, name, kind). ↑/↓ highlight and put that suggestion's command in the field ("what you see is what runs"); Enter / **OK** runs the field; a click runs a row; Esc closes the list first, then the dialog; **Cancel** closes. Unknown → error box "DouglasOS couldn't find “x”. Check the spelling, or try “projects”, “cv” or “contact”." (EN/PT, original wording), OK returns to the field with the text selected. After opening a window, focus goes to it. Opened from Start → Run…, `Alt+Shift+R`, or `Meta+R` where the browser lets it through (never on Apple platforms: Cmd+R reloads there).
- **Command palette** (`CommandPalette`, `Ctrl+K` / `Cmd+K`, lazy-loaded): same resolver, list always visible (empty query = every launcher then every project, CTA order: About, CV, Contact…), ↑/↓ (wrapping), PageUp/PageDown, Ctrl+Home/End, Enter or click opens, Esc or `Ctrl/Cmd+K` again closes; no match → "DouglasOS couldn't find “x”." + hints in a status line. Fun commands stay in Run. No new dependency (own listbox on Radix Dialog, no cmdk).
- **Mobile:** Run is in the Start panel; the dialog docks 16px below the top so the keyboard never covers the field (16px input text: no iOS zoom), suggestions are 44px rows. The palette has no touch entry point (it's the keyboard path); Run covers phones.

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
  - **Single balloon slot** *(stage 5)*: the welcome balloon, the assistant bubble, (stage 5b) the Messenger toast, (stage 6) the Recycle Bin's rescue balloon and (stage 11) the easter-egg toast — which always lets the others go first — share one first-come-first-served slot, `lib/store/balloonStore.ts` (`request(owner)` / `release(owner)`, head of the line = on screen). Each shows only while it holds the slot; see [Layering](#layering-z-index-policy).
- **Protected-file dialog** (`F2` on a desktop icon): warning message box, original humorous copy (EN: "“{name}” refused to be renamed. It says it took ages to pick that name and recruiters already know it by heart." / PT equivalent), one button ("Fair enough" / "Justo"). Never renames.
- **Tooltips**: yellow rectangles, ~500ms delay, on every icon-only control (Quick Launch, tray, window controls).
- **Menus** (window menus, context menus, submenus): white, blue highlight, keyboard-complete (radix).

---

## 8. Display Properties app

New `display` window app (kind `"window"`), opened from the Start menu and the desktop context menu → Properties (stage 7 — done).

- **Desktop tab:** a small monitor preview + a list of wallpapers: "Green Meadow" (default), "Morning Waves", "Dusk Hills", "Blueprint", the secret "Golden Egg" *(stage 11: "???" until every easter egg is found, [§20](#20-easter-eggs--achievements-stage-11--done))*, "Solid color" (swatches), "DouglasOS 3D (animated)". `Apply` / `OK` / `Cancel` buttons, XP-style.
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
External shortcuts (3, done — not windows, see [Desktop → External shortcuts](#external-shortcuts-stage-3--done)), DouglasOS Explorer (4, done), mini Douglas assistant (5, done — a desktop companion, not a window, see [§13](#13-mini-douglas-assistant-stage-5)), DouglasOS Messenger (5b, done — see [§14](#14-douglasos-messenger-stage-5b)), Recycle Bin (6, done — an always-empty window, see [Recycle Bin](#recycle-bin-stage-6--done)), Run + command palette (7, done — a dialog and a palette, not windows, see [§5](#run-and-the-command-palette-stage-7--done)), DouglasOS Media Player (8, done — see [§15](#15-douglasos-media-player-stage-8)), Retro Cam (9, done — see [§16](#16-retro-cam-stage-9)), DouglasOS Paint + "DON'T OPEN THIS.exe" (10, done — see [§17](#17-douglasos-paint-stage-10--done) and [§18](#18-dont-open-thisexe-stage-10--done); the real 404 page is [§19](#19-404-page-stage-10--done)), Achievements (11, done — a property sheet opened from the Start menu's places column, see [§20](#20-easter-eggs--achievements-stage-11--done)). Each stage must update this section.

---

## 11. Mobile (touchable XP)

> Replaced the v1 "linear mobile fallback". Applies below 768px (Tailwind `md`; `useIsMobile()` / `DESKTOP_QUERY` in `hooks/useIsMobile.ts`). **Implemented in stage 2.**

One shell for every width: `ShellGate` always mounts `DesktopShell`, and components adapt through `useIsMobile()` plus `max-md:` classes. The size tokens themselves switch to their mobile values under `@media (width < 48rem)` in `globals.css` (taskbar 48px + bottom safe-area inset, title bar 36px, control buttons 32px, task buttons 40px, desktop cell 96 × 104 with an 88px label), so `h-taskbar`, `bottom-taskbar`, `h-titlebar`… just work on phones. The Zustand stores are shared and unchanged: the touch shell is a different **presentation** of the same state.

- **Layout:** full-screen desktop (`100dvh`, `viewport-fit=cover`, safe-area padding on the desktop, windows and session screens), taskbar at the bottom, no horizontal scroll (e2e-checked). `touch-manipulation` on the shell removes the double-tap-zoom delay.
- **Icon grid:** like a phone home screen — larger cells, filled **row-first** and centered (`mobileIconLayout` in `lib/store/desktopGrid.ts`, unit-tested for no overlap at 320–767px), so About, **resume.pdf** and Contact share the first row. The layout is derived from the container width (ResizeObserver) and **never persisted**, so it can't disturb the desktop arrangement in `desktopStore`. If a short screen can't fit every row, the desktop scrolls vertically instead of stacking icons.
- **Taskbar:** Start as **logo only** (~46px; the "Start"/"Iniciar" label is hidden on phones and kept as the button's accessible name — with the label, iOS's Verdana fallback and the longer PT word left no room for a window button), **Quick Launch kept** (CV + Contact as 44px targets — the golden-rule shortcut stays), window buttons icon-only at 44px in a list that scrolls sideways inside the taskbar when crowded, and the tray with the clock plus a **single language button** showing the current locale ("EN"), which switches to the other one (two buttons didn't leave room for window buttons on a 360px phone). The phone tray is packed tight (no gaps between its 44px buttons, no AM/PM on the clock — the label and tooltip keep the full time), so with the Media Player's tray button added a 390px phone still shows one full window button. Everything on the taskbar is ≥ 44 × 44px (e2e-checked).
- **Start menu:** a full-width panel up to 85% of the viewport height; header and footer stay fixed while the body scrolls. Sections stack in spec order: pinned apps, places (My Projects, **Résumé (CV)**, Contact, Display Properties, Help), then **All Programs as an inline list** (no cascading submenu on a phone). Items are 44px tall. CV = 2 taps from the desktop (Start → Résumé (CV)).
- **Windows:** always full-screen (the work area above the taskbar), no drag/resize, no double-tap maximize. Compact 36px title bar: icon, title, **Minimize + Close** (32px glyphs, 44px hit areas). Only the focused window is visible; the others stay mounted but `inert` + `aria-hidden` until picked on the taskbar. Closing shows the next open window, else the desktop. The stored window rects are untouched, so rotating to a wide screen brings the desktop geometry back. In-app "Back" lives in the Explorer toolbar (stage 4; see [§10](#my-projects-projects) → Mobile).
- **Gestures:** single tap opens an icon. **Long-press** (~700ms) opens the icon's context menu — **Open** / **Delete** (stage 6, the Recycle Bin rescue joke) / **Rename** (the `F2` "protected file" box, so phones reach that easter egg too) / **Properties** (stage 7); on empty desktop it opens the desktop menu (Refresh, New ▸, Properties; no Arrange Icons on phones). Start → **Run…** works on phones too (dialog docked at the top). Icons suppress text selection and the iOS callout so the gesture is free. **No icon drag on touch** (decision: dragging would compete with scrolling and taps, and a phone home-screen layout doesn't need it). No hover-only affordance: every icon-only control has an accessible name, and tooltips are extras.
- **Boot/logon:** boot ~1s (`BOOT_MOBILE_MS`; reduced motion stays at 0.6s), Skip is a 44px button; the logon stacks (brand above the user tile, thinner bands) and its hint says "Tap Douglas to come in." Same once-per-session rule.
- **Welcome balloon:** same once-per-session balloon with "tap" copy; on every width it now dismisses itself as soon as the Start menu or a window opens, so it never covers the menu or a window's buttons.
- **3D wallpaper:** **not offered on mobile** (Display Properties shows it disabled with the reason). Stage 2 decision: no exception. The static wallpaper already scores 98–99 on Lighthouse mobile; the R3F chunk plus a WebGL context on mid-range phones isn't worth the battery and LCP risk for an ambient effect.
- **Content, SEO and screen readers:** the page also server-renders `StaticContent` (`components/os/StaticContent.tsx`), a server component with no client JS: every app's EN/PT content as real text with an `h1` (name + headline) → `h2` per app → `h3` outline, CV link and contact links. It's visually hidden but stays in the DOM for crawlers and for screen-reader users who want a linear read, and a `<noscript>` style makes it the visible page when JavaScript is off. Inside windows the title bar is the `h2` and in-app headings are `h3`.
- **Performance:** the server-rendered placeholder paints the default wallpaper over the same box as the shell's wallpaper, and the page preloads that SVG, so the LCP is the first paint instead of a post-hydration background. Lighthouse mobile (production build, simulated throttling): performance 98–99, LCP 1.8–2.3s, CLS 0.
- **Stage 10:** Paint opens full-screen with touch-sized tool rows and a sideways-scrolling palette, and draws with touch (one finger). The "DON'T OPEN THIS.exe" eggs and the 404 page work as on the desktop (full-screen blue screen with 44px recovery buttons; the runaway balloon is a bottom sheet). See [§10](#douglasos-paint-paint-stage-10--done).
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
| Close focused window | `Alt+F4` (best effort); closes at once, except Paint with an unsaved drawing asks first (also on the title-bar X) | `Esc` when no menu/dialog/balloon is open and focus is not in a text field — always asks "Close <app>?" (Yes / No; No, Esc or a click outside cancel) so a stray key never loses work | 1 |
| Maximize/restore focused window | double-click title | `Alt+Shift+↑` / `Alt+Shift+↓` | 1 |
| Desktop: move selection | `←↑→↓`, Home/End | — | 1 |
| Desktop: open selected | `Enter` | — | 1 |
| Desktop: `F2` on selected icon | `F2` → "protected file" dialog (no rename) | — | 1 |
| Close menu/dialog/balloon | `Esc` (topmost transient first) | — | 1 |
| Context menu (focused icon, or the desktop when nothing has focus) | `Shift+F10` / `ContextMenu` key | right-click / long-press | 7 — done |
| Desktop: select all / select / toggle / clear | `Ctrl+A`, `Space`, `Ctrl+Space`, `Esc` (focus on an icon; `Cmd` works for `Ctrl` on macOS) | — | 6 — done |
| Desktop: move focus without selecting | `Ctrl+←↑→↓` | — | 6 — done |
| Desktop: delete (Recycle Bin rescue joke) | `Delete` | `Backspace` (Mac keyboards) | 6 — done |
| Run… | `Meta+R` (best effort; never on macOS/iOS, where Cmd+R reloads) | `Alt+Shift+R`; Start → Run… | 7 — done |
| Command palette | `Ctrl+K` / `Cmd+K` (not while typing in a field; inside the palette it closes it) | — | 7 — done |
| Run / palette: move, run, close | `↑`/`↓`, `Enter`, `Esc` (Run: Esc closes the suggestions first) | — | 7 — done |
| Messenger: send / new line | `Enter` / `Shift+Enter` | — | 5b |
| Messenger: close form / window | `Esc` (form first; from the composer it closes the window) | — | 5b |
| Paint: undo / redo / save as PNG | `Ctrl+Z` / `Ctrl+Y` or `Ctrl+Shift+Z` / `Ctrl+S` (`Cmd` on macOS; focus inside Paint) | Edit and File menus, Undo/Redo buttons | 10 — done |
| Paint: cancel the stroke in progress | `Esc` (only mid-stroke; otherwise it closes the window as usual) | — | 10 — done |
| "DON'T OPEN THIS.exe": leave the egg | `Esc` (never reaches the window manager) | click anywhere | 10 — done |

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
| Cursor gaze | `lib/assistant/gaze.ts` + `hooks/useCursorGaze.ts` | Pure gaze/tilt/expression math (`GAZE_TUNING`, `pickExpression`, `shouldStartle`) + the hook (one passive `pointermove` listener, rAF-coalesced, Framer Motion springs, only the expression is React state) |
| Asset contract | `lib/assistant/media.ts` + `instructions/full-refactor/ASSISTANT-ASSETS.md` | `idle/talk/dance` clips (VP9-alpha WebM + HEVC-alpha .mov for Safari/iOS) + `poster.png`; `ASSISTANT_MEDIA.ready` switches from the placeholder |
| UI | `components/os/assistant/` | `LazyAssistant` (dynamic import, mounted after the desktop is idle), `Assistant` (layer, triggers, Esc, slot), `AssistantBubble`, `AssistantCharacter` (one interface: `PlaceholderCharacter` SVG now, `VideoCharacter` once the clips exist) |
| Triggers | `hooks/useAssistantTriggers.ts` | See below |

### Public API for later stages
- `say(message)` — queue a line. (Stage 6 uses `replace()` for the rescue lines — a direct reaction takes the bubble — and `say()` for the bin window's comment; see [Recycle Bin](#recycle-bin-stage-6--done).) Dropped after "Not now" and when a line with the same `id` is already queued. Lines said during a dance wait until it ends.
- `dance(options?)` / `stopDance(options?)` — stage 8 calls `dance()` (no duration) when music starts and `stopDance()` when it stops; `stopDance` says the "Phew!" line unless `{ quiet: true }`. A click uses `dance({ durationMs: 3500 })`.
- Also: `show()`, `replace(message)`, `closeMessage()`, `nextTip()`, `dismiss()`, `trigger(id, message?)` (once per session), `markFired(id)`.
- Intents: `matchIntent(text)` → `IntentMatch { intent, score, projectSlug? }` or `IntentFallback { intent: "fallback", score: 0, suggestions }`; `rankIntents`, `normalizeText`, `tokenize`, `findProjectSlug`, `isFallback`, `INTENT_IDS`, `FALLBACK_SUGGESTIONS`. Intents: `cv`, `contact` (incl. hire/contratar), `projects` (+ slug from slug/brand/alias), `skills`/stack, `availability` (remote/location), `ai-workflow`, `experience`, `about`. EN + PT keywords, accent/case/punctuation-insensitive, stems by prefix (`contrat*`), phrases ("entrar em contato"); ties go to CV, then Contact.

### Placement & look
- **Desktop:** the character (96 × 112) stands on the taskbar in the bottom-right corner, toward the tray, clear of the default icon columns and of the Recycle Bin's top-right default (stage 6b; until then he stood one column further left, keeping the bottom-right cell free for the bin). The bubble (300px wide, up to 320px tall, scrolls beyond) sits above him, right-aligned to the screen edge, tail pointing at him. XP balloon look: `info` background, 1px `info-border`, `radius-balloon`, `shadow-balloon`, bold title + 16px info icon + close ×, shortcuts as blue-bullet link options, then "Ask me something:" field + **Search** push button.
- **Phones (< 768px):** smaller character (60 × 70) above the taskbar at the right, hidden while a (full-screen) window is up; the bubble is a **bottom sheet** (full width, above the taskbar, ≤ 60dvh, 44px shortcuts in two columns, 16px input so iOS doesn't zoom).
- Character art: until Douglas records the clips, an **original** SVG figure (round head, dark hair, blue DouglasOS hoodie with the tile on the chest, sneakers) — not modeled on any classic OS assistant. Illustration-local colors live in the component, like `ICON_COLORS`.

### Behavior
- **Cursor gaze (desktop mouse only):** his eyes follow the cursor and his head tilts a little toward it (springs, no re-render per move); the cursor leaving the page sends his look back to center. He also makes a face about it, in this priority: **happy** (`^ ^` eyes, open smile, rosier cheeks) while the cursor is over him → **surprised** (big eyes, raised brows, "o" mouth) for ~1s when it zips past within ~320px (≥ 2.5 px/ms, 4s cooldown) → **sleepy** (half-closed lids, a floating "z") after 15s with no mouse/keyboard input — before the 30s "Still around?" trigger — waking on the next input → **curious** (raised brows, bigger eyes) when it's within ~200px → neutral. While talking he only goes happy/surprised; while dancing it's off. Off on phones (touch/pen input is ignored), under reduced motion, and with the recorded clips (placeholder-only). Purely decorative: no new clicks, no layout change. `data-expression` on the character wrapper exposes the current face.
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
- **Contact list:** brand band (icon + name, "You · Visitor (online)", plus a "♫ Listening to: <track>" line while DouglasOS Media Player is playing — the classic messenger now-playing status; click shows the player, hidden when paused/stopped/closed), group "Online (1)", one row: Douglas's picture with an online dot, "(Online)" in text (never color alone), personal message, unread count. **Single click / tap / Enter** opens the conversation (deliberate deviation from the brief's double-click, consistent with Douglas's single-click decision for every icon). One window, two views — no multi-instance.
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

## 15. DouglasOS Media Player *(stage 8)*

**Purpose:** music while the visitor looks around, and mini Douglas dances to it. Original name, icon and skin ("DouglasOS Media Player": glossy blue screen + green play triangle icon, navy "now playing" display) — never another media player's name, logo, icons or sounds. Fun only: it lives in Start → All Programs → **Entertainment** plus a desktop shortcut in the fun-apps group (its own column after the links on desktop, its own row on phones; no pin, never above the CTAs) and plays only when the visitor presses Play.

### Source (decision)
A public, embeddable **YouTube playlist** through the official IFrame Player API. The id is one constant, `YOUTUBE_PLAYLIST_ID` in `lib/media/source.ts` (currently `PLdw3FCGShY-U`, a **third-party playlist** that its owner may change, reorder or delete at any time — swap the constant to change the music). Implemented behind a source adapter (`MediaSourceAdapter` in `lib/media/types.ts`: play / pause / stop / next / prev / setVolume / mute / getTrackTitle / onEvent / destroy), so a radio stream or local files can be added later as another adapter; only `lib/media/youtube.ts` ships.
- **Privacy & loading:** embed host `https://www.youtube-nocookie.com`; the API script (`https://www.youtube.com/iframe_api`) is injected **only when the player window mounts**, never on page load. The window is not restored after a reload (`persistWindow: false` in the registry → dropped by `reconcilePersisted`), so a reload never loads YouTube on its own. The playlist is cued, not autoplayed. No CSP is configured in `next.config.ts`; if one is added it must allow `script-src https://www.youtube.com` and `frame-src https://www.youtube-nocookie.com`.
- **YouTube's terms:** the player stays **visible**, at least 200 × 200 px (the window's "screen", `aspect-video`, `min-h/min-w 200px`), never hidden for audio-only and never covered by our skin. Hence **minimizing pauses** (and, on phones, switching to another full-screen window pauses): a hidden player may not keep playing. The status bar says why ("Paused: the video has to stay on screen to play."). Restoring does not auto-resume — Play is always the visitor's. The title shown is the one YouTube provides for the current video.
- **Unplayable videos:** errors 101/150 (embedding disabled), 100 (removed/private) and 5 are skipped automatically to the next track (wrapping), with a short status line; when every track failed in a row (or error 2), an XP error message box offers **Open on YouTube** (`lib/openLink.ts`, new tab, `noopener noreferrer`) or OK. Same dialog if the API script can't load (network/15s timeout).

### Window
- Registry: `media-player` (stable id), kind `window`, `surface: "bare"`, 520 × 510, `onDesktop: false`, `folder: "entertainment"`, `persistWindow: false`.
- Top → bottom: **now playing** display (label, title from YouTube with ellipsis + tooltip, status line as `role="status"` `aria-live="polite"`, "Track n of N"); the **screen** (YouTube iframe, labelled region); the **visualizer**; **transport** (Previous, Play/Pause, Stop, Next as round XP push buttons with accessible names + tooltips) and **volume** (mute toggle + slider); **status bar** ("Source: YouTube playlist" or the latest notice, plus an "Open on YouTube" link — attribution and an escape hatch).
- **Visualizer:** a decorative, deterministic canvas (`lib/media/visualizer.ts`: bar levels are a pure function of time — the audio is in YouTube's cross-origin iframe, so there's no AnalyserNode). Token colors (`progress` → `hot`), ~30fps via throttled `requestAnimationFrame`, runs only while playing and visible (stops when paused/minimized; skips frames while the tab is hidden). Reduced motion: one static frame.
- **Media Session API:** metadata (title, "YouTube", the app name) and play/pause/stop/next/previous handlers where supported. Limitation: the audio belongs to the iframe, so browsers may show YouTube's own session instead of ours.
- Close = stop: the adapter is destroyed and the store goes back to `idle`.

### State
`lib/store/playbackStore.ts` (Zustand): `status` (`idle` | `loading` | `ready` | `buffering` | `playing` | `paused` | `ended` | `error`), `title`, `position`, `notice` (`skipped` | `hiddenPause`), `failure` (`unplayable` | `loadFailed`), `volume` (0–100, default 60) and `muted`. Only volume + mute persist (`douglasos:media`, localStorage, sanitized on load). Inside a playlist YouTube reports `ended`/`unstarted` between tracks; while the visitor wants music those map to `buffering` (`mapPlayerState`), so only the last track's end is `ended`.

### mini Douglas dances
`lib/media/danceSync.ts` (installed once by the player): `playing` → `assistant.dance()` (no duration: until stopped); buffering keeps the dance; paused / stopped / ended / error / window closed → `stopDance()`, which says the "Phew!… Back to work: want to see a project?" line whose first shortcut is **Show me a project** (`openProject` → `FEATURED_PROJECT_SLUG`). Everything goes through the assistant's own store, so "Not now" (dismissed) means no dance and no line, and the line waits for the single balloon slot like any other. Reduced motion: no dance moves — the static music note marks `dancing`.

### Tray
While the player window is open: a **volume** icon (panel with slider + Mute, the same persisted values as the window). While music plays: a **now-playing** note (tooltip/name "Now playing: {title}…"); click restores/focuses the player. Phones: a single 44px button (the note while playing, the speaker otherwise) whose panel also has **Show player**, so the tray doesn't grow by two targets on a 360px screen.

### Mobile
Full-screen window like every app; the screen keeps 16:9 above 200px tall; 44px controls; play by tap. Switching to another window (only one is visible on phones) pauses, for the same visibility reason. **Background playback stops when the screen locks or the browser goes to the background** — a YouTube embed limitation, not worked around.

### Tests
Unit: adapter state mapping, skip-on-error / give-up, loader (script once, retry, timeout), adapter commands against a fake `YT` (`test/fakeYouTube.ts`), playback store, assistant integration (`danceSync`), visualizer, registry + `reconcilePersisted`. E2E (`e2e/media-player*.spec.ts`): a fake IFrame API is served for `https://www.youtube.com/iframe_api` and every other YouTube host is blocked (`e2e/fakeYouTube.ts`) — no network. Flows: no YouTube request before opening → play → tray note + dance → next → stop → "Phew!" with "Show me a project"; tray note focuses; minimize pauses; volume/mute persist; all videos unplayable → dialog → playlist popup; phone: All Programs → Entertainment → play by tap.

---

## 16. Retro Cam *(stage 9)*

**Purpose:** a fun, original "pixelated webcam" toy. Brand: "Retro Cam" with its own glossy desk-webcam icon (`components/icons/CameraIcons.tsx`) — never a real product's name or icon.

### Pieces
| Piece | Where | Notes |
|-------|-------|-------|
| Palettes | `lib/camera/palettes.ts` | `PaletteId` = `douglasos` \| `classic16` \| `cga` \| `original`. **DouglasOS** = 16 Luna color tokens (`DOUGLASOS_PALETTE_TOKENS`, keyed by token name; a unit test parses `app/globals.css` and fails if a hex drifts — `globals.css` stays the single source). **16 colors** = the generic 16-color text-mode/VGA set. **CGA style** = black, cyan, magenta, white. **Original** = no quantization |
| Pipeline | `lib/camera/pixelate.ts` | Pure, on RGBA buffers: `captureSize` → `downscale` (box average per block, optional mirror) → `quantize` (nearest palette color, weighted RGB distance, 15-bit lookup table memoized per palette) → `upscale` (nearest neighbor, for the saved PNG; on screen the browser enlarges with `image-rendering: pixelated`). Plus `addFrame`, `photoFilename`, `createFrameGate` (24 FPS cap), `createFpsMeter` |
| Media | `lib/camera/media.ts` | `CameraStatus`, `cameraConstraints(mobile)`, `cameraErrorStatus(error)`, `hasCameraApi()`, `stopStream()` |
| Lifecycle | `hooks/useCamera.ts` | Explicit `start()` / `stop()`; stops on unmount, window minimize/hidden, tab hidden, `pagehide`, track `ended`; discards a stream that arrives after a stop |
| UI | `components/apps/CameraApp.tsx` | Registry `camera`, kind `window`, `surface: "bare"`, ~560×520, `onDesktop: false`, `folder: "accessories"` |

### Window
- **Toolbar:** **Turn on / Turn off** (toggle, `aria-pressed`), **Pixels:** Fine / Medium / Large (2 / 3 / 6 capture px per block → 160 / ~107 / ~53 blocks across on desktop; limited palettes use 4×4 ordered dithering so faces stay readable), **Palette:** DouglasOS (default) / 16 colors / CGA style / Original (native `<select>`s with the XP field look — the platform picker is the accessible, touch-friendly choice), **Mirror** (toggle, on by default), **Frame** (checkbox, on by default), **Save photo** (disabled while the camera is off).
- **Viewfinder:** dark `viewfinder` surface; only the pixelated canvas is shown (`role="img"`, labelled), never the raw video (a hidden, muted `playsInline` `<video>` feeds it).
- **States** (`data-camera-status`): **idle** — beige card: "The camera is off" + the privacy promise + **Turn on camera** (default button); after an automatic stop it also says why ("…when the window was minimized" / "…when you left the tab" / "The camera was disconnected"). **requesting** — "Waiting for permission…". **active** — the live picture. **denied** — XP warning message box ("Camera blocked", how to allow it in the browser) with **Try again** and **OK** (default; `Esc` = OK); after OK the card keeps the explanation and a Try again. **unsupported** — XP error message box with the reason: no API / insecure context (no retry), no camera found, camera busy in another app (both with Try again).
- **Status bar:** "Camera on/off" pane + "local processing · {n} FPS · no upload" (FPS only while on; measured over the last second of rendered frames, refreshed twice a second).
- **Save photo:** the last rendered frame, enlarged to ~640px wide with hard pixel edges, optionally framed (Luna title-bar blue band + button-face mat), downloaded as `douglasos-cam-YYYYMMDD-HHMMSS.png` through a local `blob:` URL; a polite live region announces "Photo saved as …".
- **Performance:** frames are captured at 320px wide (240px on phones), so the pipeline costs ~0.3 ms per frame (measured in Node on the pure functions); the loop is capped at **24 FPS** (measured 24 FPS steady with Chromium's fake camera at 1440×900 and with a stubbed stream on iPhone 13/WebKit). No worker or OffscreenCanvas — the measurement didn't call for one.

### Privacy (hard rules)
- The camera is requested **only from an explicit click** (Turn on / Turn on camera / Try again). Opening the window never asks; it never restarts by itself (restoring a minimized window leaves it off).
- **Video only** (`audio: false`), front camera (`facingMode: "user"`), small resolution (640×480 ideal; 320×240 on phones).
- **Every track is stopped** (`track.stop()`, the camera light goes off) when the visitor turns it off, **closes** the window (unmount), **minimizes** it, on a phone when **another window comes to the front**, when the **tab is hidden** (`visibilitychange`) or the page is left (`pagehide`), and when the device ends the track. A permission answer that arrives after any of these is stopped immediately.
- **Frames never leave the page.** They live in memory only (the last frame, for Save photo, is dropped when the camera stops); nothing is uploaded, stored, logged or sent to analytics. The saved PNG is built on the device and downloaded through a `blob:` URL that is revoked right after.

### Placement & mobile
- **Start → All Programs → Accessories ▸ Retro Cam**, plus a desktop shortcut in the fun-apps group (after the links; never pinned, never above the CTAs). On phones All Programs is inline, so Accessories is a labelled sub-list with Retro Cam indented under it.
- **Mobile:** full-screen window like every app; the toolbar wraps to two rows of 44px targets (16px text in the selects, so iOS doesn't zoom); the capture is smaller (240px wide, 320×240 requested) for battery/performance. Since only the focused window is visible on a phone, bringing any other window up (Quick Launch → Contact, the taskbar…) turns the camera off — CV and Contact stay one tap away on the taskbar.
- **Reduced motion:** nothing animates besides the live picture the visitor chose to start; no transitions.

### Persistence
None. Settings (pixel size, palette, mirror, frame) reset with the window; no frame, photo or permission state is stored by the page.

---

## 17. DouglasOS Paint *(stage 10 — done)*

Launcher `paint`.

**Window:** 760×560, `surface: "bare"` (draws its own bars) · Start → All Programs ▸ Accessories, Run / the palette (§5) and a desktop shortcut in the fun-apps group (after the links); never pinned. Own launcher icon (wooden palette + brush), never the classic program's.
- **Layout (classic):** menu bar **File** (New, Save as PNG, Close) and **Edit** (Undo, Redo) — real items only; a tool column (pencil, brush, eraser, fill, line, rectangle as `aria-pressed` toggle buttons, lucide glyphs inside the window), a sunken line-width box (1/3/5/9px; disabled for pencil and fill) and Undo/Redo buttons; a gray workspace with the white canvas; the **28-color palette** (2 × 14) with the current color on the left; a status bar with the tool's hint and the canvas size.
- **Drawing:** a bitmap canvas plus a transparent overlay for line/rectangle previews and input. **Pointer Events** for mouse, pen and touch (`touch-action: none` on the canvas only; one pointer at a time, a second finger is ignored; right-click ignored). Pencil = crisp 1px Bresenham pixels; brush = round stroke; eraser = wider square stroke in white; fill = scanline flood fill with a small tolerance (swallows anti-aliased edges). A single tap/click stamps a dot (WebKit draws nothing for zero-length strokes).
- **Canvas size:** fitted once to the window (160×120 – 1024×768) like the classic program; resizing the window doesn't stretch it (the workspace scrolls). **New** re-fits it.
- **History:** every finished edit (stroke, shape, fill, New) pushes an `ImageData` snapshot to a bounded history (20 steps, `lib/paint/history.ts`); New is undoable, so it never asks for confirmation. Undo/Redo by button hand focus to the partner button when they disable themselves.
- **Keys:** `Ctrl/Cmd+Z` undo, `Ctrl+Y` / `Ctrl+Shift+Z` redo, `Ctrl+S` save (focus inside Paint); `Esc` mid-stroke cancels the stroke without closing the window (it reaches the window manager only when no stroke is in progress).
- **Save as PNG:** `canvas.toBlob` → local download `douglasos-paint-<yyyymmdd-hhmmss>.png`. Nothing is uploaded or persisted; closing the window discards the drawing.
- **Pure logic (tested):** `lib/paint/history.ts`, `lib/paint/floodFill.ts`, `lib/paint/tools.ts` (tools, sizes, palette, coordinate mapping, line rasterizer, file name).
- **Mobile:** full-screen window; the tools + Undo/Redo become a row above the canvas and the widths a second row (every target 44px); the palette keeps 2 rows of 44px swatches and scrolls sideways; the canvas fits the screen.

---

## 18. "DON'T OPEN THIS.exe" *(stage 10 — done)*

Launcher `dont-open-this`.

A windowless launcher (`kind: "action"` in the registry) in All Programs ▸ Accessories, played by `useDontOpenThisStore` (`lib/store/dontOpenThisStore.ts`); PT label "NÃO ABRA ISSO.exe"; own icon (program file sealed with caution tape). Each open plays the **next of three eggs** (A → B → C → A…, count in sessionStorage `douglasos-dont-open-this`, `lib/easterEgg.ts`). Shared rules (`EasterEggPlayer`): the animated part of each lasts < 5s, no flashes (fades only), **Esc or a click anywhere outside the egg's own buttons leaves at once** (Esc is caught before the window manager, so it never closes a window), focus returns where it was, every egg offers **CV and Contact**, and after a plain dismissal mini Douglas comments through `say()` (a no-op after "Not now" — the egg never brings him back; no comment when the visitor picked CV/Contact). The eggs' code is lazy-loaded on first open. Purely visual: nothing is persisted.
- **A — "404" blue screen** (`not-found`): full-screen DouglasOS blue screen in the modal layer (z-1400), Luna title-bar blue `--color-titlebar` (never the original crash screen's blue, text, frowning face or QR code). DouglasOS logo, "DouglasOS couldn't find the page you were looking for.", "Error 404: PAGE_NOT_FOUND", an egg-specific "probable cause", a "searching every folder" bar that fills to 100% (0.6–3s), then recovery options **Download CV / Talk to Douglas / Back to desktop** (focus moves to Download CV). Reduced motion: the finished screen at once. Built as the reusable `BlueScreen` component, also the site's real 404 (below).
- **B — runaway desktop** (`scramble`): every desktop icon scatters to a random on-screen spot with a small tilt (1.2s), holds, flies back (1.5s), then the CV icon pulses once and a balloon beside it says "Everything's back in place — well, almost: your CV is still waiting" with **Download CV / Contact / Close** (shared balloon slot, owner `dontOpenThis` — a regular owner, unlike stage 11's yielding `easterEgg` toast; closes itself after 8s). It animates the icons' own elements with transforms and resets them; `desktopStore` is never touched. Reduced motion: the icons dim for 0.6s, the balloon shows at once. Phones: the balloon is a bottom sheet.
- **C — access denied** (`access-denied`): an XP warning box "Access denied — This file is confidential. Yes, even for curious recruiters."; at 0.5s mini Douglas's sticky note ("NO! — mini Douglas") slaps onto its corner; at 1.5s his scolding line appears with **Talk to me / My CV / OK**. The line lives in the box itself, so it works whether or not he's on the desktop (the fallback the trash notice needed is built in). Reduced motion: the finished box, note already stuck.

---

## 19. 404 page *(stage 10 — done)*

Unknown URLs render the same `BlueScreen` (variant `page`) through `app/[locale]/not-found.tsx`; `app/[locale]/[...rest]/page.tsx` throws `notFound()` for any unknown path under a locale (unprefixed paths are sent to `/en/...` by the proxy), so `/en/whatever` and `/pt/qualquer` get the localized screen, `<html lang>` and HTTP **404** (Next adds `noindex`). There's no shell on this page, so the recovery options are plain links: **Download CV** = `public/resume.pdf` download, **Talk to Douglas** = `/{locale}#open=contact` (the shell's `useOpenFromHash` opens the Contact window once it mounts — after boot/logon in a fresh session — then drops the hash; `lib/apps/deepLink.ts` only accepts window app ids), **Back to desktop** = `/{locale}`. Everything is server-rendered and visible at once (works without JS); only the progress bar animates.

---

## 20. Easter eggs & Achievements *(stage 11 — done)*

A discreet discovery counter for the jokes hidden across the shell: a tray toast per first discovery, an **Achievements** window with the progress, and a reward when all of them are found. It never covers, delays or gates the CV or Contact.

### Pieces

| Piece | Where | Notes |
|-------|-------|-------|
| Registry | `lib/easter-eggs/registry.ts` | `EASTER_EGGS` (id + providing stage), `EasterEggId`, `EASTER_EGG_TOTAL` (12), `isEasterEggId`, `easterEggTitleKey` / `easterEggHintKey`. **Ids are a contract** (other stages call them; `localStorage` keeps them): never rename or reuse one |
| Progress logic | `lib/easter-eggs/progress.ts` | Pure: `discoverEgg` (idempotent; queues the toast, plus `"complete"` after the last egg), `discoveryOrdinal` (the toast's "n/12" = count when *that* egg was found), `sanitizeProgress` (drops unknown ids, bad timestamps, orphan pending entries) |
| Store | `lib/store/easterEggStore.ts` | `found: Record<id, timestamp>`, `pending` (announcements still to show), `discover(id)` → `true` only the first time, `acknowledge(expected?)`, `reset()`; selectors `selectFoundCount` / `selectComplete`, hook `useEasterEggProgress()` → `{ count, total, complete }`. Persisted in **localStorage** `douglasos:easter-eggs` (version 1; `migrate` + `merge` both go through `sanitizeProgress`) |
| Reward | `lib/easter-eggs/reward.ts` | `completionMessage()` (mini Douglas line `eggsComplete`: Download CV, Display Properties, Contact) and `deliverCompletionReward()` |
| Toast | `components/os/taskbar/EasterEggToast.tsx` | Mounted last in `DesktopShell` |
| Window | `components/apps/AchievementsApp.tsx` | Registry app `achievements` (`surface: "dialog"`, no desktop icon, not in All Programs) |
| Secret wallpaper | `public/wallpapers/golden-egg.svg`, `lib/wallpapers.ts` (`SECRET_WALLPAPER`, `effectiveWallpaper(choice, blocker, secretUnlocked)`) | Original art: a glossy golden egg with a DouglasOS "D" band on a deep-blue sunburst |
| Copy | `easterEggs.*`, `apps.achievements.*`, `apps.display.secret.*`, `assistant.messages.eggsComplete` in `messages/{en,pt}.json` | Original copy |

### The eggs

| Id | How it's found | Stage | Hook |
|----|----------------|-------|------|
| `protected-file` | `F2` on a desktop icon, or its menu → **Rename** (right-click / long-press) | 1 | `Desktop.tsx` (`showProtected`, from `onIconKeyDown` and the Rename item) — **wired** |
| `assistant-dance` | Click mini Douglas (under reduced motion the click still counts, so every visitor can reach 12/12) | 5 | `Assistant.tsx` (`onCharacterClick`) — **wired** |
| `messenger-nudge` | "Nudge" in the Messenger (only a nudge that went out, not one refused by the cooldown) | 5b | `Conversation.tsx` (`nudge`) — **wired** |
| `trash-rescue` | Throw one icon in the Recycle Bin (drag, `Delete`, context menu, long-press) | 6 | `desktopStore.trashIcons` — **wired** |
| `trash-cleanup` | Throw several icons at once | 6 | `desktopStore.trashIcons` — **wired** |
| `run-cmd` | Type `cmd` in Run… | 7 | `RunDialog` (the `cmd` joke box) — **wired** |
| `desktop-new` | Desktop context menu → New ▸ joke | 7 | `Desktop` background menu → New ▸ item — **wired** |
| `music-dance` | mini Douglas dancing to the media player | 8 | `lib/media/danceSync.ts`, next to `dance()` — **wired** |
| `egg-404` | DON'T OPEN THIS.exe → 404 blue screen | 10 | `dontOpenThisStore.play` (`EGG_DISCOVERY`) — **wired** |
| `egg-runaway` | DON'T OPEN THIS.exe → the desktop runs away | 10 | `dontOpenThisStore.play` (`EGG_DISCOVERY`) — **wired** |
| `egg-scold` | DON'T OPEN THIS.exe → mini Douglas scolds | 10 | `dontOpenThisStore.play` (`EGG_DISCOVERY`) — **wired** |
| `real-404` | Visiting the real 404 page | 10 | `RealNotFoundDiscovery` (client effect in `NotFoundPage`) — **wired** |

### Integration — stage 7–10 hooks (wired at integration)

`discover()` is idempotent and safe from anywhere (React or not, with or without the shell). Each hook has exactly one call, at the moment the joke actually plays (all **wired**; `protected-file` is also reachable without a keyboard through the icon menu's **Rename** item — desktop right-click and phone long-press — which shows the same F2 message box, so phone visitors can reach 12/12):

| Stage | Hook (where) | Call |
|-------|--------------|------|
| 7 | Run dialog resolves the input `cmd` (the joke response) | `useEasterEggStore.getState().discover("run-cmd")` |
| 7 | Desktop context menu → New ▸ item selected (the joke shows) | `useEasterEggStore.getState().discover("desktop-new")` |
| 8 | Media player starts playback **and** mini Douglas dances to it (where `useAssistantStore.getState().dance()` is called for the music) | `useEasterEggStore.getState().discover("music-dance")` |
| 10 | "DON'T OPEN THIS.exe" outcome = 404 blue screen shown | `useEasterEggStore.getState().discover("egg-404")` |
| 10 | "DON'T OPEN THIS.exe" outcome = desktop runs away | `useEasterEggStore.getState().discover("egg-runaway")` |
| 10 | "DON'T OPEN THIS.exe" outcome = mini Douglas scolds | `useEasterEggStore.getState().discover("egg-scold")` |
| 10 | The real 404 page (`app/[locale]/not-found.tsx` or equivalent), in a client effect on mount | `useEasterEggStore.getState().discover("real-404")` |

Import: `import { useEasterEggStore } from "@/lib/store/easterEggStore";`. Nothing else is needed: the toast, the counter, the reward and the wallpaper unlock follow from the store. The real 404 page has no shell, so there the discovery is only persisted; its toast is queued in `pending` and shows **the next time the desktop loads** (decision: a persisted "pending toast" queue, shown once, in discovery order).

### Toast

- XP tray balloon (`info` bg, `info-border`, `radius-balloon`, tail toward the tray): bold "🎉 Easter egg found! (4/12)" / "🎉 Easter egg encontrado! (4/12)", the egg's title, and a "See all achievements" link (opens the window). Close ×. Emoji is the only "icon" (original; no system asset).
- **Balloon slot** owner `easterEgg`, which **yields**: any other owner goes ahead of it, even while it's on screen (it hides and comes back with a fresh timer once the slot frees up — `enqueueBalloon`). So the reaction that earned the egg (the rescue line, mini Douglas's bubble, the welcome balloon) always shows first, and two balloons are never on screen together. It also waits while the Start menu or a shell dialog is open (the `F2` message box that earned it) and while mini Douglas dances (otherwise the slot rule would hide him mid-dance).
- `role="status"`, `aria-live="polite"`, never takes focus; closes itself after 8s unless hovered/focused. Several discoveries queue and show one after another, each with its own "n/12".
- **Phones:** bottom sheet above the taskbar (full width, safe-area padding), like the other balloons; 44px targets.

### Achievements window

- Start menu → right column, **below Help**, normal weight, with a muted `4/12` counter on the same row (no extra row, no badge). Phones: same item in the places list (opens full screen). No desktop icon and not in All Programs, to stay discreet; the toast's link also opens it.
- Property-sheet body (`surface: "dialog"`): 32px trophy + "Easter eggs found: 4 of 12" + a segmented progress bar (12 blocks, `progress` token, `role="progressbar"`), then a group box with the list in registry order: found → trophy, bold title, "Found on {date}" (`Intl.DateTimeFormat`, locale-aware); missing → grey "?" icon, "???" and the egg's vague hint. When complete: "All found! The secret wallpaper is unlocked." + a link to Display Properties.
- **Reset progress** (disabled at 0) opens an XP confirm message box ("Reset" / "Cancel", Cancel is the default and Esc). Reset forgets every egg and pending toast and re-locks the secret wallpaper (the desktop falls back to the default if it was in use; the choice itself is kept).

### Reward (all found)

- After the last egg's toast, the reward plays once: if mini Douglas is around, `say(completionMessage())` — a special original line ("Every single easter egg! …") offering **Download CV** first, then Display Properties and Contact; he takes the slot in his own turn. If he was dismissed this session, the **toast itself** shows the same line in an XP balloon (`AssistantBubble`, `data-easter-egg-reward`; bottom sheet on phones) — he never comes back uninvited. The line isn't automatic: it stays until closed.
- **Secret wallpaper "Golden Egg"** (`golden-egg`): listed in Display Properties between Blueprint and Solid color. Locked: shown as "??? (find every easter egg to unlock it)", disabled; `effectiveWallpaper` never paints it while locked. Unlocked: "Golden Egg (secret)", selectable like any static wallpaper (works on phones; it's an SVG).

### Golden rule & a11y

- The toast and reward sit in the balloon layer (1300) like the others and wait behind every other balloon; CV/Contact stay on the taskbar and in Start. The window opens only on request.
- Keyboard-complete (Start item, window buttons, confirm box via Radix); reduced motion: opacity-only, instant. Every egg remains findable under reduced motion.

---

## 21. Games *(stage 12 — done)*

Six classics as original DouglasOS games: generic names (EN Mines, Solitaire, FreeCell, Hearts, Spider Solitaire, Pinball; PT Campo Minado, Paciência, FreeCell, Copas, Paciência Spider, Pinball), original icons, card faces/back and pinball table, **no sound**, no verbatim text from any original game. Fun only: they never cover, delay or gate the CV or Contact.

### Where they live

- **Start → All Programs ▸ Games ▸** — the six games (`folder: "games"`, `onDesktop: false`).
- **Desktop "Games" folder** (`games`, fun-apps icon group, `inAllPrograms: false`): a folder window with a large-icon view of the games. Desktop: click selects, double-click / Enter opens, arrows move the selection, status bar shows "6 objects" or the selected game's description. Touch: one tap opens.
- **Run…** / palette: ids, titles and EN/PT aliases (`lib/run/resolver.ts`).

### Pieces

| Piece | Where | Notes |
|-------|-------|-------|
| Registry | `lib/apps/registry.tsx` | `GAME_IDS`, `GameId`, `isGameId`; each game is a `surface: "bare"` window app |
| Seeded RNG | `lib/games/rng.ts` | `createRng(seed)` (mulberry32), `shuffle`, `randomSeed` — engines take an `Rng`, tests are deterministic |
| Cards | `lib/games/cards.ts` | suits, ranks, colors, `createDeck({ decks, suits })` (Spider's 1/2/4 suits), `shuffledDeck` |
| Card UI | `components/apps/games/shared/PlayingCard.tsx` | `PlayingCard` (face / lattice back, selected outline), `CardSlot`, `useCardLabel` ("Queen of hearts"); size from the `card-w`/`card-h` tokens (touch variants under 768px), overridable per table with `--card-w` / `--card-h` |
| Frame | `components/apps/games/shared/GameShell.tsx` | menu bar from data (`useStandardGameMenu`: New game F2, Undo Ctrl+Z, options, Exit), play area, status cells; `GameOverDialog` (XP message box, Play again / Close) |
| Copy | `messages/games/<id>.{en,pt}.json` → `games.<id>` | merged in `messages/index.ts`; titles stay in `apps.<id>`, shared strings in `apps.games.common` |
| Engines | `lib/games/<id>/` | pure, unit-tested; the UI only renders state and dispatches moves |

### Common rules

- Keyboard-complete (menus, every move reachable without a mouse), visible focus, accessible names for cards and cells, a polite status region for score/time.
- Cards move by **click/tap to select, then click/tap the destination** (works everywhere); drag with Pointer Events where it helps on desktop.
- Reduced motion: deal/win animations become instant; Pinball stays playable (motion is the game, the player starts it).
- Mobile: the window is full-screen; boards fit a portrait phone (cards shrink via the touch tokens), touch targets stay usable, press-and-hold = right-click where a game needs it (Mines flag).
- No persistence beyond the window session unless a game documents it (no storage keys by default).

### The games

- **Mines** — beginner 9×9/10, intermediate 16×16/40, expert 30×16/99; first click is always safe; flag (right-click / long-press), chord on numbers; mine counter, timer, original face button = new game.
- **Solitaire (Klondike)** — draw 1 or 3, unlimited redeals, double-click sends a card to its foundation, undo, standard scoring, auto-complete when all cards are face up.
- **FreeCell** — numbered deals (seeded), four free cells, supermove limit `(freeCells + 1) × 2^emptyColumns`, undo, safe auto-moves to the foundations.
- **Hearts** — you vs three simple AIs; passing left/right/across/hold; 2♣ leads, no points on the first trick, hearts broken; shooting the moon; game ends at 100.
- **Spider Solitaire** — 1, 2 or 4 suits; deal a row (not with an empty column); completed King→Ace runs leave the table; undo; score.
- **Pinball** — an original 2D table on a `<canvas>` (own theme, not any existing table), fixed-timestep physics in a pure engine; launcher, two flippers (Z and / keys, or left/right halves of the table on touch), bumpers and targets, 3 balls, score; pauses when the window is minimized, unfocused or the tab is hidden.

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
| Tray balloons, messenger toast *(5b — done)*, Recycle Bin rescue balloon *(6 — done)*, easter-egg toast *(11 — done)* | 1300 | one at a time, shared slot with the assistant bubble; the easter-egg toast yields to every other owner |
| Modal dialogs (shutdown, Run, errors), "DON'T OPEN THIS.exe" blue screen and access-denied box *(10)* | 1400 | the runaway-desktop balloon *(10)* sits at 1300 in the balloon slot |
| Boot / logon / shutdown screens | 2000 | |

**Stage 5 rules (balloon slot + assistant):**
- The bubble lives in the assistant layer (1050), not at 1300: it sits above the character, away from the taskbar, so it never needs to cover menus. Menus (1200) and dialogs (1400) always win over it.
- **One balloon on screen at a time.** Welcome balloon, assistant bubble and Messenger toast *(5b)* take turns through `balloonStore` (first come, first served). While another owner holds the slot, the assistant's line waits in his queue **and the character itself hides**, so he never stands under the welcome balloon.
- **Focused window first.** Desktop: if the focused window's title bar (controls) would intersect the character, he steps aside entirely; if it would intersect only the bubble's reserved area, the line waits until the window moves (`assistantClearance` in `lib/assistant/layout.ts`, unit-tested). Phones: the character hides while any window is up (they're full-screen); the bottom sheet may show above the window's lower part, never over its title bar.
- CV, Contact and Quick Launch are on the taskbar (1100), above the assistant layer by construction; the character stands in the bottom-right corner, clear of the default icon columns and of the Recycle Bin's top-right default cell *(stage 6b)*.
- Esc closes the topmost transient first: an open menu/dialog, then the assistant bubble, then (shell shortcut) the focused window.

---

## CTA Hierarchy

1. **Download CV** — desktop `resume.pdf` (2nd icon), Quick Launch (1 click), Start → Résumé (CV) (2 clicks), About window button, assistant bubble (stage 5), Messenger header + quick reply + answers (5b), Run / palette (`cv`, `resume`, `currículo`; 7).
2. **Contact** — desktop (3rd icon), Quick Launch, Start (left pinned + right column).
3. **How I Work With AI** and **Experience** — pinned in Start / desktop.
4. Everything else (About, Projects, Skills, fun apps).

Fun apps live in **All Programs** submenus and never above the CTAs.

---

## Persistence

| Key | Storage | Owner | Contents |
|-----|---------|-------|----------|
| `douglasos:windows` | localStorage | `windowStore` | Open windows, rects, z-order, minimized/maximized, Explorer route + Back/Forward history (reconciled on load) |
| `douglasos:desktop-icons` | localStorage | `desktopStore` | Icon cells + the Recycle Bin's cell *(6b)* (merge fills new launchers and a missing bin cell) |
| `douglasos:display` | localStorage | `displayStore` *(stage 1)* | Wallpaper + solid-color swatch |
| `douglasos-booted` | sessionStorage | `shellStore` *(stage 1)* | Boot + logon seen: skip them for the rest of the session |
| `douglasos-welcomed` | sessionStorage | `WelcomeBalloon` *(stage 1)* | Welcome balloon already shown this session |
| `douglasos-assistant` | sessionStorage | `assistantStore` *(stage 5)* | `{ dismissed, fired }`: "Not now" picked, and which automatic appearances already played |
| `douglasos:messenger` | sessionStorage | `messengerStore` *(stage 5b)* | Conversation history, pending lines, view, suggestions, unread, draft, form open, greeted |
| `douglasos-messenger-toast` | sessionStorage | `MessengerToast` *(stage 5b)* | The tray toast already showed this session |
| `douglasos:media` | localStorage | `playbackStore` *(stage 8)* | Media Player volume (0–100) + mute; playback itself is never persisted and the player window isn't restored after a reload |
| `douglasos-dont-open-this` | sessionStorage | `dontOpenThisStore` *(stage 10; renamed from `easterEggStore` at integration so stage 11 owns that name)* | How many times "DON'T OPEN THIS.exe" was opened (picks egg A/B/C) |
| `douglasos:easter-eggs` | localStorage | `easterEggStore` *(stage 11)* | `{ found: { id: timestamp }, pending: [...] }`, version 1; unknown ids dropped on load |
| locale | URL (`/en`, `/pt`) + localStorage | `LocaleToggle` | Language |

Stage 6 adds no storage key: selection, drag, rescue state and line rotation live only in memory (the icon cells — and, since 6b, the bin's cell — keep using `douglasos:desktop-icons`). Stage 8 adds `douglasos:media` (volume + mute). Stage 9 (Retro Cam) adds no storage key: settings, frames and camera state live only in memory. Stage 10's Paint stores nothing (drawings live only in the open window); its egg counter is the sessionStorage key above. Later stages add their own keys here.

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
| 6 | Recycle Bin rescue + lasso/multi-select — **done** |
| 7 | Run…, command palette, desktop context menu — **done** |
| 8 | DouglasOS Media Player (YouTube playlist) + synced dance, tray volume/now-playing, All Programs → Entertainment (§15) — **done** |
| 9 | Retro Cam (pixelated webcam, local-only, All Programs → Accessories, §16) — **done** |
| 10 | DouglasOS Paint + "DON'T OPEN THIS.exe" (three eggs in turn) + the localized 404 blue screen, All Programs ▸ Accessories (§17–§19) — **done** |
| 11 | Easter-egg counter: registry + store, tray toast, Achievements window, reward + secret wallpaper (§20) — **done** (stage 7–10 hooks pending, see §20 → Integration) |
| 12 | Games: All Programs ▸ Games, desktop Games folder, six original games (§21) — **done** |

Every stage updates this document (and `MVP-SCOPE.md` when status changes).
