import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { UserCircle, FileText } from "lucide-react";
import en from "@/messages/en.json";
import { DockItem } from "@/components/os/dock/DockItem";
import { Z_BASE, useWindowStore } from "@/lib/store/windowStore";
import type { LauncherConfig } from "@/lib/apps/registry";

// Stub the download side-effect so the test never touches the DOM/file layer.
const downloadSpy = vi.fn();
vi.mock("@/lib/download", () => ({
  downloadFile: (...args: unknown[]) => downloadSpy(...args),
}));

const aboutLauncher: LauncherConfig = {
  id: "about",
  kind: "window",
  titleKey: "about",
  icon: UserCircle,
  defaultSize: { width: 600, height: 550 },
  // Content isn't rendered by DockItem, so a placeholder is fine.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Content: (() => null) as any,
};

const resumeLauncher: LauncherConfig = {
  id: "resume",
  kind: "download",
  titleKey: "resume",
  icon: FileText,
  href: "/resume.pdf",
  download: "Douglas-Tertuliano-CV.pdf",
};

function renderItem(launcher: LauncherConfig) {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <ul>
        <DockItem launcher={launcher} />
      </ul>
    </NextIntlClientProvider>,
  );
}

describe("DockItem", () => {
  beforeEach(() => {
    downloadSpy.mockClear();
    useWindowStore.setState({
      windows: {},
      order: [],
      focusedId: null,
      topZ: Z_BASE,
      openCount: 0,
    });
  });

  it("opens a window app via the store when clicked", async () => {
    renderItem(aboutLauncher);
    await userEvent.click(screen.getByRole("button", { name: "About" }));

    expect(useWindowStore.getState().windows.about).toBeDefined();
    expect(useWindowStore.getState().focusedId).toBe("about");
    expect(downloadSpy).not.toHaveBeenCalled();
  });

  it("triggers a download (not a window) for the resume launcher", async () => {
    renderItem(resumeLauncher);
    await userEvent.click(screen.getByRole("button", { name: "Resume" }));

    expect(downloadSpy).toHaveBeenCalledWith(
      "/resume.pdf",
      "Douglas-Tertuliano-CV.pdf",
    );
    expect(useWindowStore.getState().windows).toEqual({});
  });
});
