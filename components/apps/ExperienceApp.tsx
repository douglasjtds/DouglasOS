"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface Role {
  period: string;
  company: string;
  role: string;
  description: string;
  tags: string[];
  current?: boolean;
}

export default function ExperienceApp() {
  const t = useTranslations("apps.experience");
  const roles = t.raw("roles") as Role[];
  const currentBadge = t("currentBadge");

  return (
    <ol className="relative flex flex-col gap-6 border-l border-white/[0.08] pl-5">
      {roles.map((r) => (
        <li key={r.company} className="relative">
          <span
            className={cn(
              "absolute -left-[1.46rem] top-1 size-2.5 rounded-full ring-2 ring-base-1",
              r.current ? "bg-accent shadow-glow-subtle" : "bg-base-4",
            )}
            aria-hidden
          />
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-text-primary">{r.role}</h2>
            {r.current && (
              <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-medium text-success">
                {currentBadge}
              </span>
            )}
          </div>
          <p className="text-sm text-text-secondary">{r.company}</p>
          <p className="font-mono text-xs text-text-muted">{r.period}</p>
          <p className="mt-1 text-sm text-text-secondary">{r.description}</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {r.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-sm bg-base-3 px-1.5 py-0.5 font-mono text-[11px] text-text-secondary"
              >
                {tag}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
