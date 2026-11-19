import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "@/test/renderWithIntl";
import MessengerApp from "@/components/apps/MessengerApp";
import { initialMessengerData, useMessengerStore } from "@/lib/store/messengerStore";
import { Z_BASE, useWindowStore } from "@/lib/store/windowStore";
import { downloadFile } from "@/lib/download";
import { PROFILE } from "@/lib/profile";
import { MESSENGER_TIMING } from "@/lib/messenger/engine";

vi.mock("@/lib/download", () => ({ downloadFile: vi.fn() }));

const motion = vi.hoisted(() => ({ reduced: true }));
vi.mock("@/hooks/useReducedMotion", () => ({ useReducedMotion: () => motion.reduced }));

/** Let the (reduced-motion, 0ms) typing timers deliver every queued line. */
async function flush() {
  for (let i = 0; i < 6; i++) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }
}

function log() {
  return screen.getByRole("log");
}

async function openConversation() {
  renderWithIntl(<MessengerApp />);
  await userEvent.click(screen.getByRole("button", { name: "Start a conversation with Douglas" }));
  await flush();
}

describe("MessengerApp", () => {
  beforeEach(() => {
    motion.reduced = true;
    vi.mocked(downloadFile).mockClear();
    useMessengerStore.setState(initialMessengerData());
    useWindowStore.setState({ windows: {}, order: [], focusedId: null, topZ: Z_BASE, openCount: 0 });
    useWindowStore.getState().openWindow("messenger");
  });

  it("opens on the contact list with Douglas online", () => {
    renderWithIntl(<MessengerApp />);
    expect(screen.getByRole("heading", { name: "DouglasOS Messenger" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start a conversation with Douglas" })).toHaveAccessibleDescription(
      /Building things with AI/,
    );
  });

  it("a click on Douglas opens the conversation and he greets the visitor", async () => {
    await openConversation();
    expect(log()).toHaveAttribute("aria-live", "polite");
    expect(log()).toHaveTextContent("Douglas says:");
    expect(log()).toHaveTextContent("Hi! I saw you're looking around my portfolio");
    expect(screen.getByText(/Automatic replies, written in advance by Douglas/)).toBeInTheDocument();
    const replies = screen.getByRole("group", { name: "Suggested replies" });
    expect(within(replies).getAllByRole("button").map((b) => b.textContent)).toEqual([
      "See projects",
      "Download CV",
      "Tech stack",
      "Availability",
      "Leave a message",
    ]);
    // The greeting plays once per session.
    act(() => useMessengerStore.getState().showContacts());
    await userEvent.click(screen.getByRole("button", { name: "Start a conversation with Douglas" }));
    await flush();
    expect(within(log()).getAllByText(/looking around my portfolio/)).toHaveLength(1);
  });

  it('the "Download CV" quick reply downloads right away', async () => {
    await openConversation();
    const replies = screen.getByRole("group", { name: "Suggested replies" });
    await userEvent.click(within(replies).getByRole("button", { name: "Download CV" }));
    expect(downloadFile).toHaveBeenCalledWith("/resume.pdf", expect.stringContaining(".pdf"));
    await flush();
    expect(log()).toHaveTextContent("You say:Can I have your CV?");
    expect(log()).toHaveTextContent("the download should have started");
  });

  it("answers free text through the matcher and its buttons open windows", async () => {
    await openConversation();
    await userEvent.type(screen.getByLabelText("Your message"), "posso ver seus projetos?{Enter}");
    await flush();
    expect(log()).toHaveTextContent("You say:posso ver seus projetos?");
    expect(log()).toHaveTextContent("I write my projects up as case studies");
    await userEvent.click(screen.getByRole("button", { name: "Open My Projects" }));
    expect(useWindowStore.getState().focusedId).toBe("projects");
  });

  it('typing "cv" offers the PDF one click away', async () => {
    await openConversation();
    await userEvent.type(screen.getByLabelText("Your message"), "cv{Enter}");
    await flush();
    await userEvent.click(screen.getByRole("button", { name: "Download the CV (PDF)" }));
    expect(downloadFile).toHaveBeenCalledTimes(1);
  });

  it("Shift+Enter adds a line instead of sending; Send is disabled while empty", async () => {
    await openConversation();
    const field = screen.getByLabelText("Your message");
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    await userEvent.type(field, "oi{Shift>}{Enter}{/Shift}tudo bem");
    expect(field).toHaveValue("oi\ntudo bem");
    expect(screen.queryByText("You say:")).toBeNull();
  });

  it("the header keeps CV and Contact one click away", async () => {
    await openConversation();
    await userEvent.click(document.querySelector<HTMLElement>('[data-messenger-shortcut="contact"]')!);
    expect(useWindowStore.getState().focusedId).toBe("contact");
    await userEvent.click(document.querySelector<HTMLElement>('[data-messenger-shortcut="cv"]')!);
    expect(downloadFile).toHaveBeenCalledTimes(1);
  });

  it("leaving a message builds real mailto / wa.me links, then Douglas thanks the visitor", async () => {
    await openConversation();
    await userEvent.click(screen.getByRole("button", { name: "Leave a message" }));
    await flush();
    const form = screen.getByRole("group", { name: "Leave a message" });
    expect(screen.getByLabelText("Message")).toHaveFocus();
    await userEvent.type(screen.getByLabelText("Your name (optional)"), "Ana");
    await userEvent.type(screen.getByLabelText("Message"), "Vaga remota?{Enter}Abraço");

    const email = within(form).getByRole("link", { name: "Send by e-mail" });
    const href = email.getAttribute("href")!;
    expect(href.startsWith(`mailto:${PROFILE.email}?subject=`)).toBe(true);
    expect(decodeURIComponent(href)).toContain("Ana, via the DouglasOS Messenger");
    expect(decodeURIComponent(href)).toContain("Vaga remota?\r\nAbraço");
    const whatsapp = within(form).getByRole("link", { name: "Send on WhatsApp" });
    expect(whatsapp).toHaveAttribute("target", "_blank");
    expect(whatsapp).toHaveAttribute("rel", "noopener noreferrer");
    expect(whatsapp.getAttribute("href")).toMatch(/^https:\/\/wa\.me\/\d+\?text=Hi%20Douglas/);

    // jsdom can't follow mailto:, so stop the navigation and check the follow-up.
    email.addEventListener("click", (e) => e.preventDefault());
    await userEvent.click(email);
    await flush();
    expect(screen.queryByRole("group", { name: "Leave a message" })).toBeNull();
    expect(log()).toHaveTextContent("Vaga remota?");
    expect(log()).toHaveTextContent("Your mail app should have opened");
  });

  it("an empty message doesn't follow the link", async () => {
    await openConversation();
    act(() => useMessengerStore.getState().openForm());
    const email = screen.getByRole("link", { name: "Send by e-mail" });
    expect(email).toHaveAttribute("aria-disabled", "true");
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    email.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(screen.getByRole("group", { name: "Leave a message" })).toBeInTheDocument();
  });

  it("Esc closes the form first, then (from the composer) the window", async () => {
    await openConversation();
    act(() => useMessengerStore.getState().openForm());
    fireEvent.keyDown(screen.getByLabelText("Message"), { key: "Escape" });
    expect(screen.queryByRole("group", { name: "Leave a message" })).toBeNull();
    fireEvent.keyDown(screen.getByLabelText("Your message"), { key: "Escape" });
    expect(useWindowStore.getState().windows.messenger).toBeUndefined();
  });

  it("nudges are rate-limited and answered", async () => {
    await openConversation();
    const nudge = screen.getByRole("button", { name: "Nudge" });
    await userEvent.click(nudge);
    await flush();
    expect(log()).toHaveTextContent("You sent a nudge.");
    expect(log()).toHaveTextContent("I'm here, I'm here");
    await userEvent.click(nudge);
    expect(log()).toHaveTextContent("Wait a few seconds before nudging again.");
  });

  it("shows “Douglas is typing…” for a while before each line (motion allowed)", async () => {
    motion.reduced = false;
    vi.useFakeTimers();
    try {
      renderWithIntl(<MessengerApp />);
      fireEvent.click(screen.getByRole("button", { name: "Start a conversation with Douglas" }));
      const typing = document.querySelector("[data-messenger-typing]")!;
      expect(typing).toHaveAttribute("aria-hidden", "false");
      expect(log()).not.toHaveTextContent("Douglas says:");
      act(() => vi.advanceTimersByTime(MESSENGER_TIMING.typingMax));
      expect(log()).toHaveTextContent("looking around my portfolio");
      act(() => vi.advanceTimersByTime(MESSENGER_TIMING.typingMax));
      expect(typing).toHaveAttribute("aria-hidden", "true");
      expect(useMessengerStore.getState().pending).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("lines that arrive while the window is in the background count as unread", async () => {
    renderWithIntl(<MessengerApp />);
    act(() => useWindowStore.getState().minimizeWindow("messenger"));
    act(() => useMessengerStore.getState().setView("conversation"));
    await flush();
    expect(useMessengerStore.getState().unread).toBe(2);
    act(() => useWindowStore.getState().restoreWindow("messenger"));
    expect(useMessengerStore.getState().unread).toBe(0);
  });
});
