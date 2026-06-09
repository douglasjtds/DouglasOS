"use client";

import { useTranslations } from "next-intl";

interface Category {
  name: string;
  items: string[];
}

export default function SkillsApp() {
  const t = useTranslations("apps.skills");
  const categories = t.raw("categories") as Category[];

  return (
    <div className="flex flex-col gap-5">
      {categories.map((c) => (
        <div key={c.name} className="flex flex-col gap-2">
          <h2 className="font-mono text-xs uppercase tracking-wide text-text-muted">
            {c.name}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {c.items.map((item) => (
              <li
                key={item}
                className="rounded-md border border-white/[0.06] bg-glass-card px-2.5 py-1 text-sm text-text-secondary"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
