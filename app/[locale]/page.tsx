import { preload } from "react-dom";
import { setRequestLocale } from "next-intl/server";
import { DEFAULT_DISPLAY, WALLPAPER_IMAGES } from "@/lib/wallpapers";
import { ShellGate } from "@/components/os/ShellGate";
import { StaticContent } from "@/components/os/StaticContent";

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  // The default wallpaper is the LCP element (painted by ShellGate's server
  // placeholder). As a CSS background it would only be discovered after the
  // stylesheet; preloading it from the HTML head starts the fetch right away.
  const wallpaper = WALLPAPER_IMAGES[DEFAULT_DISPLAY.wallpaper];
  if (wallpaper) preload(wallpaper, { as: "image", fetchPriority: "high" });
  // The interactive shell (client) + the crawlable, server-rendered text
  // version of the same content (no client JS).
  return (
    <>
      <ShellGate />
      <StaticContent locale={locale} />
    </>
  );
}
