import { test, expect, type Page } from "@playwright/test";
import { desktopIcon, gotoDesktop, windowById } from "./helpers";

/** DouglasOS Web: the allowlisted browser with tabs. */

function browser(page: Page) {
  return windowById(page, "browser");
}
function address(page: Page) {
  return browser(page).locator("[data-browser-address]");
}
function panel(page: Page) {
  return browser(page).locator("[data-browser-tab-panel]:not([hidden])");
}
async function goTo(page: Page, value: string) {
  await address(page).fill(value);
  await address(page).press("Enter");
}

test.describe("DouglasOS Web", () => {
  test.beforeEach(async ({ page }) => {
    // Never hit the real sites from the suite: framed sites get a stub page.
    await page.route(/gasolinha\.com\.br|vercel\.app|github\.io/, (route) =>
      route.fulfill({ contentType: "text/html", body: "<h1 data-stub>stub site</h1>" }),
    );
    await gotoDesktop(page);
  });

  test("default tabs → live site → unknown site → too many tabs; CV/Contact always there", async ({ page }) => {
    await desktopIcon(page, "browser").click();
    const tabs = browser(page).getByRole("tab");
    await expect(tabs).toHaveText(["LinkedIn", "Gasolinha"]);
    await expect(panel(page).locator('[data-browser-page="local-linkedin"]')).toBeVisible();

    // The gasolinha tab loads the real site in an iframe.
    await tabs.nth(1).click();
    const frame = panel(page).locator('iframe[data-browser-frame="gasolinha"]');
    await expect(frame).toHaveAttribute("src", "https://www.gasolinha.com.br");
    await expect(page.frameLocator('iframe[data-browser-frame="gasolinha"]').locator("[data-stub]")).toBeVisible();
    await expect(browser(page).locator('[data-browser-status="done"]')).toBeVisible();

    // A project by name.
    await goTo(page, "poupensa");
    await expect(panel(page).locator('iframe[data-browser-frame="poupensa"]')).toBeVisible();

    // Anything else: the "that's too much" page, with CV and Contact.
    await goTo(page, "google.com");
    await expect(panel(page).locator('[data-browser-page="blocked"]')).toBeVisible();
    await expect(panel(page).locator('[data-browser-cta="cv"]')).toBeVisible();

    // Tab limit.
    const newTab = browser(page).locator("[data-browser-new-tab]");
    await newTab.click();
    await newTab.click();
    await expect(tabs).toHaveCount(4);
    await newTab.click();
    await expect(page.getByTestId("browser-too-many-tabs")).toBeVisible();
    await page.keyboard.press("Escape");

    // Golden rule: Contact is one click away from the browser's own pages.
    await tabs.first().click();
    await panel(page).locator('[data-browser-cta="contact"]').click();
    await expect(windowById(page, "contact")).toBeVisible();
  });
});
