import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import {
  Briefcase,
  FolderOpen,
  Layers,
  MessageSquare,
  Sparkles,
  UserCircle,
  FileText,
  type LucideIcon,
} from "lucide-react";

/** The six apps that open as windows. `resume` is intentionally excluded. */
export type AppId =
  | "about"
  | "experience"
  | "projects"
  | "skills"
  | "how-i-work-with-ai"
  | "contact";

/** Everything that can sit in the dock / on the desktop. */
export type LauncherId = AppId | "resume";

/** Icon-container color family (DESIGN-GUIDELINES: cyan primary, purple only
 *  for AI-related elements, resume visually distinct as the primary CTA). */
export type LauncherTint = "neutral" | "purple" | "accent";

export interface WindowAppConfig {
  id: AppId;
  kind: "window";
  /** Key into the `apps` i18n namespace, e.g. "about" → apps.about.title. */
  titleKey: AppId;
  icon: LucideIcon;
  tint: LauncherTint;
  defaultSize: { width: number; height: number };
  /** Lazily-loaded window body so content never bloats the shell bundle. */
  Content: LazyExoticComponent<ComponentType>;
}

export interface DownloadConfig {
  id: "resume";
  kind: "download";
  titleKey: "resume";
  icon: LucideIcon;
  tint: LauncherTint;
  href: string;
  download: string;
}

export type LauncherConfig = WindowAppConfig | DownloadConfig;

/**
 * Single source of truth for launchers, in dock / desktop order. The CTA
 * hierarchy (resume + contact most reachable) is reflected by placing them
 * last in the row so they sit near the dock's right edge.
 */
export const LAUNCHERS: LauncherConfig[] = [
  {
    id: "about",
    kind: "window",
    titleKey: "about",
    icon: UserCircle,
    tint: "neutral",
    defaultSize: { width: 600, height: 550 },
    Content: lazy(() => import("@/components/apps/AboutApp")),
  },
  {
    id: "experience",
    kind: "window",
    titleKey: "experience",
    icon: Briefcase,
    tint: "neutral",
    defaultSize: { width: 700, height: 600 },
    Content: lazy(() => import("@/components/apps/ExperienceApp")),
  },
  {
    id: "projects",
    kind: "window",
    titleKey: "projects",
    icon: FolderOpen,
    tint: "neutral",
    defaultSize: { width: 700, height: 600 },
    Content: lazy(() => import("@/components/apps/ProjectsApp")),
  },
  {
    id: "skills",
    kind: "window",
    titleKey: "skills",
    icon: Layers,
    tint: "neutral",
    defaultSize: { width: 650, height: 550 },
    Content: lazy(() => import("@/components/apps/SkillsApp")),
  },
  {
    id: "how-i-work-with-ai",
    kind: "window",
    titleKey: "how-i-work-with-ai",
    icon: Sparkles,
    tint: "purple",
    defaultSize: { width: 700, height: 600 },
    Content: lazy(() => import("@/components/apps/HowIWorkWithAiApp")),
  },
  {
    id: "contact",
    kind: "window",
    titleKey: "contact",
    icon: MessageSquare,
    tint: "neutral",
    defaultSize: { width: 500, height: 500 },
    Content: lazy(() => import("@/components/apps/ContactApp")),
  },
  {
    id: "resume",
    kind: "download",
    titleKey: "resume",
    icon: FileText,
    tint: "accent",
    href: "/resume.pdf",
    download: "Douglas-Tertuliano-CV.pdf",
  },
];

export const WINDOW_APPS: WindowAppConfig[] = LAUNCHERS.filter(
  (l): l is WindowAppConfig => l.kind === "window",
);

const WINDOW_APP_BY_ID = new Map<AppId, WindowAppConfig>(
  WINDOW_APPS.map((app) => [app.id, app]),
);

export function getApp(id: AppId): WindowAppConfig {
  const app = WINDOW_APP_BY_ID.get(id);
  if (!app) throw new Error(`Unknown app id: ${id}`);
  return app;
}

export function isAppId(id: LauncherId): id is AppId {
  return id !== "resume";
}
