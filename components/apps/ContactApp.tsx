"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Globe, Link2, Mail, MessageCircle } from "lucide-react";
import { PROFILE } from "@/lib/profile";
import { GroupBox } from "@/components/ui/group-box";
import { Button } from "@/components/ui/button";

const EMAIL = PROFILE.email;

const LINKS = [
  { label: "LinkedIn", href: PROFILE.linkedin, icon: Globe },
  { label: "GitHub", href: PROFILE.github, icon: Link2 },
  { label: "WhatsApp", href: PROFILE.whatsapp, icon: MessageCircle },
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
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-heading-lg text-text">{t("heading")}</h1>
        <p className="mt-1 text-body text-text">{t("availability")}</p>
      </div>

      <GroupBox title={t("emailLabel")}>
        <div className="flex flex-wrap items-center gap-2">
          <Mail className="size-4 shrink-0 text-link" aria-hidden />
          <a
            href={`mailto:${EMAIL}`}
            className="min-w-0 flex-1 truncate text-body text-link underline focus-light"
          >
            {EMAIL}
          </a>
          <Button onClick={copyEmail} aria-live="polite">
            {copied ? t("copied") : t("copy")}
          </Button>
        </div>
      </GroupBox>

      <ul className="flex flex-col gap-2">
        {LINKS.map(({ label, href, icon: Icon }) => (
          <li key={label}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-body text-link underline focus-light"
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
