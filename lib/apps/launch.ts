import { getLauncher, type LauncherId } from "@/lib/apps/registry";
import { downloadFile } from "@/lib/download";
import { openLink } from "@/lib/openLink";
import { useWindowStore } from "@/lib/store/windowStore";

/**
 * Activate a launcher the same way from every surface (desktop icon, Start
 * menu, Quick Launch): window apps open (or focus) their singleton window,
 * the CV downloads `public/resume.pdf`, external shortcuts follow their link.
 */
export function launch(id: LauncherId): void {
  const launcher = getLauncher(id);
  if (launcher.kind === "download") {
    downloadFile(launcher.href, launcher.download);
  } else if (launcher.kind === "link") {
    openLink(launcher.href, launcher.external);
  } else {
    useWindowStore.getState().openWindow(launcher.id);
  }
}
