import { PROJECTS, PROJECTS_HOME_ROUTE } from "@/lib/content/projects";

/**
 * DouglasOS Explorer address bar (DESKTOP-INTERFACE-SPEC §10 → My Projects).
 *
 * Address format: `C:\DouglasOS\Projects\<slug>`; the home page (the project
 * list) is `C:\DouglasOS\Projects\`. A generic drive-letter path, picked so the
 * window reads as "a folder of projects opened in a browser".
 *
 * The resolver is forgiving: case, surrounding spaces/quotes, `/` vs `\`, the
 * `C:\DouglasOS\Projects\` prefix (whole or partial), a fun file extension
 * (`gasolinha.exe`) and punctuation/spacing inside names are all ignored, and
 * each project also answers to its brand name and aliases.
 */

export const ADDRESS_ROOT = "C:\\DouglasOS\\Projects\\";

export type AddressResolution =
  | { kind: "route"; route: string }
  | { kind: "notFound"; query: string };

/** The address shown for a route. */
export function formatAddress(route: string): string {
  return route === PROJECTS_HOME_ROUTE ? ADDRESS_ROOT : `${ADDRESS_ROOT}${route}`;
}

/** Lowercase, strip accents and everything that isn't a letter or digit. */
function normalizeKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/** Normalized name → route, built from slugs, brand names and aliases. */
const ROUTE_BY_KEY = new Map<string, string>();
for (const project of PROJECTS) {
  for (const name of [project.slug, project.name, ...project.aliases]) {
    ROUTE_BY_KEY.set(normalizeKey(name), project.slug);
  }
}
for (const name of ["home", "inicio", "index", "projects", "projetos", "myprojects", "meusprojetos"]) {
  ROUTE_BY_KEY.set(name, PROJECTS_HOME_ROUTE);
}

/** Path prefix segments that may be typed before the project name. */
const DRIVE = /^[a-z]:$/i;
const PREFIX_KEYS = ["douglasos", "projects"];

/** Fun file extensions people may type after a name. */
const EXTENSION = /\.(exe|html?|url|lnk|app)$/i;

export function resolveAddress(input: string): AddressResolution {
  const query = input.trim();
  const cleaned = query.replace(/^["']+|["']+$/g, "").replace(/\//g, "\\");
  const segments = cleaned
    .split("\\")
    .map((s) => s.trim())
    .filter(Boolean);

  // Drop the drive and the `DouglasOS\Projects` prefix, in that order. A
  // prefix word on its own is a name ("DouglasOS" is also a project), unless
  // it follows a drive ("C:\DouglasOS" is the root folder).
  const hadDrive = segments.length > 0 && DRIVE.test(segments[0]);
  if (hadDrive) segments.shift();
  for (const key of PREFIX_KEYS) {
    const isPrefix = segments.length > 1 || (hadDrive && segments.length === 1);
    if (isPrefix && normalizeKey(segments[0]) === key) segments.shift();
  }

  if (segments.length === 0) return { kind: "route", route: PROJECTS_HOME_ROUTE };
  if (segments.length > 1) return { kind: "notFound", query };

  const route = ROUTE_BY_KEY.get(normalizeKey(segments[0].replace(EXTENSION, "")));
  return route ? { kind: "route", route } : { kind: "notFound", query };
}
