import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "@/test/renderWithIntl";
import BrowserApp from "@/components/apps/BrowserApp";
import { MAX_TABS } from "@/lib/browser/tabs";
import { PROFILE } from "@/lib/profile";
import { Z_BASE, useWindowStore } from "@/lib/store/windowStore";

const openLinkSpy = vi.fn();
vi.mock("@/lib/openLink", () => ({
  openLink: (...args: unknown[]) => openLinkSpy(...args),
}));
vi.mock("@/lib/download", () => ({ downloadFile: vi.fn() }));

const address = () => screen.getByRole("textbox", { name: "Address" });
const tabs = () => screen.getAllByRole("tab");
const visiblePanel = () =>
  document.querySelector<HTMLElement>("[data-browser-tab-panel]:not([hidden])")!;

async function typeAddress(value: string) {
  await userEvent.clear(address());
  await userEvent.type(address(), `${value}{Enter}`);
}

describe("BrowserApp (DouglasOS Web)", () => {
  beforeEach(() => {
    openLinkSpy.mockClear();
    useWindowStore.setState({ windows: {}, order: [], focusedId: null, topZ: Z_BASE, openCount: 0 });
    act(() => useWindowStore.getState().openWindow("browser"));
  });

  it("opens with LinkedIn (local page) and gasolinha tabs", async () => {
    renderWithIntl(<BrowserApp />);
    expect(tabs().map((t) => t.textContent)).toEqual(["LinkedIn", "Gasolinha"]);
    expect(tabs()[0]).toHaveAttribute("aria-selected", "true");
    expect(visiblePanel().querySelector('[data-browser-page="local-linkedin"]')).not.toBeNull();
    expect(address()).toHaveValue(PROFILE.linkedin);

    await userEvent.click(screen.getByRole("button", { name: "Open the real LinkedIn" }));
    expect(openLinkSpy).toHaveBeenCalledWith(PROFILE.linkedin, true);

    await userEvent.click(tabs()[1]);
    const frame = visiblePanel().querySelector("iframe")!;
    expect(frame).toHaveAttribute("src", "https://www.gasolinha.com.br");
    expect(frame.getAttribute("sandbox")).not.toContain("allow-top-navigation");
    expect(screen.getByText("Opening Gasolinha…")).toBeInTheDocument();
    fireEvent.load(frame);
    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  it("navigates allowed sites by name and goes Back", async () => {
    renderWithIntl(<BrowserApp />);
    await typeAddress("poupensa");
    expect(visiblePanel().querySelector("iframe")).toHaveAttribute("src", "https://poupensa.vercel.app/");
    expect(address()).toHaveValue("https://poupensa.vercel.app/");
    await userEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(visiblePanel().querySelector('[data-browser-page="local-linkedin"]')).not.toBeNull();
  });

  it("shows the 'that's too much' page for other sites, with CV and Contact", async () => {
    renderWithIntl(<BrowserApp />);
    await typeAddress("google.com");
    expect(screen.getByRole("heading", { name: "Okay, now that's a bit much, right?" })).toBeInTheDocument();
    expect(visiblePanel().textContent).toContain('"google.com"');
    expect(visiblePanel().querySelector('[data-browser-cta="cv"]')).not.toBeNull();
    expect(visiblePanel().querySelector('[data-browser-cta="contact"]')).not.toBeNull();
    await userEvent.click(visiblePanel().querySelector<HTMLElement>('[data-browser-site="santo-rosario"]')!);
    expect(visiblePanel().querySelector("iframe")).toHaveAttribute(
      "src",
      "https://santo-rosario-dojotes.vercel.app/",
    );
  });

  it("limits tabs with a humorous message", async () => {
    renderWithIntl(<BrowserApp />);
    const newTab = screen.getByRole("button", { name: "New tab" });
    for (let i = 2; i < MAX_TABS; i++) await userEvent.click(newTab);
    expect(tabs()).toHaveLength(MAX_TABS);
    expect(screen.queryByTestId("browser-too-many-tabs")).toBeNull();
    await userEvent.click(newTab);
    expect(await screen.findByTestId("browser-too-many-tabs")).toBeInTheDocument();
    // The dialog hides the window from the accessibility tree meanwhile.
    expect(screen.getAllByRole("tab", { hidden: true })).toHaveLength(MAX_TABS);
  });

  it("closing the last tab closes the window", async () => {
    renderWithIntl(<BrowserApp />);
    await userEvent.click(screen.getByRole("button", { name: "Close Gasolinha" }));
    expect(tabs()).toHaveLength(1);
    await userEvent.click(screen.getByRole("button", { name: "Close LinkedIn" }));
    expect(useWindowStore.getState().windows.browser).toBeUndefined();
  });

  it("moves between tabs with the arrow keys", async () => {
    renderWithIntl(<BrowserApp />);
    tabs()[0].focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(tabs()[1]).toHaveAttribute("aria-selected", "true");
  });
});
