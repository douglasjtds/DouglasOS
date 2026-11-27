"use client";

import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useLauncherLabels } from "@/hooks/useLauncherLabels";
import { COMMANDS, runCommand, type CmdEffect } from "@/lib/cmd/commands";
import { completePath, formatPath } from "@/lib/cmd/filesystem";
import { executeRunTarget } from "@/lib/run/execute";
import { openLink } from "@/lib/openLink";
import { useEasterEggStore } from "@/lib/store/easterEggStore";
import { useWindowStore } from "@/lib/store/windowStore";

/** Scrollback cap: the oldest lines are dropped past this. */
const MAX_LINES = 500;

/** Quick commands offered as chips on phones (no Tab, no ↑ on a touch keyboard). */
const CHIPS = ["help", "dir", "cv", "contact", "cls"] as const;

/**
 * Scrollback. `base` counts every line ever dropped (cap or `cls`) so each
 * line keeps a stable React key (`base + index`) while the array shifts.
 */
interface Scrollback {
  base: number;
  lines: string[];
}

function append(prev: Scrollback, added: string[]): Scrollback {
  const lines = [...prev.lines, ...added];
  const overflow = Math.max(0, lines.length - MAX_LINES);
  return { base: prev.base + overflow, lines: overflow ? lines.slice(overflow) : lines };
}

function performEffect(effect: CmdEffect) {
  switch (effect.kind) {
    case "run":
      executeRunTarget(effect.target);
      break;
    case "openUrl":
      openLink(effect.url, true);
      break;
    case "close":
      useWindowStore.getState().closeWindow("cmd");
      break;
    case "discover":
      useEasterEggStore.getState().discover(effect.egg);
      break;
    case "clear":
      // Handled with the scrollback update.
      break;
  }
}

/**
 * cmd.exe: a small, read-only command line over the portfolio. The engine
 * (`lib/cmd/commands.ts`) is pure; this component keeps the scrollback, the
 * current folder and the session history, and performs the effects (open an
 * app, download the CV, close the window…). Output is always rendered as
 * text nodes. Enter runs, ↑/↓ walk the history, Tab completes, Esc clears the
 * line, Ctrl+L clears the screen. Phones get chips for the main commands.
 */
