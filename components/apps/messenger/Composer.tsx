"use client";

import { useId, useRef, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { DropdownMenu } from "radix-ui";
import { BellRing, Smile } from "lucide-react";
import { useMessengerStore } from "@/lib/store/messengerStore";
import { EMOTICON_IDS, emoticonCode, insertAtCaret } from "@/lib/messenger/emoticons";
import { Emoticon } from "@/components/icons/MessengerIcons";
import { Button } from "@/components/ui/button";
import { menuSurfaceClass } from "@/components/os/menuStyles";
import { cn } from "@/lib/utils";

/** Composer text limit (the matcher only needs a sentence). */
export const MAX_CHAT_LENGTH = 500;

const toolButton =
  "inline-flex h-push-button-h items-center gap-1 rounded-button border border-transparent px-1.5 text-system text-text hover:border-bevel-shadow hover:bg-surface data-[state=open]:border-bevel-shadow data-[state=open]:shadow-bevel-pressed focus-light max-md:h-touch-target";

export interface ComposerProps {
  onSend: (text: string) => void;
  onNudge: () => void;
  /** Focus the field on mount (pointer desktop only; on a phone it would pop the keyboard). */
  autoFocus?: boolean;
}

/**
 * The composer: emoticon picker, Nudge, the message field and Send.
 * Enter sends, Shift+Enter adds a line. The draft lives in the store, so it
 * survives Esc closing the window.
 */
export function Composer({ onSend, onNudge, autoFocus }: ComposerProps) {
  const t = useTranslations("messenger");
  const draft = useMessengerStore((s) => s.draft);
  const setDraft = useMessengerStore((s) => s.setDraft);
  const field = useRef<HTMLTextAreaElement>(null);
  const fieldId = useId();

  function send() {
    if (!draft.trim()) return;
    onSend(draft);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  }

  function insertEmoticon(code: string) {
    const el = field.current;
    const { text, caret } = insertAtCaret(draft, code, el?.selectionStart ?? draft.length, el?.selectionEnd ?? draft.length);
    setDraft(text.slice(0, MAX_CHAT_LENGTH));
    requestAnimationFrame(() => {
      field.current?.focus();
      field.current?.setSelectionRange(caret, caret);
    });
  }

  return (
    <div data-messenger-composer className="flex flex-col gap-1">
      <div role="toolbar" aria-label={t("conversation.toolbar")} className="flex items-center gap-0.5">
        <DropdownMenu.Root modal={false}>
          <DropdownMenu.Trigger className={toolButton} data-messenger-emoticons>
            <Smile aria-hidden className="size-4 text-icon-info" />
            {t("conversation.emoticons")}
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              side="top"
              align="start"
              sideOffset={4}
              onCloseAutoFocus={(e) => e.preventDefault()}
              className={cn(menuSurfaceClass, "z-1200 grid grid-cols-5 gap-0.5 p-1")}
            >
              {EMOTICON_IDS.map((id) => (
                <DropdownMenu.Item
                  key={id}
                  data-emoticon={id}
                  onSelect={() => insertEmoticon(emoticonCode(id))}
                  className="flex size-8 cursor-default items-center justify-center rounded-button outline-none data-[highlighted]:bg-startmenu-right data-[highlighted]:shadow-[inset_0_0_0_1px_var(--color-startmenu-right-border)] max-md:size-touch-target"
                >
                  <Emoticon id={id} label={t(`emoticons.${id}`)} size={20} />
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
        <button type="button" data-messenger-nudge onClick={onNudge} className={toolButton}>
          <BellRing aria-hidden className="size-4 text-hot-strong" />
          {t("conversation.nudge")}
        </button>
      </div>
      <div className="flex items-stretch gap-1.5">
        <label htmlFor={fieldId} className="sr-only">
          {t("conversation.composerLabel")}
        </label>
        <textarea
          ref={field}
          id={fieldId}
          data-messenger-input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={t("conversation.placeholder")}
          maxLength={MAX_CHAT_LENGTH}
          rows={2}
          autoFocus={autoFocus}
          autoComplete="off"
          enterKeyHint="send"
          className="min-h-0 min-w-0 flex-1 resize-none border border-field-border bg-surface px-1.5 py-1 text-body text-text focus-light max-md:text-heading max-md:font-normal"
        />
        <Button
          type="button"
          variant="primary"
          data-messenger-send
          onClick={send}
          disabled={!draft.trim()}
          className="h-auto self-stretch max-md:min-h-touch-target"
        >
          {t("conversation.send")}
        </Button>
      </div>
    </div>
  );
}
