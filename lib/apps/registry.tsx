import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { IconComponent } from "@/components/icons/types";
import { PROFILE, RESUME } from "@/lib/profile";
import { PROJECTS_HOME_ROUTE, isProjectRoute } from "@/lib/content/projects";
import {
  AboutIcon,
  AchievementsIcon,
  AiIcon,
  ContactIcon,
  DisplayIcon,
  ExperienceIcon,
  ProjectsIcon,
  ResumeIcon,
  SkillsIcon,
} from "@/components/icons/AppIcons";
import { RecycleBinIcon } from "@/components/icons/RecycleBinIcons";
import {
  EmailLinkIcon,
  GitHubLinkIcon,
  LinkedInLinkIcon,
  WhatsAppLinkIcon,
} from "@/components/icons/LinkIcons";
import { MessengerIcon } from "@/components/icons/MessengerIcons";
import { MediaPlayerIcon } from "@/components/icons/MediaIcons";
import { CameraIcon } from "@/components/icons/CameraIcons";
import { DontOpenThisIcon, PaintIcon } from "@/components/icons/PaintIcons";
import {
  FreeCellIcon,
  GamesFolderIcon,
  HeartsIcon,
  MinesIcon,
  PinballIcon,
  SolitaireIcon,
  SpiderIcon,
} from "@/components/icons/GameIcons";

/** Apps that open as windows. `resume` is intentionally excluded (download). */
export type AppId =
  | "about"
  | "experience"
  | "projects"
  | "skills"
  | "how-i-work-with-ai"
  | "contact"
  | "messenger"
  | "display"
  | "recycle-bin"
  | "media-player"
  | "camera"
  | "paint"
  | "achievements"
  | "games"
  | GameId;

/**
 * The classic games (stage 12), listed in All Programs ▸ Games and in the
 * desktop "Games" folder window — never as desktop icons of their own.
 */
export const GAME_IDS = ["mines", "solitaire", "freecell", "hearts", "spider", "pinball"] as const;
export type GameId = (typeof GAME_IDS)[number];

/**
 * External shortcuts (stage 3). These ids are stable on purpose: they are the
 * targets of the Recycle Bin rescue jokes in stage 6.
 */
export type LinkId = "linkedin" | "github" | "whatsapp" | "email";

/** Windowless actions (stage 10): the "DON'T OPEN THIS.exe" easter egg. */
export type ActionId = "dont-open-this";

/** Everything that can be launched (Start menu, desktop, Quick Launch). */
export type LauncherId = AppId | "resume" | LinkId | ActionId;

/**
 * In-window navigation for apps that have pages (stage 4: the DouglasOS
 * Explorer in `projects`). The window store keeps a Back/Forward history of
 * these routes per window and only ever stores routes `isValid` accepts.
 */
export interface AppRoutes {
  /** Route shown when the window opens without a destination. */
  home: string;
  isValid: (route: string) => boolean;
}

/**
 * Launchers that live as movable desktop icons. Display Properties has no
 * icon; the Recycle Bin has one, but it is drawn by the desktop itself
 * (stage 6, `lib/store/recycleBin.ts`): top-right by default, draggable on its
 * own, its cell persisted separately (`desktopStore.binCell`), and never
 * lassoed, grouped or trashed with the others.
 */
export type DesktopIconId = Exclude<
  LauncherId,
  "display" | "recycle-bin" | "achievements" | ActionId | GameId
>;

/**
 * Folders inside Start → All Programs (DESKTOP-INTERFACE-SPEC §5), in display
 * order. Fun apps live there so they never sit above the CTAs. A window app
 * or a windowless action declares `folder` to be listed inside that folder
 * instead of the flat list; a folder shows only once something declares it
 * (see `programsInFolder`). This is the single folder API: stages 8, 9 and 10
 * each prototyped one, and they were unified on `folder` at integration.
 */
export const PROGRAM_FOLDERS = ["accessories", "entertainment", "games"] as const;
export type ProgramFolder = (typeof PROGRAM_FOLDERS)[number];
/** Alias kept for stage 9/10 call sites. */
export type ProgramFolderId = ProgramFolder;

export interface WindowAppConfig {
  id: AppId;
  kind: "window";
  icon: IconComponent;
  defaultSize: { width: number; height: number };
  /** Whether the launcher gets a (movable) desktop icon (all but system apps). */
  onDesktop: boolean;
  /** Listed in Start → All Programs (default true; the Recycle Bin isn't). */
  inAllPrograms?: boolean;
  /** All Programs folder the app is listed in (flat list when absent). */
  folder?: ProgramFolder;
  /**
   * Restore the window after a reload (default true). The media player opts
   * out so the YouTube API never loads on the initial page load.
   */
  persistWindow?: boolean;
  /**
   * Window body style: "pane" (default) frames the content in a white sunken
   * pane; "dialog" keeps the beige button-face body (property sheets);
   * "bare" hands the whole body to the app, which draws its own bars and
   * pane (the Explorer's menu bar, toolbar, address bar and status bar).
   */
  surface?: "pane" | "dialog" | "bare";
  /** Present when the app has pages (see `AppRoutes`). */
  routes?: AppRoutes;
  /** Lazily-loaded window body so content never bloats the shell bundle. */
  Content: LazyExoticComponent<ComponentType>;
}

