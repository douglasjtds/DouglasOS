import { getLauncher, type LauncherId } from "@/lib/apps/registry";
import { downloadFile } from "@/lib/download";
import { useWindowStore } from "@/lib/store/windowStore";

/**
 * Activate a launcher the same way from every surface (desktop icon, Start
 * menu, Quick Launch): window apps open (or focus) their singleton window,
 * the CV downloads `public/resume.pdf`.
 */
export function launch(id: LauncherId): void {
  const launcher = getLauncher(id);
  if (launcher.kind === "download") {
    downloadFile(launcher.href, launcher.download);
  } else {
    useWindowStore.getState().openWindow(launcher.id);
  }
}
