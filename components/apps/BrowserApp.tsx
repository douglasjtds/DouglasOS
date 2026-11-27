"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertDialog } from "radix-ui";
import {
  DEFAULT_SITE_IDS,
  formatPageAddress,
  getSite,
  resolveBrowserAddress,
  type BrowserPage,
  type BrowserSiteId,
} from "@/lib/browser/sites";
import {
  MAX_TABS,
  MAX_TABS_MOBILE,
  activeTab,
  canGoBack,
  canGoForward,
  closeTab,
  createBrowser,
  currentPage,
  goBack,
  goForward,
  navigate,
  openTab,
  reload,
  selectTab,
  type BrowserState,
  type BrowserTab,
} from "@/lib/browser/tabs";
import { launch } from "@/lib/apps/launch";
import { openLink } from "@/lib/openLink";
import { useWindowStore } from "@/lib/store/windowStore";
import { useIsMobile } from "@/hooks/useIsMobile";
import { MessageBox } from "@/components/os/MessageBox";
import { Button } from "@/components/ui/button";
import { WarningIcon } from "@/components/icons/SystemIcons";
import {
  BrowserMenuBar,
  BrowserStatusBar,
  BrowserTabStrip,
  BrowserToolbar,
  type BrowserActions,
} from "@/components/apps/browser/BrowserBars";
import {
  BlockedPage,
  FramePage,
  HomePage,
  ProfilePage,
  type PageActions,
} from "@/components/apps/browser/BrowserPages";

const ID = "browser";
const PANEL_ID = "browser-panel";

const sitePage = (siteId: BrowserSiteId): BrowserPage => ({ kind: "site", siteId });

/** Identity of what a tab shows right now (a new value remounts its iframe). */
function frameKey(tab: BrowserTab): string {
  const page = currentPage(tab);
  return `${tab.id}:${page.kind === "site" ? page.siteId : page.kind}:${tab.reloadKey}`;
}

/**
 * DouglasOS Web: a real browser for a short allowlist (`lib/browser/sites.ts`).
 * Projects and gasolinha.com.br load live in sandboxed iframes; LinkedIn and
 * GitHub (which refuse to be framed) get a local profile page with a button
 * to the real site; anything else gets the "that's too much" page, and a tab
 * past the limit gets the "too many tabs" message.
 *
 * Tabs live in React state (not persisted: the window isn't restored after a
 * reload, so no iframe loads with the shell). Tabs that were opened stay
 * mounted while hidden, so switching back doesn't reload the site.
 */
