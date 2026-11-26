"use client";

import { useTranslations } from "next-intl";
import { splitEmoticons } from "@/lib/messenger/emoticons";
import { Emoticon } from "@/components/icons/MessengerIcons";

/**
 * A chat line as text with emoticon codes swapped for our SVG faces. Visitor
 * input is only ever rendered as React text nodes (never as HTML); line
 * breaks are kept by `whitespace-pre-wrap` on the container.
 */
export function MessageText({ text }: { text: string }) {
  const t = useTranslations("messenger.emoticons");
  return (
    <>
      {splitEmoticons(text).map((part, i) =>
        part.kind === "text" ? (
          <span key={i}>{part.text}</span>
        ) : (
          <Emoticon key={i} id={part.id} label={t(part.id)} />
        ),
      )}
    </>
  );
}
