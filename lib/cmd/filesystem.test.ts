import { describe, expect, it } from "vitest";
import { PROJECTS } from "@/lib/content/projects";
import { GAME_IDS } from "@/lib/apps/registry";
import {
  completePath,
  formatPath,
  isBinary,
  resolvePath,
  type FsDir,
  type FsFile,
} from "./filesystem";

describe("fictional drive", () => {
  it("lists one .txt per project and one .exe per game", () => {
    const projects = resolvePath([], "Projects")!.node as FsDir;
    expect(projects.children.map((c) => c.name)).toEqual(PROJECTS.map((p) => `${p.slug}.txt`));
    const games = resolvePath([], "games")!.node as FsDir;
    expect(games.children).toHaveLength(GAME_IDS.length);
  });
  it.each([
    [[], "PROJECTS", ["Projects"]],
    [[], "/projects/", ["Projects"]],
    [[], '"Projects"', ["Projects"]],
    [["Projects"], "..", []],
    [["Projects"], "..\\..\\..", []],
    [["Projects"], "C:\\", []],
    [["Projects"], "\\", []],
    [[], "C:\\DouglasOS\\Projects\\gasolinha.txt", ["Projects", "gasolinha.txt"]],
  ])("resolves %j + %s", (cwd, input, path) => {
    expect(resolvePath(cwd, input)?.path).toEqual(path);
  });
  it("returns null for a missing path", () => expect(resolvePath([], "nope\\x")).toBeNull());
  it("formats paths", () => {
    expect(formatPath([])).toBe("C:\\DouglasOS");
    expect(formatPath(["Projects"])).toBe("C:\\DouglasOS\\Projects");
  });
  it("completes names case-insensitively, dirs with a backslash", () => {
    expect(completePath([], "pro")).toEqual(["Projects\\"]);
    expect(completePath([], "projects\\gas")).toEqual(["Projects\\gasolinha.txt"]);
  });
  it("marks resume and games as binary", () => {
    expect(isBinary(resolvePath([], "resume.pdf")!.node as FsFile)).toBe(true);
    expect(isBinary(resolvePath([], "about.txt")!.node as FsFile)).toBe(false);
  });
});
