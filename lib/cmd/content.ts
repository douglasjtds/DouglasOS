import type { FsSource } from "@/lib/cmd/filesystem";
import { CASE_STUDY_SECTIONS, PROJECTS } from "@/lib/content/projects";
import { whatsappChatUrl } from "@/lib/messenger/links";
import { PROFILE } from "@/lib/profile";

/** Root-namespace translator (next-intl `useTranslations()` with no namespace satisfies it). */
export interface CmdTranslator {
  (key: string, values?: Record<string, string | number>): string;
  raw(key: string): unknown;
  has(key: string): boolean;
}

type TextSource = Exclude<FsSource, { kind: "resume" } | { kind: "game" }>;

function list<T>(t: CmdTranslator, key: string): T[] {
  const value = t.raw(key);
  return Array.isArray(value) ? (value as T[]) : [];
}

function about(t: CmdTranslator): string[] {
  const stats = list<{ label: string; value: string }>(t, "apps.about.stats");
  const summary = list<string>(t, "apps.about.summary").flatMap((p, i) => (i === 0 ? [p] : ["", p]));
  return [
    t("apps.about.name"),
    t("apps.about.headline"),
    t("apps.about.location"),
    "",
    ...summary,
    "",
    `${t("apps.about.statsTitle")}:`,
    ...stats.map((s) => `- ${s.label}: ${s.value}`),
  ];
}

function experience(t: CmdTranslator): string[] {
  const roles = list<{ period: string; company: string; role: string; description: string; tags: string[] }>(
    t,
    "apps.experience.roles",
  );
  return roles.flatMap((r, i) => [
    ...(i === 0 ? [] : [""]),
    `${r.period}  ${r.company} — ${r.role}`,
    r.description,
    `[${r.tags.join(", ")}]`,
  ]);
}

function skills(t: CmdTranslator): string[] {
  return list<{ name: string; items: string[] }>(t, "apps.skills.categories").map(
    (c) => `${c.name}: ${c.items.join(", ")}`,
  );
}

function howIWorkWithAi(t: CmdTranslator): string[] {
  const sections = list<{ heading: string; body: string }>(t, "apps.how-i-work-with-ai.sections");
  return [
    t("apps.how-i-work-with-ai.intro"),
    ...sections.flatMap((s) => ["", `## ${s.heading}`, s.body]),
  ];
}

function contact(t: CmdTranslator): string[] {
  return [
    t("apps.contact.heading"),
    t("apps.contact.availability"),
    "",
    `LinkedIn: ${PROFILE.linkedin}`,
    `GitHub: ${PROFILE.github}`,
    `E-mail: ${PROFILE.email}`,
    `WhatsApp: ${whatsappChatUrl()}`,
  ];
}

function project(slug: string, t: CmdTranslator): string[] {
  const p = PROJECTS.find((candidate) => candidate.slug === slug);
  if (!p) return [];
  const base = `apps.projects.caseStudies.${slug}`;
  const lines = [p.year ? `${p.name} (${p.year})` : p.name, p.tags.join(", ")];
  for (const section of CASE_STUDY_SECTIONS) {
    const key = `${base}.sections.${section}`;
    const body = t.has(key) ? t(key) : "";
    lines.push(
      "",
      `## ${t(`apps.projects.explorer.page.sections.${section}`)}`,
      body || t("apps.projects.explorer.page.comingSoon"),
    );
  }
  const links: string[] = [];
  if (p.links.repo) links.push(`${t("apps.projects.explorer.page.repo")}: ${p.links.repo}`);
  if (p.links.demo) links.push(`${t("apps.projects.explorer.page.demo")}: ${p.links.demo}`);
  if (links.length > 0) lines.push("", ...links);
  return lines;
}

/** Plain-text version of a portfolio file: one array item per line, "" is a blank line. */
export function renderFile(source: TextSource, t: CmdTranslator): string[] {
  switch (source.kind) {
    case "readme":
      return list<string>(t, "apps.cmd.readme");
    case "project":
      return project(source.slug, t);
    case "app":
      switch (source.app) {
        case "about":
          return about(t);
        case "experience":
          return experience(t);
        case "skills":
          return skills(t);
        case "how-i-work-with-ai":
          return howIWorkWithAi(t);
        case "contact":
          return contact(t);
      }
  }
}
