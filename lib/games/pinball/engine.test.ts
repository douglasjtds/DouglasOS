import { describe, expect, it } from "vitest";
import {
  advance,
  BALL_SAVE_TIME,
  BALLS_PER_GAME,
  createInitialState,
  FIXED_DT,
  GRAVITY,
  isBallInLane,
  isBallOnPlunger,
  MAX_FRAME,
  NO_INPUT,
  PLUNGER_MAX_SPEED,
  PLUNGER_MIN_SPEED,
  SCORE_BANK,
  SCORE_BUMPER,
  SCORE_ROLLOVER,
  SCORE_TARGET,
  step,
  tick,
  TARGET_RESET_DELAY,
  type PinballInput,
  type PinballState,
} from "./engine";
import { TABLE, type TableDef } from "./table";

/** A table with nothing on it (and a far-away drain) to isolate one mechanic. */
function emptyTable(overrides: Partial<TableDef> = {}): TableDef {
  return {
    ...TABLE,
    walls: [],
    bumpers: [],
    targets: [],
    rollover: { x: -1000, y: -1000, r: 1 },
    drainY: 100_000,
    ...overrides,
  };
}

function place(s: PinballState, x: number, y: number, vx = 0, vy = 0) {
  s.ball.x = x;
  s.ball.y = y;
  s.ball.vx = vx;
  s.ball.vy = vy;
  s.launched = true;
}

function run(s: PinballState, input: PinballInput, ticks: number, table: TableDef = TABLE) {
  for (let i = 0; i < ticks; i++) tick(s, input, table);
}

const PLUNGER: PinballInput = { left: false, right: false, plunger: true };

