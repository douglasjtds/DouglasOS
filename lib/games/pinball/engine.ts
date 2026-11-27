/**
 * Pinball physics + rules (stage 12). Pure and DOM-free.
 *
 * The simulation runs on a FIXED timestep (`FIXED_DT`, 1/120 s), each tick
 * split into `SUBSTEPS` sub-steps so the ball (capped at `MAX_SPEED`) moves
 * well under its radius per sub-step and can't tunnel through walls or a
 * swinging flipper. Real frame time is accumulated by `advance`, which clamps
 * long gaps (a backgrounded tab) to `MAX_FRAME`.
 *
 * `tick` / `advance` mutate the state in place (the render loop keeps one
 * state object and allocates nothing per frame); `step` is the pure wrapper
 * used by tests: same state + same inputs → same result.
 */
import { TABLE, type TableDef } from "./table";

export const FIXED_DT = 1 / 120;
export const SUBSTEPS = 4;
/** Longest real-time gap simulated in one `advance` call (seconds). */
export const MAX_FRAME = 0.1;
export const GRAVITY = 900;
export const MAX_SPEED = 1400;
export const BALLS_PER_GAME = 3;

/** Seconds to fully charge the plunger. */
export const PLUNGER_CHARGE_TIME = 1;
export const PLUNGER_MIN_SPEED = 750;
export const PLUNGER_MAX_SPEED = 1350;

export const FLIPPER_UP_SPEED = 22;
export const FLIPPER_DOWN_SPEED = 14;

export const BUMPER_KICK = 520;
export const BALL_SAVE_TIME = 5;
export const TARGET_RESET_DELAY = 0.6;
/** How long a hit bumper / the lamp stays lit (decorative). */
export const FLASH_TIME = 0.15;

export const SCORE_BUMPER = 100;
export const SCORE_TARGET = 250;
export const SCORE_BANK = 2000;
export const SCORE_ROLLOVER = 500;

const RESTITUTION_WALL = 0.5;
const RESTITUTION_FLIPPER = 0.3;
const RESTITUTION_BUMPER = 0.9;
const RESTITUTION_TARGET = 0.6;
/** Normal bounces slower than this die out, so a ball can come to rest. */
const REST_SPEED = 25;

export interface PinballInput {
  left: boolean;
  right: boolean;
  plunger: boolean;
}

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface FlipperState {
  angle: number;
  /** Angular velocity during the last sub-step (rad/s). */
  omega: number;
}

export type PinballStatus = "playing" | "over";

export interface PinballState {
  status: PinballStatus;
  ball: Ball;
  flippers: [FlipperState, FlipperState];
  score: number;
  /** Current ball, 1-based (ball n of `BALLS_PER_GAME`). */
  ballNumber: number;
  /** Plunger charge, 0..1. */
  plungerCharge: number;
  /** Plunger input on the previous tick (release = launch). */
  plungerWasHeld: boolean;
  /** Whether the current ball has left the plunger once (ball save is granted once). */
  launched: boolean;
  /** Seconds of ball save left. */
  ballSave: number;
  /** Which drop targets are down. */
  targets: boolean[];
  /** Countdown until a completed bank pops back up (0 = idle). */
  targetReset: number;
  /** Decorative flash timers per bumper. */
  bumperFlash: number[];
  /** Whether the ball is inside the rollover (one score per pass). */
  rolloverInside: boolean;
  /** The desk lamp toggles on every pass over the rollover. */
  lampOn: boolean;
  lampFlash: number;
  /** Event counters, so the UI can react without per-frame allocation. */
  drains: number;
  saves: number;
  banks: number;
  /** Simulated time (seconds) and the real-time accumulator for `advance`. */
  time: number;
  accumulator: number;
}

export const NO_INPUT: PinballInput = Object.freeze({ left: false, right: false, plunger: false });

