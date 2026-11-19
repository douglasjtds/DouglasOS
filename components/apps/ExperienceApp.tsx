"use client";

import { useTranslations } from "next-intl";
import { GroupBox } from "@/components/ui/group-box";
import { Tag } from "@/components/ui/tag";

interface Role {
  period: string;
  company: string;
  role: string;
  description: string;
  tags: string[];
  current?: boolean;
}

/** One group box per role; the current role is marked with a tag (not color alone). */
export default function ExperienceApp() {
  const t = useTranslations("apps.experience");
  const roles = t.raw("roles") as Role[];
  const currentBadge = t("currentBadge");

  return (
    <ol className="flex flex-col gap-4">
      {roles.map((r) => (
        <li key={r.company}>
          <GroupBox title={r.company}>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-body font-bold text-text">{r.role}</h2>
              {r.current && (
                <Tag className="border-icon-success font-bold text-icon-success">
                  {currentBadge}
                </Tag>
              )}
            </div>
            <p className="text-system text-text-muted">{r.period}</p>
            <p className="mt-1.5 text-body text-text">{r.description}</p>
            <ul className="mt-2 flex flex-wrap gap-1">
              {r.tags.map((tag) => (
                <li key={tag}>
                  <Tag>{tag}</Tag>
                </li>
              ))}
            </ul>
          </GroupBox>
        </li>
      ))}
    </ol>
  );
}
