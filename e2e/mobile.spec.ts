import { test, expect } from "@playwright/test";
import { desktopIcon } from "./helpers";

// Below 768px the linear mobile page stays until stage 2 (touchable XP). Use
// only the viewport (not isMobile/device descriptors) so it runs on all browser
// projects — Firefox rejects `isMobile`, and the shell keys off width anyway.
test.use({ viewport: { width: 390, height: 844 } });

test.describe("mobile experience", () => {
  test("renders the linear mobile view, not the desktop shell", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/en");

    await expect(page.getByRole("heading", { name: "Douglas Tertuliano" })).toBeVisible();
    await expect(desktopIcon(page, "about")).toHaveCount(0);
    await expect(page.locator("[data-start-button]")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Download CV" }).first()).toBeVisible();
  });
});
