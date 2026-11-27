import { launch } from "@/lib/apps/launch";
import { getLauncher, type AppId } from "@/lib/apps/registry";
import { PROJECTS_HOME_ROUTE } from "@/lib/content/projects";
import type { RunTarget } from "@/lib/run/resolver";

/**
 * Perform a Run / palette target through the launcher every surface uses.
 * Returns the id of the window it opened or focused (so the caller can move
 * focus there), or null when nothing windowed happened (CV download, external
 * link).
 */
export function executeRunTarget(target: RunTarget): AppId | null {
  const { id, route } = target;
  // `projects` without a route goes home, like the assistant's "open projects".
  launch(id, id === "projects" ? { route: route ?? PROJECTS_HOME_ROUTE } : undefined);
  const launcher = getLauncher(id);
  return launcher.kind === "window" ? launcher.id : null;
}
