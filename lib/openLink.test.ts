import { afterEach, describe, expect, it, vi } from "vitest";
import { openLink } from "@/lib/openLink";

describe("openLink", () => {
  afterEach(() => vi.restoreAllMocks());

  function captureClick() {
    const clicked: HTMLAnchorElement[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked.push(this);
    });
    return clicked;
  }

  it("opens external URLs in a new tab with noopener noreferrer", () => {
    const clicked = captureClick();
    openLink("https://example.com/profile", true);
    expect(clicked).toHaveLength(1);
    expect(clicked[0].href).toBe("https://example.com/profile");
    expect(clicked[0].target).toBe("_blank");
    expect(clicked[0].rel).toBe("noopener noreferrer");
    expect(clicked[0].isConnected).toBe(false);
  });

  it("follows mailto: in place (no new tab)", () => {
    const clicked = captureClick();
    openLink("mailto:someone@example.com", false);
    expect(clicked[0].href).toBe("mailto:someone@example.com");
    expect(clicked[0].target).toBe("");
  });
});
