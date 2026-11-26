import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { LAUNCHERS, launcherTitleKey } from "@/lib/apps/registry";
import type { LauncherLabels } from "@/lib/run/resolver";

/** Every launcher's localized title (Run / palette search and labels). */
export function useLauncherLabels(): LauncherLabels {
  const t = useTranslations();
  return useMemo(() => {
    const labels: LauncherLabels = {};
    for (const l of LAUNCHERS) labels[l.id] = t(launcherTitleKey(l.id));
    return labels;
  }, [t]);
}