export default function CmdApp() {
  const t = useTranslations();
  const locale = useLocale();
  const labels = useLauncherLabels();
  const mobile = useIsMobile();
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const [screen, setScreen] = useState<Scrollback>(() => ({
    base: 0,
    lines: [t("apps.cmd.banner"), t("apps.cmd.bannerHint"), ""],
  }));
  const [cwd, setCwd] = useState<string[]>([]);
  const [value, setValue] = useState("");
  const [caret, setCaret] = useState(0);
  const [focused, setFocused] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  // Position while walking the history; `history.length` = the fresh line.
  const [historyIndex, setHistoryIndex] = useState(0);

  const prompt = `${formatPath(cwd)}>`;

  // Keyboard users land on the prompt; phones wait for a tap (no surprise keyboard).
  useEffect(() => {
    if (!mobile) inputRef.current?.focus({ preventScroll: true });
  }, [mobile]);

  // The shell focuses the window frame (Run, palette, taskbar restore…), often
  // after this app mounted: on desktop, hand that focus straight to the prompt.
  useEffect(() => {
    const frame = rootRef.current?.closest<HTMLElement>('[data-window="cmd"]');
    if (!frame || mobile) return;
    const onFocusIn = (e: FocusEvent) => {
      if (e.target === frame) inputRef.current?.focus({ preventScroll: true });
    };
    frame.addEventListener("focusin", onFocusIn);
    return () => frame.removeEventListener("focusin", onFocusIn);
  }, [mobile]);

  // Keep the newest line in view after every run.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [screen]);

  /** Keep the visible mirror scrolled exactly like the (transparent) field. */
  function syncMirror() {
    const input = inputRef.current;
    const mirror = mirrorRef.current;
    if (input && mirror) mirror.scrollLeft = input.scrollLeft;
  }

  // After every edit or caret move the field may have scrolled: follow it.
  useLayoutEffect(syncMirror, [value, caret]);

  function setLine(next: string) {
    setValue(next);
    setCaret(next.length);
  }

  function execute(line: string) {
    const result = runCommand(line, { cwd, t, locale, now: new Date(), labels });
    const effects = result.effects ?? [];
    if (effects.some((e) => e.kind === "clear")) {
      setScreen((prev) => ({ base: prev.base + prev.lines.length, lines: [] }));
    } else {
      setScreen((prev) => append(prev, [`${prompt} ${line}`, ...result.output]));
    }
    if (result.cwd) setCwd(result.cwd);
    const nextHistory = line.trim() ? [...history, line] : history;
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length);
    setLine("");
    effects.forEach(performEffect);
  }

  function recall(step: -1 | 1) {
    const next = Math.min(history.length, Math.max(0, historyIndex + step));
    if (next === historyIndex) return;
    setHistoryIndex(next);
    setLine(history[next] ?? "");
  }

  /** Complete the last token: a command name first, a path after it. */
  function complete() {
    const match = /^(.*?)(\S*)$/.exec(value);
    const head = match?.[1] ?? "";
    const token = match?.[2] ?? "";
    const isCommand = head.trim() === "";
    const options = isCommand
      ? token
        ? COMMANDS.filter((c) => c.startsWith(token.toLowerCase()))
        : []
      : completePath(cwd, token);
    if (options.length === 1) setLine(`${head}${options[0]}`);
    else if (options.length > 1) setScreen((prev) => append(prev, [options.join("  ")]));
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      execute(value);
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      recall(e.key === "ArrowUp" ? -1 : 1);
    } else if (e.key === "Tab") {
      if (e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return;
      e.preventDefault();
      complete();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setLine("");
      setHistoryIndex(history.length);
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "l") {
      e.preventDefault();
      setScreen((prev) => ({ base: prev.base + prev.lines.length, lines: [] }));
    }
  }

  const before = value.slice(0, caret);
  const under = value.charAt(caret);
  const after = value.slice(caret + 1);

  return (
    <div ref={rootRef} data-cmd-app className="flex h-full min-h-0 flex-col bg-console-bg font-mono text-body text-console-text">
      {/* Clicking anywhere on the console types at the prompt. */}
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 cursor-text overflow-y-auto px-2 py-1.5"
        onMouseUp={() => {
          // Keep a text selection (copying output) intact.
          if (!window.getSelection()?.toString()) inputRef.current?.focus({ preventScroll: true });
        }}
      >
        <div role="log" aria-live="polite">
          {screen.lines.map((line, i) => (
            <div key={screen.base + i} className="min-h-lh whitespace-pre-wrap break-words">
              {line}
            </div>
          ))}
        </div>
        <div className="flex items-start">
          <span data-cmd-prompt className="shrink-0 whitespace-pre text-console-prompt">
            {prompt}
          </span>
          <span className="shrink-0 whitespace-pre"> </span>
          <div className="relative min-w-0 flex-1">
            {/* Visible mirror of the field with the console caret. Both get a
                1ch end padding (room for the caret past the last character), so
                their scroll ranges match and `syncMirror` keeps them aligned. */}
            <div
              ref={mirrorRef}
              aria-hidden
              data-cmd-mirror
              className="min-h-lh overflow-hidden whitespace-pre pr-[1ch] text-console-prompt"
            >
              {before}
              <span className="relative">
                {under}
                {focused && (
                  <span className="absolute bottom-0 left-0 h-0.5 w-[1ch] bg-console-prompt motion-safe:animate-caret-blink" />
                )}
              </span>
              {after}
            </div>
            <input
              ref={inputRef}
              aria-label={t("apps.cmd.inputLabel")}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              enterKeyHint="send"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setCaret(e.target.selectionStart ?? e.target.value.length);
              }}
              onSelect={(e) => {
                setCaret(e.currentTarget.selectionStart ?? value.length);
                syncMirror();
              }}
              onScroll={syncMirror}
              onKeyUp={syncMirror}
              onKeyDown={onKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              className="absolute inset-0 w-full bg-transparent p-0 pr-[1ch] font-mono text-body text-transparent caret-transparent outline-none selection:bg-console-text selection:text-console-bg"
            />
          </div>
        </div>
      </div>
      {mobile && (
        <div
          role="toolbar"
          aria-label={t("apps.cmd.chipsLabel")}
          className="flex shrink-0 flex-wrap gap-1.5 border-t border-console-text/40 px-2 py-1.5"
        >
          {CHIPS.map((command) => (
            <button
              key={command}
              type="button"
              onClick={() => execute(command)}
              className="min-h-touch-target rounded-button border border-console-text/60 px-3 font-mono text-body text-console-prompt active:bg-console-text active:text-console-bg"
            >
              {command}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
