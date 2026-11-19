"use client";

import { useEffect, useId, useState, type CSSProperties, type FormEvent } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { actionLabel, type AssistantAction, type AssistantMessage } from "@/lib/assistant/script";
import { ASSISTANT_TIMING } from "@/lib/assistant/script";
import { DURATION } from "@/lib/motion";
import { InfoIcon } from "@/components/icons/SystemIcons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AssistantBubbleProps {
  message: AssistantMessage;
  /** Bottom sheet on phones; a balloon with a tail on the desktop. */
  variant: "balloon" | "sheet";
  /** Balloon placement (absolute, in shell coordinates). */
  style?: CSSProperties;
  /** Tail position from the balloon's left edge (px). */
  tailX?: number;
  reducedMotion: boolean;
  onAction: (action: AssistantAction) => void;
  onClose: () => void;
  onSearch: (query: string) => void;
}

/**
 * The yellow assistant balloon (DESIGN-GUIDELINES → Balloon): bold title with
 * a 16px icon and close ×, the line (a polite live region), shortcut options
 * and the "ask me something" field. Automatic lines close themselves after a
 * while unless the visitor is hovering or working inside the bubble. It never
 * moves focus on its own.
 */
export function AssistantBubble({
  message,
  variant,
  style,
  tailX,
  reducedMotion,
  onAction,
  onClose,
  onSearch,
}: AssistantBubbleProps) {
  const t = useTranslations();
  const ids = useId();
  const [query, setQuery] = useState("");
  const [paused, setPaused] = useState(false);
  const sheet = variant === "sheet";

  useEffect(() => {
    if (!message.auto || paused) return;
    const timer = setTimeout(onClose, ASSISTANT_TIMING.autoHide);
    return () => clearTimeout(timer);
  }, [message, paused, onClose]);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch(query);
    setQuery("");
  }

  return (
    <motion.section
      aria-labelledby={`${ids}-title`}
      data-assistant-bubble
      data-message={message.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reducedMotion ? DURATION.instant : DURATION.base }}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
      }}
      style={style}
      className={cn(
        "pointer-events-auto flex flex-col border-info-border bg-info text-system text-text shadow-balloon",
        sheet
          ? "absolute inset-x-0 bottom-taskbar max-h-[60dvh] rounded-t-balloon border-t px-safe"
          : "absolute rounded-balloon border",
      )}
    >
      <div className={cn("flex min-h-0 flex-col gap-2 overflow-y-auto", sheet ? "p-3" : "p-2.5")}>
        <div className="flex items-center gap-1.5">
          <InfoIcon size={16} />
          <h2 id={`${ids}-title`} className="flex-1 font-bold">
            {t(message.titleKey, message.values)}
          </h2>
          <button
            type="button"
            aria-label={t("assistant.close")}
            onClick={onClose}
            className="relative flex size-icon-small items-center justify-center rounded-control border border-bevel-shadow text-text hover:bg-surface focus-light max-md:after:absolute max-md:after:-inset-3.5 max-md:after:content-['']"
          >
            <svg viewBox="0 0 10 10" className="size-2" aria-hidden>
              <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </button>
        </div>

        <p role="status" aria-live="polite" aria-atomic="true">
          {t(message.textKey, message.values)}
        </p>

        {message.actions.length > 0 && (
          <ul className="flex flex-col gap-0.5 max-md:grid max-md:grid-cols-2 max-md:gap-x-2 max-md:gap-y-0" aria-label={t("assistant.shortcuts")}>
            {message.actions.map((action) => {
              const label = actionLabel(action);
              return (
                <li key={`${action.kind}-${"app" in action ? action.app : ""}-${"slug" in action ? action.slug : ""}`}>
                  <button
                    type="button"
                    data-assistant-action={action.kind === "openApp" ? `open-${action.app}` : action.kind}
                    onClick={() => onAction(action)}
                    className="group flex w-full items-center gap-1.5 rounded-button px-1 py-0.5 text-left text-link hover:underline focus-light max-md:min-h-touch-target"
                  >
                    <span aria-hidden className="size-2 shrink-0 rounded-full border border-icon-info bg-icon-info/70" />
                    {t(label.key, label.values)}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {message.search && (
          <form role="search" onSubmit={submit} className="flex flex-col gap-1">
            <label htmlFor={`${ids}-search`}>{t("assistant.search.label")}</label>
            <div className="flex gap-1.5">
              <input
                id={`${ids}-search`}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("assistant.search.placeholder")}
                autoComplete="off"
                enterKeyHint="search"
                maxLength={120}
                className="h-push-button-h min-w-0 flex-1 border border-field-border bg-surface px-1.5 text-system text-text focus-light max-md:h-touch-target max-md:text-heading max-md:font-normal"
              />
              <Button type="submit" className="max-md:h-touch-target">
                {t("assistant.search.submit")}
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Tail pointing down at the character. */}
      {!sheet && tailX !== undefined && (
        <span
          aria-hidden
          style={{ left: tailX - 6 }}
          className="absolute -bottom-[7px] size-3 rotate-45 border-b border-r border-info-border bg-info"
        />
      )}
    </motion.section>
  );
}
