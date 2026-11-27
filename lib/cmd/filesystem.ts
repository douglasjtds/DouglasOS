import { PROJECTS } from "@/lib/content/projects";
import { GAME_IDS, type GameId } from "@/lib/apps/registry";

export type CmdTextApp = "about" | "experience" | "skills" | "how-i-work-with-ai" | "contact";

export type FsSource =
  | { kind: "app"; app: CmdTextApp }
  | { kind: "project"; slug: string }
  | { kind: "readme" }
  | { kind: "resume" } // binary
  | { kind: "game"; game: GameId }; // binary

export interface FsFile {
  type: "file";
  name: string;
  size: number;
  source: FsSource;
}
export interface FsDir {
  type: "dir";
  name: string;
  children: FsNode[];
}
export type FsNode = FsFile | FsDir;

function file(name: string, size: number, source: FsSource): FsFile {
  return { type: "file", name, size, source };
}

function textApp(app: CmdTextApp, size: number): FsFile {
  return file(`${app}.txt`, size, { kind: "app", app });
}

export const ROOT: FsDir = {
  type: "dir",
  name: "DouglasOS",
  children: [
    {
      type: "dir",
      name: "Projects",
      children: PROJECTS.map((p, i) =>
        file(`${p.slug}.txt`, 1200 + i * 137, { kind: "project", slug: p.slug }),
      ),
    },
    {
      type: "dir",
      name: "Games",
      children: GAME_IDS.map((game, i) =>
        file(`${game}.exe`, 245760 + i * 18432, { kind: "game", game }),
      ),
    },
    textApp("about", 1843),
    textApp("experience", 2961),
    textApp("skills", 1478),
    textApp("how-i-work-with-ai", 2312),
    textApp("contact", 512),
    file("readme.txt", 934, { kind: "readme" }),
    file("resume.pdf", 184320, { kind: "resume" }),
  ],
};

export function isBinary(f: FsFile): boolean {
  return f.source.kind === "resume" || f.source.kind === "game";
}

export function resolvePath(
  cwd: string[],
  input: string,
): { node: FsNode; path: string[] } | null {
  let text = input.trim();
  if (text.length >= 2 && text.startsWith('"') && text.endsWith('"')) {
    text = text.slice(1, -1).trim();
  }
  text = text.replace(/\//g, "\\");

  let absolute = false;
  const drive = /^c:(?=\\|$)/i.exec(text);
  if (drive) {
    text = text.slice(drive[0].length);
    absolute = true;
  }
  if (text.startsWith("\\")) absolute = true;

  const segments = text.split("\\").filter((s) => s !== "");
  // The drive is C:\DouglasOS, so an explicit root name is a no-op.
  if (absolute && segments[0]?.toLowerCase() === ROOT.name.toLowerCase()) segments.shift();

  const wanted = absolute ? [] : [...cwd];
  for (const seg of segments) {
    if (seg === ".") continue;
    if (seg === "..") wanted.pop();
    else wanted.push(seg);
  }

  // Walk the tree to validate the path and recover canonical casing.
  const path: string[] = [];
  let node: FsNode = ROOT;
  for (const name of wanted) {
    if (node.type !== "dir") return null;
    const child: FsNode | undefined = node.children.find(
      (c) => c.name.toLowerCase() === name.toLowerCase(),
    );
    if (!child) return null;
    path.push(child.name);
    node = child;
  }
  return { node, path };
}

export function formatPath(path: string[]): string {
  return ["C:", ROOT.name, ...path].join("\\");
}

export function completePath(cwd: string[], partial: string): string[] {
  const text = partial.replace(/\//g, "\\");
  const idx = text.lastIndexOf("\\");
  const dirPart = text.slice(0, idx + 1);
  const prefix = text.slice(idx + 1).toLowerCase();

  const target = resolvePath(cwd, dirPart === "" ? "." : dirPart);
  if (!target || target.node.type !== "dir") return [];

  // A plain relative prefix is rewritten in canonical casing; other forms keep the typed text.
  const typedDirs = dirPart.split("\\").filter(Boolean);
  const isPlainRelative =
    typedDirs.length > 0 && !typedDirs.some((d) => d === "." || d === "..") && !/^(c:|\\)/i.test(dirPart);
  const shownDir = isPlainRelative ? `${target.path.slice(cwd.length).join("\\")}\\` : dirPart;

  return target.node.children
    .filter((c) => c.name.toLowerCase().startsWith(prefix))
    .map((c) => `${shownDir}${c.name}${c.type === "dir" ? "\\" : ""}`);
}
