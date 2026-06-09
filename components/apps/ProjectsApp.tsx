"use client";

import { useTranslations } from "next-intl";
import { Link2, ExternalLink } from "lucide-react";

interface Project {
  name: string;
  description: string;
  tags: string[];
  status: string;
  repo: string;
  demo: string;
}

export default function ProjectsApp() {
  const t = useTranslations("apps.projects");
  const items = t.raw("items") as Project[];

  return (
    <ul className="grid grid-cols-2 gap-4">
      {items.map((p) => (
        <li
          key={p.name}
          className="flex flex-col gap-2 rounded-lg border border-white/[0.06] bg-glass-card p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-text-primary">{p.name}</h2>
            <span className="rounded-full bg-base-3 px-2 py-0.5 font-mono text-[10px] text-text-muted">
              {p.status}
            </span>
          </div>
          <p className="flex-1 text-sm text-text-secondary">{p.description}</p>
          <ul className="flex flex-wrap gap-1.5">
            {p.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-sm bg-base-3 px-1.5 py-0.5 font-mono text-[11px] text-text-secondary"
              >
                {tag}
              </li>
            ))}
          </ul>
          {(p.repo || p.demo) && (
            <div className="flex gap-3 pt-1">
              {p.repo && (
                <a
                  href={p.repo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-text-muted transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Link2 className="size-3.5" aria-hidden /> Repo
                </a>
              )}
              {p.demo && (
                <a
                  href={p.demo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-text-muted transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ExternalLink className="size-3.5" aria-hidden /> Demo
                </a>
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
