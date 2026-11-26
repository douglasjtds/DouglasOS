"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertDialog } from "radix-ui";
import { useWindowStore } from "@/lib/store/windowStore";
import {
  canGoBack,
  canGoForward,
  currentRoute,
} from "@/lib/store/routeHistory";
import { PROJECTS_HOME_ROUTE, getProject } from "@/lib/content/projects";
import { formatAddress, resolveAddress } from "@/lib/content/projectAddress";
import { launch } from "@/lib/apps/launch";
import { useIsMobile } from "@/hooks/useIsMobile";
import { MessageBox } from "@/components/os/MessageBox";
import { Button } from "@/components/ui/button";
import { ErrorIcon } from "@/components/icons/SystemIcons";
import {
  ExplorerMenuBar,
  ExplorerStatusBar,
  ExplorerToolbar,
  type ExplorerActions,
} from "@/components/apps/explorer/ExplorerBars";
import { CaseStudyPage, ExplorerHome } from "@/components/apps/explorer/ExplorerPages";

const ID = "projects";

/**
 * DouglasOS Explorer (DESKTOP-INTERFACE-SPEC §10 → My Projects): the
 * `projects` window as a small browser for case studies. The current page and
 * the Back/Forward history live in `windowStore` (the window's `history`), so
 * other surfaces can open a page with `openWindow("projects", { route })` and
 * the page survives a reload. The address bar resolves slugs, brand names and
 * aliases (`lib/content/projectAddress.ts`); anything else opens a themed
 * "not found" message box with ways out (project list, Contact).
 *
 * Pages swap instantly (no transition, so nothing to reduce under
 * prefers-reduced-motion); focus moves to the new page's heading and a polite
 * live region announces its title.
 */
export default function ProjectsApp() {
  const t = useTranslations("apps.projects");
  const history = useWindowStore((s) => s.windows[ID]?.history);
  const mobile = useIsMobile();
  const route = history ? currentRoute(history) : PROJECTS_HOME_ROUTE;
  const project = getProject(route);

  // The address field shows the current page until the user edits it; a page
  // change resets it (React's "adjust state when a prop changes" pattern).
  const [draft, setDraft] = useState(() => formatAddress(route));
  const [shownRoute, setShownRoute] = useState(route);
  if (shownRoute !== route) {
    setShownRoute(route);
    setDraft(formatAddress(route));
  }
  const [notFound, setNotFound] = useState<string | null>(null);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const paneRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const firstRender = useRef(true);
  // A not-found action that moves focus (new page, Contact window) must not
  // have the dialog pull focus back to the address field on close.
  const keepFocus = useRef(false);

  // Page change: back to the top, focus the new heading (not on first open —
  // the window itself takes focus then).
  useEffect(() => {
    // Narrow fields (phones) would hide the slug: show the end of the path.
    const input = inputRef.current;
    if (input && document.activeElement !== input) input.scrollLeft = input.scrollWidth;
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (paneRef.current) paneRef.current.scrollTop = 0;
    headingRef.current?.focus({ preventScroll: true });
  }, [route]);

  const store = useWindowStore.getState;
  const go = (next: string) => store().navigateWindow(ID, next);
  const actions: ExplorerActions = {
    go,
    contact: () => launch("contact"),
    downloadCv: () => launch("resume"),
    close: () => store().closeWindow(ID),
  };

  function submitAddress() {
    const result = resolveAddress(draft);
    if (result.kind === "route") {
      go(result.route);
      // Same page (or just a different spelling of it): normalize the field.
      setDraft(formatAddress(result.route));
    } else {
      setNotFound(result.query || draft);
    }
  }

  const title = project ? project.name : t("explorer.home.heading");

  return (
    <div data-explorer className="flex min-h-0 flex-1 flex-col">
      {!mobile && <ExplorerMenuBar actions={actions} />}
      <ExplorerToolbar
        mobile={mobile}
        canBack={history ? canGoBack(history) : false}
        canForward={history ? canGoForward(history) : false}
        onBack={() => store().windowBack(ID)}
        onForward={() => store().windowForward(ID)}
        onHome={() => go(PROJECTS_HOME_ROUTE)}
        address={draft}
        onAddressChange={setDraft}
        onSubmit={submitAddress}
        onEscape={() => {
          setDraft(formatAddress(route));
          requestAnimationFrame(() => inputRef.current?.select());
        }}
        inputRef={inputRef}
        actions={actions}
      />

      <div
        ref={paneRef}
        className="mx-1 min-h-0 flex-1 overflow-auto overscroll-contain border border-field-border bg-surface p-4 max-md:mx-0.5 max-md:p-3"
      >
        {project ? (
          <CaseStudyPage
            project={project}
            headingRef={headingRef}
            onHome={() => go(PROJECTS_HOME_ROUTE)}
            onContact={actions.contact}
          />
        ) : (
          <ExplorerHome headingRef={headingRef} onOpen={go} />
        )}
      </div>

      <ExplorerStatusBar />
      <p aria-live="polite" className="sr-only">
        {t("explorer.announce", { title })}
      </p>

      <MessageBox
        testId="explorer-not-found"
        open={notFound !== null}
        onOpenChange={(open) => {
          if (!open) setNotFound(null);
        }}
        onCloseAutoFocus={(e) => {
          if (keepFocus.current) e.preventDefault();
          keepFocus.current = false;
        }}
        title={t("explorer.notFound.title")}
        icon={<ErrorIcon size={32} />}
        actions={
          <>
            <AlertDialog.Action asChild>
              <Button
                data-not-found-home
                onClick={() => {
                  keepFocus.current = route !== PROJECTS_HOME_ROUTE;
                  go(PROJECTS_HOME_ROUTE);
                }}
              >
                {t("explorer.notFound.home")}
              </Button>
            </AlertDialog.Action>
            <AlertDialog.Action asChild>
              <Button
                data-not-found-contact
                onClick={() => {
                  keepFocus.current = true;
                  actions.contact();
                }}
              >
                {t("explorer.notFound.contact")}
              </Button>
            </AlertDialog.Action>
            <AlertDialog.Cancel asChild>
              <Button variant="primary">{t("explorer.notFound.ok")}</Button>
            </AlertDialog.Cancel>
          </>
        }
      >
        {t("explorer.notFound.body", { address: notFound ?? "" })}
      </MessageBox>
    </div>
  );
}
