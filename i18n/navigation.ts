import { createNavigation } from "next-intl/navigation";
import { routing } from "@/i18n/routing";

/** Locale-aware navigation helpers (keep the `/en` `/pt` prefix in sync). */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