export interface DownloadConfig {
  id: "resume";
  kind: "download";
  icon: IconComponent;
  onDesktop: true;
  href: string;
  download: string;
}

/**
 * An external shortcut: opens `href` instead of a window. External links open
 * in a new tab with `rel="noopener noreferrer"`; `mailto:` opens the mail app
 * in place (`external: false`). URLs come only from `lib/profile.ts`.
 */
export interface LinkConfig {
  id: LinkId;
  kind: "link";
  /** i18n key of the fun file-name label ("linkedin.url", "whatsapp.exe"…). */
  titleKey: string;
  icon: IconComponent;
  onDesktop: true;
  href: string;
  external: boolean;
}

/**
 * A windowless action launched from a folder in All Programs (stage 10): the
 * "DON'T OPEN THIS.exe" easter egg (`lib/store/easterEggStore.ts`). Never a
 * desktop icon, never pinned.
 */
export interface ActionConfig {
  id: ActionId;
  kind: "action";
  /** i18n key of the file-name label. */
  titleKey: string;
  icon: IconComponent;
  onDesktop: false;
  /** All Programs folder it's listed in (actions always live in one). */
  folder: ProgramFolder;
}

export type LauncherConfig = WindowAppConfig | DownloadConfig | LinkConfig | ActionConfig;

/**
 * Single source of truth for launchers. The order is the desktop's default
 * column-first arrangement and follows the CTA hierarchy
 * (DESKTOP-INTERFACE-SPEC → Desktop icons): About, CV, Contact, then the rest.
 * System apps (Display Properties) come last and stay off the desktop.
 */
