"use client";

import { useTranslations } from "next-intl";
import { launch } from "@/lib/apps/launch";
import { UserAvatar } from "@/components/icons/SystemIcons";
import { GroupBox } from "@/components/ui/group-box";
import { Button } from "@/components/ui/button";

interface Stat {
  label: string;
  value: string;
}

/** Summary paragraphs + quick stats — shared between the window and the
 *  mobile fallback (which has its own hero, so it skips the header). */
export function AboutSummary() {
  const t = useTranslations("apps.about");
  const stats = t.raw("stats") as Stat[];
  const summary = t.raw("summary") as string[];

  return (
    <>
      <div className="flex flex-col gap-3">
        {summary.map((paragraph) => (
          <p key={paragraph.slice(0, 24)} className="text-body text-text">
            {paragraph}
          </p>
        ))}
      </div>

      <GroupBox title={t("statsTitle")}>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label}>
              <dt className="text-system text-text-muted">{s.label}</dt>
              <dd className="text-body font-bold text-text">{s.value}</dd>
            </div>
          ))}
        </dl>
      </GroupBox>
    </>
  );
}

export default function AboutApp() {
  const t = useTranslations("apps.about");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <span
          role="img"
          aria-label={t("photoAlt")}
          className="shrink-0 border border-field-border bg-surface p-0.5"
        >
          <UserAvatar size={112} />
        </span>
        <div className="flex flex-col gap-0.5">
          <h1 className="text-heading-lg text-text">{t("name")}</h1>
          <p className="text-heading text-text">{t("headline")}</p>
          <p className="text-system text-text-muted">{t("location")}</p>
        </div>
      </div>

      <AboutSummary />

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" onClick={() => launch("resume")}>
          {t("downloadCv")}
        </Button>
        <Button variant="link" onClick={() => launch("contact")}>
          {t("contactLink")}
        </Button>
      </div>
    </div>
  );
}
