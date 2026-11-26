import { describe, expect, it } from "vitest";
import { createRng } from "@/lib/games/rng";
import {
  DIFFICULTIES,
  activate,
  boardFromMines,
  chord,
  createBoard,
  indexOf,
  minesLeft,
  neighbors,
  newGame,
  reveal,
  setQuestionMarks,
  toggleFlag,
  type MinesConfig,
  type MinesGame,
} from "./engine";

/** A game in progress on a hand-made layout (`*` = mine, `.` = safe). */
function fromLayout(rows: string[], questionMarks = false): MinesGame {
  const config: MinesConfig = {
    rows: rows.length,
    cols: rows[0].length,
    mines: rows.join("").split("").filter((c) => c === "*").length,
  };
  const mines: number[] = [];
  rows.forEach((row, r) =>
    row.split("").forEach((c, col) => {
      if (c === "*") mines.push(r * config.cols + col);
    }),
  );
  return { ...newGame(config, 1, { questionMarks }), cells: boardFromMines(config, mines), status: "playing" };
}

const states = (game: MinesGame) => game.cells.map((c) => c.state);

describe("difficulties", () => {
  it("match the classic sizes", () => {
    expect(DIFFICULTIES.beginner).toEqual({ rows: 9, cols: 9, mines: 10 });
    expect(DIFFICULTIES.intermediate).toEqual({ rows: 16, cols: 16, mines: 40 });
    expect(DIFFICULTIES.expert).toEqual({ rows: 16, cols: 30, mines: 99 });
  });
});

describe("neighbors", () => {
  const config = { rows: 3, cols: 4, mines: 1 };
  it("lists the 8 surrounding cells inside the board", () => {
    expect(neighbors(config, indexOf(config, 1, 1)).sort((a, b) => a - b)).toEqual([0, 1, 2, 4, 6, 8, 9, 10]);
  });
  it("clips at corners and edges", () => {
    expect(neighbors(config, 0).sort((a, b) => a - b)).toEqual([1, 4, 5]);
    expect(neighbors(config, 11).sort((a, b) => a - b)).toEqual([6, 7, 10]);
  });
});

describe("boardFromMines", () => {
  it("counts adjacent mines", () => {
    const game = fromLayout(["*..", "...", "..*"]);
    expect(game.cells.map((c) => (c.mine ? "*" : String(c.adjacent))).join("")).toBe("*10121" + "01*");
  });
});

describe("createBoard", () => {
  it("places exactly the configured number of mines", () => {
    for (const config of Object.values(DIFFICULTIES)) {
      const cells = createBoard(config, 0, createRng(42));
      expect(cells).toHaveLength(config.rows * config.cols);
      expect(cells.filter((c) => c.mine)).toHaveLength(config.mines);
      expect(cells.every((c) => c.state === "hidden")).toBe(true);
    }
  });

  it("never mines the first cell or its neighbors", () => {
    for (const config of Object.values(DIFFICULTIES)) {
      for (let seed = 0; seed < 200; seed++) {
        const first = seed % (config.rows * config.cols);
        const cells = createBoard(config, first, createRng(seed));
        expect(cells[first].mine).toBe(false);
        for (const n of neighbors(config, first)) expect(cells[n].mine).toBe(false);
      }
    }
  });

  it("falls back to excluding only the first cell when the board is too dense", () => {
    const config = { rows: 3, cols: 3, mines: 8 };
    const cells = createBoard(config, 4, createRng(7));
    expect(cells[4].mine).toBe(false);
    expect(cells.filter((c) => c.mine)).toHaveLength(8);
  });

  it("is deterministic for a seed", () => {
    const a = createBoard(DIFFICULTIES.expert, 100, createRng(1234));
    const b = createBoard(DIFFICULTIES.expert, 100, createRng(1234));
    const c = createBoard(DIFFICULTIES.expert, 100, createRng(4321));
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });

  it("rejects impossible configs", () => {
    expect(() => createBoard({ rows: 2, cols: 2, mines: 4 }, 0, createRng(1))).toThrow();
  });
});

describe("newGame + first reveal", () => {
  it("starts ready with no mines placed", () => {
    const game = newGame(DIFFICULTIES.beginner, 9);
    expect(game.status).toBe("ready");
    expect(game.cells.some((c) => c.mine)).toBe(false);
    expect(minesLeft(game)).toBe(10);
  });

  it("first reveal is always safe and opens a zero region", () => {
    for (let seed = 0; seed < 100; seed++) {
      const game = reveal(newGame(DIFFICULTIES.beginner, seed), 40);
      expect(game.status === "playing" || game.status === "won").toBe(true);
      expect(game.cells[40].state).toBe("revealed");
      expect(game.cells[40].adjacent).toBe(0);
      expect(game.revealed).toBeGreaterThan(1);
    }
  });

  it("is deterministic by seed", () => {
    const a = reveal(newGame(DIFFICULTIES.intermediate, 77), 17);
    const b = reveal(newGame(DIFFICULTIES.intermediate, 77), 17);
    expect(a).toEqual(b);
  });

  it("keeps flags placed before the first reveal", () => {
    let game = toggleFlag(newGame(DIFFICULTIES.beginner, 3), 80);
    game = reveal(game, 0);
    expect(game.cells[80].state === "flagged" || game.status === "won").toBe(true);
  });
});

