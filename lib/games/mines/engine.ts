/**
 * Mines engine (stage 12): a pure, immutable minefield. Every action returns
 * a new game, or the very same object when nothing changed (so the UI can
 * skip renders). Mines are placed on the first reveal, seeded, away from
 * the first cell and its neighbors, so the opening move is always safe.
 */
import { createRng, randomInt, type Rng } from "@/lib/games/rng";

export interface MinesConfig {
  rows: number;
  cols: number;
  mines: number;
}

export type Difficulty = "beginner" | "intermediate" | "expert";

export const DIFFICULTIES: Record<Difficulty, MinesConfig> = {
  beginner: { rows: 9, cols: 9, mines: 10 },
  intermediate: { rows: 16, cols: 16, mines: 40 },
  expert: { rows: 16, cols: 30, mines: 99 },
};

export const DIFFICULTY_IDS = Object.keys(DIFFICULTIES) as Difficulty[];

export type CellState = "hidden" | "flagged" | "question" | "revealed";

export interface MinesCell {
  mine: boolean;
  /** Mines in the 8 surrounding cells. */
  adjacent: number;
  state: CellState;
}

/** `ready` = no mines placed yet (before the first reveal). */
export type MinesStatus = "ready" | "playing" | "won" | "lost";

export interface MinesGame {
  config: MinesConfig;
  /** Seeds the mine layout on the first reveal. */
  seed: number;
  /** Row-major: index = row * cols + col. */
  cells: readonly MinesCell[];
  status: MinesStatus;
  /** The mine that ended the game. */
  exploded: number | null;
  revealed: number;
  flags: number;
  /** Whether the flag cycle includes the "?" mark. */
  questionMarks: boolean;
}

export function indexOf(config: MinesConfig, row: number, col: number): number {
  return row * config.cols + col;
}

export function neighbors(config: MinesConfig, index: number): number[] {
  const row = Math.floor(index / config.cols);
  const col = index % config.cols;
  const out: number[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < config.rows && c >= 0 && c < config.cols) out.push(r * config.cols + c);
    }
  }
  return out;
}

/** A hidden board with mines at the given indices and adjacency counts. */
export function boardFromMines(config: MinesConfig, mines: Iterable<number>): MinesCell[] {
  const cells: MinesCell[] = Array.from({ length: config.rows * config.cols }, () => ({
    mine: false,
    adjacent: 0,
    state: "hidden",
  }));
  for (const m of mines) cells[m].mine = true;
  cells.forEach((cell, i) => {
    cell.adjacent = neighbors(config, i).reduce((n, j) => n + (cells[j].mine ? 1 : 0), 0);
  });
  return cells;
}

/**
 * Seeded mine layout that keeps `firstCell` and its neighbors clear (only
 * `firstCell` when the board is too dense for that).
 */
