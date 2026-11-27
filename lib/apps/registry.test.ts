import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import pt from "@/messages/pt.json";
import { PROFILE } from "@/lib/profile";
import { mobileIconLayout } from "@/lib/store/desktopGrid";
import {
  DESKTOP_ICON_GROUPS,
  DESKTOP_ICON_IDS,
  GAME_IDS,
  LAUNCHERS,
  LINK_LAUNCHERS,
  PROGRAM_FOLDERS,
  folderOf,
  getLauncher,
  isAppId,
  isGameId,
  launcherTitleKey,
  programsInFolder,
} from "@/lib/apps/registry";

/** Resolve a dotted i18n key in a message catalog. */
function lookup(messages: unknown, key: string): unknown {
  return key
    .split(".")
    .reduce<unknown>(
      (node, part) => (node && typeof node === "object" ? (node as Record<string, unknown>)[part] : undefined),
      messages,
    );
}

describe("registry: external shortcuts", () => {
  it("has the four stable link ids (Recycle Bin targets in stage 6)", () => {
    expect(LINK_LAUNCHERS.map((l) => l.id)).toEqual(["linkedin", "github", "whatsapp", "email"]);
  });

  it("takes every URL from lib/profile.ts", () => {
    expect(getLauncher("linkedin")).toMatchObject({ href: PROFILE.linkedin, external: true });
    expect(getLauncher("github")).toMatchObject({ href: PROFILE.github, external: true });
    expect(getLauncher("whatsapp")).toMatchObject({ href: PROFILE.whatsapp, external: true });
    expect(getLauncher("email")).toMatchObject({ href: `mailto:${PROFILE.email}`, external: false });
  });

  it("gives every link an href and an EN + PT label and description", () => {
    for (const link of LINK_LAUNCHERS) {
      expect(link.href).toMatch(/^(https:\/\/|mailto:)/);
      expect(link.external).toBe(link.href.startsWith("https://"));
      expect(launcherTitleKey(link.id)).toBe(link.titleKey);
      for (const messages of [en, pt]) {
        expect(lookup(messages, link.titleKey)).toEqual(expect.any(String));
        expect(lookup(messages, `links.${link.id}.description`)).toEqual(expect.any(String));
      }
    }
  });

  it("links are desktop icons but never window apps", () => {
    for (const link of LINK_LAUNCHERS) {
      expect(DESKTOP_ICON_IDS).toContain(link.id);
      expect(isAppId(link.id)).toBe(false);
    }
    expect(isAppId("resume")).toBe(false);
    expect(isAppId("about")).toBe(true);
  });

  it("groups the desktop icons as apps first, then links, then fun apps", () => {
    expect([...DESKTOP_ICON_GROUPS.flat()].sort()).toEqual([...DESKTOP_ICON_IDS].sort());
    expect(DESKTOP_ICON_GROUPS[2]).toEqual(["browser", "media-player", "camera", "paint", "cmd", "games"]);
    expect(DESKTOP_ICON_GROUPS[1]).toEqual(LINK_LAUNCHERS.map((l) => l.id));
    expect(DESKTOP_ICON_GROUPS[0].slice(0, 3)).toEqual(["about", "resume", "contact"]);
  });

  it("every launcher has an EN + PT label", () => {
    for (const l of LAUNCHERS) {
      expect(lookup(en, launcherTitleKey(l.id))).toEqual(expect.any(String));
      expect(lookup(pt, launcherTitleKey(l.id))).toEqual(expect.any(String));
    }
  });
});

describe("registry: DouglasOS Messenger (stage 5b)", () => {
  it("is a window app with a desktop icon, last of the apps group", () => {
    expect(isAppId("messenger")).toBe(true);
    expect(getLauncher("messenger")).toMatchObject({ kind: "window", onDesktop: true, surface: "bare" });
    expect(DESKTOP_ICON_GROUPS[0].at(-1)).toBe("messenger");
  });

  it("never pushes About / CV / Contact off a phone's first row", () => {
    for (const width of [320, 360, 390, 430]) {
      const { cells } = mobileIconLayout(DESKTOP_ICON_GROUPS, width);
      for (const id of ["about", "resume", "contact"] as const) expect(cells[id].row).toBe(0);
    }
  });
});

describe("registry: DouglasOS Media Player (stage 8)", () => {
  it("has the stable id, lives in All Programs → Entertainment and has a desktop shortcut", () => {
    expect(isAppId("media-player")).toBe(true);
    expect(getLauncher("media-player")).toMatchObject({
      kind: "window",
      onDesktop: true,
      folder: "entertainment",
      persistWindow: false,
    });
    expect(DESKTOP_ICON_IDS).toContain("media-player");
    expect(programsInFolder("entertainment").map((a) => a.id)).toContain("media-player");
  });
});

describe("registry: Retro Cam (stage 9)", () => {
  it("is a window app in All Programs → Accessories, with a desktop shortcut", () => {
    expect(isAppId("camera")).toBe(true);
    expect(getLauncher("camera")).toMatchObject({ kind: "window", onDesktop: true, folder: "accessories" });
    expect(DESKTOP_ICON_IDS).toContain("camera");
    expect(PROGRAM_FOLDERS).toContain("accessories");
    expect(programsInFolder("accessories").map((a) => a.id)).toContain("camera");
  });
});