export default function BrowserApp() {
  const t = useTranslations("apps.browser");
  const mobile = useIsMobile();
  const maxTabs = mobile ? MAX_TABS_MOBILE : MAX_TABS;

  const [state, setState] = useState<BrowserState>(() =>
    createBrowser(DEFAULT_SITE_IDS.slice(0, mobile ? MAX_TABS_MOBILE : MAX_TABS).map(sitePage)),
  );
  // Tabs that have been shown at least once keep their iframe mounted.
  const [visited, setVisited] = useState<ReadonlySet<number>>(() => new Set([state.activeId]));
  if (!visited.has(state.activeId)) setVisited(new Set([...visited, state.activeId]));
  // Frame keys whose iframe has fired `load`.
  const [loaded, setLoaded] = useState<ReadonlySet<string>>(() => new Set());
  const [tooMany, setTooMany] = useState(false);

  const tab = activeTab(state);
  const page = currentPage(tab);
  const site = page.kind === "site" ? getSite(page.siteId) : undefined;

  // The address field shows the current page until edited; a page change resets it.
  const address = formatPageAddress(page);
  const [draft, setDraft] = useState(address);
  const [shownAddress, setShownAddress] = useState(address);
  if (shownAddress !== address) {
    setShownAddress(address);
    setDraft(address);
  }
  const inputRef = useRef<HTMLInputElement>(null);

  const go = (next: BrowserPage) => setState((s) => navigate(s, next));
  const open = (siteId: BrowserSiteId) => go(sitePage(siteId));

  function newTab() {
    const result = openTab(state, { kind: "home" }, maxTabs);
    if (result.limited) setTooMany(true);
    else setState(result.state);
  }

  function close(id: number) {
    const next = closeTab(state, id);
    if (next) setState(next);
    else useWindowStore.getState().closeWindow(ID);
  }

  const pageActions: PageActions = {
    open,
    downloadCv: () => launch("resume"),
    contact: () => launch("contact"),
  };
  const actions: BrowserActions = {
    ...pageActions,
    newTab,
    closeTab: () => close(state.activeId),
    openReal: site ? () => openLink(site.url, true) : null,
    close: () => useWindowStore.getState().closeWindow(ID),
  };

  function tabTitle(tb: BrowserTab): string {
    const p = currentPage(tb);
    if (p.kind === "home") return t("tabs.home");
    if (p.kind === "blocked") return t("tabs.blocked");
    return getSite(p.siteId)?.title ?? "";
  }

  const loading = site?.render === "frame" && !loaded.has(frameKey(tab));
  const status = !site
    ? t(page.kind === "home" ? "status.home" : "status.blocked")
    : site.render === "local"
      ? t("status.local", { title: site.title })
      : loading
        ? t("status.loading", { title: site.title })
        : t("status.done");

  return (
    <div data-browser className="flex min-h-0 flex-1 flex-col">
      {!mobile && <BrowserMenuBar actions={actions} />}
      <BrowserToolbar
        mobile={mobile}
        canBack={canGoBack(tab)}
        canForward={canGoForward(tab)}
        onBack={() => setState(goBack)}
        onForward={() => setState(goForward)}
        onRefresh={() => setState(reload)}
        onHome={() => go({ kind: "home" })}
        address={draft}
        onAddressChange={setDraft}
        onSubmit={() => {
          const next = resolveBrowserAddress(draft);
          go(next);
          setDraft(formatPageAddress(next));
        }}
        onEscape={() => {
          setDraft(address);
          requestAnimationFrame(() => inputRef.current?.select());
        }}
        inputRef={inputRef}
        actions={actions}
      />
      <BrowserTabStrip
        tabs={state.tabs.map((tb) => ({ id: tb.id, title: tabTitle(tb) }))}
        activeId={state.activeId}
        panelId={PANEL_ID}
        onSelect={(id) => setState((s) => selectTab(s, id))}
        onClose={close}
        onNew={newTab}
      />

      <div
        id={PANEL_ID}
        role="tabpanel"
        aria-labelledby={`browser-tab-${state.activeId}`}
        className="relative mx-1 min-h-0 flex-1 overflow-hidden border border-field-border bg-surface max-md:mx-0.5"
      >
        {state.tabs.map((tb) => {
          if (!visited.has(tb.id)) return null;
          const p = currentPage(tb);
          const s = p.kind === "site" ? getSite(p.siteId) : undefined;
          const key = frameKey(tb);
          let content;
          if (s?.render === "frame") {
            content = (
              <FramePage
                key={key}
                site={s}
                onLoaded={() => setLoaded((prev) => new Set([...prev, key]))}
              />
            );
          } else if (s) {
            content = <ProfilePage key={key} site={s} actions={pageActions} />;
          } else if (p.kind === "blocked") {
            content = <BlockedPage key={key} query={p.query} actions={pageActions} />;
          } else {
            content = <HomePage key={key} actions={pageActions} />;
          }
          return (
            <div key={tb.id} data-browser-tab-panel={tb.id} hidden={tb.id !== state.activeId} className="absolute inset-0">
              {content}
            </div>
          );
        })}
      </div>

      <BrowserStatusBar status={status} loading={loading} />
      <p aria-live="polite" className="sr-only">
        {t("announce", { title: tabTitle(tab) })}
      </p>

      <MessageBox
        testId="browser-too-many-tabs"
        open={tooMany}
        onOpenChange={setTooMany}
        title={t("tooMany.title")}
        icon={<WarningIcon size={32} />}
        actions={
          <>
            <AlertDialog.Action asChild>
              <Button data-too-many-cv onClick={() => launch("resume")}>
                {t("tooMany.downloadCv")}
              </Button>
            </AlertDialog.Action>
            <AlertDialog.Cancel asChild>
              <Button variant="primary">{t("tooMany.ok")}</Button>
            </AlertDialog.Cancel>
          </>
        }
      >
        {t("tooMany.body", { count: String(state.tabs.length + 1) })}
      </MessageBox>
    </div>
  );
}
