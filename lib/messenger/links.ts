import { PROFILE } from "@/lib/profile";

/**
 * "Leave a message" links for the DouglasOS Messenger (DESKTOP-INTERFACE-SPEC
 * §14). There is no backend: the visitor's message leaves the browser only as
 * a pre-filled `mailto:` or `wa.me` link they send themselves. Pure and
 * locale-agnostic — the UI passes the localized subject and body frame.
 * Destinations come only from `lib/profile.ts`.
 */

/**
 * Longest link we hand to the browser. Some mail clients and Windows' URL
 * handler truncate around 2,000 characters, so the visitor's text is
 * shortened (with an ellipsis) until the whole encoded link fits.
 */
export const MAX_LINK_LENGTH = 2000;
/** Character limits of the form fields. */
export const MAX_MESSAGE_LENGTH = 1000;
export const MAX_NAME_LENGTH = 80;

/** Wraps the visitor's message in the localized body (greeting, signature). */
export type MessageFrame = (message: string) => string;

const identity: MessageFrame = (message) => message;

/** `\r\n` and lone `\r` become `\n`. */
export function normalizeNewlines(text: string): string {
  return text.replace(/\r\n?/g, "\n");
}

/** Trim, normalize line breaks and squeeze 3+ blank lines down to one. */
export function cleanMessage(text: string): string {
  return normalizeNewlines(text).replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Build `make(frame(message))`, shortening `message` (never the frame, so the
 * greeting and signature survive) until the link is at most `maxLength`.
 * Cuts on code points, so an accent or emoji is never split in half.
 */
function fitLink(
  message: string,
  frame: MessageFrame,
  make: (body: string) => string,
  maxLength: number,
): string {
  const full = make(frame(message));
  if (full.length <= maxLength) return full;
  const chars = Array.from(message);
  const shortened = (count: number) => make(frame(`${chars.slice(0, count).join("").trimEnd()}…`));
  let lo = 0;
  let hi = chars.length - 1;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (shortened(mid).length <= maxLength) lo = mid;
    else hi = mid - 1;
  }
  return shortened(lo);
}

export interface MailtoInput {
  /** Recipient address (defaults to `PROFILE.email`). */
  to?: string;
  subject: string;
  message: string;
  frame?: MessageFrame;
}

/**
 * `mailto:` link with an encoded subject and body. Line breaks in the body
 * are sent as CRLF (`%0D%0A`), as RFC 6068 asks.
 */
export function buildMailtoLink(
  { to = PROFILE.email, subject, message, frame = identity }: MailtoInput,
  maxLength = MAX_LINK_LENGTH,
): string {
  const prefix = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=`;
  return fitLink(
    cleanMessage(message),
    frame,
    (body) => prefix + encodeURIComponent(normalizeNewlines(body).replace(/\n/g, "\r\n")),
    maxLength,
  );
}

export interface WhatsAppInput {
  /**
   * The profile's `wa.me` link (defaults to `PROFILE.whatsapp`). Only its
   * origin and number are kept; any preset `?text=` is replaced.
   */
  base?: string;
  message: string;
  frame?: MessageFrame;
}

/** `https://wa.me/<number>` part of a WhatsApp click-to-chat link. */
export function whatsappChatUrl(base: string = PROFILE.whatsapp): string {
  const url = new URL(base);
  return `${url.origin}${url.pathname}`;
}

/** `wa.me` link with the encoded text (line breaks as `%0A`). */
export function buildWhatsAppLink(
  { base = PROFILE.whatsapp, message, frame = identity }: WhatsAppInput,
  maxLength = MAX_LINK_LENGTH,
): string {
  const prefix = `${whatsappChatUrl(base)}?text=`;
  return fitLink(
    cleanMessage(message),
    frame,
    (body) => prefix + encodeURIComponent(normalizeNewlines(body)),
    maxLength,
  );
}

export interface MessageLinks {
  mailto: string;
  whatsapp: string;
}

/**
 * Both links for a message, addressed from `lib/profile.ts`. `subject` and
 * `frame` are localized by the caller.
 */
export function buildMessageLinks(input: {
  subject: string;
  message: string;
  frame?: MessageFrame;
}): MessageLinks {
  return {
    mailto: buildMailtoLink(input),
    whatsapp: buildWhatsAppLink(input),
  };
}
