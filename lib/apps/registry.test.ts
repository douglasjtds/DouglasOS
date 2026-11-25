import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import pt from "@/messages/pt.json";
import { PROFILE } from "@/lib/profile";
import { mobileIconLayout } from "@/lib/store/desktopGrid";
import {
  DESKTOP_ICON_GROUPS,
  DESKTOP_ICON_IDS,
  LAUNCHERS,
  LINK_LAUNCHERS,
  PROGRAM_FOLDERS,
  getLauncher,
  isAppId,
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

  it("groups the desktop icons as apps first, then links", () => {
    expect(DESKTOP_ICON_GROUPS.flat()).toEqual(DESKTOP_ICON_IDS);
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
  it("has the stable id, lives in All Programs → Entertainment and has no desktop icon", () => {
    expect(isAppId("media-player")).toBe(true);
    expect(getLauncher("media-player")).toMatchObject({
      kind: "window",
      onDesktop: false,
      folder: "entertainment",
      persistWindow: false,
    });
    expect(DESKTOP_ICON_IDS).not.toContain("media-player");
    expect(programsInFolder("entertainment").map((a) => a.id)).toContain("media-player");
  });
});

describe("registry: Retro Cam (stage 9)", () => {
  it("is a window app in All Programs → Accessories, never a desktop icon", () => {
    expect(isAppId("camera")).toBe(true);
    expect(getLauncher("camera")).toMatchObject({ kind: "window", onDesktop: false, folder: "accessories" });
    expect(DESKTOP_ICON_IDS).not.toContain("camera");
    expect(PROGRAM_FOLDERS).toContain("accessories");
    expect(programsInFolder("accessories").map((a) => a.id)).toContain("camera");
  });
});

describe("registry: All Programs folders (unified API)", () => {
  it("lists Accessories then Entertainment, and every folder app is a window app with a known folder", () => {
    expect([...PROGRAM_FOLDERS]).toEqual(["accessories", "entertainment"]);
    for (const folder of PROGRAM_FOLDERS) {
      for (const app of programsInFolder(folder)) expect(app.folder).toBe(folder);
    }
  });
});
