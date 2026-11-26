import { useEffect } from "react";
import { launch } from "@/lib/apps/launch";
import { appFromHash } from "@/lib/apps/deepLink";

/**
 * Open the window a `#open=<app>` home link asks for (stage 10, used by the
 * 404 page's "Talk to Douglas"), once, then drop the hash so a reload doesn't
 * reopen it. During boot/logon the window simply waits behind those screens.
 */
export function useOpenFromHash() {
  useEffect(() => {
    const app = appFromHash(window.location.hash);
    if (!app) return;
    launch(app);
    const { pathname, search } = window.location;
    window.history.replaceState(window.history.state, "", `${pathname}${search}`);
  }, []);
}
