import { describe, expect, it } from "vitest";
import { COMMANDS, runCommand } from "@/lib/cmd/commands";
import { en, pt } from "@/lib/cmd/testTranslator";
import { buildWhatsAppLink } from "@/lib/messenger/links";

const now = new Date("2026-11-27T15:00:00Z");
const run = (line: string, cwd: string[] = []) =>
  runCommand(line, { cwd, t: en, locale: "en", now, labels: {} });

describe("runCommand", () => {
  it("help lists every public command and no hidden joke", () => {
    const out = run("help").output.join("\n");
    for (const c of COMMANDS) expect(out).toContain(c);
    expect(out).not.toMatch(/\bsudo\b|\bformat\b|\bhack\b|\bcoffee\b|\bmatrix\b/);
  });

  it("help <name> prints one line", () => {
    expect(run("help cd").output).toEqual([`cd — ${en("apps.cmd.help.cd")}`]);
  });

  it("cd changes cwd, cd .. returns, cd on a file errors", () => {
    expect(run("cd projects").cwd).toEqual(["Projects"]);
    expect(run("cd ..", ["Projects"]).cwd).toEqual([]);
    expect(run("cd about.txt").output[0]).toBe(en("apps.cmd.errors.notDir", { path: "about.txt" }));
  });

  it("cd.. and cd\\ work without a space", () => {
    expect(run("cd..", ["Projects"]).cwd).toEqual([]);
    expect(run("cd\\", ["Projects"]).cwd).toEqual([]);
  });

  it("cd without args prints the path", () => {
    expect(run("cd").output).toEqual(["C:\\DouglasOS"]);
  });

  it("dir lists folders and files", () => {
    const out = run("dir").output;
    expect(out[0]).toBe(en("apps.cmd.dir.header", { path: "C:\\DouglasOS" }));
    expect(out.join("\n")).toContain("<DIR>");
    expect(out.join("\n")).toContain("resume.pdf");
  });

  it("dir header follows the locale", () => {
    const out = runCommand("dir", { cwd: [], t: pt, locale: "pt", now, labels: {} }).output;
    expect(out[0]).toBe(pt("apps.cmd.dir.header", { path: "C:\\DouglasOS" }));
    expect(out[0]).toContain("Conteúdo de");
  });

  it("tree draws the structure", () => {
    const out = run("tree").output.join("\n");
    expect(out).toContain("├─");
    expect(out).toContain("└─");
  });

  it("type prints the file, refuses folders and binaries", () => {
    expect(run("type about.txt").output[0]).toBe(en("apps.about.name"));
    expect(run("type projects").output[0]).toBe(en("apps.cmd.errors.notFile", { path: "projects" }));
    expect(run("type resume.pdf").output[0]).toContain("resume.pdf");
    expect(run("type resume.pdf").effects).toBeUndefined();
    expect(run("type").output[0]).toBe(en("apps.cmd.errors.usage.type"));
    expect(run("type nope.txt").output[0]).toBe(en("apps.cmd.errors.notFound", { path: "nope.txt" }));
  });

  it("start resume.pdf downloads the CV; start gasolinha.txt opens it in the Explorer", () => {
    expect(run("start resume.pdf").effects).toEqual([
      { kind: "run", target: { kind: "launcher", id: "resume" } },
    ]);
    expect(run("start gasolinha.txt", ["Projects"]).effects).toEqual([
      { kind: "run", target: { kind: "launcher", id: "projects", route: "gasolinha" } },
    ]);
    expect(run("start about.txt").effects).toEqual([
      { kind: "run", target: { kind: "launcher", id: "about" } },
    ]);
    expect(run("start Games").effects).toEqual([
      { kind: "run", target: { kind: "launcher", id: "games" } },
    ]);
    expect(run("start mines.exe", ["Games"]).effects).toEqual([
      { kind: "run", target: { kind: "launcher", id: "mines" } },
    ]);
  });

  it("start falls back to the Run resolver", () => {
    expect(run("start linkedin").effects).toEqual([
      { kind: "run", target: { kind: "launcher", id: "linkedin" } },
    ]);
    expect(run("start zzzqqq").output[0]).toBe(en("apps.cmd.errors.notFound", { path: "zzzqqq" }));
    expect(run("start").output[0]).toBe(en("apps.cmd.errors.usage.start"));
  });

  it("cv and contact are one command away", () => {
    expect(run("cv").effects![0]).toEqual({ kind: "run", target: { kind: "launcher", id: "resume" } });
    expect(run("cv").output).toEqual([en("apps.cmd.start.opening", { name: "resume.pdf" })]);
    expect(run("contact").output).toEqual([en("apps.cmd.start.opening", { name: "contact.txt" })]);
    expect(run("CONTACT").effects![0]).toEqual({
      kind: "run",
      target: { kind: "launcher", id: "contact" },
    });
  });

  it("msg needs text and goes through buildWhatsAppLink", () => {
    expect(run("msg   ").effects).toBeUndefined();
    const url = (run("msg hi Douglas").effects![0] as { url: string }).url;
    expect(url).toBe(buildWhatsAppLink({ message: "hi Douglas" }));
    expect((run(`msg ${"a".repeat(5000)}`).effects![0] as { url: string }).url.length).toBeLessThanOrEqual(2000);
  });

  it("sudo and format unlock their eggs", () => {
    expect(run("sudo rm -rf /").effects).toContainEqual({ kind: "discover", egg: "cmd-sudo" });
    expect(run("format c:").effects).toContainEqual({ kind: "discover", egg: "cmd-format" });
    expect(run("format").effects).toContainEqual({ kind: "discover", egg: "cmd-format" });
  });

  it("other jokes answer without effects", () => {
    expect(run("hack").output[0]).toBe(en("apps.cmd.jokes.hack"));
    expect(run("coffee").output[0]).toBe(en("apps.cmd.jokes.coffee"));
    expect(run("matrix").output[0]).toBe(en("apps.cmd.jokes.matrix"));
    expect(run("rm -rf /").output[0]).toBe(en("apps.cmd.jokes.rm"));
  });

  it("writes are refused (read-only drive)", () => {
    expect(run("mkdir x").output[0]).toBe(en("apps.cmd.errors.readOnly"));
    expect(run("del about.txt").output[0]).toBe(en("apps.cmd.errors.readOnly"));
  });

  it("whoami, ver, echo, date and time", () => {
    expect(run("whoami").output).toEqual(["douglasos\\visitor"]);
    expect(run("ver").output).toEqual([en("apps.cmd.banner")]);
    expect(run("echo hello  world").output).toEqual(["hello  world"]);
    expect(run("echo").output).toEqual([""]);
    expect(run("date").output[0]).toContain("2026");
    expect(run("time").output[0]).toMatch(/\d/);
  });

  it("unknown commands echo the name as plain text, deterministically", () => {
    const a = run("<script>alert(1)</script>").output[0];
    expect(a).toContain("<script>alert(1)</script>");
    expect(run("<script>alert(1)</script>").output[0]).toBe(a);
  });

  it("cls clears, exit closes, blank does nothing", () => {
    expect(run("cls").effects).toEqual([{ kind: "clear" }]);
    expect(run("exit").effects).toEqual([{ kind: "close" }]);
    expect(run("   ")).toEqual({ output: [] });
  });

  it("output follows the locale", () => {
    const out = runCommand("mkdir x", { cwd: [], t: pt, locale: "pt", now, labels: {} }).output[0];
    expect(out).toBe(pt("apps.cmd.errors.readOnly"));
  });
});
