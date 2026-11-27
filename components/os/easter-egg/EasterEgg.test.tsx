import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/renderWithIntl";
import { LazyEasterEgg } from "@/components/os/easter-egg/LazyEasterEgg";
import { NotFoundPage } from "@/components/os/easter-egg/NotFoundPage";
import { useDontOpenThisStore } from "@/lib/store/dontOpenThisStore";
import { useAssistantStore } from "@/lib/store/assistantStore";
import { useBalloonStore } from "@/lib/store/balloonStore";
import { EASTER_EGG_MESSAGE_ID } from "@/lib/assistant/easterEgg";
import { launch } from "@/lib/apps/launch";

const downloadSpy = vi.fn();
vi.mock("@/lib/download", () => ({
  downloadFile: (...args: unknown[]) => downloadSpy(...args),
}));

/** Open the egg through the real launcher and wait for the lazy chunk. */
async function openEgg() {
  renderWithIntl(<LazyEasterEgg />);
  act(() => launch("dont-open-this"));
  return waitForEgg();
}

async function waitForEgg() {
  await vi.waitFor(() => expect(document.querySelector("[data-easter-egg]")).not.toBeNull());
  return document.querySelector("[data-easter-egg]")!;
}

describe("DON'T OPEN THIS.exe", () => {
  let say: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    sessionStorage.clear();
    downloadSpy.mockClear();
    useDontOpenThisStore.setState({ active: null, seq: 0 });
    useBalloonStore.setState({ queue: [] });
    say = vi.spyOn(useAssistantStore.getState(), "say");
  });
  afterEach(() => {
    say.mockRestore();
  });

  it("A: the 404 blue screen; Esc leaves and mini Douglas comments", async () => {
    const egg = await openEgg();
    expect(egg).toHaveAttribute("data-easter-egg", "not-found");
    expect(screen.getByRole("alertdialog", { name: "DouglasOS error screen" })).toBeInTheDocument();
    expect(screen.getByText("Error 404: PAGE_NOT_FOUND")).toBeInTheDocument();

    const windowListener = vi.fn();
    window.addEventListener("keydown", windowListener);
    fireEvent.keyDown(document.body, { key: "Escape" });
    window.removeEventListener("keydown", windowListener);

    expect(useDontOpenThisStore.getState().active).toBeNull();
    expect(windowListener).not.toHaveBeenCalled(); // the window manager never sees it
    expect(say).toHaveBeenCalledWith(expect.objectContaining({ id: EASTER_EGG_MESSAGE_ID }));
    expect(document.querySelector("[data-easter-egg]")).toBeNull();
  });

  it("A: Download CV downloads and leaves without a comment", async () => {
    await openEgg();
    fireEvent.click(document.querySelector('[data-egg-action="cv"]')!);
    expect(downloadSpy).toHaveBeenCalledWith("/resume.pdf", "Douglas-Tertuliano-CV.pdf");
    expect(useDontOpenThisStore.getState().active).toBeNull();
    expect(say).not.toHaveBeenCalled();
  });

  it("A: a click anywhere outside the buttons leaves", async () => {
    const egg = await openEgg();
    fireEvent.pointerDown(egg);
    expect(useDontOpenThisStore.getState().active).toBeNull();
  });

  it("B on the second open: icons move only visually and come back on Esc", async () => {
    sessionStorage.setItem("douglasos-dont-open-this", "1");
    const icon = document.createElement("div");
    icon.setAttribute("data-desktop-icon", "resume");
    document.body.appendChild(icon);

    const egg = await openEgg();
    expect(egg).toHaveAttribute("data-easter-egg", "scramble");
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(useDontOpenThisStore.getState().active).toBeNull();
    expect(icon.style.transform).toBe("");
    icon.remove();
  });

  it("C on the third open: Access denied with the sticky note, CV and Contact", async () => {
    sessionStorage.setItem("douglasos-dont-open-this", "2");
    const egg = await openEgg();
    expect(egg).toHaveAttribute("data-easter-egg", "access-denied");
    expect(screen.getByRole("alertdialog", { name: "Access denied" })).toBeInTheDocument();
    expect(screen.getByText("NO!")).toBeInTheDocument();
    expect(document.querySelector('[data-egg-action="cv"]')).not.toBeNull();
    fireEvent.click(document.querySelector('[data-egg-action="ok"]')!);
    expect(useDontOpenThisStore.getState().active).toBeNull();
    expect(say).toHaveBeenCalledTimes(1);
  });

  it("C: clicking inside the box doesn't leave; clicking outside does", async () => {
    sessionStorage.setItem("douglasos-dont-open-this", "2");
    const egg = await openEgg();
    fireEvent.pointerDown(screen.getByText("Access denied"));
    expect(useDontOpenThisStore.getState().active).toBe("access-denied");
    fireEvent.pointerDown(egg);
    expect(useDontOpenThisStore.getState().active).toBeNull();
  });

  it("Esc works from the very first frame the egg is on screen", async () => {
    // Fresh modules so the lazy chunk really loads, as on a first open: the
    // egg must not be visible before its Esc listener exists.
    vi.resetModules();
    const { LazyEasterEgg: FreshEgg } = await import("@/components/os/easter-egg/LazyEasterEgg");
    const { useDontOpenThisStore: freshStore } = await import("@/lib/store/dontOpenThisStore");
    const { launch: freshLaunch } = await import("@/lib/apps/launch");

    const observer = new MutationObserver(() => {
      if (!document.querySelector("[data-easter-egg]")) return;
      observer.disconnect();
      fireEvent.keyDown(document.body, { key: "Escape" });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    renderWithIntl(<FreshEgg />);
    act(() => freshLaunch("dont-open-this"));
    await vi.waitFor(() => expect(freshStore.getState().active).toBeNull());
    observer.disconnect();
  });

  it("gives focus back to what was focused before the egg opened", async () => {
    const previous = document.createElement("button");
    document.body.appendChild(previous);
    previous.focus();

    await openEgg();
    fireEvent.keyDown(document.body, { key: "Escape" });

    await vi.waitFor(() => expect(document.activeElement).toBe(previous));
    previous.remove();
  });
});

describe("NotFoundPage", () => {
  it("renders the blue screen with plain recovery links", () => {
    renderWithIntl(<NotFoundPage />);
    expect(screen.getByRole("heading", { level: 1, name: /couldn't find the page/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Download CV" })).toHaveAttribute("href", "/resume.pdf");
    expect(screen.getByRole("link", { name: "Download CV" })).toHaveAttribute("download", "Douglas-Tertuliano-CV.pdf");
    expect(screen.getByRole("link", { name: "Talk to Douglas" })).toHaveAttribute("href", "/en#open=contact");
    expect(screen.getByRole("link", { name: "Back to desktop" })).toHaveAttribute("href", "/en");
  });
});