describe("registry: All Programs folders (unified API)", () => {
  it("lists Accessories, Entertainment then Games, and every program in a folder declares it", () => {
    expect([...PROGRAM_FOLDERS]).toEqual(["accessories", "entertainment", "games"]);
    for (const folder of PROGRAM_FOLDERS) {
      for (const app of programsInFolder(folder)) expect(folderOf(app)).toBe(folder);
    }
  });

  it("Accessories holds Retro Cam, Paint, cmd.exe and DON'T OPEN THIS.exe; Entertainment holds the Media Player", () => {
    expect(programsInFolder("accessories").map((a) => a.id)).toEqual(["camera", "paint", "cmd", "dont-open-this"]);
    expect(programsInFolder("entertainment").map((a) => a.id)).toEqual(["media-player"]);
  });
});

describe("registry: DouglasOS Paint (stage 10)", () => {
  it("is a window app in All Programs ▸ Accessories, with a desktop shortcut", () => {
    expect(isAppId("paint")).toBe(true);
    const paint = getLauncher("paint");
    expect(paint).toMatchObject({ kind: "window", onDesktop: true, surface: "bare" });
    expect(folderOf(paint)).toBe("accessories");
    expect(DESKTOP_ICON_IDS).toContain("paint");
  });

  it("every folder has an EN + PT label", () => {
    for (const folder of PROGRAM_FOLDERS) {
      expect(lookup(en, `startMenu.folders.${folder}`)).toEqual(expect.any(String));
      expect(lookup(pt, `startMenu.folders.${folder}`)).toEqual(expect.any(String));
    }
  });

  it("DON'T OPEN THIS.exe is a windowless action in Accessories, labelled in EN + PT", () => {
    const egg = getLauncher("dont-open-this");
    expect(egg).toMatchObject({ kind: "action", onDesktop: false });
    expect(folderOf(egg)).toBe("accessories");
    expect(isAppId("dont-open-this")).toBe(false);
    expect(DESKTOP_ICON_IDS).not.toContain("dont-open-this");
    expect(lookup(en, launcherTitleKey("dont-open-this"))).toBe("DON'T OPEN THIS.exe");
    expect(lookup(pt, launcherTitleKey("dont-open-this"))).toBe("NÃO ABRA ISSO.exe");
  });

  it("has the same easter egg copy keys in EN and PT, none empty", () => {
    const leaves = (node: unknown, prefix = ""): [string, unknown][] =>
      node && typeof node === "object"
        ? Object.entries(node).flatMap(([k, v]) => leaves(v, `${prefix}${k}.`))
        : [[prefix, node]];
    const enLeaves = leaves(lookup(en, "easterEgg"));
    const ptLeaves = leaves(lookup(pt, "easterEgg"));
    expect(ptLeaves.map(([k]) => k)).toEqual(enLeaves.map(([k]) => k));
    for (const [, v] of [...enLeaves, ...ptLeaves]) expect(v).toEqual(expect.stringMatching(/\S/));
  });

  it("has the same Paint copy keys in EN and PT", () => {
    const keys = (node: unknown, prefix = ""): string[] =>
      node && typeof node === "object"
        ? Object.entries(node).flatMap(([k, v]) => keys(v, `${prefix}${k}.`))
        : [prefix];
    expect(keys(lookup(pt, "apps.paint"))).toEqual(keys(lookup(en, "apps.paint")));
  });
});

describe("registry: cmd.exe", () => {
  it("cmd is a window app in All Programs ▸ Accessories with a desktop shortcut and EN + PT labels", () => {
    expect(isAppId("cmd")).toBe(true);
    const cmd = getLauncher("cmd");
    expect(cmd).toMatchObject({
      kind: "window",
      onDesktop: true,
      surface: "bare",
      defaultSize: { width: 680, height: 440 },
    });
    expect(folderOf(cmd)).toBe("accessories");
    expect(DESKTOP_ICON_IDS).toContain("cmd");
    // Fun group, right after Paint.
    const fun = DESKTOP_ICON_GROUPS[2];
    expect(fun.indexOf("cmd")).toBe(fun.indexOf("paint") + 1);
    for (const messages of [en, pt]) {
      expect(lookup(messages, launcherTitleKey("cmd"))).toEqual(expect.stringMatching(/\S/));
      expect(lookup(messages, "apps.cmd.description")).toEqual(expect.stringMatching(/\S/));
    }
  });
});

describe("registry: Games (stage 12)", () => {
  it("lists the six games in All Programs ▸ Games, never as desktop icons", () => {
    expect(programsInFolder("games").map((a) => a.id)).toEqual([...GAME_IDS]);
    for (const id of GAME_IDS) {
      expect(getLauncher(id)).toMatchObject({ kind: "window", onDesktop: false, folder: "games", surface: "bare" });
      expect(DESKTOP_ICON_IDS).not.toContain(id);
      for (const messages of [en, pt]) {
        expect(lookup(messages, `apps.${id}.title`)).toEqual(expect.any(String));
        expect(lookup(messages, `apps.${id}.description`)).toEqual(expect.any(String));
      }
    }
    expect(isGameId("mines")).toBe(true);
    expect(isGameId("paint")).toBe(false);
  });

  it("has a Games folder window on the desktop (fun group), not in the flat All Programs list", () => {
    expect(getLauncher("games")).toMatchObject({ kind: "window", onDesktop: true, inAllPrograms: false });
    expect(folderOf(getLauncher("games"))).toBeUndefined();
    expect(DESKTOP_ICON_GROUPS[2].at(-1)).toBe("games");
    for (const messages of [en, pt]) {
      expect(lookup(messages, "startMenu.folders.games")).toEqual(expect.any(String));
    }
  });
});