export function createInitialState(table: TableDef = TABLE): PinballState {
  return {
    status: "playing",
    ball: { x: table.ballStart.x, y: table.ballStart.y, vx: 0, vy: 0 },
    flippers: [
      { angle: table.flippers[0].restAngle, omega: 0 },
      { angle: table.flippers[1].restAngle, omega: 0 },
    ],
    score: 0,
    ballNumber: 1,
    plungerCharge: 0,
    plungerWasHeld: false,
    launched: false,
    ballSave: 0,
    targets: table.targets.map(() => false),
    targetReset: 0,
    bumperFlash: table.bumpers.map(() => 0),
    rolloverInside: false,
    lampOn: false,
    lampFlash: 0,
    drains: 0,
    saves: 0,
    banks: 0,
    time: 0,
    accumulator: 0,
  };
}

export function cloneState(s: PinballState): PinballState {
  return {
    ...s,
    ball: { ...s.ball },
    flippers: [{ ...s.flippers[0] }, { ...s.flippers[1] }],
    targets: [...s.targets],
    bumperFlash: [...s.bumperFlash],
  };
}

/** Whether the ball sits in the plunger lane (the Launch button shows then). */
export function isBallInLane(s: PinballState, table: TableDef = TABLE): boolean {
  return s.status === "playing" && s.ball.x > table.lane.left && s.ball.y > table.lane.top;
}

/** Whether the ball rests on the plunger, ready to be launched. */
export function isBallOnPlunger(s: PinballState, table: TableDef = TABLE): boolean {
  return (
    s.status === "playing" &&
    s.ball.x > table.lane.left &&
    s.ball.x < table.lane.right &&
    s.ball.y >= table.lane.stopperY - 6
  );
}

/** Flipper tip position for a given angle. */
export function flipperTip(table: TableDef, index: 0 | 1, angle: number): { x: number; y: number } {
  const f = table.flippers[index];
  return { x: f.pivot.x + f.length * Math.cos(angle), y: f.pivot.y + f.length * Math.sin(angle) };
}

// --- collision helpers (module scratch, no allocation) ----------------------

const closest = { x: 0, y: 0 };
const normal = { x: 0, y: 0 };
/** Whether the last contact was approaching (vs. merely touching). */
let approached = false;

function closestPointOnSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const abx = bx - ax;
  const aby = by - ay;
  const len2 = abx * abx + aby * aby;
  let t = len2 > 0 ? ((px - ax) * abx + (py - ay) * aby) / len2 : 0;
  if (t < 0) t = 0;
  else if (t > 1) t = 1;
  closest.x = ax + abx * t;
  closest.y = ay + aby * t;
}

/**
 * Resolve the ball against the point `closest` with contact distance `minD`.
 * The surface moves at (svx, svy) (a swinging flipper); the ball's velocity
 * relative to it is reflected along the contact normal with restitution `e`.
 * Returns true on contact (and leaves the normal in `normal`).
 */
function resolveContact(
  ball: Ball,
  minD: number,
  e: number,
  svx: number,
  svy: number,
  fallbackNx: number,
  fallbackNy: number,
): boolean {
  const dx = ball.x - closest.x;
  const dy = ball.y - closest.y;
  const d2 = dx * dx + dy * dy;
  if (d2 >= minD * minD) {
    approached = false;
    return false;
  }
  const d = Math.sqrt(d2);
  if (d < 1e-9) {
    normal.x = fallbackNx;
    normal.y = fallbackNy;
  } else {
    normal.x = dx / d;
    normal.y = dy / d;
  }
  ball.x = closest.x + normal.x * minD;
  ball.y = closest.y + normal.y * minD;
  const rvx = ball.vx - svx;
  const rvy = ball.vy - svy;
  const vn = rvx * normal.x + rvy * normal.y;
  approached = vn < 0;
  if (vn < 0) {
    let bounce = -vn * e;
    if (bounce < REST_SPEED) bounce = 0;
    const tx = rvx - vn * normal.x;
    const ty = rvy - vn * normal.y;
    ball.vx = svx + tx + normal.x * bounce;
    ball.vy = svy + ty + normal.y * bounce;
  }
  return true;
}

function collideSegment(
  ball: Ball,
  r: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  thickness: number,
  e: number,
): boolean {
  closestPointOnSegment(ball.x, ball.y, ax, ay, bx, by);
  const len = Math.hypot(bx - ax, by - ay) || 1;
  return resolveContact(ball, r + thickness, e, 0, 0, -(by - ay) / len, (bx - ax) / len);
}

