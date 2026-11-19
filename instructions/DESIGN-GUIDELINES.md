# DouglasOS — Design Guidelines ("DouglasOS XP")

> Visual design system for DouglasOS from v1.5 onward. These tokens and rules are the **source of truth** for all UI work. Implement them as Tailwind v4 `@theme` tokens + CSS variables in `app/globals.css` (and TS constants where Framer Motion or geometry code needs them). Never hardcode a value that has a token.
>
> **Status:** v1.5 design system, **implemented in stage 1** (desktop shell): tokens live in `app/globals.css`, motion in `lib/motion.ts`, hex mirrors for metadata/OG in `lib/theme.ts`, icons in `components/icons/`. The phone layout keeps the linear page (restyled with these tokens) until stage 2. See [Changelog](#changelog--why-the-identity-changed) for what changed and why.
>
> **Naming:** "DouglasOS XP" is the *internal* name of this design system. The product brand shown to visitors is just **DouglasOS** — never render "XP" as a product/edition name in the UI (see [What NOT to use](#what-not-to-use)).

---

## Design Philosophy

**DouglasOS is a faithful simulation of the early-2000s blue desktop ("Luna" era) under its own brand.** The visitor should instantly recognize the mechanics — green Start button, blue taskbar, rounded blue title bars, beige dialogs, yellow balloons — and then notice that everything carries the DouglasOS name, logo, icons, wallpapers and copy.

**Core principles:**

- **Familiar mechanics, original assets.** Recreate the *look and behavior* with our own CSS/SVG/illustrations. Copy nothing that is a trademark, artwork, icon, sound or verbatim text (see [What NOT to use](#what-not-to-use)).
- **Fun never blocks the CV or contact.** The golden rule still wins over fidelity: CV and Contact are always 1–2 clicks away.
- **Fidelity yields to accessibility.** Where the original look fails WCAG AA (contrast, focus visibility, tiny text in content), we deviate deliberately and document it ([Accessibility](#accessibility)).
- **Chrome is dense, content is readable.** System chrome (taskbar, menus, title bars) uses the original's 11px density; reading content inside windows uses a larger body size.
- **Light theme only.** v1.5 is a single light Luna theme. No dark mode, no theme switcher (wallpapers are the only personalization).

---

## Color Palette (Luna)

All values below become `--color-*` tokens in the Tailwind v4 `@theme` block. Token names are the source of truth; the hex values are tuned approximations of the original look (not sampled assets), adjusted where needed for AA contrast (marked **AA**).

### Taskbar & tray

| Token | Hex | Usage |
|-------|-----|-------|
| `taskbar` | `#245DDB` | Taskbar body (gradient mid-tone) |
| `taskbar-highlight` | `#3F8CF3` | Top highlight band of the taskbar gradient |
| `taskbar-shadow` | `#1941A5` | Bottom edge of the taskbar gradient |
| `taskbar-edge` | `#0C37A8` | 1px top border line |
| `tray` | `#0B72D0` | Notification area (tray) mid-tone — **AA** (darker than the original cyan so white clock text passes) |
| `tray-highlight` | `#19A3EC` | Tray top highlight |
| `tray-edge` | `#0A4FB0` | Tray left separator line |
| `task-button` | `#2860D6` | Taskbar window button (normal) — **AA** |
| `task-button-highlight` | `#4B8BF0` | Task button top highlight |
| `task-button-hover` | `#3270E2` | Task button hover mid-tone — **AA** |
| `task-button-active` | `#1C49A8` | Task button of the focused window (pressed) |

### Start button

| Token | Hex | Usage |
|-------|-----|-------|
| `start` | `#2E7D32` | Start button mid-tone — **AA** (darker than the original so white bold label passes 4.5:1) |
| `start-highlight` | `#5DB85D` | Start button top highlight |
| `start-highlight-hover` | `#79CC79` | Hover: only the highlight brightens; mid-tone stays AA |
| `start-shadow` | `#1E5E22` | Bottom edge |
| `start-pressed` | `#23662A` | Pressed / menu-open state |

### Window chrome

| Token | Hex | Usage |
|-------|-----|-------|
| `titlebar` | `#0058EE` | Active title bar mid-tone |
| `titlebar-highlight` | `#3D95FF` | Active title bar top highlight |
| `titlebar-shadow` | `#003DD7` | Active title bar bottom edge |
| `window-frame` | `#0831D9` | Active window frame (3px sides/bottom) |
| `titlebar-inactive` | `#7A96DF` | Inactive title bar mid-tone |
| `titlebar-inactive-highlight` | `#9DB9EB` | Inactive top highlight |
| `titlebar-inactive-shadow` | `#7894DE` | Inactive bottom edge (kept light so navy text stays ≥ 4.5:1 across the gradient) |
| `window-frame-inactive` | `#7A96DF` | Inactive frame |
| `titlebar-text` | `#FFFFFF` | Active title text |
| `titlebar-text-inactive` | `#0F2A6B` | Inactive title text — **AA deviation**: the original used pale text on the pale bar (~2.9:1); we use navy (4.6:1) |
| `control` | `#2F6BE8` | Minimize/maximize button fill |
| `control-highlight` | `#7BA9F5` | Control top highlight |
| `control-hover` | `#4D86F2` | Control hover |
| `control-pressed` | `#1D4FC2` | Control pressed |
| `control-border` | `#FFFFFF` | 1px border around each control button |
| `close` | `#D8461F` | Close button fill |
| `close-highlight` | `#F0A08A` | Close top highlight |
| `close-hover` | `#E86A4B` | Close hover |
| `close-pressed` | `#A93212` | Close pressed |

### Surfaces ("ButtonFace" family) & bevels

| Token | Hex | Usage |
|-------|-----|-------|
| `button-face` | `#ECE9D8` | Window body, dialogs, menu bars, status bars, toolbars |
| `surface` | `#FFFFFF` | Content panes, text fields, list views, menus, Start menu left column |
| `surface-muted` | `#F4F3EE` | Zebra rows, subtle panels inside content |
| `bevel-highlight` | `#FFFFFF` | Outer light edge of raised elements |
| `bevel-light` | `#F1EFE2` | Inner light edge |
| `bevel-shadow` | `#ACA899` | Inner dark edge; separators |
| `bevel-dark` | `#716F64` | Outer dark edge |
| `field-border` | `#7F9DB9` | Text fields, sunken content panes, list boxes |
| `button-border` | `#003C74` | Push button 1px border |
| `groupbox-border` | `#D0D0BF` | Group box outline |

### Hover, focus & selection

| Token | Hex | Usage |
|-------|-----|-------|
| `hot` | `#F8B330` | Hover ("hot-track") amber — inner glow on buttons, tab top line |
| `hot-light` | `#FFF0CF` | Light end of the hover glow |
| `hot-strong` | `#E5A01A` | Strong hover edge, Start menu orange separator accents |
| `default-ring` | `#98B8EA` | Inner blue ring of the default/focused push button |
| `default-ring-light` | `#CEE7FF` | Light end of that ring |
| `focus-ring` | `#0A246A` | Keyboard focus outline on light surfaces |
| `focus-ring-inverse` | `#FFFFFF` | Keyboard focus outline on blue chrome (taskbar, title bars, Start header) |
| `highlight` | `#316AC5` | Selection background (menus, lists, selected desktop icon label) |
| `highlight-text` | `#FFFFFF` | Text on `highlight` |
| `highlight-inactive` | `#D4D0C8` | Selection in an unfocused list (black text) |
| `lasso-border` | `#316AC5` | Rubber-band (lasso) selection border (stage 6) |
| `lasso-fill` | `rgb(49 106 197 / 0.25)` | Lasso fill |

### Start menu

| Token | Hex | Usage |
|-------|-----|-------|
| `startmenu-frame` | `#1C5BCC` | Outer 1px frame |
| `startmenu-header` | `#1868CE` | Header (avatar + name) and footer gradient mid-tone |
| `startmenu-header-highlight` | `#3C8BE6` | Header/footer top highlight |
| `startmenu-header-shadow` | `#0F55B8` | Header/footer bottom edge |
| `startmenu-accent-line` | `#E5813A` | 2px orange separator line under the header |
| `startmenu-left` | `#FFFFFF` | Left column (pinned programs) |
| `startmenu-right` | `#D3E5FA` | Right column (places) |
| `startmenu-right-border` | `#95BDEE` | Divider between columns |
| `startmenu-right-text` | `#0A246A` | Right column text |
| `startmenu-hover` | `#316AC5` | Item hover/focus background (white text) |

### Text

| Token | Hex | Usage |
|-------|-----|-------|
| `text` | `#000000` | Default text on `button-face` / `surface` |
| `text-muted` | `#5C5C5C` | Secondary text, captions, status bar text (AA on both surfaces) |
| `text-disabled` | `#ACA899` | Disabled labels (exempt from contrast, never used for content) |
| `text-inverse` | `#FFFFFF` | Text on blue/green chrome |
| `link` | `#0033CC` | Links inside windows (underlined) |
| `link-visited` | `#551A8B` | Visited links (optional) |
| `desktop-label` | `#FFFFFF` | Desktop icon labels (always with `shadow-desktop-label`) |

### Info surfaces & semantic icon colors

| Token | Hex | Usage |
|-------|-----|-------|
| `info` | `#FFFFE1` | Tooltips, tray balloons, assistant bubble |
| `info-border` | `#000000` | 1px border of tooltips/balloons |
| `icon-error` | `#D11F1F` | Error dialog icon (own SVG, red circle + ×) |
| `icon-warning` | `#F2C230` | Warning icon (own SVG, yellow triangle + !) |
| `icon-info` | `#2A6FD6` | Information icon (own SVG, blue circle + i) |
| `icon-success` | `#2E8B2E` | Success / "online" indicators |
| `progress` | `#2FB52F` | In-window progress bar blocks |

### Desktop, boot & logon

| Token | Hex | Usage |
|-------|-----|-------|
| `desktop` | `#004E98` | Solid desktop fallback (behind wallpapers; default solid color) |
| `boot-bg` | `#000000` | Boot screen background |
| `boot-progress` | `#2B6CF5` | Boot progress blocks |
| `boot-progress-highlight` | `#8FB8FF` | Boot block top highlight |
| `boot-track` | `#B2B2B2` | Boot progress track border |
| `logon-bg` | `#5A7EDC` | Logon screen body |
| `logon-band` | `#00309C` | Logon top/bottom bands |
| `logon-divider` | `#F5A86C` | Thin divider accent next to the user list |

---

## Gradients (CSS recipes)

Gradients are **not** a Tailwind v4 theme namespace. Define them as `--gradient-*` custom properties on `:root`, built only from the color tokens above, and expose them through `@utility` classes (e.g. `@utility bg-taskbar { background-image: var(--gradient-taskbar); }`) or `bg-[image:var(--gradient-taskbar)]`. Never inline a raw gradient in a component.

```css
:root {
  /* Taskbar: bright top band, flat body, dark bottom edge */
  --gradient-taskbar: linear-gradient(
    to bottom,
    var(--color-taskbar-edge) 0,
    var(--color-taskbar-highlight) 4%,
    var(--color-taskbar) 18%,
    var(--color-taskbar) 88%,
    var(--color-taskbar-shadow) 100%
  );

  /* Tray: lighter/cyan-ish, same structure */
  --gradient-tray: linear-gradient(
    to bottom,
    var(--color-tray-edge) 0,
    var(--color-tray-highlight) 6%,
    var(--color-tray) 20%,
    var(--color-tray) 90%,
    var(--color-tray-edge) 100%
  );

  /* Start button: glossy green, rounded right side */
  --gradient-start: linear-gradient(
    to bottom,
    var(--color-start-highlight) 0,
    var(--color-start) 30%,
    var(--color-start) 80%,
    var(--color-start-shadow) 100%
  );
  --gradient-start-hover: linear-gradient(
    to bottom,
    var(--color-start-highlight-hover) 0,
    var(--color-start) 34%,
    var(--color-start) 80%,
    var(--color-start-shadow) 100%
  );

  /* Taskbar window buttons */
  --gradient-task-button: linear-gradient(
    to bottom,
    var(--color-task-button-highlight) 0,
    var(--color-task-button) 25%,
    var(--color-task-button) 100%
  );
  --gradient-task-button-hover: linear-gradient(
    to bottom,
    var(--color-task-button-highlight) 0,
    var(--color-task-button-hover) 25%,
    var(--color-task-button-hover) 100%
  );
  /* Focused window's button is flat + inset (see shadow-task-button-active) */

  /* Title bars */
  --gradient-titlebar: linear-gradient(
    to bottom,
    var(--color-titlebar-highlight) 0,
    var(--color-titlebar) 10%,
    var(--color-titlebar) 85%,
    var(--color-titlebar-shadow) 100%
  );
  --gradient-titlebar-inactive: linear-gradient(
    to bottom,
    var(--color-titlebar-inactive-highlight) 0,
    var(--color-titlebar-inactive) 12%,
    var(--color-titlebar-inactive) 85%,
    var(--color-titlebar-inactive-shadow) 100%
  );

  /* Title bar control buttons */
  --gradient-control: radial-gradient(
    circle at 90% 90%,
    var(--color-control) 0,
    var(--color-control) 55%,
    var(--color-control-highlight) 100%
  );
  --gradient-close: radial-gradient(
    circle at 90% 90%,
    var(--color-close) 0,
    var(--color-close) 55%,
    var(--color-close-highlight) 100%
  );

  /* Start menu header & footer */
  --gradient-startmenu-header: linear-gradient(
    to bottom,
    var(--color-startmenu-header-highlight) 0,
    var(--color-startmenu-header) 30%,
    var(--color-startmenu-header) 85%,
    var(--color-startmenu-header-shadow) 100%
  );
  --gradient-startmenu-accent: linear-gradient(
    to right,
    transparent 0,
    var(--color-startmenu-accent-line) 50%,
    transparent 100%
  );

  /* XP push button (in-window) */
  --gradient-button: linear-gradient(
    to bottom,
    var(--color-surface) 0,
    var(--color-button-face) 86%,
    var(--color-bevel-shadow) 100%
  );
  --gradient-button-pressed: linear-gradient(
    to bottom,
    var(--color-bevel-shadow) 0,
    var(--color-button-face) 14%,
    var(--color-surface) 100%
  );

  /* Boot progress block */
  --gradient-boot-block: linear-gradient(
    to bottom,
    var(--color-boot-progress-highlight) 0,
    var(--color-boot-progress) 50%,
    var(--color-boot-progress) 100%
  );

  /* Logon screen: bands + soft light spot top-left */
  --gradient-logon: radial-gradient(
    circle at 15% 20%,
    color-mix(in srgb, var(--color-surface) 25%, var(--color-logon-bg)) 0,
    var(--color-logon-bg) 45%
  );
}
```

---

## Typography

### Font families

**System stacks only.** No webfonts are bundled — in particular, never self-host or load Microsoft fonts (Tahoma, Verdana, Trebuchet MS, Segoe UI, Lucida Console, Franklin Gothic). We only *reference* them by name; visitors who have them installed see them, everyone else gets the fallbacks. Stage 1 removes the Geist `next/font` loading (a performance win as well).

| Token | Stack | Usage |
|-------|-------|-------|
| `font-sans` | `Tahoma, Verdana, "Segoe UI", "DejaVu Sans", sans-serif` | All UI chrome and content |
| `font-title` | `"Trebuchet MS", Tahoma, Verdana, "DejaVu Sans", sans-serif` | Window title bars, Start menu user name, boot/logon headings |
| `font-mono` | `"Lucida Console", "Courier New", ui-monospace, monospace` | Address bar paths, Run dialog field, code snippets |

### Type scale

Defined as Tailwind v4 `--text-*` tokens (with `--text-*--line-height`).

| Token | Size / line height | Weight | Usage |
|-------|--------------------|--------|-------|
| `text-system` | 11px / 14px (8pt) | 400 | Taskbar, tray, menus, Start menu items, status bars, dialogs, desktop icon labels, tooltips, balloons |
| `text-title` | 13px / 16px | 700 | Window title text |
| `text-start` | 14px / 16px | 700 italic | Start button label (with `shadow-start-label`) |
| `text-startmenu-user` | 14px / 18px | 700 | Start menu header user name |
| `text-body` | 13px / 20px | 400 | Reading content inside windows (about, experience, AI narrative) |
| `text-heading` | 16px / 22px | 700 | Section headings inside windows |
| `text-heading-lg` | 20px / 26px | 700 | App page title inside a window (e.g. "About Douglas") |
| `text-logon` | 24px / 30px | 400 | Logon screen headline and user name |
| `text-boot` | 40px / 44px | 700 | Boot screen wordmark |

### Rules

- **Chrome is 11px; content is 13px.** Never set long-form reading content at 11px.
- Title bars: `font-title`, bold, single line, ellipsis on overflow.
- Desktop icon labels: 11px, centered, max 2 lines, ellipsis; full label shown when selected/focused.
- No letter-spacing tricks, no gradient text, no text shadows **except** the desktop label shadow and the Start button label shadow (both functional: legibility on wallpapers/green).
- Respect browser zoom: layouts must reflow at 200% zoom without loss of content (WCAG 1.4.4); never lock font sizes with viewport units.

---

## Spacing

4px base unit (Tailwind default scale). The XP look is **dense** — use the small end of the scale for chrome.

| Step | Value | Common use |
|------|-------|-----------|
| `0.5` | 2px | Bevel gaps, icon-to-label gap in menus |
| `1` | 4px | Taskbar padding, gap between task buttons, menu item vertical padding |
| `1.5` | 6px | Title bar horizontal padding, gap between control buttons |
| `2` | 8px | Menu item horizontal padding, group box inner padding, window content padding (dense apps) |
| `3` | 12px | Dialog padding, window content padding (reading apps), push button horizontal padding |
| `4` | 16px | Gap between group boxes / content sections |
| `6` | 24px | Large section breaks inside content windows |
| `8` | 32px | Logon/boot layout gaps |

**Rules:** don't use values between steps; don't invent one-off values. Window **content** may breathe more (12–16px) than window **chrome** (2–6px).

---

## Sizes

Defined as Tailwind v4 `--spacing-*` tokens so they generate utilities (`h-taskbar`, `size-icon-desktop`, …). Geometry constants in `lib/store/geometry.ts` / `desktopGrid.ts` **must mirror** these values (keep a comment cross-reference; stage 1 updates them).

| Token | Desktop | Mobile (< 768px) | Notes |
|-------|---------|------------------|-------|
| `taskbar` | 30px | 48px + `env(safe-area-inset-bottom)` | Taskbar height |
| `titlebar` | 30px | 36px | Includes the 3px top frame |
| `menubar` | 20px | — (collapsed into a "⋯" menu) | File/Edit/View/Help row |
| `statusbar` | 22px | 22px | Optional per app |
| `control-button` | 21px | 32px (hit area ≥ 44px) | Minimize/maximize/close |
| `start-button` | 30px tall, ~100px wide | 48px tall, ~88px wide | Label + logo |
| `task-button` | 22px tall, 40–160px wide | 40px tall | Shrinks to icon-only at 40px |
| `icon-desktop` | 48px | 48px | Desktop icon glyph ("large icons") |
| `icon-startmenu-pinned` | 32px | 32px | Start menu left column |
| `icon-startmenu-places` | 24px | 24px | Start menu right column |
| `icon-small` | 16px | 16px (in ≥ 44px hit area) | Title bars, task buttons, tray, menus |
| `desktop-cell` | 88 × 96px pitch, 76px label width | 96 × 104px pitch | Icon grid (column-first, top-left origin) |
| `startmenu` | 380 × ~480px | full width, 85dvh | Start menu panel |
| `startmenu-header` | 64px (avatar 48px) | 64px | User header |
| `touch-target` | — | ≥ 44 × 44px | Every interactive element on mobile |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius-window` | 8px | **Top-left and top-right only** of window frames (`rounded-t-window`); bottom corners square |
| `radius-start` | 0 12px 12px 0 | Start button: flush left against the screen edge, pill-rounded on the right |
| `radius-startmenu` | 8px | Top corners of the Start menu panel only |
| `radius-control` | 3px | Title bar control buttons |
| `radius-button` | 3px | Push buttons, task buttons |
| `radius-groupbox` | 3px | Group boxes |
| `radius-balloon` | 8px | Tray balloons, assistant bubble |
| `radius-none` | 0 | Text fields, menus, status bars, content panes |

---

## Borders, Bevels & Shadows

The 3D "bevel" is built with stacked inset shadows, never with images.

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-bevel-raised` | `inset -1px -1px var(--color-bevel-dark), inset 1px 1px var(--color-bevel-highlight), inset -2px -2px var(--color-bevel-shadow), inset 2px 2px var(--color-bevel-light)` | Raised panels, toolbar buttons (pressed state flips it) |
| `shadow-bevel-sunken` | `inset 1px 1px var(--color-bevel-shadow), inset -1px -1px var(--color-bevel-highlight)` | Status bar panes, sunken frames |
| `shadow-button-hover` | `inset -1px 1px var(--color-hot-light), inset 1px 2px var(--color-hot), inset -2px 2px var(--color-hot), inset 2px -2px var(--color-hot-strong)` | Push button hover (amber inner glow) |
| `shadow-button-default` | `inset -1px 1px var(--color-default-ring-light), inset 1px 2px var(--color-default-ring), inset -2px 2px var(--color-default-ring-light), inset 2px -2px var(--color-default-ring)` | Default / focused push button (blue inner ring) |
| `shadow-task-button-active` | `inset 1px 1px 2px rgb(0 0 0 / 0.45)` | Focused window's taskbar button (pressed look) |
| `shadow-window` | `2px 4px 12px rgb(0 0 0 / 0.35)` | Active window (subtle; the original had none — added for depth) |
| `shadow-window-inactive` | `1px 2px 6px rgb(0 0 0 / 0.25)` | Inactive window |
| `shadow-menu` | `2px 2px 3px rgb(0 0 0 / 0.4)` | Start menu, context menus, dropdowns |
| `shadow-balloon` | `2px 2px 4px rgb(0 0 0 / 0.35)` | Balloons, tooltips, assistant bubble |
| `shadow-desktop-label` | `1px 1px 1px rgb(0 0 0 / 0.9), 0 0 2px rgb(0 0 0 / 0.6)` (text-shadow) | Desktop icon labels — mandatory |
| `shadow-start-label` | `1px 1px 1px rgb(0 0 0 / 0.5)` (text-shadow) | Start button label |

**Borders:** text fields and content panes `1px solid var(--color-field-border)`; push buttons `1px solid var(--color-button-border)`; menus `1px solid var(--color-bevel-shadow)`; window frame 3px (`window-frame` / `window-frame-inactive`); group boxes `1px solid var(--color-groupbox-border)`.

---

## Focus States

- **Keyboard focus is always visible** (`:focus-visible`), on every interactive element, on every surface.
- On light surfaces (`button-face`, `surface`): `outline: 2px solid var(--color-focus-ring); outline-offset: 1px` **plus** the classic 1px dotted inner rectangle (`outline` on an inner element or `::after` with `1px dotted currentColor`) for fidelity.
- On blue chrome (taskbar, title bars, Start header/footer, task buttons, tray): `outline: 2px solid var(--color-focus-ring-inverse); outline-offset: -3px`.
- Desktop icons: focused icon = selected styling (`highlight` behind the label, icon tinted) + 1px dotted rectangle around the label.
- Push buttons: focused = `shadow-button-default` + dotted rectangle; hover = `shadow-button-hover`.
- Never remove an outline without replacing it. Mouse clicks must not show the outline (`:focus-visible` only).

---

## Motion

### Library & philosophy

**Framer Motion for all animation** (fixed stack). The original desktop barely animated: motion is **short, functional, and explains spatial change** (where a window went, where a menu came from). No decorative loops in chrome.

### Tokens

Framer consumes TS values, so motion tokens live as constants in `lib/motion.ts` (created in stage 1), mirrored as `--duration-*` / `--ease-*` CSS vars only if CSS needs them.

| Token | Value | Use |
|-------|-------|-----|
| `duration-instant` | 0ms | Hover/press states (XP had no hover transitions) |
| `duration-fast` | 100ms | Start menu, context menus, dropdowns, tooltips |
| `duration-base` | 150ms | Minimize/restore, balloons, dialogs |
| `duration-slow` | 250ms | Logon → desktop fade, boot → logon fade |
| `ease-out` | `[0.2, 0, 0, 1]` | Entries |
| `ease-in` | `[0.4, 0, 1, 1]` | Exits |
| `ease-linear` | `"linear"` | Boot progress marquee |

### Recipes

| Element | Animation |
|---------|-----------|
| Start menu open | opacity 0→1, `y: 8 → 0`, `duration-fast`, `ease-out`; close = instant |
| Context menu / dropdown | opacity 0→1, `duration-fast` |
| Window open | opacity 0→1, `duration-fast` (no scale — the original popped windows in) |
| Window close | instant unmount (no exit animation) |
| Minimize | scale + translate toward the window's taskbar button rect, opacity → 0, `duration-base`, `ease-in` |
| Restore | reverse of minimize, `ease-out` |
| Maximize / restore size | instant (no tween) |
| Tray balloon | opacity 0→1, `duration-base`; auto-dismiss after ~8s unless hovered/focused |
| Boot progress | 3 blocks sliding through the track on a loop (~1.2s, `ease-linear`) |
| Logon → desktop | crossfade `duration-slow` |

### Reduced motion (`prefers-reduced-motion: reduce`)

Every animation has a static alternative:

- All tweens become instant (no transforms, no fades longer than `duration-fast`).
- Boot: no marquee; a static "Starting DouglasOS…" label, then go straight to logon (or desktop when skipped).
- Minimize/restore: instant.
- 3D wallpaper: never loads; falls back to the default static wallpaper.
- Assistant/dance/nudge/visualizers (later stages): static poster or indicator.
- The global CSS reduced-motion reset in `globals.css` stays.

---

## Iconography

### Direction

**Own SVG icons in the XP style** — never the originals, never traced.

- Colorful, soft vertical gradients, light from the top-left, a slightly darker 1px outline, gentle rounded forms and a subtle drop shadow (in the SVG, not CSS).
- Three-quarter or front view; friendly, glossy, but simple enough to read at 16px.
- Palette drawn from the color tokens (blues, greens, ambers) plus a small set of icon-local accent colors documented in the icon module.
- Each icon is a React SVG component in **`components/icons/`** (`AppIcons.tsx` for launchers, `SystemIcons.tsx` for the brand mark, avatar, Start places and dialog glyphs) drawn on a **48px master**; 32/24/16px scale from it. *Stage 1 deviation:* there is no separately drawn 16px variant yet — the masters were kept simple enough to read at 16px (checked in the taskbar/Start menu screenshots); hand-tuned 16px variants are a polish item.
- External shortcuts (stage 3) get a **shortcut-arrow overlay** of our own design in the bottom-left corner.
- `lucide-react` is allowed **only inside window content** (e.g. list bullets, inline actions), never for desktop, Start menu, taskbar or title bar icons.

### Icon concepts per launcher

| Launcher | Concept |
|----------|---------|
| `about` | User card / ID badge with Douglas's stylized silhouette |
| `experience` | Leather briefcase |
| `projects` | Yellow folder with documents peeking out ("My Projects") |
| `skills` | Toolbox / stacked colored blocks |
| `how-i-work-with-ai` | Lightbulb with a small circuit/spark motif — the marquee icon, slightly more vivid |
| `resume` | Paper document with a folded corner and a red "PDF" band — a **generic** PDF cue, never a vendor logo |
| `contact` | Envelope + address card |
| `display` (stage 1) | Monitor showing a tiny "Morning Waves" wallpaper |
| Later stages | Recycle bin (own wire-basket design), messenger (one buddy + speech bubble — not the original two-person icon), media player, camera, paint, "don't open this" |

### Brand mark (DouglasOS logo)

- The DouglasOS logo takes the place where the original put its flag (boot, logon, Start button, About dialog, favicon).
- Direction: a glossy rounded-square tile in Luna blue with a white "D" monogram and a small green accent dot (echoing the Start button).
- **Never** a four-pane / four-color / waving-flag shape, never a window-pane grid. If it reads as "a flag" at 16px, redraw it.

---

## Wallpapers

Wallpapers are the only personalization. They're chosen in **Display Properties** (stage 1) and persisted locally.

| Wallpaper | Type | Notes |
|-----------|------|-------|
| **"Morning Waves"** (default, `morning-waves`) | Static, original | Abstract, no landscape: a diagonal deep-navy → bright Luna-blue field, three flowing light ribbons sweeping across the lower third (pale-blue, mid-blue, deep-blue) with white crest lines and one Start-green accent line, a soft glow behind a faint DouglasOS mark centered in the upper half, a few sparkles. Replaced the stage-1 "Morning Hills" (green hills + blue sky + clouds), which read too close to the famous hill photograph. |
| "Dusk Hills" | Static, original | Layered rolling hills at sunset (purple-to-orange sky, slate hills, stars) — the warm-palette alternative. |
| "Blueprint" | Static, original | Deep blue field with a faint DouglasOS-logo / grid pattern. |
| Solid color | Static | Fixed swatches (default `desktop` `#004E98` + up to 5 more); no free color picker. |
| **"DouglasOS 3D (animated)"** | Animated, optional | The existing R3F `AmbientBackground` scene, unchanged in spirit. |

### Rules for static wallpapers

- **Original artwork only.** Explicitly *not* the famous green-hill photograph or anything derived from it: no photography, no single smooth hill under a blue sky with white clouds as the whole composition. Ours is visibly illustrated and layered.
- Stored in `public/wallpapers/` as optimized SVG (≤ 80KB, SVGO) or, if the illustration needs it, AVIF/WebP ≤ 200KB at 2560px wide.
- Rendered as a CSS background (`center bottom / cover`) over `var(--color-desktop)`, so there is never a flash of nothing and the wallpaper never becomes the LCP element.
- **Label legibility:** the area under the default icon column (left ~200px, top 70%) must be mid-to-dark (the deep part of the sky / hills) so white labels with `shadow-desktop-label` stay readable.
- Mobile uses the same art cropped center-bottom; provide a portrait-friendly composition (the default's mark is centered and its ribbons span the full width, so it survives a 9:19.5 crop).
- Persisted ids of retired wallpapers (e.g. `morning-hills`) are unknown to `sanitizeDisplay` and fall back to the current default.

### "DouglasOS 3D (animated)" rules (carried over from v1)

- Off by default. Opt-in in Display Properties only.
- Lazy-loaded after the critical UI; never on the critical path.
- Capped at 30 FPS; low density (50–100 particles, 5–10 code fragments); no physics, no high-poly models.
- **Never loads** under `prefers-reduced-motion`, with `Save-Data`, or on mobile (stage 2 may propose an exception within the perf budget).
- If unavailable, falls back to the default static wallpaper, and Display Properties explains why ("disabled: reduced motion").
- The scene keeps its original night palette (near-black base, electric cyan `#00D9FF`, purple `#7C3AED`) as **scene-local constants inside the 3D module**. These are not UI tokens and must not leak into chrome.

---

## Component Guidelines (shadcn/ui inside windows)

shadcn/ui + radix stay the base for in-window UI and for accessible primitives (menus, dialogs, popovers, tabs). Their **styles** are replaced by the XP look; their **behavior** (focus management, ARIA) is kept.

| Component | XP treatment |
|-----------|--------------|
| **Push button** (`Button` default) | `gradient-button`, 1px `button-border`, `radius-button`, min-width 75px, height 23px, `text-system`. Hover `shadow-button-hover`, focus `shadow-button-default` + dotted rect, pressed `gradient-button-pressed`. |
| **Primary action** (e.g. "Download CV") | Same push button in the "default button" state (permanent blue ring) — never a different color fill. |
| **Link** | `link` color, underlined, no button chrome. |
| **Text field / textarea** | `surface` bg, 1px `field-border`, height 21–23px, `radius-none`; focus ring per [Focus States](#focus-states). |
| **Checkbox / radio** | 13px boxes, white with `field-border`, green check / dot glyph (own SVG). |
| **Tabs** | Raised tabs on `button-face`; hover adds a 2px `hot` top line; selected tab is `surface`, connected to the panel, with a `hot-strong` top line. |
| **Group box** | 1px `groupbox-border`, `radius-groupbox`, label sits on the top border on `button-face`. |
| **Content pane** | `surface` with 1px `field-border` (sunken look) — replaces v1 "glass cards". |
| **Tags / badges** | Small `surface` chips, 1px `bevel-shadow` border, `radius-button`, `text-system`. |
| **Menus** (menu bar, context, dropdown) | `surface` bg, 1px `bevel-shadow` border, `shadow-menu`, items 22px tall, hover/focus `highlight` + `highlight-text`, separators 1px `bevel-shadow`, submenu arrow ▸. |
| **Dialog / message box** | Window chrome (title bar with close only), `button-face` body, semantic icon (32px) on the left, text on the right, buttons right-aligned at the bottom. Modal: focus trapped, Esc = Cancel. No dimming scrim (transparent click-blocker), matching the original. |
| **Tooltip** | `info` bg, 1px `info-border`, `text-system`, no radius, `shadow-balloon`; delay ~500ms. |
| **Balloon** (tray, assistant) | `info` bg, 1px `info-border`, `radius-balloon`, tail pointing to its source, bold title row with 16px icon, close ×. |
| **Progress bar** | Sunken track, `progress` green blocks. |
| **Scrollbars** | Optional XP tint via `scrollbar-color`; never hide scrollbars. |

---

## Accessibility

- **Contrast AA (4.5:1) for all text**, including chrome. Key pairs (computed):

| Text / background | Ratio |
|-------------------|-------|
| `text` on `button-face` | ~17:1 |
| `text-muted` on `surface` / `button-face` | ~6.7:1 / ~5.5:1 |
| `link` on `surface` | ~9:1 |
| `titlebar-text` on `titlebar` | ~5.8:1 |
| `titlebar-text-inactive` on `titlebar-inactive` | ~4.6:1 |
| `text-inverse` on `task-button` / `task-button-hover` | ~5.6:1 / ~4.6:1 |
| `text-inverse` on `tray` | ~4.9:1 |
| `text-inverse` on `start` | ~5.1:1 |
| `text-inverse` on `startmenu-header` | ~5.4:1 |
| `highlight-text` on `highlight` | ~5.3:1 |
| `startmenu-right-text` on `startmenu-right` | ~11:1 |

- **Deliberate fidelity deviations for AA:** darker Start green, darker task buttons, darker tray, navy inactive title text, 13px reading text inside windows, a solid 2px focus outline in addition to the dotted rectangle.
- Non-text contrast ≥ 3:1 for control glyphs (white glyphs on `control` / `close`).
- Never rely on color alone (active window = color **and** pressed taskbar button; selection = color **and** dotted focus rect).
- Every icon-only control has an accessible name (`aria-label`, localized).
- Touch targets ≥ 44 × 44px on mobile (hit area may extend beyond the visual).
- Reduced motion respected everywhere (see [Motion](#motion)).

---

## What NOT to use

DouglasOS imitates mechanics, never property. The following are **banned** in code, assets, copy, metadata and screenshots:

- ❌ The names **"Windows"**, **"Microsoft"**, **"Windows XP"**, and "XP" as a product/edition name in the UI ("DouglasOS XP" is an internal doc name only).
- ❌ The **flag logo** or anything resembling it (four colored panes, waving flag, window-pane grid as a logo).
- ❌ The **"Bliss" wallpaper**, photos or derivatives of it, or any composition that reads as it.
- ❌ **Original system icons** (My Computer, Recycle Bin, folders, Internet Explorer "e", Media Player, MSN/Windows Live, Outlook, Paint, Solitaire, etc.) — no extraction, tracing or "inspired copy" of individual icons.
- ❌ **Original sounds** (startup, logon/logoff, error "ding", balloon, messenger nudge/login).
- ❌ **Microsoft fonts bundled or self-hosted** (Tahoma, Verdana, Trebuchet MS, Segoe UI, Lucida Console, Franklin Gothic). System-stack references only.
- ❌ **Verbatim original UI text** (e.g. the exact shutdown/boot/error strings, the blue-screen text). Write original, DouglasOS-voiced copy.
- ❌ **Product names** of the era: Internet Explorer, Windows Media Player, MSN/Windows Live Messenger, Outlook Express, Office Assistant / the paperclip character. Our equivalents have original names ("DouglasOS Explorer", "DouglasOS Media Player", "DouglasOS Messenger", the "mini Douglas" assistant).
- ❌ Screenshots of the real OS used as assets or placeholders.
- ❌ The reference video's portfolio **copy or visuals** — we reuse its mechanics only.
- ❌ Vendor logos as generic icons (e.g. the Adobe PDF logo on `resume.pdf`).
- ❌ v1 leftovers: glassmorphism/backdrop blur, electric cyan accent in chrome, dark-only surfaces, Geist fonts, dock magnification, macOS traffic-light controls.

---

## Implementation Reference (Tailwind v4)

Conceptual shape of the `globals.css` rewrite in stage 1 (names are normative, structure is indicative):

```css
@theme {
  /* Colors — every token from the palette tables above */
  --color-taskbar: #245ddb;
  --color-start: #2e7d32;
  --color-titlebar: #0058ee;
  --color-button-face: #ece9d8;
  --color-highlight: #316ac5;
  --color-focus-ring: #0a246a;
  /* … */

  /* Fonts */
  --font-sans: Tahoma, Verdana, "Segoe UI", "DejaVu Sans", sans-serif;
  --font-title: "Trebuchet MS", Tahoma, Verdana, "DejaVu Sans", sans-serif;
  --font-mono: "Lucida Console", "Courier New", ui-monospace, monospace;

  /* Type scale */
  --text-system: 11px;
  --text-system--line-height: 14px;
  --text-title: 13px;
  --text-body: 13px;
  --text-body--line-height: 20px;
  /* … */

  /* Sizes → utilities like h-taskbar, size-icon-desktop */
  --spacing-taskbar: 30px;
  --spacing-titlebar: 30px;
  --spacing-icon-desktop: 48px;
  /* … */

  /* Radii */
  --radius-window: 8px;
  --radius-button: 3px;
  --radius-balloon: 8px;

  /* Shadows */
  --shadow-bevel-raised: inset -1px -1px var(--color-bevel-dark), inset 1px 1px var(--color-bevel-highlight),
    inset -2px -2px var(--color-bevel-shadow), inset 2px 2px var(--color-bevel-light);
  --shadow-menu: 2px 2px 3px rgb(0 0 0 / 0.4);
  /* … */
}

:root {
  color-scheme: light;
  /* --gradient-* recipes (see Gradients) */
  /* shadcn semantic tokens mapped onto Luna: */
  --background: var(--color-button-face);
  --foreground: var(--color-text);
  --card: var(--color-surface);
  --popover: var(--color-surface);
  --primary: var(--color-highlight);
  --primary-foreground: var(--color-highlight-text);
  --muted: var(--color-surface-muted);
  --muted-foreground: var(--color-text-muted);
  --accent: var(--color-highlight);
  --accent-foreground: var(--color-highlight-text);
  --border: var(--color-bevel-shadow);
  --input: var(--color-field-border);
  --ring: var(--color-focus-ring);
}
```

- Remove the forced `html.dark` class and the `dark` variant usage; `color-scheme: light`.
- Remove every v1 token (`base-*`, `accent*`, `glass-*`, `glow-*`, `win-*`, `blur-glass*`, `radius-dock`) once no component references it.
- Keep the global `prefers-reduced-motion` reset.

### Tokens added in stage 1

Beyond the tables above, implementation needed a few extra tokens (all in `app/globals.css`):

| Token | Value | Why |
|-------|-------|-----|
| `--color-swatch-{navy,teal,forest,plum,slate}` | `#004E98`, `#2A6B6B`, `#2F5F3A`, `#4F3F78`, `#3C4650` | Display Properties solid-color swatches (all dark enough for white desktop labels) |
| `--spacing-menu-item` | 22px | Menu item height (was described in prose only) |
| `--spacing-push-button-w/h` | 75 × 23px | Push button min size (from the component table) |
| `--spacing-desktop-cell-x/y`, `--spacing-desktop-label` | 88 / 96 / 76px | The `desktop-cell` token split into utilities |
| `--shadow-bevel-pressed` | inverted `bevel-raised` | Pressed raised elements |
| `--gradient-start-pressed`, `--gradient-control-hover`, `--gradient-close-hover`, `--gradient-logon-divider` | from color tokens | Pressed Start, hovered controls, logon divider |
| `--filter-icon-selected` (`icon-selected-tint` utility) | sepia/hue-rotate blue wash | Tinted glyph of a selected desktop icon |
| `--text-shadow-desktop-label`, `--text-shadow-start-label` | as in Shadows table | Exposed as Tailwind `text-shadow-*` utilities |

`lib/utils.ts` registers these custom utilities with tailwind-merge (otherwise `cn("text-system text-text")` silently drops the font size).

### Checklist for stage 1

- [x] All palette, type, size, radius and shadow tokens defined in `@theme`; gradients as `--gradient-*` + `@utility`.
- [x] Geist font loading removed; system stacks applied.
- [x] shadcn semantic tokens remapped; `color-scheme: light`; no `.dark`.
- [x] Geometry constants (`MENU_BAR_H` → `TASKBAR_H`/`TITLEBAR_H`, grid pitch 88 × 96) mirror the size tokens.
- [x] `lib/motion.ts` with the motion tokens; reduced-motion paths verified (e2e runs under `reducedMotion: "reduce"`).
- [ ] Contrast pairs above verified in the browser with a tool (still pending a manual axe/DevTools pass; the logon screen moved all small text onto the dark bands because white on `logon-bg` is only ~4:1).
- [x] No banned asset/name anywhere (grep for "Windows", "Microsoft", "XP" in UI copy — only internal code comments use the internal "XP" name).

---

## Changelog — why the identity changed

**v1 (MVP, 2026) — "dark glass":** dark-only UI, glassmorphism (`backdrop-blur`), electric cyan accent `#00D9FF` (+ purple), Geist Sans/Mono, macOS-inspired top menu bar + bottom dock with magnification, muted traffic-light window controls, ambient R3F 3D background always on (desktop). The full v1 document is preserved in git history: `git show 14dc47d:instructions/DESIGN-GUIDELINES.md`.

**v1.5 — "DouglasOS XP":** replaced by a faithful early-2000s Luna simulation with DouglasOS branding.

**Why:**

- The v1 look was polished but read as "another dark dev portfolio"; the brief's goal is to be *memorable*. A faithful, nostalgic desktop is instantly recognizable and shareable, and it makes the OS metaphor self-explanatory (everyone knows Start → Programs).
- The analysis of a reference OS-style portfolio (`instructions/full-refactor/V1.5-FEATURE-PROMPTS.md`) showed that the delight comes from *mechanics* (Start menu, recycle bin, assistant, media player) — which map naturally onto a Luna-style desktop, not onto a macOS-like dock.
- A familiar desktop also works on touch (stage 2), replacing the v1 linear mobile fallback with the same experience.

**What was removed:** dark-only rule, glassmorphism recipe, cyan/purple accents in UI, Geist fonts, dock/menu-bar tokens, macOS-style window controls, "3D always on" (it is now an optional animated wallpaper).
