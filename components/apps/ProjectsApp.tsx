"use client";

import { useTranslations } from "next-intl";
import { ExternalLink, Link2 } from "lucide-react";
import { GroupBox } from "@/components/ui/group-box";
import { Tag } from "@/components/ui/tag";

interface Project {
  name: string;
  description: string;
  tags: string[];
  status: string;
  repo: string;
  demo: string;
}

const linkClass =
  "inline-flex items-center gap-1 text-body text-link underline focus-light";

export default function ProjectsApp() {
  const t = useTranslations("apps.projects");
  const items = t.raw("items") as Project[];

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {items.map((p) => (
        <li key={p.name} className="flex">
          <GroupBox title={p.name} className="flex flex-1 flex-col gap-2">
            <Tag className="self-start">{p.status}</Tag>
            <p className="flex-1 text-body text-text">{p.description}</p>
            <ul className="flex flex-wrap gap-1">
              {p.tags.map((tag) => (
                <li key={tag}>
                  <Tag>{tag}</Tag>
                </li>
              ))}
            </ul>
            {(p.repo || p.demo) && (
              <div className="flex gap-3">
                {p.repo && (
                  <a href={p.repo} target="_blank" rel="noopener noreferrer" className={linkClass}>
                    <Link2 className="size-3.5" aria-hidden /> Repo
                  </a>
                )}
                {p.demo && (
                  <a href={p.demo} target="_blank" rel="noopener noreferrer" className={linkClass}>
                    <ExternalLink className="size-3.5" aria-hidden /> Demo
                  </a>
                )}
              </div>
            )}
          </GroupBox>
        </li>
      ))}
    </ul>
  );
}
