"use client";

import type { Ref } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ExternalLink, Info, Link2 } from "lucide-react";
import {
  CASE_STUDY_SECTIONS,
  PROJECTS,
  projectImageSrc,
  type ProjectCaseStudy,
} from "@/lib/content/projects";
import { CaseStudyIcon } from "@/components/icons/BrowserIcons";
import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/utils";

const linkButtonClass =
  "cursor-pointer text-left text-link underline focus-light";
const externalLinkClass =
  "inline-flex items-center gap-1 text-body text-link underline focus-light";

/** "SaaS · Live · 2026" — the year only when Douglas has confirmed it. */
function MetaLine({ project }: { project: ProjectCaseStudy }) {
  const t = useTranslations(`apps.projects.caseStudies.${project.slug}`);
  const parts = [t("category"), t("status"), project.year?.toString()].filter(Boolean);
  return <p className="text-system text-text-muted">{parts.join(" · ")}</p>;
}

function TagList({ tags }: { tags: string[] }) {
  return (
    <ul className="flex flex-wrap gap-1">
      {tags.map((tag) => (
        <li key={tag}>
          <Tag>{tag}</Tag>
        </li>
      ))}
    </ul>
  );
}

/** Explorer home page: the project list. */
export function ExplorerHome({
  headingRef,
  onOpen,
}: {
  headingRef: Ref<HTMLHeadingElement>;
  onOpen: (slug: string) => void;
}) {
  const t = useTranslations("apps.projects");
  return (
    <div data-explorer-page="home" className="flex flex-col gap-4">
      <div>
        <h3 ref={headingRef} tabIndex={-1} className="text-heading-lg text-text outline-none">
          {t("explorer.home.heading")}
        </h3>
        <p className="mt-1 text-body text-text">{t("explorer.home.intro")}</p>
      </div>
      <ul className="flex flex-col gap-3">
        {PROJECTS.map((project) => (
          <li
            key={project.slug}
            className="flex gap-3 border-b border-groupbox-border pb-3 last:border-b-0"
          >
            <CaseStudyIcon size={32} />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <button
                type="button"
                data-project-link={project.slug}
                aria-describedby={`project-summary-${project.slug}`}
                onClick={() => onOpen(project.slug)}
                className={cn(linkButtonClass, "self-start text-heading")}
              >
                {project.name}
              </button>
              <MetaLine project={project} />
              <p id={`project-summary-${project.slug}`} className="text-body text-text">
                {t(`caseStudies.${project.slug}.summary`)}
              </p>
              <TagList tags={project.tags} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** One case study: header, links, images, then Problem → Approach → Role & stack → Result. */
export function CaseStudyPage({
  project,
  headingRef,
  onHome,
  onContact,
}: {
  project: ProjectCaseStudy;
  headingRef: Ref<HTMLHeadingElement>;
  onHome: () => void;
  onContact: () => void;
}) {
  const t = useTranslations("apps.projects");
  const page = (key: string) => t(`explorer.page.${key}`);
  const text = (key: string) => t(`caseStudies.${project.slug}.${key}`);
  const { repo, demo } = project.links;

  return (
    <article data-explorer-page={project.slug} className="flex flex-col gap-4">
      <header className="flex items-start gap-3">
        <CaseStudyIcon size={48} />
        <div className="flex min-w-0 flex-col gap-1">
          <h3 ref={headingRef} tabIndex={-1} className="text-heading-lg text-text outline-none">
            {project.name}
          </h3>
          <MetaLine project={project} />
        </div>
      </header>

      <p className="text-body text-text">{text("summary")}</p>

      {(repo || demo) && (
        <div className="flex flex-wrap gap-4">
          {demo && (
            <a href={demo} target="_blank" rel="noopener noreferrer" className={externalLinkClass}>
              <ExternalLink className="size-3.5" aria-hidden /> {page("demo")}
            </a>
          )}
          {repo && (
            <a href={repo} target="_blank" rel="noopener noreferrer" className={externalLinkClass}>
              <Link2 className="size-3.5" aria-hidden /> {page("repo")}
            </a>
          )}
        </div>
      )}

      {project.images.length > 0 && (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {project.images.map((image) => (
            <li key={image.file} className="border border-field-border">
              <Image
                src={projectImageSrc(project.slug, image)}
                alt={text(image.altKey)}
                width={image.width}
                height={image.height}
                sizes="(max-width: 767px) 100vw, 360px"
                className="h-auto w-full"
              />
            </li>
          ))}
        </ul>
      )}

      {CASE_STUDY_SECTIONS.map((section) => {
        const body = text(`sections.${section}`);
        return (
          <section key={section} data-case-section={section} className="flex flex-col gap-1.5">
            <h4 className="text-heading text-text">{page(`sections.${section}`)}</h4>
            {body ? (
              <p className="text-body text-text">{body}</p>
            ) : (
              <p data-coming-soon className="flex items-center gap-1.5 text-body text-text-muted italic">
                <Info className="size-4 shrink-0 text-icon-info" aria-hidden />
                {page("comingSoon")}
              </p>
            )}
            {section === "role" && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-system font-bold text-text">{page("stack")}:</span>
                <TagList tags={project.tags} />
              </div>
            )}
          </section>
        );
      })}

      <footer className="flex flex-wrap gap-x-6 gap-y-2 border-t border-groupbox-border pt-3">
        <button type="button" data-explorer-back-home onClick={onHome} className={linkButtonClass}>
          {page("backHome")}
        </button>
        <button type="button" data-explorer-contact onClick={onContact} className={linkButtonClass}>
          {page("contactCta")}
        </button>
      </footer>
    </article>
  );
}
