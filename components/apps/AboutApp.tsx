"use client";

import { useTranslations } from "next-intl";

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
          <p
            key={paragraph.slice(0, 24)}
            className="text-sm leading-relaxed text-text-secondary"
          >
            {paragraph}
          </p>
        ))}
      </div>

      <dl className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-md border border-white/[0.06] bg-glass-card p-3"
          >
            <dt className="font-mono text-[11px] uppercase tracking-wide text-text-muted">
              {s.label}
            </dt>
            <dd className="mt-1 text-sm font-medium text-text-primary">
              {s.value}
            </dd>
          </div>
        ))}
      </dl>
    </>
  );
}

export default function AboutApp() {
  const t = useTranslations("apps.about");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div
          className="flex size-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent/25 via-base-2 to-accent-purple/25 shadow-glow-subtle ring-1 ring-accent/30"
          aria-hidden
        >
          <span className="font-mono text-2xl font-bold text-accent">DT</span>
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
            {t("name")}
          </h1>
          <p className="text-accent">{t("headline")}</p>
          <p className="mt-1 font-mono text-xs text-text-muted">
            {t("location")}
          </p>
        </div>
      </div>

      <AboutSummary />
    </div>
  );
}