export const LAUNCHERS: LauncherConfig[] = [
  {
    id: "about",
    kind: "window",
    icon: AboutIcon,
    onDesktop: true,
    defaultSize: { width: 600, height: 550 },
    Content: lazy(() => import("@/components/apps/AboutApp")),
  },
  {
    id: "resume",
    kind: "download",
    icon: ResumeIcon,
    onDesktop: true,
    href: RESUME.href,
    download: RESUME.filename,
  },
  {
    id: "contact",
    kind: "window",
    icon: ContactIcon,
    onDesktop: true,
    defaultSize: { width: 500, height: 500 },
    Content: lazy(() => import("@/components/apps/ContactApp")),
  },
  {
    id: "projects",
    kind: "window",
    icon: ProjectsIcon,
    onDesktop: true,
    surface: "bare",
    routes: { home: PROJECTS_HOME_ROUTE, isValid: isProjectRoute },
    defaultSize: { width: 760, height: 600 },
    Content: lazy(() => import("@/components/apps/ProjectsApp")),
  },
  {
    id: "experience",
    kind: "window",
    icon: ExperienceIcon,
    onDesktop: true,
    defaultSize: { width: 700, height: 600 },
    Content: lazy(() => import("@/components/apps/ExperienceApp")),
  },
  {
    id: "skills",
    kind: "window",
    icon: SkillsIcon,
    onDesktop: true,
    defaultSize: { width: 650, height: 550 },
    Content: lazy(() => import("@/components/apps/SkillsApp")),
  },
  {
    id: "how-i-work-with-ai",
    kind: "window",
    icon: AiIcon,
    onDesktop: true,
    defaultSize: { width: 700, height: 600 },
    Content: lazy(() => import("@/components/apps/HowIWorkWithAiApp")),
  },
  // DouglasOS Messenger (stage 5b): last of the apps, so on phones it ends the
  // apps' second row and About / CV / Contact keep the first one.
  {
    id: "messenger",
    kind: "window",
    icon: MessengerIcon,
    onDesktop: true,
    surface: "bare",
    defaultSize: { width: 460, height: 580 },
    Content: lazy(() => import("@/components/apps/MessengerApp")),
  },
  // External shortcuts follow the apps; on the desktop they start their own
  // column (row on mobile), see DESKTOP_ICON_GROUPS.
  {
    id: "linkedin",
    kind: "link",
    titleKey: "links.linkedin.title",
    icon: LinkedInLinkIcon,
    onDesktop: true,
    href: PROFILE.linkedin,
    external: true,
  },
  {
    id: "github",
    kind: "link",
    titleKey: "links.github.title",
    icon: GitHubLinkIcon,
    onDesktop: true,
    href: PROFILE.github,
    external: true,
  },
  {
    id: "whatsapp",
    kind: "link",
    titleKey: "links.whatsapp.title",
    icon: WhatsAppLinkIcon,
    onDesktop: true,
    href: PROFILE.whatsapp,
    external: true,
  },
  {
    id: "email",
    kind: "link",
    titleKey: "links.email.title",
    icon: EmailLinkIcon,
    onDesktop: true,
    href: `mailto:${PROFILE.email}`,
    external: false,
  },
  {
    id: "display",
    kind: "window",
    icon: DisplayIcon,
    onDesktop: false,
    surface: "dialog",
    defaultSize: { width: 420, height: 500 },
    Content: lazy(() => import("@/components/apps/DisplayApp")),
  },
  // Recycle Bin (stage 6): a window app whose icon the desktop draws itself
  // (top-right by default, draggable). Its window is always empty — mini Douglas
  // never lets anything stay in it.
  {
    id: "recycle-bin",
    kind: "window",
    icon: RecycleBinIcon,
    onDesktop: false,
    inAllPrograms: false,
    defaultSize: { width: 520, height: 380 },
    Content: lazy(() => import("@/components/apps/RecycleBinApp")),
  },
  // DouglasOS Media Player (stage 8): Start → All Programs → Entertainment,
  // plus a desktop shortcut in the fun-apps group (after the links, so a
  // phone's first row stays About / CV / Contact).
  {
    id: "media-player",
    kind: "window",
    icon: MediaPlayerIcon,
    onDesktop: true,
    folder: "entertainment",
    persistWindow: false,
    surface: "bare",
    defaultSize: { width: 520, height: 510 },
    Content: lazy(() => import("@/components/apps/MediaPlayerApp")),
  },
  // Retro Cam (stage 9): pixelated webcam, Start → All Programs → Accessories
  // and a desktop shortcut in the fun-apps group.
  {
    id: "camera",
    kind: "window",
    icon: CameraIcon,
    onDesktop: true,
    folder: "accessories",
    surface: "bare",
    defaultSize: { width: 560, height: 520 },
    Content: lazy(() => import("@/components/apps/CameraApp")),
  },
  // DouglasOS Paint (stage 10): All Programs ▸ Accessories, Run, and a desktop
  // shortcut in the fun-apps group; never pinned.
  {
    id: "paint",
    kind: "window",
    icon: PaintIcon,
    onDesktop: true,
    folder: "accessories",
    surface: "bare",
    defaultSize: { width: 760, height: 560 },
    Content: lazy(() => import("@/components/apps/PaintApp")),
  },
  // "DON'T OPEN THIS.exe" (stage 10): three short easter eggs in turn, no window.
  {
    id: "dont-open-this",
    kind: "action",
    titleKey: "easterEgg.title",
    icon: DontOpenThisIcon,
    onDesktop: false,
    folder: "accessories",
  },
  // Achievements (stage 11): the easter-egg progress, a property sheet. Only
  // reachable from the Start menu's places column (discreet: no desktop icon,
  // not in All Programs) and from the easter-egg toast.
  {
    id: "achievements",
    kind: "window",
    icon: AchievementsIcon,
    onDesktop: false,
    inAllPrograms: false,
    surface: "dialog",
    defaultSize: { width: 440, height: 520 },
    Content: lazy(() => import("@/components/apps/AchievementsApp")),
  },
  // Games (stage 12): a desktop folder window listing the games (it is not in
  // All Programs — the Games ▸ folder there lists the games themselves).
  {
    id: "games",
    kind: "window",
    icon: GamesFolderIcon,
    onDesktop: true,
    inAllPrograms: false,
    surface: "bare",
    defaultSize: { width: 520, height: 400 },
    Content: lazy(() => import("@/components/apps/GamesFolderApp")),
  },
  {
    id: "mines",
    kind: "window",
    icon: MinesIcon,
    onDesktop: false,
    folder: "games",
    surface: "bare",
    defaultSize: { width: 340, height: 420 },
    Content: lazy(() => import("@/components/apps/games/MinesApp")),
  },
  {
    id: "solitaire",
    kind: "window",
    icon: SolitaireIcon,
    onDesktop: false,
    folder: "games",
    surface: "bare",
    defaultSize: { width: 720, height: 560 },
    Content: lazy(() => import("@/components/apps/games/SolitaireApp")),
  },
  {
    id: "freecell",
    kind: "window",
    icon: FreeCellIcon,
    onDesktop: false,
    folder: "games",
    surface: "bare",
    defaultSize: { width: 720, height: 560 },
    Content: lazy(() => import("@/components/apps/games/FreeCellApp")),
  },
  {
    id: "hearts",
    kind: "window",
    icon: HeartsIcon,
    onDesktop: false,
    folder: "games",
    surface: "bare",
    defaultSize: { width: 720, height: 580 },
    Content: lazy(() => import("@/components/apps/games/HeartsApp")),
  },
  {
    id: "spider",
    kind: "window",
    icon: SpiderIcon,
    onDesktop: false,
    folder: "games",
    surface: "bare",
    defaultSize: { width: 780, height: 580 },
    Content: lazy(() => import("@/components/apps/games/SpiderApp")),
  },
  {
    id: "pinball",
    kind: "window",
    icon: PinballIcon,
    onDesktop: false,
    folder: "games",
    surface: "bare",
    defaultSize: { width: 460, height: 640 },
    Content: lazy(() => import("@/components/apps/games/PinballApp")),
  },
];

