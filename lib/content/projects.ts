/**
 * Case studies shown in DouglasOS Explorer (the `projects` window).
 *
 * Typed static source (no MDX, no CMS): the language-neutral facts live here,
 * the prose lives in `messages/{en,pt}.json` under
 * `apps.projects.caseStudies.<slug>` (category, status, summary and the four
 * sections). A section whose text is an empty string renders as a
 * "coming soon" note: nothing is ever invented to fill a gap.
 *
 * Images go in `public/projects/<slug>/` and are listed in `images` with their
 * intrinsic size (next/image needs it) and an i18n key for the alt text.
 *
 * Content still to be written by Douglas is marked `TODO(douglas)` below and
 * in the JSON (empty strings).
 */

/** The four case-study sections, in reading order. */
export const CASE_STUDY_SECTIONS = ["problem", "approach", "role", "result"] as const;
export type CaseStudySection = (typeof CASE_STUDY_SECTIONS)[number];

export interface ProjectImage {
  /** File name inside `public/projects/<slug>/`. */
  file: string;
  width: number;
  height: number;
  /** i18n key (under `apps.projects.caseStudies.<slug>`) of the alt text. */
  altKey: string;
}

export interface ProjectCaseStudy {
  /** Stable id: the address-bar path segment and the route stored per window. */
  slug: string;
  /** Brand name, not translated. */
  name: string;
  /** Year the project started; null until Douglas confirms it. */
  year: number | null;
  /** Extra names the address bar accepts (case/spacing/punctuation-insensitive). */
  aliases: string[];
  /** Stack tags (language-neutral). */
  tags: string[];
  links: { repo?: string; demo?: string };
  images: ProjectImage[];
}

export const PROJECTS: ProjectCaseStudy[] = [
  {
    slug: "gasolinha",
    name: "Gasolinha",
    // TODO(douglas): start year.
    year: null,
    aliases: ["gasolinha.com.br", "fuel tracker"],
    tags: ["Next.js", "TypeScript", "Supabase", "Vercel"],
    // TODO(douglas): repo URL, if it can be public.
    links: { demo: "https://www.gasolinha.com.br" },
    // TODO(douglas): screenshots in public/projects/gasolinha/.
    images: [],
  },
  {
    slug: "douglasos",
    name: "DouglasOS",
    year: 2026,
    aliases: ["douglas os", "portfolio", "this site"],
    tags: ["Next.js", "TypeScript", "Zustand", "Framer Motion"],
    // TODO(douglas): repo URL, if it can be public.
    links: {},
    images: [],
  },
  {
    slug: "the-wedding-post",
    name: "The Wedding Post",
    // TODO(douglas): start year.
    year: null,
    aliases: ["wedding post", "wedding"],
    tags: ["Next.js", "TypeScript"],
    // TODO(douglas): demo/repo URLs once it ships.
    links: {},
    // TODO(douglas): screenshots in public/projects/the-wedding-post/.
    images: [],
  },
];

/**
 * The project surfaced by "Show me a project" shortcuts (assistant, later the
 * messenger): the first case study in the list above.
 */
export const FEATURED_PROJECT_SLUG = PROJECTS[0].slug;

/** Route of the Explorer home page (the project list). Never a slug. */
export const PROJECTS_HOME_ROUTE = "home";

const PROJECT_BY_SLUG = new Map(PROJECTS.map((p) => [p.slug, p]));

export function getProject(slug: string): ProjectCaseStudy | undefined {
  return PROJECT_BY_SLUG.get(slug);
}

/** True for the routes the `projects` window can show (home or a slug). */
export function isProjectRoute(route: string): boolean {
  return route === PROJECTS_HOME_ROUTE || PROJECT_BY_SLUG.has(route);
}

/** Public path of a case-study image. */
export function projectImageSrc(slug: string, image: ProjectImage): string {
  return `/projects/${slug}/${image.file}`;
}
