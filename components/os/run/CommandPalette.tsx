"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Dialog } from "radix-ui";
import { useTranslations } from "next-intl";
import { useShellStore } from "@/lib/store/shellStore";
import { searchRun, type RunSuggestion } from "@/lib/run/resolver";
import { executeRunTarget } from "@/lib/run/execute";
import type { AppId } from "@/lib/apps/registry";
import { useLauncherLabels } from "@/hooks/useLauncherLabels";
import { SuggestionOption } from "@/components/os/run/SuggestionOption";
import { focusWindowSoon } from "@/components/os/run/RunDialog";
import { RunIcon } from "@/components/icons/SystemIcons";
import { TitleBarButton } from "@/components/os/window/WindowControls";

/** Enough rows for every launcher + project with an empty query. */
const MAX_RESULTS = 40;

/**
 * Command palette (DESKTOP-INTERFACE-SPEC §12, stage 7): Ctrl+K / Cmd+K opens a
 * search box over the desktop with the same resolver as Run. The list is
 * always visible (everything with an empty query, CTA order), ↑/↓/Home/End
 * move the highlight, Enter or a click opens it, Esc (or Ctrl/Cmd+K again)
 * closes. No match → "DouglasOS couldn't find" with the usual hints.
 * Lazy-loaded by `ShellDialogs` when it opens.
 */
export default function CommandPalette() {
  const t = useTranslations("palette");
  const tWindow = useTranslations("window");
  const closeDialog = useShellStore((s) => s.closeDialog);
  const labels = useLauncherLabels();
  const listId = useId();
  const ranWindow = useRef<AppId | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const results: RunSuggestion[] = searchRun(query, labels, MAX_RESULTS);
  const current = Math.min(active, results.length - 1);
  const optionId = (i: number) => `${listId}-option-${i}`;

  useEffect(() => {
    if (current < 0) return;
    document.getElementById(optionId(current))?.scrollIntoView?.({ block: "nearest" });
    // optionId is derived from the stable listId.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  function pick(s: RunSuggestion | undefined) {
    if (!s) return;
    ranWindow.current = executeRunTarget(s.target);
    closeDialog();
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    const last = results.length - 1;
    if (e.key === "ArrowDown") setActive(current >= last ? 0 : current + 1);
    else if (e.key === "ArrowUp") setActive(current <= 0 ? last : current - 1);
    else if (e.key === "Home" && e.ctrlKey) setActive(0);
    else if (e.key === "End" && e.ctrlKey) setActive(last);
    else if (e.key === "PageDown") setActive(Math.min(last, current + 8));
    else if (e.key === "PageUp") setActive(Math.max(0, current - 8));
    else if (e.key === "Enter") pick(results[current]);
    else if ((e.ctrlKey || e.metaKey) && !e.altKey && e.code === "KeyK") closeDialog();
    else return;
    e.preventDefault();
  }

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) closeDialog();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-1400" />
        <Dialog.Content
          data-testid="command-palette"
          aria-describedby={`${listId}-hint`}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
          }}
          onCloseAutoFocus={(e) => {
            if (!ranWindow.current) return;
            e.preventDefault();
            focusWindowSoon(ranWindow.current);
          }}
          className="fixed left-1/2 top-[12dvh] z-1400 flex max-h-[70dvh] w-[min(560px,calc(100vw-32px))] -translate-x-1/2 flex-col overflow-hidden rounded-t-window border-x-[3px] border-b-[3px] border-window-frame bg-window-frame shadow-window outline-none max-md:top-[calc(env(safe-area-inset-top)+16px)]"
        >
          <div className="flex h-titlebar shrink-0 items-center gap-1.5 rounded-t-window bg-titlebar-gradient px-1.5 pt-0.5">
            <RunIcon size={16} />
            <Dialog.Title className="min-w-0 flex-1 truncate font-title text-title font-bold text-titlebar-text">
              {t("label")}
            </Dialog.Title>
            <Dialog.Close asChild>
              <TitleBarButton glyph="close" aria-label={tWindow("close")} />
            </Dialog.Close>
          </div>
          <div className="flex min-h-0 flex-col gap-1.5 bg-button-face p-2">
            <input
              ref={inputRef}
              data-palette-input
              role="combobox"
              aria-label={t("label")}
              aria-expanded="true"
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={current >= 0 ? optionId(current) : undefined}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="go"
              placeholder={t("placeholder")}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              className="h-touch-target w-full shrink-0 border border-field-border bg-surface px-2 text-body text-text outline-none placeholder:text-text-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus-ring max-md:text-heading max-md:font-normal"
            />
            {results.length > 0 ? (
              <ul
                id={listId}
                role="listbox"
                aria-label={t("results")}
                data-palette-results
                className="min-h-0 flex-1 overflow-y-auto border border-field-border bg-surface py-0.5"
              >
                {results.map((s, i) => (
                  <SuggestionOption
                    key={s.key}
                    id={optionId(i)}
                    suggestion={s}
                    labels={labels}
                    active={i === current}
                    onHover={() => setActive(i)}
                    onPick={() => pick(s)}
                    iconSize={24}
                    className="min-h-8 py-0.5 text-body max-md:min-h-touch-target"
                  />
                ))}
              </ul>
            ) : (
              <div
                id={listId}
                role="listbox"
                aria-label={t("results")}
                data-palette-empty
                className="border border-field-border bg-surface p-3 text-body text-text"
              >
                <p role="status">{t("empty", { query: query.trim() })}</p>
                <p className="text-text-muted">{t("emptyHint")}</p>
              </div>
            )}
            <p id={`${listId}-hint`} className="shrink-0 text-system text-text-muted max-md:hidden">
              {t("hint")}
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
