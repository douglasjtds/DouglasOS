import { test, expect } from "@playwright/test";
import { dockButton } from "./helpers";

// Drop the desktop metaphor below 768px: a small viewport gets the mobile
// placeholder, never the dock/window shell. Use only the viewport (not isMobile/
// device descriptors) so it runs on all browser projects — Firefox rejects
// `isMobile`, and the shell only keys off the width media query anyway.
test.use({ viewport: { width: 390, height: 844 } });

test.describe("mobile experience", () => {
  test("renders the linear mobile view, not the desktop shell", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/en");

    // No dock launchers on mobile.
    await expect(dockButton(page, "about")).toHaveCount(0);
    // Some content is still present (the placeholder uses the same copy/tokens).
    await expect(page.locator("body")).not.toBeEmpty();
  });
});
