/**
 * "Night Shift" — the original DouglasOS pinball table (stage 12).
 *
 * A top-down 2D table in logical units (1 unit = 1 CSS px at scale 1, y grows
 * downwards). The theme is a late-night desk: coffee-mug bumpers, a row of
 * keyboard-key drop targets spelling C-O-D-E and a desk-lamp rollover. Pure
 * data: the engine (`engine.ts`) simulates it, the canvas only draws it.
 */

export interface Vec {
  x: number;
  y: number;
}

/** A static wall: a capsule from `a` to `b` with half-thickness `thickness`. */
export interface Segment {
  a: Vec;
  b: Vec;
  thickness: number;
}

export interface Bumper {
  x: number;
  y: number;
  r: number;
}

/** A keyboard-key drop target: a horizontal capsule that drops when hit. */
export interface DropTarget {
  label: string;
  a: Vec;
  b: Vec;
  thickness: number;
}

export interface Flipper {
  pivot: Vec;
  length: number;
  /** Capsule radius of the flipper bar. */
  radius: number;
  /** Direction angle (radians, y-down) while released. */
  restAngle: number;
  /** Direction angle while held. */
  activeAngle: number;
}

export interface Rollover {
  x: number;
  y: number;
  r: number;
}

export interface PlungerLane {
  /** The lane spans `left < x < right`; the ball rests on the stopper at `stopperY`. */
  left: number;
  right: number;
  stopperY: number;
  /** The lane is considered "the lane" below this y (for the Launch button). */
  top: number;
}

export interface TableDef {
  width: number;
  height: number;
  ballRadius: number;
  walls: Segment[];
  bumpers: Bumper[];
  targets: DropTarget[];
  flippers: [Flipper, Flipper];
  rollover: Rollover;
  lane: PlungerLane;
  /** Where a fresh ball sits (on the plunger stopper). */
  ballStart: Vec;
  /** A ball whose center passes this y has drained. */
  drainY: number;
}

export const TABLE_WIDTH = 400;
export const TABLE_HEIGHT = 700;
const WALL = 2;

function seg(ax: number, ay: number, bx: number, by: number, thickness = WALL): Segment {
  return { a: { x: ax, y: ay }, b: { x: bx, y: by }, thickness };
}

/** Approximate an arc with straight segments (angles in radians, y-down). */
export function arcSegments(
  cx: number,
  cy: number,
  r: number,
  from: number,
  to: number,
  pieces: number,
  thickness = WALL,
): Segment[] {
  const out: Segment[] = [];
  for (let i = 0; i < pieces; i++) {
    const t0 = from + ((to - from) * i) / pieces;
    const t1 = from + ((to - from) * (i + 1)) / pieces;
    out.push(
      seg(cx + r * Math.cos(t0), cy + r * Math.sin(t0), cx + r * Math.cos(t1), cy + r * Math.sin(t1), thickness),
    );
  }
  return out;
}

const LANE_LEFT = 350;
const LANE_RIGHT = 380;
const STOPPER_Y = 670;
const BALL_RADIUS = 8;

const FLIPPER_REST = 0.5;
const FLIPPER_ACTIVE = -0.45;

export const TABLE: TableDef = {
  width: TABLE_WIDTH,
  height: TABLE_HEIGHT,
  ballRadius: BALL_RADIUS,
  walls: [
    // Left wall and the top-left curve.
    seg(20, 500, 20, 90),
    ...arcSegments(100, 90, 80, Math.PI, Math.PI * 1.5, 8),
    // Ceiling and the top-right curve that feeds the plunger lane into play.
    seg(100, 10, 300, 10),
    ...arcSegments(300, 90, 80, -Math.PI / 2, 0, 8),
    // Outer right wall, the plunger lane divider and the stopper.
    seg(LANE_RIGHT, 90, LANE_RIGHT, 700),
    seg(LANE_LEFT, 170, LANE_LEFT, 700),
    // The ball's center rests exactly on `STOPPER_Y`.
    seg(LANE_LEFT, STOPPER_Y + BALL_RADIUS + WALL, LANE_RIGHT, STOPPER_Y + BALL_RADIUS + WALL),
    // Guides that roll the ball onto each flipper.
    seg(20, 500, 109, 597, 3),
    seg(LANE_LEFT, 500, 261, 597, 3),
    // Short posts beside the bumper cluster (desk-organizer pens).
    seg(60, 300, 60, 360, 3),
    seg(310, 300, 310, 360, 3),
  ],
  bumpers: [
    { x: 120, y: 220, r: 22 },
    { x: 250, y: 220, r: 22 },
    { x: 185, y: 310, r: 22 },
  ],
  targets: ["C", "O", "D", "E"].map((label, i) => {
    const cx = 125 + i * 40;
    return { label, a: { x: cx - 13, y: 120 }, b: { x: cx + 13, y: 120 }, thickness: 5 };
  }),
  flippers: [
    { pivot: { x: 115, y: 605 }, length: 62, radius: 6, restAngle: FLIPPER_REST, activeAngle: FLIPPER_ACTIVE },
    {
      pivot: { x: 255, y: 605 },
      length: 62,
      radius: 6,
      restAngle: Math.PI - FLIPPER_REST,
      activeAngle: Math.PI - FLIPPER_ACTIVE,
    },
  ],
  rollover: { x: 55, y: 190, r: 12 },
  lane: { left: LANE_LEFT, right: LANE_RIGHT, stopperY: STOPPER_Y, top: 180 },
  ballStart: { x: (LANE_LEFT + LANE_RIGHT) / 2, y: STOPPER_Y },
  drainY: 720,
};
