"use client";

import { useTranslations } from "next-intl";
import { getLauncher } from "@/lib/apps/registry";
import { PROJECTS } from "@/lib/content/projects";
import type { LauncherLabels, RunSuggestion } from "@/lib/run/resolver";
import { CaseStudyIcon } from "@/components/icons/BrowserIcons";
import { cn } from "@/lib/utils";

/** Visible name of a suggestion: the launcher's title or the project's brand. */
export function suggestionLabel(s: RunSuggestion, labels: LauncherLabels): string {
  if (s.type === "project") {
    return PROJECTS.find((p) => p.slug === s.command)?.name ?? s.command;
  }
  return labels[s.target.id] ?? s.target.id;
}

function SuggestionIcon({ suggestion, size }: { suggestion: RunSuggestion; size: number }) {
  if (suggestion.type === "project") return <CaseStudyIcon size={size} />;
  const Icon = getLauncher(suggestion.target.id).icon;
  return <Icon size={size} />;
}

/**
 * One `role="option"` row of the Run / palette listbox: icon, name and kind
 * ("Program", "Project", "Link"…). The input keeps focus (combobox pattern,
 * `aria-activedescendant`), so a press never steals it.
 */
export function SuggestionOption({
  id,
  suggestion,
  labels,
  active,
  onPick,
  onHover,
  iconSize = 16,
  className,
}: {
  id: string;
  suggestion: RunSuggestion;
  labels: LauncherLabels;
  active: boolean;
  onPick: () => void;
  onHover?: () => void;
  iconSize?: number;
  className?: string;
}) {
  const t = useTranslations("run.types");
  return (
    <li
      id={id}
      role="option"
      aria-selected={active}
      data-run-option={suggestion.key}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onPick}
      onMouseMove={onHover}
      className={cn(
        "flex cursor-default select-none items-center gap-2 px-1.5 text-system text-text",
        active && "bg-highlight text-highlight-text",
        className,
      )}
    >
      <SuggestionIcon suggestion={suggestion} size={iconSize} />
      <span className="min-w-0 flex-1 truncate">{suggestionLabel(suggestion, labels)}</span>
      <span className={cn("shrink-0 text-text-muted", active && "text-highlight-text")}>
        {t(suggestion.type)}
      </span>
    </li>
  );
}
