/**
 * "DON'T OPEN THIS.exe" (stage 10): three short, reversible easter eggs that
 * take turns on successive opens in a session. Pure: the cycle, the scatter
 * geometry of the "runaway desktop" and the timelines live here; the store
 * (`lib/store/easterEggStore.ts`) and the UI (`components/os/easter-egg/`)
 * only read them.
 */

/**
 * The three eggs, in cycle order:
 * - `not-found`: a DouglasOS-own "404" blue screen (also the site's real 404);
 * - `scramble`: the desktop icons run away and put themselves back;
 * - `access-denied`: an "Access denied" box with mini Douglas's sticky note.
 */
export const EASTER_EGGS = ["not-found", "scramble", "access-denied"] as const;
export type EasterEggId = (typeof EASTER_EGGS)[number];

/** sessionStorage key holding how many times the egg was opened this session. */
export const EASTER_EGG_STORAGE_KEY = "douglasos-dont-open-this";

/** The egg for the `count`-th open (0-based), cycling A → B → C → A… */
export function eggForOpen(count: number): EasterEggId {
  const n = Number.isFinite(count) && count >= 0 ? Math.floor(count) : 0;
  return EASTER_EGGS[n % EASTER_EGGS.length];
}

/** Parse the stored open count; anything unreadable starts over at 0. */
export function parseOpenCount(raw: string | null): number {
  const n = raw === null ? NaN : Number(raw);
  return Number.isInteger(n) && n >= 0 ? n : 0;
}

/**
 * Read the session's open count, pick the egg and store the next count.
 * Never throws: without sessionStorage (privacy mode) every open is the first.
 */
export function takeNextEgg(storage: Pick<Storage, "getItem" | "setItem"> | null): EasterEggId {
  let count = 0;
  try {
    count = parseOpenCount(storage?.getItem(EASTER_EGG_STORAGE_KEY) ?? null);
    storage?.setItem(EASTER_EGG_STORAGE_KEY, String(count + 1));
  } catch {
    // Storage blocked: fall back to the first egg.
  }
  return eggForOpen(count);
}

/**
 * Timelines (seconds). Every egg's animated part ends before 5s; what stays
 * on screen afterwards is a still frame with CV / Contact shortcuts that Esc,
 * a click or its own button closes. Reduced motion skips straight to it.
 */
export const EGG_TIMING = {
  notFound: {
    fadeIn: 0.3,
    /** Delay between the text lines appearing. */
    lineStagger: 0.25,
    progressStart: 0.6,
    progressEnd: 3,
    /** Recovery options fade in once the "search" is over. */
    recovery: 3.1,
  },
  scramble: {
    scatter: 1.2,
    hold: 0.3,
    regroup: 1.5,
    /** The CV icon's "look at me" pulse, right after everything is back. */
    pulse: 1.2,
    /** The balloon closes by itself after this long (like the tray balloons). */
    balloonAutoClose: 8,
  },
  accessDenied: {
    noteDelay: 0.5,
    noteDuration: 0.25,
    /** mini Douglas's line and the CV / Contact buttons. */
    scold: 1.5,
  },
} as const;

/** When the runaway desktop is back in place and the balloon shows (s). */
export const SCRAMBLE_SETTLED_AT =
  EGG_TIMING.scramble.scatter + EGG_TIMING.scramble.hold + EGG_TIMING.scramble.regroup;

export interface Offset {
  x: number;
  y: number;
  rotate: number;
}

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Where each icon runs to: a random offset that keeps the whole icon inside
 * `area` (so nothing leaves the screen), plus a small tilt. `random` is
 * injectable so the result is testable. Offsets are relative to the icon's
 * current box and purely visual — the desktop layout is never touched.
 */
export function scatterOffsets(
  boxes: readonly Box[],
  area: { width: number; height: number },
  random: () => number = Math.random,
): Offset[] {
  return boxes.map((b) => {
    const maxX = Math.max(0, area.width - b.width);
    const maxY = Math.max(0, area.height - b.height);
    const targetX = random() * maxX;
    const targetY = random() * maxY;
    return {
      x: Math.round(targetX - b.left),
      y: Math.round(targetY - b.top),
      rotate: Math.round((random() - 0.5) * 50),
    };
  });
}
