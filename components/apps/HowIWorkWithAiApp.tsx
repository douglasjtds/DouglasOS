"use client";

import { useTranslations } from "next-intl";

interface Section {
  heading: string;
  body: string;
}

export default function HowIWorkWithAiApp() {
  const t = useTranslations("apps.how-i-work-with-ai");
  const sections = t.raw("sections") as Section[];

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm leading-relaxed text-text-secondary">{t("intro")}</p>
      {sections.map((s) => (
        <section key={s.heading} className="flex flex-col gap-1.5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <span className="size-1.5 rounded-full bg-accent" aria-hidden />
            {s.heading}
          </h2>
          <p className="text-sm leading-relaxed text-text-secondary">{s.body}</p>
        </section>
      ))}
    </div>
  );
}
