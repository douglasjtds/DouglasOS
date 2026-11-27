import { PROFILE } from "@/lib/profile";
import { PROJECTS } from "@/lib/content/projects";

/**
 * DouglasOS Web (the `browser` window): the short allowlist of sites it can
 * show, and the address-bar resolver.
 *
 * Sites render in one of two ways:
 * - `frame`: the real site in a sandboxed iframe. Only sites whose response
 *   headers allow being framed (no `X-Frame-Options`, no restrictive
 *   `frame-ancestors`) can use it: Douglas's projects and gasolinha.com.br.
 * - `local`: LinkedIn and GitHub refuse to be framed by any other origin, so
 *   their tab shows our own static profile page (DouglasOS's look, never the
 *   vendor's) with a button that opens the real site in a new tab.
 *
 * Anything else resolves to the "that's too much" page: this is a browser
 * inside a browser, it only goes where Douglas's work is.
 */

export type BrowserSiteId = string;

export interface BrowserSite {
  id: BrowserSiteId;
  /** Tab title / favorite label (brand name, not translated). */
  title: string;
  /** Real URL: the iframe source, or where "open the real site" goes. */
  url: string;
  render: "frame" | "local";
  /** Extra names the address bar accepts (case/accent/punctuation-insensitive). */
  aliases: readonly string[];
}

/** The start page and the "too much" page are part of the browser itself. */
export type BrowserPage =
  | { kind: "home" }
  | { kind: "site"; siteId: BrowserSiteId }
  | { kind: "blocked"; query: string };

const LOCAL_SITES: BrowserSite[] = [
  {
    id: "linkedin",
    title: "LinkedIn",
    url: PROFILE.linkedin,
    render: "local",
    aliases: ["linked in", "linkedin.com"],
  },
  {
    id: "github",
    title: "GitHub",
    url: PROFILE.github,
    render: "local",
    aliases: ["git hub", "github.com"],
  },
];

/** Every project with a public demo is a site (single source: `projects.ts`). */
const PROJECT_SITES: BrowserSite[] = PROJECTS.filter((p) => p.links.demo).map((p) => ({
  id: p.slug,
  title: p.name,
  url: p.links.demo as string,
  render: "frame",
  aliases: [p.name, ...p.aliases],
}));

/** Favorites order: LinkedIn, GitHub, then the projects in their list order. */
export const BROWSER_SITES: readonly BrowserSite[] = [...LOCAL_SITES, ...PROJECT_SITES];

/** Tabs a fresh window opens with. */
export const DEFAULT_SITE_IDS: readonly BrowserSiteId[] = ["linkedin", "gasolinha"];

const SITE_BY_ID = new Map(BROWSER_SITES.map((s) => [s.id, s]));

export function getSite(id: BrowserSiteId): BrowserSite | undefined {
  return SITE_BY_ID.get(id);
}

/** Host without `www.` (`https://www.gasolinha.com.br/x` → `gasolinha.com.br`). */
export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/** Lowercase, strip accents and everything that isn't a letter or digit. */
function normalizeKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/** Host → site and normalized name → site. */
const SITE_BY_HOST = new Map<string, BrowserSiteId>();
const SITE_BY_KEY = new Map<string, BrowserSiteId>();
for (const site of BROWSER_SITES) {
  SITE_BY_HOST.set(hostOf(site.url), site.id);
  for (const name of [site.id, site.title, ...site.aliases]) {
    SITE_BY_KEY.set(normalizeKey(name), site.id);
  }
}

const HOME_KEYS = new Set(["", "home", "inicio", "start", "aboutblank", "aboutstart"]);

/** The address shown for a page. */
export function formatPageAddress(page: BrowserPage): string {
  if (page.kind === "home") return "about:start";
  if (page.kind === "blocked") return page.query;
  return getSite(page.siteId)?.url ?? "";
}

/**
 * Resolve what was typed in the address bar. Accepts full URLs, bare hosts
 * (`gasolinha.com.br`), paths on an allowed host, names and aliases
 * (`poupensa`, "santo rosario"). An empty field goes home; anything else is
 * blocked (with the query kept for the joke).
 */
export function resolveBrowserAddress(input: string): BrowserPage {
  const query = input.trim();
  const key = normalizeKey(query);
  if (HOME_KEYS.has(key)) return { kind: "home" };

  const byName = SITE_BY_KEY.get(key);
  if (byName) return { kind: "site", siteId: byName };

  // Looks like a URL or host: compare hosts (paths on an allowed host are
  // fine, they just open the site's page we know).
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(query) ? query : `https://${query}`;
  const host = query.includes(".") ? hostOf(withScheme) : "";
  const byHost = host ? SITE_BY_HOST.get(host) : undefined;
  if (byHost) return { kind: "site", siteId: byHost };
  if (host) {
    // Subdomains of an allowed host (`m.linkedin.com`) count too.
    for (const [allowed, id] of SITE_BY_HOST) {
      if (host.endsWith(`.${allowed}`)) return { kind: "site", siteId: id };
    }
  }

  return { kind: "blocked", query };
}
