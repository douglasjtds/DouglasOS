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
    <div className="flex flex-col gap-4">
      <p className="border-l-4 border-hot bg-surface-muted p-3 text-body text-text">
        {t("intro")}
      </p>
      {sections.map((s) => (
        <section key={s.heading} className="flex flex-col gap-1">
          <h3 className="text-heading text-link">{s.heading}</h3>
          <p className="text-body text-text">{s.body}</p>
        </section>
      ))}
    </div>
  );
}
