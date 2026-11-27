import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import CmdApp from "@/components/apps/CmdApp";
import { renderWithIntl } from "@/test/renderWithIntl";
import { MESSAGES } from "@/messages";
import { Z_BASE, useWindowStore } from "@/lib/store/windowStore";

const downloadSpy = vi.fn();
vi.mock("@/lib/download", () => ({
  downloadFile: (...args: unknown[]) => downloadSpy(...args),
}));

const mobile = vi.hoisted(() => ({ value: false }));
vi.mock("@/hooks/useIsMobile", () => ({
  useIsMobile: () => mobile.value,
}));

const input = () => screen.getByRole("textbox", { name: "Command" });
const log = () => screen.getByRole("log");
const prompt = () => document.querySelector("[data-cmd-prompt]")?.textContent;

beforeEach(() => {
  downloadSpy.mockClear();
  mobile.value = false;
  useWindowStore.setState({ windows: {}, order: [], focusedId: null, topZ: Z_BASE, openCount: 0 });
});

describe("CmdApp", () => {
  it("shows the banner and runs help", async () => {
    renderWithIntl(<CmdApp />);
    expect(log()).toHaveTextContent("DouglasOS [Version 1.5]");
    await userEvent.type(input(), "help{Enter}");
    expect(log()).toHaveTextContent("C:\\DouglasOS> help");
    expect(log().textContent).toContain("dir");
    expect(input()).toHaveValue("");
  });

  it("cd changes the prompt", async () => {
    renderWithIntl(<CmdApp />);
    expect(prompt()).toBe("C:\\DouglasOS>");
    await userEvent.type(input(), "cd projects{Enter}");
    expect(prompt()).toBe("C:\\DouglasOS\\Projects>");
  });

  it("↑ recalls the previous command", async () => {
    renderWithIntl(<CmdApp />);
    await userEvent.type(input(), "dir{Enter}");
    await userEvent.type(input(), "ver{Enter}");
    await userEvent.keyboard("{ArrowUp}");
    expect(input()).toHaveValue("ver");
    await userEvent.keyboard("{ArrowUp}");
    expect(input()).toHaveValue("dir");
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    expect(input()).toHaveValue("");
  });

  it("Tab completes a path", async () => {
    renderWithIntl(<CmdApp />);
    await userEvent.type(input(), "cd pro");
    await userEvent.keyboard("{Tab}");
    expect(input()).toHaveValue("cd Projects\\");
    expect(input()).toHaveFocus();
  });

  it("Tab completes a command name and lists several matches", async () => {
    renderWithIntl(<CmdApp />);
    await userEvent.type(input(), "wh");
    await userEvent.keyboard("{Tab}");
    expect(input()).toHaveValue("whoami");
    await userEvent.clear(input());
    await userEvent.type(input(), "c");
    await userEvent.keyboard("{Tab}");
    expect(log().textContent).toMatch(/cd\s+cv\s+contact\s+cls/);
  });

  it("cls empties the log", async () => {
    renderWithIntl(<CmdApp />);
    await userEvent.type(input(), "dir{Enter}");
    await userEvent.type(input(), "cls{Enter}");
    expect(log()).toBeEmptyDOMElement();
  });

  it("Esc clears the input", async () => {
    renderWithIntl(<CmdApp />);
    await userEvent.type(input(), "dir");
    await userEvent.keyboard("{Escape}");
    expect(input()).toHaveValue("");
  });

  it("exit closes the window", async () => {
    useWindowStore.getState().openWindow("cmd");
    expect(useWindowStore.getState().windows.cmd).toBeDefined();
    renderWithIntl(<CmdApp />);
    await userEvent.type(input(), "exit{Enter}");
    expect(useWindowStore.getState().windows.cmd).toBeUndefined();
  });

  it("renders typed markup as text", async () => {
    renderWithIntl(<CmdApp />);
    await userEvent.type(input(), "echo <b>hi</b>{Enter}");
    expect(log().querySelector("b")).toBeNull();
    expect(log()).toHaveTextContent("<b>hi</b>");
  });

  it("start resume.pdf triggers the CV download", async () => {
    renderWithIntl(<CmdApp />);
    await userEvent.type(input(), "start resume.pdf{Enter}");
    expect(downloadSpy).toHaveBeenCalledWith("/resume.pdf", expect.any(String));
  });

  it("uses PT copy when the locale is pt", async () => {
    render(
      <NextIntlClientProvider locale="pt" messages={MESSAGES.pt}>
        <CmdApp />
      </NextIntlClientProvider>,
    );
    expect(log()).toHaveTextContent("DouglasOS [Versão 1.5]");
    await userEvent.type(screen.getByRole("textbox", { name: "Comando" }), "mkdir x{Enter}");
    expect(log()).toHaveTextContent("Este drive é somente leitura");
  });

  it("shows quick-command chips on phones", async () => {
    mobile.value = true;
    renderWithIntl(<CmdApp />);
    const chips = screen.getByRole("toolbar", { name: "Quick commands" });
    expect(chips).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "cv" }));
    expect(downloadSpy).toHaveBeenCalledWith("/resume.pdf", expect.any(String));
    expect(log()).toHaveTextContent("C:\\DouglasOS> cv");
  });

  it("keeps the visible mirror scrolled with a long line", async () => {
    renderWithIntl(<CmdApp />);
    const mirror = document.querySelector<HTMLElement>("[data-cmd-mirror]")!;
    await userEvent.type(input(), `echo ${"x".repeat(120)}`);
    expect(mirror).toHaveTextContent(`echo ${"x".repeat(120)}`);
    // jsdom doesn't lay out: scroll the field as a browser would.
    input().scrollLeft = 640;
    fireEvent.scroll(input());
    expect(mirror.scrollLeft).toBe(640);
    input().scrollLeft = 120;
    await userEvent.keyboard("{Home}");
    expect(mirror.scrollLeft).toBe(120);
  });

  it("hands focus from the window frame to the prompt on desktop", () => {
    renderWithIntl(
      <div data-window="cmd" tabIndex={-1}>
        <CmdApp />
      </div>,
    );
    const frame = document.querySelector<HTMLElement>('[data-window="cmd"]')!;
    input().blur();
    frame.focus();
    expect(input()).toHaveFocus();
  });

  it("leaves focus on the window frame on phones (no surprise keyboard)", () => {
    mobile.value = true;
    renderWithIntl(
      <div data-window="cmd" tabIndex={-1}>
        <CmdApp />
      </div>,
    );
    const frame = document.querySelector<HTMLElement>('[data-window="cmd"]')!;
    frame.focus();
    expect(frame).toHaveFocus();
  });

  it("hides the chips on desktop", () => {
    renderWithIntl(<CmdApp />);
    expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();
  });

  it("keeps the mirror one line tall when the field is empty (so the input stays clickable)", () => {
    renderWithIntl(<CmdApp />);
    expect(document.querySelector("[data-cmd-mirror]")).toHaveClass("min-h-lh");
  });
});