function clampSpeed(ball: Ball) {
  const sp2 = ball.vx * ball.vx + ball.vy * ball.vy;
  if (sp2 > MAX_SPEED * MAX_SPEED) {
    const k = MAX_SPEED / Math.sqrt(sp2);
    ball.vx *= k;
    ball.vy *= k;
  }
}

function resetBall(s: PinballState, table: TableDef) {
  s.ball.x = table.ballStart.x;
  s.ball.y = table.ballStart.y;
  s.ball.vx = 0;
  s.ball.vy = 0;
  s.plungerCharge = 0;
  s.rolloverInside = false;
}

function updateFlipper(f: FlipperState, def: TableDef["flippers"][number], held: boolean, h: number) {
  const target = held ? def.activeAngle : def.restAngle;
  const speed = held ? FLIPPER_UP_SPEED : FLIPPER_DOWN_SPEED;
  const diff = target - f.angle;
  const maxStep = speed * h;
  if (Math.abs(diff) <= maxStep) {
    f.omega = diff / h;
    f.angle = target;
  } else {
    const dir = diff > 0 ? 1 : -1;
    f.omega = dir * speed;
    f.angle += dir * maxStep;
  }
}

function substep(s: PinballState, input: PinballInput, h: number, table: TableDef) {
  updateFlipper(s.flippers[0], table.flippers[0], input.left, h);
  updateFlipper(s.flippers[1], table.flippers[1], input.right, h);

  const ball = s.ball;
  const r = table.ballRadius;
  ball.vy += GRAVITY * h;
  clampSpeed(ball);
  ball.x += ball.vx * h;
  ball.y += ball.vy * h;

  for (const w of table.walls) {
    collideSegment(ball, r, w.a.x, w.a.y, w.b.x, w.b.y, w.thickness, RESTITUTION_WALL);
  }

  for (let i = 0; i < table.bumpers.length; i++) {
    const b = table.bumpers[i];
    closest.x = b.x;
    closest.y = b.y;
    if (resolveContact(ball, r + b.r, RESTITUTION_BUMPER, 0, 0, 0, -1) && approached) {
      const vn = ball.vx * normal.x + ball.vy * normal.y;
      if (vn < BUMPER_KICK) {
        ball.vx += (BUMPER_KICK - vn) * normal.x;
        ball.vy += (BUMPER_KICK - vn) * normal.y;
      }
      s.score += SCORE_BUMPER;
      s.bumperFlash[i] = FLASH_TIME;
    }
  }

  for (let i = 0; i < table.targets.length; i++) {
    if (s.targets[i]) continue;
    const t = table.targets[i];
    if (collideSegment(ball, r, t.a.x, t.a.y, t.b.x, t.b.y, t.thickness, RESTITUTION_TARGET)) {
      s.targets[i] = true;
      s.score += SCORE_TARGET;
      if (s.targets.every(Boolean)) {
        s.score += SCORE_BANK;
        s.banks += 1;
        s.targetReset = TARGET_RESET_DELAY;
      }
    }
  }

  for (let i = 0 as 0 | 1; i < 2; i = (i + 1) as 0 | 1) {
    const def = table.flippers[i];
    const f = s.flippers[i];
    const tipX = def.pivot.x + def.length * Math.cos(f.angle);
    const tipY = def.pivot.y + def.length * Math.sin(f.angle);
    closestPointOnSegment(ball.x, ball.y, def.pivot.x, def.pivot.y, tipX, tipY);
    // Surface velocity of the swinging bar at the contact point: ω × r.
    const svx = -f.omega * (closest.y - def.pivot.y);
    const svy = f.omega * (closest.x - def.pivot.x);
    resolveContact(ball, r + def.radius, RESTITUTION_FLIPPER, svx, svy, 0, -1);
  }

  clampSpeed(ball);

  const ro = table.rollover;
  const inside = Math.hypot(ball.x - ro.x, ball.y - ro.y) < ro.r + r;
  if (inside && !s.rolloverInside) {
    s.score += SCORE_ROLLOVER;
    s.lampOn = !s.lampOn;
    s.lampFlash = FLASH_TIME;
  }
  s.rolloverInside = inside;
}

