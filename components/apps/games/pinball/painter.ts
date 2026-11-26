import type { PinballState } from "@/lib/games/pinball/engine";
import { TABLE, type TableDef } from "@/lib/games/pinball/table";

/** Canvas colors, read once from the `--color-pinball-*` tokens. */
export interface PinballColors {
  table: string;
  tableGlow: string;
  wall: string;
  ball: string;
  flipper: string;
  bumper: string;
  bumperLit: string;
  target: string;
  text: string;
  font: string;
}

const TOKENS: Record<Exclude<keyof PinballColors, "font">, string> = {
  table: "--color-pinball-table",
  tableGlow: "--color-pinball-table-glow",
  wall: "--color-pinball-wall",
  ball: "--color-pinball-ball",
  flipper: "--color-pinball-flipper",
  bumper: "--color-pinball-bumper",
  bumperLit: "--color-pinball-bumper-lit",
  target: "--color-pinball-target",
  text: "--color-pinball-text",
};

/** Resolve the pinball tokens from the element's computed style. */
export function readPinballColors(el: Element): PinballColors {
  const style = getComputedStyle(el);
  const read = (name: string) => style.getPropertyValue(name).trim();
  const colors = { font: read("--font-mono") } as PinballColors;
  for (const key of Object.keys(TOKENS) as (keyof typeof TOKENS)[]) colors[key] = read(TOKENS[key]);
  return colors;
}

/**
 * Builds a draw function for one 2D context. The caller sets the transform
 * (logical table units → device pixels); the painter caches what it can
 * (the background gradient) so a frame allocates next to nothing.
 * `reduced` turns off decorative flashes (reduced motion).
 */
export function createPainter(ctx: CanvasRenderingContext2D, colors: PinballColors, table: TableDef = TABLE) {
  let background: CanvasGradient | string = colors.table;
  if (typeof ctx.createRadialGradient === "function") {
    const g = ctx.createRadialGradient(185, 320, 20, 185, 320, 420);
    if (g && colors.tableGlow && colors.table) {
      g.addColorStop(0, colors.tableGlow);
      g.addColorStop(1, colors.table);
      background = g;
    }
  }
  const keyFont = `bold 12px ${colors.font || "monospace"}`;
  const r = table.ballRadius;

  function line(ax: number, ay: number, bx: number, by: number) {
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }

  function circle(x: number, y: number, radius: number) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
  }

  return function draw(s: PinballState, reduced: boolean) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, table.width, table.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Walls.
    ctx.strokeStyle = colors.wall;
    for (const w of table.walls) {
      ctx.lineWidth = Math.max(3, w.thickness * 2);
      line(w.a.x, w.a.y, w.b.x, w.b.y);
    }

    // Desk-lamp rollover.
    const ro = table.rollover;
    ctx.lineWidth = 2;
    ctx.strokeStyle = colors.bumperLit;
    if (!reduced && s.lampFlash > 0) {
      ctx.fillStyle = colors.tableGlow;
      circle(ro.x, ro.y, ro.r + 8);
      ctx.fill();
    }
    circle(ro.x, ro.y, ro.r);
    ctx.fillStyle = s.lampOn ? colors.bumperLit : colors.table;
    ctx.fill();
    ctx.stroke();
    // Lamp shade above the bulb.
    ctx.fillStyle = colors.wall;
    ctx.beginPath();
    ctx.moveTo(ro.x - ro.r, ro.y - ro.r - 2);
    ctx.lineTo(ro.x + ro.r, ro.y - ro.r - 2);
    ctx.lineTo(ro.x + ro.r * 0.5, ro.y - ro.r - 12);
    ctx.lineTo(ro.x - ro.r * 0.5, ro.y - ro.r - 12);
    ctx.closePath();
    ctx.fill();

    // Coffee-mug bumpers: body, coffee inside, handle on the right.
    for (let i = 0; i < table.bumpers.length; i++) {
      const b = table.bumpers[i];
      const lit = !reduced && s.bumperFlash[i] > 0;
      ctx.lineWidth = 4;
      ctx.strokeStyle = lit ? colors.bumperLit : colors.bumper;
      ctx.beginPath();
      ctx.arc(b.x + b.r, b.y, b.r * 0.45, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
      circle(b.x, b.y, b.r);
      ctx.fillStyle = lit ? colors.bumperLit : colors.bumper;
      ctx.fill();
      circle(b.x, b.y, b.r * 0.62);
      ctx.fillStyle = colors.table;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = colors.text;
      circle(b.x, b.y, b.r);
      ctx.stroke();
    }

    // Keyboard-key drop targets (C-O-D-E).
    ctx.font = keyFont;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let i = 0; i < table.targets.length; i++) {
      const t = table.targets[i];
      const x = t.a.x - t.thickness;
      const w = t.b.x - t.a.x + t.thickness * 2;
      const y = t.a.y - t.thickness - 3;
      const h = t.thickness * 2 + 6;
      if (s.targets[i]) {
        ctx.lineWidth = 1;
        ctx.strokeStyle = colors.target;
        ctx.strokeRect(x, y, w, h);
      } else {
        ctx.fillStyle = colors.target;
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = colors.text;
        ctx.fillText(t.label, (t.a.x + t.b.x) / 2, t.a.y + 1);
      }
    }

    // Plunger, pulled back by the charge.
    const lane = table.lane;
    const plungerTop = lane.stopperY + r + 4 + s.plungerCharge * 16;
    ctx.fillStyle = colors.flipper;
    ctx.fillRect(lane.left + 6, plungerTop, lane.right - lane.left - 12, table.height - plungerTop);

    // Flippers.
    ctx.strokeStyle = colors.flipper;
    for (let i = 0; i < 2; i++) {
      const f = table.flippers[i];
      const angle = s.flippers[i].angle;
      ctx.lineWidth = f.radius * 2;
      line(f.pivot.x, f.pivot.y, f.pivot.x + f.length * Math.cos(angle), f.pivot.y + f.length * Math.sin(angle));
      circle(f.pivot.x, f.pivot.y, 2.5);
      ctx.fillStyle = colors.table;
      ctx.fill();
    }

    // Ball.
    if (s.status === "playing") {
      circle(s.ball.x, s.ball.y, r);
      ctx.fillStyle = colors.ball;
      ctx.fill();
    }
  };
}
