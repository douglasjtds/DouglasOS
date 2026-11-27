/**
 * Command engine of the cmd.exe app: a pure function from a typed line to
 * output lines + effects (the UI executes the effects).
 *
 * TODO(douglas): the joke and unknown-command copy (`apps.cmd.jokes.*`,
 * `apps.cmd.unknown.*`) is placeholder personal copy. Rewrite it in your voice.
 */
import { renderFile, type CmdTranslator } from "@/lib/cmd/content";
import {
  formatPath,
  isBinary,
  resolvePath,
  ROOT,
  type FsDir,
  type FsFile,
  type FsNode,
} from "@/lib/cmd/filesystem";
import { parseLine } from "@/lib/cmd/parser";
import type { EasterEggId } from "@/lib/easter-eggs/registry";
import { buildWhatsAppLink } from "@/lib/messenger/links";
import { resolveRun, type LauncherLabels, type RunTarget } from "@/lib/run/resolver";

export type CmdEffect =
  | { kind: "run"; target: RunTarget } // executed with executeRunTarget
  | { kind: "openUrl"; url: string } // new tab, noopener noreferrer
  | { kind: "clear" }
  | { kind: "close" }
  | { kind: "discover"; egg: EasterEggId };

export interface CmdContext {
  cwd: string[];
  t: CmdTranslator;
  locale: string;
  now: Date;
  labels: LauncherLabels;
}

export interface CmdResult {
  output: string[];
  cwd?: string[];
  effects?: CmdEffect[];
}

/** Every name `help` lists (also used for Tab completion). Hidden jokes are not here. */
export const COMMANDS: readonly string[] = [
  "help",
  "dir",
  "cd",
  "type",
  "tree",
  "start",
  "cv",
  "contact",
  "msg",
  "whoami",
  "ver",
  "date",
  "time",
  "echo",
  "cls",
  "exit",
];

const ALIASES: Record<string, string> = {
  ls: "dir",
  cat: "type",
  open: "start",
  clear: "cls",
};

const WRITE_COMMANDS = new Set(["mkdir", "md", "del", "rm", "copy", "move", "ren"]);

const run = (target: RunTarget): CmdEffect => ({ kind: "run", target });
const launcher = (id: Extract<RunTarget, { kind: "launcher" }>["id"], route?: string): CmdEffect =>
  run(route ? { kind: "launcher", id, route } : { kind: "launcher", id });

function notFound(ctx: CmdContext, path: string): CmdResult {
  return { output: [ctx.t("apps.cmd.errors.notFound", { path })] };
}

function help(args: string[], ctx: CmdContext): CmdResult {
  const { t } = ctx;
  if (args.length > 0) {
    const asked = args[0].toLowerCase();
    const name = ALIASES[asked] ?? asked;
    if (!COMMANDS.includes(name)) return unknown(asked, ctx);
    return { output: [`${name} — ${t(`apps.cmd.help.${name}`)}`] };
  }
  return {
    output: [
      t("apps.cmd.help.title"),
      ...COMMANDS.map((name) => `${name} — ${t(`apps.cmd.help.${name}`)}`),
      t("apps.cmd.help.footer"),
    ],
  };
}

function dir(argText: string, ctx: CmdContext): CmdResult {
  const target = resolvePath(ctx.cwd, argText === "" ? "." : argText);
  if (!target) return notFound(ctx, argText);
  const { node, path } = target;
  if (node.type === "file") return { output: [`${String(node.size).padStart(8)}  ${node.name}`] };
  const dirs = node.children.filter((c): c is FsDir => c.type === "dir");
  const files = node.children.filter((c): c is FsFile => c.type === "file");
  return {
    output: [
      `Directory of ${formatPath(path)}`,
      "",
      ...dirs.map((d) => `${"<DIR>".padStart(8)}  ${d.name}`),
      ...files.map((f) => `${String(f.size).padStart(8)}  ${f.name}`),
      "",
      ctx.t("apps.cmd.dir.summaryFiles", { count: files.length }),
      ctx.t("apps.cmd.dir.summaryDirs", { count: dirs.length }),
    ],
  };
}

function cd(argText: string, ctx: CmdContext): CmdResult {
  if (argText === "") return { output: [formatPath(ctx.cwd)] };
  const target = resolvePath(ctx.cwd, argText);
  if (!target) return notFound(ctx, argText);
  if (target.node.type !== "dir") {
    return { output: [ctx.t("apps.cmd.errors.notDir", { path: argText })] };
  }
  return { output: [], cwd: target.path };
}

function type(argText: string, ctx: CmdContext): CmdResult {
  if (argText === "") return { output: [ctx.t("apps.cmd.errors.usage.type")] };
  const target = resolvePath(ctx.cwd, argText);
  if (!target) return notFound(ctx, argText);
  const { node } = target;
  if (node.type === "dir") return { output: [ctx.t("apps.cmd.errors.notFile", { path: argText })] };
  if (isBinary(node)) return { output: [ctx.t("apps.cmd.errors.binary", { name: node.name })] };
  if (node.source.kind === "resume" || node.source.kind === "game") return { output: [] };
  return { output: renderFile(node.source, ctx.t) };
}

