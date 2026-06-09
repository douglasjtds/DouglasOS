import { setRequestLocale } from "next-intl/server";
import { ShellGate } from "@/components/os/ShellGate";

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ShellGate />;
}
