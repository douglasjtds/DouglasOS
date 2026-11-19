import { getLauncher, type LauncherId } from "@/lib/apps/registry";
import { downloadFile } from "@/lib/download";
import { openLink } from "@/lib/openLink";
import { useWindowStore, type WindowDestination } from "@/lib/store/windowStore";

/**
 * Activate a launcher the same way from every surface (desktop icon, Start
 * menu, Quick Launch): window apps open (or focus) their singleton window,
 * the CV downloads `public/resume.pdf`, external shortcuts follow their link.
 * `destination` is forwarded to `openWindow` (e.g. a project route).
 */
export function launch(id: LauncherId, destination?: WindowDestination): void {
  const launcher = getLauncher(id);
  if (launcher.kind === "download") {
    downloadFile(launcher.href, launcher.download);
  } else if (launcher.kind === "link") {
    openLink(launcher.href, launcher.external);
  } else {
    useWindowStore.getState().openWindow(launcher.id, destination);
  }
}
