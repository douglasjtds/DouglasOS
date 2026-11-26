import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site";
import { THEME_HEX } from "@/lib/theme";
import "../globals.css";

// No webfonts: the XP look uses system font stacks only (DESIGN-GUIDELINES →
// Typography), so nothing is loaded via next/font.

// Browser chrome tinted with the taskbar blue (light theme only).
// `viewportFit: "cover"` lets the touch shell paint edge to edge and exposes
// the iOS safe-area insets (env(safe-area-inset-*)) that the taskbar, windows
// and session screens pad against.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: THEME_HEX.taskbar,
  colorScheme: "light",
};

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const title = t("title");
  const description = t("description");

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: {
      canonical: `/${locale}`,
      languages: { en: "/en", pt: "/pt", "x-default": "/en" },
    },
    openGraph: {
      type: "website",
      url: `/${locale}`,
      siteName: "DouglasOS",
      title,
      description,
      locale: locale === "pt" ? "pt_BR" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

// Pre-render both locales at build time.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;

  // 404 on unsupported locales instead of rendering with a fallback.
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Opt this route into static rendering with the resolved locale.
  setRequestLocale(locale);

  // Pass messages explicitly so client components (the shell) can translate.
  const messages = await getMessages();

  return (
    <html lang={locale} className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
