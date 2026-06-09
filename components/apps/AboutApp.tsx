"use client";

import { useTranslations } from "next-intl";

interface Stat {
  label: string;
  value: string;
}

export default function AboutApp() {
  const t = useTranslations("apps.about");
  const stats = t.raw("stats") as Stat[];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        {/* TODO: real profile photo at public/avatar.* */}
        <div
          className="size-20 shrink-0 rounded-full bg-gradient-to-br from-base-3 to-base-1 ring-1 ring-white/10"
          aria-hidden
        />
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

      <p className="text-sm leading-relaxed text-text-secondary">
        {t("summary")}
      </p>

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
    </div>
  );
}
