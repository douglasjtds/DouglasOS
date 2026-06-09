"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Globe, Link2, Mail, MessageCircle, Copy, Check } from "lucide-react";

const EMAIL = "douglasjtds@gmail.com";

// TODO: replace placeholder hrefs with real profile URLs / WhatsApp number.
const LINKS = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/TODO", icon: Globe },
  { label: "GitHub", href: "https://github.com/TODO", icon: Link2 },
  { label: "WhatsApp", href: "https://wa.me/5531991848090?text=Hey%20Douglas!", icon: MessageCircle },
] as const;

export default function ContactApp() {
  const t = useTranslations("apps.contact");
  const [copied, setCopied] = useState(false);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable — the mailto link is still the fallback.
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          {t("heading")}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">{t("availability")}</p>
      </div>

      {/* Email row: mailto + copy-to-clipboard */}
      <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-glass-card p-3">
        <Mail className="size-4 shrink-0 text-accent" aria-hidden />
        <a
          href={`mailto:${EMAIL}`}
          className="flex-1 truncate text-sm text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {EMAIL}
        </a>
        <button
          type="button"
          onClick={copyEmail}
          aria-label={copied ? t("copied") : t("copy")}
          className="flex items-center gap-1 rounded-md px-2 py-1 font-mono text-xs text-text-muted transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {copied ? (
            <Check className="size-3.5" aria-hidden />
          ) : (
            <Copy className="size-3.5" aria-hidden />
          )}
          {copied ? t("copied") : t("copy")}
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {LINKS.map(({ label, href, icon: Icon }) => (
          <li key={label}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-glass-card p-3 text-sm text-text-secondary transition-colors hover:border-accent/40 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Icon className="size-4 shrink-0 text-accent" aria-hidden />
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