export function isGameId(id: string): id is GameId {
  return (GAME_IDS as readonly string[]).includes(id);
}

export const WINDOW_APPS: WindowAppConfig[] = LAUNCHERS.filter(
  (l): l is WindowAppConfig => l.kind === "window",
);

/** Launchers shown as desktop icons, in default (column-first) order. */
export const DESKTOP_LAUNCHERS = LAUNCHERS.filter(
  (l) => l.onDesktop,
) as (LauncherConfig & { id: DesktopIconId })[];

export const DESKTOP_ICON_IDS: DesktopIconId[] = DESKTOP_LAUNCHERS.map((l) => l.id);

/** External shortcuts, in registry order. */
export const LINK_LAUNCHERS: LinkConfig[] = LAUNCHERS.filter(
  (l): l is LinkConfig => l.kind === "link",
);

/** A desktop launcher that is a fun app (it lives in an All Programs folder). */
const isFunApp = (l: LauncherConfig) =>
  l.kind === "window" && (Boolean(l.folder) || l.id === "games");

/**
 * Desktop icons split into default-layout groups: the portfolio apps (+ CV)
 * first, then the external shortcuts, then the fun apps (Media Player, Retro
 * Cam, Paint). Each group starts a new column on the desktop and a new row on
 * mobile, so nothing pushes About / CV / Contact around.
 */
export const DESKTOP_ICON_GROUPS: DesktopIconId[][] = [
  DESKTOP_LAUNCHERS.filter((l) => l.kind !== "link" && !isFunApp(l)).map((l) => l.id),
  DESKTOP_LAUNCHERS.filter((l) => l.kind === "link").map((l) => l.id),
  DESKTOP_LAUNCHERS.filter(isFunApp).map((l) => l.id),
];

const WINDOW_APP_BY_ID = new Map<AppId, WindowAppConfig>(
  WINDOW_APPS.map((app) => [app.id, app]),
);

const LAUNCHER_BY_ID = new Map<LauncherId, LauncherConfig>(
  LAUNCHERS.map((l) => [l.id, l]),
);

/** A launcher that can sit inside an All Programs folder. */
export type FolderProgramConfig = WindowAppConfig | ActionConfig;

/** The All Programs folder a launcher lives in, if any (window apps and actions). */
export function folderOf(launcher: LauncherConfig): ProgramFolder | undefined {
  return launcher.kind === "window" || launcher.kind === "action" ? launcher.folder : undefined;
}

/** Launchers listed inside an All Programs folder, in registry order. */
export function programsInFolder(folder: ProgramFolder): FolderProgramConfig[] {
  return LAUNCHERS.filter(
    (l): l is FolderProgramConfig => folderOf(l) === folder,
  );
}

export function getApp(id: AppId): WindowAppConfig {
  const app = WINDOW_APP_BY_ID.get(id);
  if (!app) throw new Error(`Unknown app id: ${id}`);
  return app;
}

export function getLauncher(id: LauncherId): LauncherConfig {
  const launcher = LAUNCHER_BY_ID.get(id);
  if (!launcher) throw new Error(`Unknown launcher id: ${id}`);
  return launcher;
}

export function isAppId(id: LauncherId): id is AppId {
  return WINDOW_APP_BY_ID.has(id as AppId);
}

/**
 * i18n key of a launcher's friendly label (window title, icon label, menu
 * entry): `apps.<id>.title` for window apps, `resume.title` for the CV and the
 * own `titleKey` for external shortcuts and actions.
 */
export function launcherTitleKey(id: LauncherId): string {
  if (id === "resume") return "resume.title";
  const launcher = LAUNCHER_BY_ID.get(id);
  if (launcher?.kind === "link" || launcher?.kind === "action") return launcher.titleKey;
  return `apps.${id}.title`;
}
