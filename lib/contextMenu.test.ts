import { afterEach, describe, expect, it, vi } from "vitest";
import { contextMenuTarget, openContextMenuOn } from "@/lib/contextMenu";

afterEach(() => {
  document.body.innerHTML = "";
});

function setup() {
  document.body.innerHTML = `
    <div data-desktop>
      <div data-desktop-background></div>
      <div data-desktop-icon="about" tabindex="0"><span id="label">About</span></div>
    </div>
    <section data-window="contact"><button id="inside">x</button></section>`;
  return {
    background: document.querySelector("[data-desktop-background]")!,
    icon: document.querySelector('[data-desktop-icon="about"]')!,
  };
}

describe("contextMenuTarget", () => {
  it("targets the focused icon (or the icon around the focus)", () => {
    const { icon } = setup();
    expect(contextMenuTarget(icon, document)).toBe(icon);
    expect(contextMenuTarget(document.getElementById("label"), document)).toBe(icon);
  });

  it("targets the desktop background when nothing has focus", () => {
    const { background } = setup();
    expect(contextMenuTarget(document.body, document)).toBe(background);
    expect(contextMenuTarget(null, document)).toBe(background);
  });

  it("leaves the key alone inside windows", () => {
    setup();
    expect(contextMenuTarget(document.getElementById("inside"), document)).toBeNull();
  });
});

describe("openContextMenuOn", () => {
  it("dispatches a bubbling, cancelable contextmenu event on the element", () => {
    const { icon } = setup();
    const listener = vi.fn((e: MouseEvent) => {
      expect(e.bubbles).toBe(true);
      expect(e.cancelable).toBe(true);
    });
    document.addEventListener("contextmenu", listener);
    openContextMenuOn(icon);
    expect(listener).toHaveBeenCalledOnce();
    document.removeEventListener("contextmenu", listener);
  });
});
