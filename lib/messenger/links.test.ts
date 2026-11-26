import { describe, expect, it } from "vitest";
import { PROFILE } from "@/lib/profile";
import {
  MAX_LINK_LENGTH,
  buildMailtoLink,
  buildMessageLinks,
  buildWhatsAppLink,
  cleanMessage,
  whatsappChatUrl,
} from "@/lib/messenger/links";

/** Decode a query parameter the way a mail app / WhatsApp would. */
function param(link: string, name: string): string | null {
  const query = link.slice(link.indexOf("?") + 1);
  for (const pair of query.split("&")) {
    const [key, value = ""] = pair.split("=");
    if (key === name) return decodeURIComponent(value);
  }
  return null;
}

describe("cleanMessage", () => {
  it("trims, normalizes CRLF and squeezes long runs of blank lines", () => {
    expect(cleanMessage("  oi\r\n\r\n\r\n\r\ntchau \r")).toBe("oi\n\ntchau");
  });
});

describe("buildMailtoLink", () => {
  it("addresses PROFILE.email with an encoded subject and body", () => {
    const link = buildMailtoLink({ subject: "Olá pelo DouglasOS Messenger", message: "Vaga remota & café?" });
    expect(link.startsWith(`mailto:${PROFILE.email}?subject=`)).toBe(true);
    expect(link).not.toContain(" ");
    expect(param(link, "subject")).toBe("Olá pelo DouglasOS Messenger");
    expect(param(link, "body")).toBe("Vaga remota & café?");
    // The & inside the text never starts a new parameter.
    expect(link.split("&")).toHaveLength(2);
  });

  it("keeps accents and sends line breaks as CRLF", () => {
    const link = buildMailtoLink({
      subject: "Recado",
      message: "Olá, Douglas!\nAção: conversar\n\nAbraço",
      frame: (m) => `Oi,\n\n${m}\n\n(Enviado pelo DouglasOS Messenger)`,
    });
    expect(link).toContain("%0D%0A");
    expect(link.replace(/%0D%0A/g, "")).not.toContain("%0A");
    expect(param(link, "body")).toBe(
      "Oi,\r\n\r\nOlá, Douglas!\r\nAção: conversar\r\n\r\nAbraço\r\n\r\n(Enviado pelo DouglasOS Messenger)",
    );
  });

  it("shortens only the message (never the frame) to stay under the length cap", () => {
    const message = "ação ".repeat(800);
    const link = buildMailtoLink({ subject: "Hi", message, frame: (m) => `Hi Douglas,\n\n${m}\n\n— Ana` });
    expect(link.length).toBeLessThanOrEqual(MAX_LINK_LENGTH);
    const body = param(link, "body")!;
    expect(body.startsWith("Hi Douglas,\r\n\r\nação")).toBe(true);
    expect(body.endsWith("…\r\n\r\n— Ana")).toBe(true);
    // No broken multi-byte sequence: decoding succeeded and the text is intact.
    expect(body).not.toContain("�");
  });

  it("never splits an emoji when shortening", () => {
    const link = buildMailtoLink({ subject: "Hi", message: "😀".repeat(500) }, 300);
    expect(link.length).toBeLessThanOrEqual(300);
    expect(param(link, "body")).toMatch(/^(😀)+…$/u);
  });
});

describe("buildWhatsAppLink", () => {
  it("reuses the profile number and replaces its preset text", () => {
    expect(whatsappChatUrl()).toBe(whatsappChatUrl(PROFILE.whatsapp));
    expect(PROFILE.whatsapp).toContain("?text=");
    const link = buildWhatsAppLink({ message: "Olá!\nTudo bem?" });
    expect(link.startsWith(`${whatsappChatUrl()}?text=`)).toBe(true);
    expect(link).toContain("%0A");
    expect(param(link, "text")).toBe("Olá!\nTudo bem?");
    expect(link.match(/\?text=/g)).toHaveLength(1);
  });

  it("stays under the length cap", () => {
    const link = buildWhatsAppLink({ message: "x".repeat(5000) });
    expect(link.length).toBeLessThanOrEqual(MAX_LINK_LENGTH);
    expect(param(link, "text")!.endsWith("…")).toBe(true);
  });
});

describe("buildMessageLinks", () => {
  it("builds both links from lib/profile.ts with the same framed text", () => {
    const links = buildMessageLinks({
      subject: "Ana, via the DouglasOS Messenger",
      message: "Let's talk about a role",
      frame: (m) => `Hi Douglas,\n\n${m}\n\nAna`,
    });
    expect(links.mailto.startsWith(`mailto:${PROFILE.email}?`)).toBe(true);
    expect(links.whatsapp.startsWith(whatsappChatUrl(PROFILE.whatsapp))).toBe(true);
    expect(param(links.mailto, "subject")).toBe("Ana, via the DouglasOS Messenger");
    expect(param(links.whatsapp, "text")).toBe("Hi Douglas,\n\nLet's talk about a role\n\nAna");
  });
});
