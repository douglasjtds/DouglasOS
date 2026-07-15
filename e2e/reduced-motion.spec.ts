import { test, expect } from "@playwright/test";
import { dockButton } from "./helpers";

test.describe("prefers-reduced-motion", () => {
  test("skips the boot animation and lands straight on the desktop", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/en");

    // BootScreen bails out entirely under reduced motion (see BootScreen.tsx).
    await expect(dockButton(page, "about")).toBeVisible();
    await expect(page.getByTestId("boot-screen")).toHaveCount(0);
  });
});