describe("reveal", () => {
  it("flood-reveals zeros and stops at numbers", () => {
    const game = reveal(
      fromLayout([
        "....", //
        "....",
        "...*",
      ]),
      0,
    );
    // Everything but the mine opens; (1,2),(1,3),(2,2) are the numbered border.
    expect(game.cells.filter((c) => c.state === "revealed")).toHaveLength(11);
    expect(game.status).toBe("won");
  });

  it("does not flood past numbers", () => {
    const game = reveal(fromLayout(["..*.", "....", "....", "*..."]), 0);
    // (0,0) is 0 → opens (0,1)=1, (1,0)=0, (1,1)=1; (1,0) is 0 → opens (2,0)=1, (2,1)=1.
    const revealed = game.cells.map((c, i) => (c.state === "revealed" ? i : -1)).filter((i) => i >= 0);
    expect(revealed).toEqual([0, 1, 4, 5, 8, 9]);
    expect(game.status).toBe("playing");
  });

  it("revealing a number opens only that cell", () => {
    const game = reveal(fromLayout(["*..", "...", "..."]), 1);
    expect(game.revealed).toBe(1);
  });

  it("hitting a mine loses and records the exploded cell", () => {
    const game = reveal(fromLayout(["*..", "...", "..."]), 0);
    expect(game.status).toBe("lost");
    expect(game.exploded).toBe(0);
  });

  it("ignores flagged cells, revealed cells and finished games", () => {
    const start = fromLayout(["*..", "...", "..."]);
    const flagged = toggleFlag(start, 0);
    expect(reveal(flagged, 0)).toBe(flagged);
    const opened = reveal(start, 1);
    expect(reveal(opened, 1)).toBe(opened);
    const lost = reveal(start, 0);
    expect(reveal(lost, 1)).toBe(lost);
  });

  it("reveals question-marked cells", () => {
    let game = fromLayout(["*..", "...", "..."], true);
    game = toggleFlag(toggleFlag(game, 1), 1);
    expect(game.cells[1].state).toBe("question");
    expect(reveal(game, 1).cells[1].state).toBe("revealed");
  });
});

describe("win detection", () => {
  it("wins when every safe cell is revealed and auto-flags the mines", () => {
    let game = fromLayout(["*..", "...", "..*"]);
    for (const i of [1, 2, 3, 4, 5, 6, 7]) game = reveal(game, i);
    expect(game.status).toBe("won");
    expect(game.cells[0].state).toBe("flagged");
    expect(game.cells[8].state).toBe("flagged");
    expect(game.flags).toBe(2);
    expect(minesLeft(game)).toBe(0);
  });
});

describe("toggleFlag", () => {
  it("cycles hidden → flagged → hidden and counts flags", () => {
    let game = fromLayout(["*..", "...", "..."]);
    game = toggleFlag(game, 4);
    expect(game.cells[4].state).toBe("flagged");
    expect(game.flags).toBe(1);
    expect(minesLeft(game)).toBe(0);
    game = toggleFlag(game, 5);
    expect(minesLeft(game)).toBe(-1);
    game = toggleFlag(game, 4);
    expect(game.cells[4].state).toBe("hidden");
    expect(game.flags).toBe(1);
  });

  it("cycles through ? when marks are on", () => {
    let game = fromLayout(["*..", "...", "..."], true);
    game = toggleFlag(game, 4);
    game = toggleFlag(game, 4);
    expect(game.cells[4].state).toBe("question");
    expect(game.flags).toBe(0);
    game = toggleFlag(game, 4);
    expect(game.cells[4].state).toBe("hidden");
  });

  it("does nothing on revealed cells or finished games", () => {
    const opened = reveal(fromLayout(["*..", "...", "..."]), 1);
    expect(toggleFlag(opened, 1)).toBe(opened);
    const lost = reveal(opened, 0);
    expect(toggleFlag(lost, 2)).toBe(lost);
  });

  it("turning marks off clears existing ? marks", () => {
    let game = fromLayout(["*..", "...", "..."], true);
    game = toggleFlag(toggleFlag(game, 4), 4);
    game = setQuestionMarks(game, false);
    expect(game.questionMarks).toBe(false);
    expect(game.cells[4].state).toBe("hidden");
  });
});

describe("chord", () => {
  const layout = ["*..", "...", "..."];

  it("reveals the remaining neighbors when flags match the number", () => {
    let game = reveal(fromLayout(layout), 4); // center = 1
    game = toggleFlag(game, 0);
    game = chord(game, 4);
    expect(states(game)).toEqual(["flagged", ...Array(8).fill("revealed")]);
    expect(game.status).toBe("won");
  });

  it("does nothing when the flag count differs", () => {
    const game = reveal(fromLayout(layout), 4);
    expect(chord(game, 4)).toBe(game);
  });

  it("loses when a flag is wrong", () => {
    let game = reveal(fromLayout(layout), 4);
    game = toggleFlag(game, 1);
    game = chord(game, 4);
    expect(game.status).toBe("lost");
    expect(game.exploded).toBe(0);
  });

  it("ignores hidden cells and zeros", () => {
    const game = fromLayout(layout);
    expect(chord(game, 4)).toBe(game);
    const zero = reveal(fromLayout(["*...", "....", "...."]), 3);
    expect(chord(zero, 3)).toBe(zero);
  });
});

describe("activate", () => {
  it("reveals hidden cells and chords revealed numbers", () => {
    let game = activate(fromLayout(["*..", "...", "..."]), 4);
    expect(game.cells[4].state).toBe("revealed");
    game = toggleFlag(game, 0);
    game = activate(game, 4);
    expect(game.status).toBe("won");
  });
});