export function createBoard(config: MinesConfig, firstCell: number, rng: Rng): MinesCell[] {
  const total = config.rows * config.cols;
  if (config.mines < 0 || config.mines >= total) {
    throw new Error(`Invalid mines config: ${config.mines} mines on ${total} cells`);
  }
  let excluded = new Set([firstCell, ...neighbors(config, firstCell)]);
  if (total - excluded.size < config.mines) excluded = new Set([firstCell]);
  const candidates: number[] = [];
  for (let i = 0; i < total; i++) if (!excluded.has(i)) candidates.push(i);
  // Partial Fisher–Yates: the first `mines` slots become the mines.
  for (let i = 0; i < config.mines; i++) {
    const j = i + randomInt(rng, candidates.length - i);
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  return boardFromMines(config, candidates.slice(0, config.mines));
}

export function newGame(
  config: MinesConfig,
  seed: number,
  { questionMarks = false }: { questionMarks?: boolean } = {},
): MinesGame {
  return {
    config,
    seed,
    cells: boardFromMines(config, []),
    status: "ready",
    exploded: null,
    revealed: 0,
    flags: 0,
    questionMarks,
  };
}

export function minesLeft(game: MinesGame): number {
  return game.config.mines - game.flags;
}

function isOver(game: MinesGame): boolean {
  return game.status === "won" || game.status === "lost";
}

/** Opens `starts` (flood-filling zeros) on a board that already has mines. */
function open(game: MinesGame, starts: number[]): MinesGame {
  const cells = game.cells.map((c) => ({ ...c }));
  let revealed = game.revealed;
  let exploded: number | null = null;
  const stack: number[] = [];
  for (const start of starts) {
    const cell = cells[start];
    if (cell.state === "revealed" || cell.state === "flagged") continue;
    if (cell.mine) {
      cell.state = "revealed";
      if (exploded === null) exploded = start;
      continue;
    }
    stack.push(start);
  }
  while (stack.length > 0) {
    const i = stack.pop()!;
    const cell = cells[i];
    if (cell.state === "revealed" || cell.state === "flagged" || cell.mine) continue;
    cell.state = "revealed";
    revealed++;
    if (cell.adjacent === 0) {
      for (const n of neighbors(game.config, i)) {
        if (cells[n].state !== "revealed" && cells[n].state !== "flagged") stack.push(n);
      }
    }
  }
  if (exploded !== null) {
    return { ...game, cells, revealed, status: "lost", exploded };
  }
  const total = game.config.rows * game.config.cols;
  if (revealed === total - game.config.mines) {
    for (const cell of cells) if (cell.mine) cell.state = "flagged";
    return { ...game, cells, revealed, status: "won", flags: game.config.mines };
  }
  return { ...game, cells, revealed, status: "playing" };
}

export function reveal(game: MinesGame, index: number): MinesGame {
  if (isOver(game)) return game;
  const target = game.cells[index];
  if (!target || target.state === "revealed" || target.state === "flagged") return game;
  let current = game;
  if (game.status === "ready") {
    const board = createBoard(game.config, index, createRng(game.seed));
    // Keep any flag / "?" placed before the first reveal.
    board.forEach((cell, i) => {
      cell.state = game.cells[i].state;
    });
    current = { ...game, cells: board, status: "playing" };
  }
  return open(current, [index]);
}

export function toggleFlag(game: MinesGame, index: number): MinesGame {
  if (isOver(game)) return game;
  const cell = game.cells[index];
  if (!cell || cell.state === "revealed") return game;
  let state: CellState;
  let flags = game.flags;
  if (cell.state === "hidden") {
    state = "flagged";
    flags++;
  } else if (cell.state === "flagged") {
    state = game.questionMarks ? "question" : "hidden";
    flags--;
  } else {
    state = "hidden";
  }
  const cells = game.cells.slice();
  cells[index] = { ...cell, state };
  return { ...game, cells, flags };
}

/**
 * On a revealed number whose adjacent flags equal it, opens every other
 * hidden neighbor (a wrong flag means hitting a mine).
 */
export function chord(game: MinesGame, index: number): MinesGame {
  if (game.status !== "playing") return game;
  const cell = game.cells[index];
  if (!cell || cell.state !== "revealed" || cell.adjacent === 0) return game;
  const around = neighbors(game.config, index);
  const flagged = around.filter((n) => game.cells[n].state === "flagged").length;
  if (flagged !== cell.adjacent) return game;
  const targets = around.filter((n) => game.cells[n].state === "hidden" || game.cells[n].state === "question");
  if (targets.length === 0) return game;
  return open(game, targets);
}

/** The primary action on a cell: reveal it, or chord when it is a revealed number. */
export function activate(game: MinesGame, index: number): MinesGame {
  return game.cells[index]?.state === "revealed" ? chord(game, index) : reveal(game, index);
}

export function setQuestionMarks(game: MinesGame, on: boolean): MinesGame {
  if (game.questionMarks === on) return game;
  const cells = on
    ? game.cells
    : game.cells.map((c) => (c.state === "question" ? { ...c, state: "hidden" as const } : c));
  return { ...game, cells, questionMarks: on };
}
