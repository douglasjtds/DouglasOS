import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { IconComponent } from "@/components/icons/types";
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

/** Apps that open as windows. `resume` is intentionally excluded (download). */
export type AppId =
  | "about"
  | "experience"
  | "projects"
  | "skills"
  | "how-i-work-with-ai"
  | "contact"
  | "display";

/** Everything that can be launched (Start menu, desktop, Quick Launch). */
export type LauncherId = AppId | "resume";

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
   * pane; "dialog" keeps the beige button-face body (property sheets).
   */
  surface?: "pane" | "dialog";
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

export type LauncherConfig = WindowAppConfig | DownloadConfig;

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
    href: "/resume.pdf",
    download: "Douglas-Tertuliano-CV.pdf",
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
    defaultSize: { width: 700, height: 600 },
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
  return id !== "resume";
}

/**
 * i18n key of a launcher's friendly label (window title, icon label, menu
 * entry): `apps.<id>.title` for window apps, `resume.title` for the CV.
 */
export function launcherTitleKey(id: LauncherId): string {
  return id === "resume" ? "resume.title" : `apps.${id}.title`;
}
