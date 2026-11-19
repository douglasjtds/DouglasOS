import type { AppId } from "@/lib/apps/registry";
import { launch } from "@/lib/apps/launch";
import { FEATURED_PROJECT_SLUG, PROJECTS_HOME_ROUTE } from "@/lib/content/projects";
import { isFallback, type IntentId, type IntentResult } from "@/lib/assistant/intents";

/**
 * Shell actions a scripted character can offer as shortcuts. UI-agnostic:
 * the assistant bubble (stage 5), the Messenger quick replies (stage 5b) and
 * Run / the palette (stage 7) all run them through `runShellAction`.
 */
export type ShellAction =
  /** Open a case study in DouglasOS Explorer (default: the featured project). */
  | { kind: "openProject"; slug?: string }
  /** Open (or focus) an app window. `projects` opens the Explorer home. */
  | { kind: "openApp"; app: AppId }
  /** Download `public/resume.pdf` (same path as the desktop icon). */
  | { kind: "downloadCv" };

/** Perform a shell action through the same launcher every surface uses. */
export function runShellAction(action: ShellAction): void {
  switch (action.kind) {
    case "openProject":
      launch("projects", { route: action.slug ?? FEATURED_PROJECT_SLUG });
      return;
    case "openApp":
      launch(action.app, action.app === "projects" ? { route: PROJECTS_HOME_ROUTE } : undefined);
      return;
    case "downloadCv":
      launch("resume");
  }
}

const CONTACT: ShellAction = { kind: "openApp", app: "contact" };
const CV: ShellAction = { kind: "downloadCv" };
const PROJECT_LIST: ShellAction = { kind: "openApp", app: "projects" };

/** Shortcuts offered for each intent, most relevant first. */
export const INTENT_ACTIONS: Record<IntentId, readonly ShellAction[]> = {
  cv: [CV, CONTACT],
  contact: [CONTACT, CV],
  projects: [PROJECT_LIST, { kind: "openProject" }],
  skills: [{ kind: "openApp", app: "skills" }, PROJECT_LIST],
  availability: [CONTACT, CV],
  "ai-workflow": [{ kind: "openApp", app: "how-i-work-with-ai" }, PROJECT_LIST],
  experience: [{ kind: "openApp", app: "experience" }, CV],
  about: [{ kind: "openApp", app: "about" }, CONTACT],
};

/** Shortcuts when nothing matched: the recruiter essentials. */
export const FALLBACK_ACTIONS: readonly ShellAction[] = [PROJECT_LIST, CV, CONTACT];

/**
 * Shortcuts for a matcher result. A named project leads with that case study
 * (then the list); otherwise the intent's defaults, or the fallback set.
 */
export function actionsForIntent(result: IntentResult): readonly ShellAction[] {
  if (isFallback(result)) return FALLBACK_ACTIONS;
  if (result.projectSlug) {
    return [{ kind: "openProject", slug: result.projectSlug }, PROJECT_LIST];
  }
  return INTENT_ACTIONS[result.intent];
}
