"use client";

import { useTranslations } from "next-intl";
import { GroupBox } from "@/components/ui/group-box";
import { Tag } from "@/components/ui/tag";

interface Category {
  name: string;
  items: string[];
}

/** One group box per category, skills as XP chips. No star ratings. */
export default function SkillsApp() {
  const t = useTranslations("apps.skills");
  const categories = t.raw("categories") as Category[];

  return (
    <div className="flex flex-col gap-3">
      {categories.map((c) => (
        <GroupBox key={c.name} title={c.name}>
          <ul className="flex flex-wrap gap-1">
            {c.items.map((item) => (
              <li key={item}>
                <Tag className="text-body">{item}</Tag>
              </li>
            ))}
          </ul>
        </GroupBox>
      ))}
    </div>
  );
}
