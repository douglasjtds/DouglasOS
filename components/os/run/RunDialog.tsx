"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { AlertDialog } from "radix-ui";
import { useTranslations } from "next-intl";
import { useShellStore } from "@/lib/store/shellStore";
import { resolveRun, searchRun, type RunSuggestion, type RunTarget } from "@/lib/run/resolver";
import { executeRunTarget } from "@/lib/run/execute";
import type { AppId } from "@/lib/apps/registry";
import { useLauncherLabels } from "@/hooks/useLauncherLabels";
import { XpDialog } from "@/components/os/XpDialog";
import { MessageBox } from "@/components/os/MessageBox";
import { SuggestionOption } from "@/components/os/run/SuggestionOption";
import { ErrorIcon, RunIcon } from "@/components/icons/SystemIcons";
import { Button } from "@/components/ui/button";
import { useEasterEggStore } from "@/lib/store/easterEggStore";

/** Max autocomplete rows under the field. */
const MAX_SUGGESTIONS = 6;

type RunError = { kind: "notFound"; query: string };

export function focusWindowSoon(id: AppId) {
  requestAnimationFrame(() =>
    document.querySelector<HTMLElement>(`[data-window="${id}"]`)?.focus({ preventScroll: true }),
  );
}

/**
 * Run… (DESKTOP-INTERFACE-SPEC §5 → Run, stage 7): an XP dialog with an
 * "Open:" combobox. Typing lists suggestions (apps, the CV, links, projects);
 * ↑/↓ walk them and put the highlighted command in the field (what you see is
 * what runs), Enter / OK runs the field, a click runs a row, Esc closes the
 * list first and then the dialog. Everything resolves through
 * `lib/run/resolver.ts` (registry + Explorer address resolver + the shared
 * intent matcher). Unknown names show the "DouglasOS couldn't find" error
 * and return to the field with the text selected; `cmd` opens the Command
 * Prompt (and counts the `run-cmd` easter egg).
 * Lazy-loaded by `ShellDialogs` when the dialog opens.
 */
export default function RunDialog() {
  const t = useTranslations("run");
  const closeDialog = useShellStore((s) => s.closeDialog);
  const labels = useLauncherLabels();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  // Window opened by the last run: focus goes there instead of back.
  const ranWindow = useRef<AppId | null>(null);
  const [query, setQuery] = useState("");
  const [value, setValue] = useState("");
  const [active, setActive] = useState(-1);
  const [listOpen, setListOpen] = useState(false);
  const [error, setError] = useState<RunError | null>(null);

  const suggestions: RunSuggestion[] = query.trim() ? searchRun(query, labels, MAX_SUGGESTIONS) : [];
  const expanded = listOpen && suggestions.length > 0;
  const optionId = (i: number) => `${listId}-option-${i}`;

  function runTarget(target: RunTarget) {
    // Easter egg (stage 11): opening the Command Prompt from Run….
    if (target.id === "cmd") useEasterEggStore.getState().discover("run-cmd");
    ranWindow.current = executeRunTarget(target);
    closeDialog();
  }

  function run(text: string) {
    const resolution = resolveRun(text, labels);
    if (!resolution) return;
    if (resolution.kind === "notFound") {
      setListOpen(false);
      setError({ kind: "notFound", query: resolution.query });
      return;
    }
    runTarget(resolution.target);
  }

  function highlight(index: number) {
    setActive(index);
    setValue(index < 0 ? query : suggestions[index].command);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (suggestions.length === 0) return;
      e.preventDefault();
      if (!listOpen) {
        setListOpen(true);
        highlight(e.key === "ArrowDown" ? 0 : suggestions.length - 1);
        return;
      }
      const step = e.key === "ArrowDown" ? 1 : -1;
      // -1 (back to what was typed) sits between the last and the first row.
      let next = active + step;
      if (next >= suggestions.length) next = -1;
      if (next < -1) next = suggestions.length - 1;
      highlight(next);
    } else if (e.key === "Enter") {
      e.preventDefault();
      run(value);
    } else if (e.key === "Tab") {
      setListOpen(false);
    }
  }

  return (
    <>
      <XpDialog
        open
        testId="run-dialog"
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
        title={t("title")}
        icon={<RunIcon size={16} />}
        className="w-[min(400px,calc(100vw-32px))]"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          inputRef.current?.focus();
        }}
        onEscapeKeyDown={(e) => {
          // Esc closes the suggestion list before the dialog.
          if (expanded) {
            e.preventDefault();
            setListOpen(false);
            highlight(-1);
          }
        }}
        onCloseAutoFocus={(e) => {
          if (!ranWindow.current) return;
          e.preventDefault();
          focusWindowSoon(ranWindow.current);
        }}
      >
        <div className="flex items-start gap-3">
          <RunIcon size={32} />
          <p className="pt-0.5 text-system text-text">{t("intro")}</p>
        </div>
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(value);
          }}
        >
          <label htmlFor={`${listId}-input`} className="shrink-0 text-system text-text">
            {t("openLabel")}
          </label>
          <div className="relative min-w-0 flex-1">
            <input
              ref={inputRef}
              id={`${listId}-input`}
              data-run-input
              role="combobox"
              aria-expanded={expanded}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={expanded && active >= 0 ? optionId(active) : undefined}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="go"
              value={value}
              onChange={(e) => {
                setQuery(e.target.value);
                setValue(e.target.value);
                setActive(-1);
                setListOpen(true);
              }}
              onKeyDown={onKeyDown}
              onBlur={() => setListOpen(false)}
              className="h-push-button-h w-full border border-field-border bg-surface px-1 font-mono text-system text-text outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus-ring max-md:h-touch-target max-md:text-heading max-md:font-normal"
            />
            <ul
              id={listId}
              role="listbox"
              aria-label={t("suggestions")}
              hidden={!expanded}
              data-run-suggestions
              className="absolute inset-x-0 top-full z-10 max-h-60 overflow-y-auto border border-bevel-shadow bg-surface py-0.5 shadow-menu"
            >
              {suggestions.map((s, i) => (
                <SuggestionOption
                  key={s.key}
                  id={optionId(i)}
                  suggestion={s}
                  labels={labels}
                  active={i === active}
                  onHover={() => setActive(i)}
                  onPick={() => runTarget(s.target)}
                  className="h-menu-item max-md:min-h-touch-target"
                />
              ))}
            </ul>
          </div>
        </form>
        <div className="flex justify-end gap-1.5">
          <Button type="button" variant="primary" disabled={!value.trim()} onClick={() => run(value)}>
            {t("ok")}
          </Button>
          <Button type="button" onClick={closeDialog}>
            {t("cancel")}
          </Button>
        </div>
      </XpDialog>

      <MessageBox
        testId="run-error-dialog"
        open={error !== null}
        onOpenChange={(open) => {
          if (!open) setError(null);
        }}
        title={t("notFound.title")}
        icon={<ErrorIcon size={32} />}
        onCloseAutoFocus={(e) => {
          // Back to the field with the text selected, ready to retype.
          e.preventDefault();
          inputRef.current?.focus();
          inputRef.current?.select();
        }}
        actions={
          <AlertDialog.Cancel asChild>
            <Button variant="primary">{t("notFound.ok")}</Button>
          </AlertDialog.Cancel>
        }
      >
        {t("notFound.body", { query: error?.query ?? "" })}
      </MessageBox>
    </>
  );
}