function tree(ctx: CmdContext): CmdResult {
  const start = resolvePath(ctx.cwd, ".");
  const root = start?.node.type === "dir" ? start.node : ROOT;
  const lines: string[] = [formatPath(start?.path ?? [])];
  const walk = (children: FsNode[], prefix: string) => {
    children.forEach((child, i) => {
      const last = i === children.length - 1;
      lines.push(`${prefix}${last ? "└─" : "├─"} ${child.name}`);
      if (child.type === "dir") walk(child.children, `${prefix}${last ? "  " : "│ "}`);
    });
  };
  walk(root.children, "");
  return { output: lines };
}

function start(argText: string, ctx: CmdContext): CmdResult {
  if (argText === "") return { output: [ctx.t("apps.cmd.errors.usage.start")] };
  const opening = (name: string, effect: CmdEffect): CmdResult => ({
    output: [ctx.t("apps.cmd.start.opening", { name })],
    effects: [effect],
  });

  const target = resolvePath(ctx.cwd, argText);
  if (target) {
    const { node } = target;
    if (node.type === "dir") {
      if (node.name === "Projects") return opening(node.name, launcher("projects"));
      if (node.name === "Games") return opening(node.name, launcher("games"));
    } else {
      const { source } = node;
      switch (source.kind) {
        case "app":
          return opening(node.name, launcher(source.app));
        case "project":
          return opening(node.name, launcher("projects", source.slug));
        case "resume":
          return opening(node.name, launcher("resume"));
        case "game":
          return opening(node.name, launcher(source.game));
        case "readme":
          return { output: renderFile(source, ctx.t) };
      }
    }
  }

  const resolved = resolveRun(argText, ctx.labels);
  if (resolved?.kind === "target") return opening(argText, run(resolved.target));
  return notFound(ctx, argText);
}

function msg(argText: string, ctx: CmdContext): CmdResult {
  if (argText === "") return { output: [ctx.t("apps.cmd.errors.usage.msg")] };
  return {
    output: [ctx.t("apps.cmd.msg.opening")],
    effects: [{ kind: "openUrl", url: buildWhatsAppLink({ message: argText }) }],
  };
}

function unknown(name: string, ctx: CmdContext): CmdResult {
  let sum = 0;
  for (const ch of name) sum += ch.charCodeAt(0);
  return { output: [ctx.t(`apps.cmd.unknown.v${(sum % 4) + 1}`, { name })] };
}

export function runCommand(line: string, ctx: CmdContext): CmdResult {
  // Classic cmd: `cd..` and `cd\` work without a space.
  const normalized = line.replace(/^(\s*cd)(?=\.\.|\\|\/)/i, "$1 ");
  const parsed = parseLine(normalized);
  if (!parsed) return { output: [] };
  const { args, argText } = parsed;
  const name = ALIASES[parsed.name] ?? parsed.name;
  const { t } = ctx;

  switch (name) {
    case "help":
      return help(args, ctx);
    case "dir":
      return dir(argText, ctx);
    case "cd":
      return cd(argText, ctx);
    case "type":
      return type(argText, ctx);
    case "tree":
      return tree(ctx);
    case "start":
      return start(argText, ctx);
    case "cv":
      return { output: [], effects: [launcher("resume")] };
    case "contact":
      return { output: [], effects: [launcher("contact")] };
    case "msg":
      return msg(argText, ctx);
    case "whoami":
      return { output: ["douglasos\\visitor"] };
    case "ver":
      return { output: [t("apps.cmd.banner")] };
    case "date":
      return { output: [new Intl.DateTimeFormat(ctx.locale, { dateStyle: "full" }).format(ctx.now)] };
    case "time":
      return { output: [new Intl.DateTimeFormat(ctx.locale, { timeStyle: "medium" }).format(ctx.now)] };
    case "echo":
      return { output: [argText] };
    case "cls":
      return { output: [], effects: [{ kind: "clear" }] };
    case "exit":
      return { output: [], effects: [{ kind: "close" }] };
    case "sudo":
      return { output: [t("apps.cmd.jokes.sudo")], effects: [{ kind: "discover", egg: "cmd-sudo" }] };
    case "format":
      return {
        output: [t("apps.cmd.jokes.format")],
        effects: [{ kind: "discover", egg: "cmd-format" }],
      };
    case "hack":
    case "coffee":
    case "matrix":
      return { output: [t(`apps.cmd.jokes.${name}`)] };
    default:
      break;
  }

  if (WRITE_COMMANDS.has(name)) {
    if (name === "rm" && args.some((a) => /^-(rf|fr)$/i.test(a))) {
      return { output: [t("apps.cmd.jokes.rm")] };
    }
    return { output: [t("apps.cmd.errors.readOnly")] };
  }

  const rawName = normalized.trim().split(/\s+/)[0];
  return unknown(rawName, ctx);
}
