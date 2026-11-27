"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ExternalLink } from "lucide-react";
import { BROWSER_SITES, hostOf, type BrowserSite, type BrowserSiteId } from "@/lib/browser/sites";
import { openLink } from "@/lib/openLink";
import { BrowserAppIcon } from "@/components/icons/BrowserIcons";
import { WarningIcon } from "@/components/icons/SystemIcons";
import { Button } from "@/components/ui/button";

/** How long a framed site may take before the "taking a nap" fallback shows. */
export const FRAME_TIMEOUT_MS = 15_000;

/** What the in-page buttons can ask the browser to do. */
export interface PageActions {
  open: (siteId: BrowserSiteId) => void;
  downloadCv: () => void;
  contact: () => void;
}

/** CV + Contact, on every page the browser draws itself (golden rule). */
function CtaRow({ actions, children }: { actions: PageActions; children?: ReactNode }) {
  const t = useTranslations("apps.browser.pages");
  return (
    <div className="flex flex-wrap gap-2">
      {children}
      <Button data-browser-cta="cv" onClick={actions.downloadCv}>
        {t("downloadCv")}
      </Button>
      <Button data-browser-cta="contact" onClick={actions.contact}>
        {t("contact")}
      </Button>
    </div>
  );
}

/** The allowlist as clickable site tiles. */
function SiteList({ onOpen }: { onOpen: (id: BrowserSiteId) => void }) {
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-2">
      {BROWSER_SITES.map((site) => (
        <li key={site.id}>
          <button
            type="button"
            data-browser-site={site.id}
            onClick={() => onOpen(site.id)}
            className="flex w-full items-center gap-2 border border-field-border bg-surface p-2 text-left hover:bg-highlight hover:text-highlight-text focus-light max-md:min-h-touch-target"
          >
            <BrowserAppIcon size={24} />
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-body font-bold">{site.title}</span>
              <span className="truncate text-system opacity-80">{hostOf(site.url)}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** A page drawn by the browser itself: scrollable, padded, white. */
function LocalPage({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div data-browser-page={name} className="h-full overflow-auto overscroll-contain bg-surface p-5 max-md:p-3">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">{children}</div>
    </div>
  );
}

/** Start page: what this browser is, and the sites it knows. */
export function HomePage({ actions }: { actions: PageActions }) {
  const t = useTranslations("apps.browser.pages");
  return (
    <LocalPage name="home">
      <div className="flex items-center gap-3">
        <BrowserAppIcon size={48} />
        <div>
          <h3 className="text-heading-lg text-text">{t("home.heading")}</h3>
          <p className="text-body text-text">{t("home.intro")}</p>
        </div>
      </div>
      <SiteList onOpen={actions.open} />
      <CtaRow actions={actions} />
    </LocalPage>
  );
}

/** "That's too much": anything outside the allowlist. */
export function BlockedPage({ query, actions }: { query: string; actions: PageActions }) {
  const t = useTranslations("apps.browser.pages.blocked");
  return (
    <LocalPage name="blocked">
      <div className="flex items-start gap-3">
        <WarningIcon size={48} />
        <div className="flex flex-col gap-1">
          <h3 className="text-heading-lg text-text">{t("heading")}</h3>
          <p className="text-body text-text">{t("body", { query })}</p>
        </div>
      </div>
      <h4 className="text-heading text-text">{t("sites")}</h4>
      <SiteList onOpen={actions.open} />
      <CtaRow actions={actions} />
    </LocalPage>
  );
}

/**
 * LinkedIn / GitHub: they refuse to be framed, so this is our own short
 * profile page (DouglasOS look, About content) with a way to the real site.
 */
export function ProfilePage({ site, actions }: { site: BrowserSite; actions: PageActions }) {
  const t = useTranslations("apps.browser.pages.local");
  const about = useTranslations("apps.about");
  const variant = site.id === "github" ? "github" : "linkedin";
  return (
    <LocalPage name={`local-${site.id}`}>
      <p className="border border-field-border bg-surface-muted p-2 text-body text-text">{t(`${variant}.lead`)}</p>
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <span className="shrink-0 border border-field-border bg-surface p-1 shadow-menu">
          <Image
            src="/about/douglas.jpg"
            alt={about("photoAlt")}
            width={120}
            height={150}
            sizes="120px"
            className="block h-[150px] w-[120px] object-cover"
          />
        </span>
        <div className="flex flex-col gap-0.5">
          <h3 className="text-heading-lg text-text">{about("name")}</h3>
          <p className="text-heading text-text">{about("headline")}</p>
          <p className="text-system text-text-muted">{about("location")}</p>
        </div>
      </div>
      <p className="text-body text-text">{about.raw("summary")[0] as string}</p>
      <CtaRow actions={actions}>
        <Button variant="primary" data-browser-open-real onClick={() => openLink(site.url, true)}>
          <ExternalLink className="size-4" aria-hidden />
          {t(`${variant}.button`)}
        </Button>
      </CtaRow>
    </LocalPage>
  );
}

/**
 * A live site in a sandboxed iframe. `onLoaded` drives the status bar; if the
 * site hasn't loaded after `FRAME_TIMEOUT_MS`, a friendly fallback offers a
 * real tab (the iframe keeps loading behind it).
 */
export function FramePage({
  site,
  onLoaded,
}: {
  site: BrowserSite;
  onLoaded: () => void;
}) {
  const t = useTranslations("apps.browser");
  const [loaded, setLoaded] = useState(false);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (loaded) return;
    const timer = setTimeout(() => setSlow(true), FRAME_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [loaded]);

  return (
    <div className="relative h-full bg-surface">
      <iframe
        data-browser-frame={site.id}
        src={site.url}
        title={t("frameTitle", { title: site.title })}
        // Scripts + its own origin so the site works; forms and popups for its
        // own links. Never top navigation: the desktop stays where it is.
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        referrerPolicy="no-referrer"
        allow="clipboard-write"
        onLoad={() => {
          setLoaded(true);
          setSlow(false);
          onLoaded();
        }}
        className="block size-full border-0"
      />
      {slow && !loaded && (
        <div data-browser-slow className="absolute inset-0 flex items-center justify-center bg-surface p-4">
          <div className="flex max-w-md flex-col items-start gap-2">
            <h3 className="text-heading-lg text-text">{t("pages.slow.heading")}</h3>
            <p className="text-body text-text">{t("pages.slow.body", { title: site.title })}</p>
            <Button variant="primary" onClick={() => openLink(site.url, true)}>
              <ExternalLink className="size-4" aria-hidden />
              {t("pages.slow.button")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
