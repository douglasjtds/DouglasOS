"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertDialog } from "radix-ui";
import { MessageBox } from "@/components/os/MessageBox";
import { Button } from "@/components/ui/button";
import { QuestionIcon } from "@/components/icons/SystemIcons";
import { MAX_GAME_NUMBER, MIN_GAME_NUMBER, isValidGameNumber } from "@/lib/games/freecell/engine";

/**
 * "Select game…": a small message box asking for a deal number (1–32000).
 * Give it a fresh `key` each time it opens to reset the field.
 */
export function SelectGameDialog({
  open,
  onOpenChange,
  initialNumber,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialNumber: number;
  onSelect: (gameNumber: number) => void;
}) {
  const t = useTranslations("games.freecell.selectDialog");
  const range = { min: MIN_GAME_NUMBER, max: MAX_GAME_NUMBER };
  const inputId = useId();
  const errorId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(String(initialNumber));
  const [invalid, setInvalid] = useState(false);

  // The parent remounts this (new `key`) on each open, so state starts from
  // the current number; select it once Radix has placed its own focus.
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.select(), 0);
    return () => clearTimeout(timer);
  }, [open]);

  const submit = () => {
    const trimmed = value.trim();
    const n = /^\d+$/.test(trimmed) ? Number(trimmed) : NaN;
    if (!isValidGameNumber(n)) {
      setInvalid(true);
      inputRef.current?.focus();
      return;
    }
    onSelect(n);
    onOpenChange(false);
  };

  return (
    <MessageBox
      open={open}
      onOpenChange={onOpenChange}
      title={t("title")}
      icon={<QuestionIcon size={32} />}
      testId="freecell-select-game"
      actions={
        <>
          <Button variant="primary" data-freecell-action="select-ok" onClick={submit}>
            {t("ok")}
          </Button>
          <AlertDialog.Cancel asChild>
            <Button data-freecell-action="select-cancel">{t("cancel")}</Button>
          </AlertDialog.Cancel>
        </>
      }
    >
      <span className="flex flex-col gap-1.5">
        <label htmlFor={inputId}>{t("label", range)}</label>
        <input
          ref={inputRef}
          id={inputId}
          data-freecell-game-input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={value}
          aria-invalid={invalid}
          aria-describedby={invalid ? errorId : undefined}
          onChange={(event) => {
            setValue(event.target.value);
            setInvalid(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submit();
            }
          }}
          className="h-push-button-h w-32 border border-field-border bg-surface px-1.5 text-system text-text focus-light max-md:h-touch-target max-md:text-heading max-md:font-normal"
        />
        {invalid && (
          <span id={errorId} role="alert" className="text-system text-text">
            {t("invalid", range)}
          </span>
        )}
      </span>
    </MessageBox>
  );
}
