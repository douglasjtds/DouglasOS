import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { IconComponent } from "@/components/icons/types";
import { PROFILE, RESUME } from "@/lib/profile";
import { PROJECTS_HOME_ROUTE, isProjectRoute } from "@/lib/content/projects";
import {
  AboutIcon,
  AiIcon,
  ContactIcon,
  DisplayIcon,
  ExperienceIcon,
  ProjectsIcon,
  ResumeIcon,
  SkillsIcon,
} from "@/components/icons/AppIcons";
import {
  EmailLinkIcon,
  GitHubLinkIcon,
  LinkedInLinkIcon,
  WhatsAppLinkIcon,
} from "@/components/icons/LinkIcons";

/** Apps that open as windows. `resume` is intentionally excluded (download). */
export type AppId =
  | "about"
  | "experience"
  | "projects"
  | "skills"
  | "how-i-work-with-ai"
  | "contact"
  | "display";

/**
 * External shortcuts (stage 3). These ids are stable on purpose: they are the
 * targets of the Recycle Bin rescue jokes in stage 6.
 */
export type LinkId = "linkedin" | "github" | "whatsapp" | "email";

/** Everything that can be launched (Start menu, desktop, Quick Launch). */
export type LauncherId = AppId | "resume" | LinkId;

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

/** Launchers that also live as desktop icons (Display Properties doesn't). */
export type DesktopIconId = Exclude<LauncherId, "display">;

export interface WindowAppConfig {
  id: AppId;
  kind: "window";
  icon: IconComponent;
  defaultSize: { width: number; height: number };
  /** Whether the launcher gets a desktop icon (all but system apps). */
  onDesktop: boolean;
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

export type LauncherConfig = WindowAppConfig | DownloadConfig | LinkConfig;

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
];

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

/**
 * Desktop icons split into default-layout groups: the apps (+ CV) first, then
 * the external shortcuts. Each group starts a new column on the desktop and a
 * new row on mobile, so the links never push About / CV / Contact around.
 */
export const DESKTOP_ICON_GROUPS: DesktopIconId[][] = [
  DESKTOP_LAUNCHERS.filter((l) => l.kind !== "link").map((l) => l.id),
  DESKTOP_LAUNCHERS.filter((l) => l.kind === "link").map((l) => l.id),
];

const WINDOW_APP_BY_ID = new Map<AppId, WindowAppConfig>(
  WINDOW_APPS.map((app) => [app.id, app]),
);

const LAUNCHER_BY_ID = new Map<LauncherId, LauncherConfig>(
  LAUNCHERS.map((l) => [l.id, l]),
);

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
 * link's own `titleKey` for external shortcuts.
 */
export function launcherTitleKey(id: LauncherId): string {
  if (id === "resume") return "resume.title";
  const launcher = LAUNCHER_BY_ID.get(id);
  if (launcher?.kind === "link") return launcher.titleKey;
  return `apps.${id}.title`;
}