function handleDrain(s: PinballState, table: TableDef) {
  if (s.ballSave > 0) {
    s.saves += 1;
    s.ballSave = 0;
    resetBall(s, table);
    return;
  }
  s.drains += 1;
  if (s.ballNumber >= BALLS_PER_GAME) {
    s.status = "over";
    s.ball.vx = 0;
    s.ball.vy = 0;
    s.plungerCharge = 0;
    return;
  }
  s.ballNumber += 1;
  s.launched = false;
  resetBall(s, table);
}

/** Advance exactly one fixed step (`FIXED_DT`). Mutates `s`. */
export function tick(s: PinballState, input: PinballInput, table: TableDef = TABLE): void {
  const dt = FIXED_DT;
  s.time += dt;

  for (let i = 0; i < s.bumperFlash.length; i++) {
    if (s.bumperFlash[i] > 0) s.bumperFlash[i] = Math.max(0, s.bumperFlash[i] - dt);
  }
  if (s.lampFlash > 0) s.lampFlash = Math.max(0, s.lampFlash - dt);
  if (s.targetReset > 0) {
    s.targetReset = Math.max(0, s.targetReset - dt);
    if (s.targetReset === 0) s.targets.fill(false);
  }

  if (s.status === "over") {
    // Flippers still respond on the empty table; nothing else moves.
    updateFlipper(s.flippers[0], table.flippers[0], input.left, dt);
    updateFlipper(s.flippers[1], table.flippers[1], input.right, dt);
    s.plungerWasHeld = input.plunger;
    return;
  }

  if (s.ballSave > 0) s.ballSave = Math.max(0, s.ballSave - dt);

  // Plunger: hold to charge while the ball rests on it, release to launch.
  const onPlunger = isBallOnPlunger(s, table);
  if (input.plunger && onPlunger) {
    s.plungerCharge = Math.min(1, s.plungerCharge + dt / PLUNGER_CHARGE_TIME);
  } else if (!input.plunger && s.plungerWasHeld && onPlunger && s.plungerCharge > 0) {
    s.ball.vx = 0;
    s.ball.vy = -(PLUNGER_MIN_SPEED + s.plungerCharge * (PLUNGER_MAX_SPEED - PLUNGER_MIN_SPEED));
    s.plungerCharge = 0;
    if (!s.launched) {
      s.launched = true;
      s.ballSave = BALL_SAVE_TIME;
    }
  } else if (!onPlunger) {
    s.plungerCharge = 0;
  }
  s.plungerWasHeld = input.plunger;

  const h = dt / SUBSTEPS;
  for (let i = 0; i < SUBSTEPS; i++) {
    // While charging, the ball sits still on the pulled-back plunger.
    if (input.plunger && s.plungerCharge > 0 && isBallOnPlunger(s, table)) {
      s.ball.vx = 0;
      s.ball.vy = 0;
      updateFlipper(s.flippers[0], table.flippers[0], input.left, h);
      updateFlipper(s.flippers[1], table.flippers[1], input.right, h);
      continue;
    }
    substep(s, input, h, table);
    if (s.ball.y > table.drainY) {
      handleDrain(s, table);
      break;
    }
  }
}

/**
 * Accumulate `elapsed` real seconds (clamped to `MAX_FRAME`) and run as many
 * fixed ticks as fit. Mutates `s`; returns the number of ticks run.
 */
export function advance(
  s: PinballState,
  input: PinballInput,
  elapsed: number,
  table: TableDef = TABLE,
): number {
  const frame = Number.isFinite(elapsed) && elapsed > 0 ? Math.min(elapsed, MAX_FRAME) : 0;
  s.accumulator += frame;
  let ticks = 0;
  while (s.accumulator >= FIXED_DT - 1e-9) {
    tick(s, input, table);
    s.accumulator -= FIXED_DT;
    ticks++;
  }
  if (s.accumulator < 0) s.accumulator = 0;
  return ticks;
}

/** Pure step: returns a new state advanced by `dt` seconds of real time. */
export function step(
  state: PinballState,
  input: PinballInput,
  dt: number,
  table: TableDef = TABLE,
): PinballState {
  const next = cloneState(state);
  advance(next, input, dt, table);
  return next;
}