describe("pinball engine", () => {
  it("starts with the ball on the plunger, ball 1, no score", () => {
    const s = createInitialState();
    expect(s.status).toBe("playing");
    expect(s.ballNumber).toBe(1);
    expect(s.score).toBe(0);
    expect(isBallOnPlunger(s)).toBe(true);
    expect(isBallInLane(s)).toBe(true);
    expect(s.targets.every((d) => !d)).toBe(true);
  });

  it("is deterministic: the same inputs give the same state", () => {
    const script = (): PinballState => {
      let s = createInitialState();
      for (let i = 0; i < 90; i++) s = step(s, PLUNGER, FIXED_DT);
      for (let i = 0; i < 600; i++) {
        const input = { left: i % 40 < 10, right: i % 50 < 12, plunger: false };
        s = step(s, input, FIXED_DT);
      }
      return s;
    };
    expect(script()).toEqual(script());
  });

  it("step is pure: it doesn't mutate its input state", () => {
    const s = createInitialState();
    const before = JSON.stringify(s);
    step(s, PLUNGER, 0.05);
    expect(JSON.stringify(s)).toBe(before);
  });

  it("the ball falls under gravity", () => {
    const table = emptyTable();
    const s = createInitialState(table);
    place(s, 200, 100);
    run(s, NO_INPUT, 120, table);
    expect(s.ball.vy).toBeCloseTo(GRAVITY * 1, 0);
    expect(s.ball.y).toBeGreaterThan(100 + 0.4 * GRAVITY);
    expect(s.ball.x).toBe(200);
  });

  it("reflects off a wall with restitution (loses energy, reverses)", () => {
    const table = emptyTable({ walls: [{ a: { x: 0, y: 400 }, b: { x: 400, y: 400 }, thickness: 2 }] });
    const s = createInitialState(table);
    place(s, 200, 370, 0, 600);
    let incoming = 0;
    for (let i = 0; i < 60 && s.ball.vy >= 0; i++) {
      incoming = s.ball.vy;
      tick(s, NO_INPUT, table);
    }
    expect(s.ball.vy).toBeLessThan(0);
    expect(-s.ball.vy).toBeLessThan(incoming * 0.7);
    expect(-s.ball.vy).toBeGreaterThan(incoming * 0.3);
    expect(s.ball.y).toBeLessThanOrEqual(400 - 2 - table.ballRadius + 1e-6);
  });

  it("a bumper scores and kicks the ball outward", () => {
    const table = emptyTable({ bumpers: [{ x: 200, y: 300, r: 20 }] });
    const s = createInitialState(table);
    place(s, 200, 265, 0, 100);
    run(s, NO_INPUT, 20, table);
    expect(s.score).toBe(SCORE_BUMPER);
    expect(s.ball.vy).toBeLessThan(-300);
    expect(s.ball.y).toBeLessThan(300 - 20 - table.ballRadius);
    expect(s.bumperFlash[0]).toBeGreaterThanOrEqual(0);
  });

  it("an active flipper launches a resting ball upward", () => {
    const table = emptyTable();
    const s = createInitialState(table);
    const f = table.flippers[0];
    const along = 45;
    const dirX = Math.cos(f.restAngle);
    const dirY = Math.sin(f.restAngle);
    // Sit the ball on top of the bar (the normal pointing up-right of the bar).
    const nx = dirY;
    const ny = -dirX;
    const gap = table.ballRadius + f.radius;
    place(s, f.pivot.x + dirX * along + nx * gap, f.pivot.y + dirY * along + ny * gap);
    run(s, { left: true, right: false, plunger: false }, 12, table);
    expect(s.ball.vy).toBeLessThan(-300);
    expect(s.flippers[0].angle).toBeCloseTo(f.activeAngle, 5);
  });

  it("a released flipper doesn't launch the ball", () => {
    const table = emptyTable();
    const s = createInitialState(table);
    expect(s.flippers[1].angle).toBe(table.flippers[1].restAngle);
    run(s, NO_INPUT, 30, table);
    expect(s.flippers[0].omega).toBe(0);
    expect(s.flippers[1].omega).toBe(0);
  });

  it("the plunger charges while held and launches on release in proportion", () => {
    const half = createInitialState();
    run(half, PLUNGER, 60);
    expect(half.plungerCharge).toBeCloseTo(0.5, 1);
    expect(isBallOnPlunger(half)).toBe(true);
    const charge = half.plungerCharge;
    tick(half, NO_INPUT);
    expect(half.launched).toBe(true);
    expect(half.ballSave).toBeCloseTo(BALL_SAVE_TIME, 1);
    const expected = PLUNGER_MIN_SPEED + charge * (PLUNGER_MAX_SPEED - PLUNGER_MIN_SPEED);
    expect(-half.ball.vy).toBeGreaterThan(expected * 0.9);
    expect(-half.ball.vy).toBeLessThanOrEqual(expected);

    const full = createInitialState();
    run(full, PLUNGER, 200);
    expect(full.plungerCharge).toBe(1);
    tick(full, NO_INPUT);
    expect(-full.ball.vy).toBeGreaterThan(-half.ball.vy);
    // A full launch reaches the top of the table and leaves the lane.
    let minY = full.ball.y;
    for (let i = 0; i < 240; i++) {
      tick(full, NO_INPUT);
      minY = Math.min(minY, full.ball.y);
    }
    expect(minY).toBeLessThan(120);
    expect(full.ball.x).toBeLessThan(TABLE.lane.left);
  });

  it("draining decrements balls and ends the game after the last one", () => {
    const s = createInitialState();
    for (let n = 1; n <= BALLS_PER_GAME; n++) {
      expect(s.ballNumber).toBe(n);
      place(s, 185, TABLE.drainY - 1, 0, 400);
      tick(s, NO_INPUT);
      expect(s.drains).toBe(n);
      if (n < BALLS_PER_GAME) {
        expect(s.status).toBe("playing");
        expect(isBallOnPlunger(s)).toBe(true);
        expect(s.launched).toBe(false);
      }
    }
    expect(s.status).toBe("over");
    expect(s.ballNumber).toBe(BALLS_PER_GAME);
    // Nothing more happens once the game is over.
    const score = s.score;
    run(s, PLUNGER, 30);
    expect(s.score).toBe(score);
    expect(s.status).toBe("over");
  });

  it("ball save returns a ball drained right after launch", () => {
    const s = createInitialState();
    run(s, PLUNGER, 30);
    tick(s, NO_INPUT);
    place(s, 185, TABLE.drainY - 1, 0, 400);
    tick(s, NO_INPUT);
    expect(s.saves).toBe(1);
    expect(s.drains).toBe(0);
    expect(s.ballNumber).toBe(1);
    expect(isBallOnPlunger(s)).toBe(true);
  });

  it("dropping the whole target bank pays a bonus and resets it", () => {
    const table = emptyTable({ targets: TABLE.targets });
    const s = createInitialState(table);
    s.targets = [true, true, true, false];
    const last = table.targets[3];
    const cx = (last.a.x + last.b.x) / 2;
    place(s, cx, last.a.y + 20, 0, -500);
    run(s, NO_INPUT, 10, table);
    expect(s.score).toBe(SCORE_TARGET + SCORE_BANK);
    expect(s.banks).toBe(1);
    expect(s.targets.every(Boolean)).toBe(true);
    expect(s.ball.vy).toBeGreaterThan(0);
    run(s, NO_INPUT, Math.ceil(TARGET_RESET_DELAY / FIXED_DT) + 1, table);
    expect(s.targets.every((d) => !d)).toBe(true);
  });

  it("a single dropped target scores without a bonus", () => {
    const table = emptyTable({ targets: TABLE.targets });
    const s = createInitialState(table);
    const t = table.targets[0];
    place(s, (t.a.x + t.b.x) / 2, t.a.y + 20, 0, -500);
    run(s, NO_INPUT, 10, table);
    expect(s.targets).toEqual([true, false, false, false]);
    expect(s.score).toBe(SCORE_TARGET);
    expect(s.banks).toBe(0);
  });

  it("the rollover scores once per pass and toggles the lamp", () => {
    const table = emptyTable({ rollover: { x: 200, y: 300, r: 12 } });
    const s = createInitialState(table);
    place(s, 200, 250, 0, 300);
    run(s, NO_INPUT, 60, table);
    expect(s.score).toBe(SCORE_ROLLOVER);
    expect(s.lampOn).toBe(true);
  });

  it("doesn't tunnel through a wall at maximum speed", () => {
    const table = emptyTable({
      walls: [
        { a: { x: 100, y: -1000 }, b: { x: 100, y: 2000 }, thickness: 2 },
        { a: { x: -1000, y: 600 }, b: { x: 1000, y: 600 }, thickness: 2 },
      ],
    });
    const s = createInitialState(table);
    place(s, 140, 200, -50_000, 50_000);
    for (let i = 0; i < 240; i++) {
      tick(s, NO_INPUT, table);
      expect(s.ball.x).toBeGreaterThan(100);
      expect(s.ball.y).toBeLessThan(600);
    }
  });

  it("advance accumulates real time and clamps long gaps", () => {
    const s = createInitialState();
    expect(advance(s, NO_INPUT, FIXED_DT / 2)).toBe(0);
    expect(advance(s, NO_INPUT, FIXED_DT / 2)).toBe(1);
    const ticks = advance(s, NO_INPUT, 10);
    expect(ticks).toBeLessThanOrEqual(Math.round(MAX_FRAME / FIXED_DT) + 1);
    expect(advance(s, NO_INPUT, Number.NaN)).toBe(0);
  });

  it("the ball stays inside the table during random play", () => {
    let s = createInitialState();
    for (let i = 0; i < 100; i++) s = step(s, PLUNGER, FIXED_DT);
    for (let i = 0; i < 6000 && s.status === "playing"; i++) {
      tick(s, { left: i % 70 < 15, right: (i + 30) % 70 < 15, plunger: i % 300 < 100 });
      expect(s.ball.x).toBeGreaterThan(18);
      expect(s.ball.x).toBeLessThan(382);
      expect(s.ball.y).toBeGreaterThan(8);
    }
  });
});
