import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import pt from "@/messages/pt.json";
import {
  CASE_STUDY_SECTIONS,
  PROJECTS,
  PROJECTS_HOME_ROUTE,
  getProject,
  isProjectRoute,
} from "@/lib/content/projects";

type Study = {
  category: string;
  status: string;
  summary: string;
  sections: Record<string, string>;
};
const studies = (messages: typeof en) =>
  messages.apps.projects.caseStudies as unknown as Record<string, Study>;

describe("project case studies", () => {
  it("have unique slugs that never collide with the home route", () => {
    const slugs = PROJECTS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).not.toContain(PROJECTS_HOME_ROUTE);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9-]+$/);
  });

  it("validates routes: home and every slug, nothing else", () => {
    expect(isProjectRoute(PROJECTS_HOME_ROUTE)).toBe(true);
    for (const p of PROJECTS) {
      expect(isProjectRoute(p.slug)).toBe(true);
      expect(getProject(p.slug)).toBe(p);
    }
    expect(isProjectRoute("nope")).toBe(false);
    expect(getProject(PROJECTS_HOME_ROUTE)).toBeUndefined();
  });

  it("has EN and PT texts for every project, with the same sections written", () => {
    for (const p of PROJECTS) {
      for (const messages of [en, pt]) {
        const s = studies(messages)[p.slug];
        expect(s, `${p.slug} texts`).toBeDefined();
        expect(s.category).not.toBe("");
        expect(s.status).not.toBe("");
        expect(s.summary).not.toBe("");
        expect(Object.keys(s.sections).sort()).toEqual([...CASE_STUDY_SECTIONS].sort());
      }
      // A section is either written in both languages or pending in both.
      for (const section of CASE_STUDY_SECTIONS) {
        expect(
          Boolean(studies(en)[p.slug].sections[section]),
          `${p.slug}.${section} EN/PT parity`,
        ).toBe(Boolean(studies(pt)[p.slug].sections[section]));
      }
    }
  });

  it("has no texts for projects that don't exist", () => {
    const slugs = PROJECTS.map((p) => p.slug).sort();
    expect(Object.keys(studies(en)).sort()).toEqual(slugs);
    expect(Object.keys(studies(pt)).sort()).toEqual(slugs);
  });

  it("only links to https URLs and keeps images under public/projects/<slug>/", () => {
    for (const p of PROJECTS) {
      for (const href of Object.values(p.links)) expect(href).toMatch(/^https:\/\//);
      for (const image of p.images) {
        expect(image.file).not.toContain("/");
        expect(studies(en)[p.slug]).toHaveProperty(image.altKey);
      }
    }
  });
});
