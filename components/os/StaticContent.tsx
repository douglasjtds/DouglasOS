import { getTranslations } from "next-intl/server";
import { PROFILE, RESUME } from "@/lib/profile";

interface Stat {
  label: string;
  value: string;
}
interface Role {
  period: string;
  company: string;
  role: string;
  description: string;
  tags: string[];
  current?: boolean;
}
interface Project {
  name: string;
  description: string;
  tags: string[];
  status: string;
  repo: string;
  demo: string;
}
interface SkillCategory {
  name: string;
  items: string[];
}
interface AiSection {
  heading: string;
  body: string;
}

/** Shown only when JavaScript is off: reveal the text version, drop the blue placeholder. */
const NO_SCRIPT_CSS = `
.static-content{position:static;width:auto;height:auto;margin:0;overflow:visible;clip-path:none;white-space:normal;padding:16px;max-width:42rem}
[data-shell-placeholder]{display:none}
`;

/**
 * Crawlable text version of the portfolio (DESKTOP-INTERFACE-SPEC §11 →
 * Content, §12 → Screen readers). A server component with no client JS: the
 * same EN/PT content the windows show, as real text with a proper heading
 * outline (h1 → h2 per app → h3). It's visually hidden (the desktop is the
 * visual experience) but stays in the DOM for crawlers and for screen-reader
 * users who prefer a linear read; with JavaScript off it becomes the page.
 */
export async function StaticContent({ locale }: { locale: string }) {
  const t = await getTranslations({ locale });
  const about = (key: string) => t(`apps.about.${key}`);
  const summary = t.raw("apps.about.summary") as string[];
  const stats = t.raw("apps.about.stats") as Stat[];
  const roles = t.raw("apps.experience.roles") as Role[];
  const projects = t.raw("apps.projects.items") as Project[];
  const skills = t.raw("apps.skills.categories") as SkillCategory[];
  const aiSections = t.raw("apps.how-i-work-with-ai.sections") as AiSection[];

  return (
    <>
      <noscript>
        <style>{NO_SCRIPT_CSS}</style>
      </noscript>
      <article data-static-content aria-label={t("static.label")} className="static-content">
        <header>
          <h1>
            {about("name")} — {about("headline")}
          </h1>
          <p>{about("location")}</p>
          <p>
            <a href={RESUME.href} download={RESUME.filename}>
              {t("resume.download")}
            </a>
          </p>
        </header>

        <section>
          <h2>{t("apps.about.title")}</h2>
          {summary.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
          <dl>
            {stats.map((s) => (
              <div key={s.label}>
                <dt>{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section>
          <h2>{t("apps.experience.title")}</h2>
          {roles.map((r) => (
            <section key={`${r.company}-${r.period}`}>
              <h3>
                {r.role} — {r.company}
              </h3>
              <p>{r.period}</p>
              <p>{r.description}</p>
              <p>{r.tags.join(", ")}</p>
            </section>
          ))}
        </section>

        <section>
          <h2>{t("apps.projects.title")}</h2>
          {projects.map((p) => (
            <section key={p.name}>
              <h3>{p.name}</h3>
              <p>{p.description}</p>
              <p>{p.tags.join(", ")}</p>
              {p.repo && <a href={p.repo}>{p.repo}</a>}
            </section>
          ))}
        </section>

        <section>
          <h2>{t("apps.skills.title")}</h2>
          {skills.map((c) => (
            <section key={c.name}>
              <h3>{c.name}</h3>
              <p>{c.items.join(", ")}</p>
            </section>
          ))}
        </section>

        <section>
          <h2>{t("apps.how-i-work-with-ai.title")}</h2>
          <p>{t("apps.how-i-work-with-ai.intro")}</p>
          {aiSections.map((s) => (
            <section key={s.heading}>
              <h3>{s.heading}</h3>
              <p>{s.body}</p>
            </section>
          ))}
        </section>

        <section>
          <h2>{t("apps.contact.title")}</h2>
          <p>{t("apps.contact.availability")}</p>
          <ul>
            <li>
              <a href={`mailto:${PROFILE.email}`}>{PROFILE.email}</a>
            </li>
            <li>
              <a href={PROFILE.linkedin}>LinkedIn</a>
            </li>
            <li>
              <a href={PROFILE.github}>GitHub</a>
            </li>
            <li>
              <a href={PROFILE.whatsapp}>WhatsApp</a>
            </li>
          </ul>
        </section>
      </article>
    </>
  );
}
