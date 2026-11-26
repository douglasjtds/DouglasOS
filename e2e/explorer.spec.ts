import { test, expect, type Page } from "@playwright/test";
import { desktopIcon, gotoDesktop, startButton, startItem, windowById } from "./helpers";

/** DouglasOS Explorer: the `projects` window as a case-study browser (stage 4). */

function explorer(page: Page) {
  return windowById(page, "projects");
}
function address(page: Page) {
  return explorer(page).locator("[data-explorer-address]");
}
function currentPage(page: Page) {
  return explorer(page).locator("[data-explorer-page]");
}
async function goTo(page: Page, value: string) {
  await address(page).fill(value);
  await address(page).press("Enter");
}

test.describe("DouglasOS Explorer", () => {
  test.beforeEach(async ({ page }) => {
    await gotoDesktop(page);
  });

  test("open a project → type another → navigate → unknown address → error → back", async ({ page }) => {
    await desktopIcon(page, "projects").click();
    await expect(currentPage(page)).toHaveAttribute("data-explorer-page", "home");
    await expect(address(page)).toHaveValue("C:\\DouglasOS\\Projects\\");

    // Open a project from the home list.
    await explorer(page).locator('[data-project-link="gasolinha"]').click();
    await expect(currentPage(page)).toHaveAttribute("data-explorer-page", "gasolinha");
    await expect(address(page)).toHaveValue("C:\\DouglasOS\\Projects\\gasolinha");
    await expect(explorer(page).getByRole("heading", { level: 3, name: "Gasolinha" })).toBeFocused();

    // Type another brand name (any case, spaces) and press Enter.
    await goTo(page, "the wedding POST");
    await expect(currentPage(page)).toHaveAttribute("data-explorer-page", "the-wedding-post");
    await expect(address(page)).toHaveValue("C:\\DouglasOS\\Projects\\the-wedding-post");

    // Something that doesn't exist → themed error, page unchanged.
    await goTo(page, "C:\\DouglasOS\\Projects\\netflix");
    const dialog = page.getByTestId("explorer-not-found");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("netflix");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(currentPage(page)).toHaveAttribute("data-explorer-page", "the-wedding-post");
    // Esc closed only the dialog, not the window.
    await expect(explorer(page)).toBeVisible();

    // Back → Gasolinha, Back → home, Forward → Gasolinha.
    const nav = (name: string) => explorer(page).locator(`[data-explorer-nav="${name}"]`);
    await nav("back").click();
    await expect(currentPage(page)).toHaveAttribute("data-explorer-page", "gasolinha");
    await nav("back").click();
    await expect(currentPage(page)).toHaveAttribute("data-explorer-page", "home");
    await expect(nav("back")).toBeDisabled();
    await nav("forward").click();
    await expect(currentPage(page)).toHaveAttribute("data-explorer-page", "gasolinha");
  });

  test("the not-found dialog links to the project list and to Contact", async ({ page }) => {
    await desktopIcon(page, "projects").click();
    await goTo(page, "douglasos");
    await goTo(page, "zzz");
    await page.getByTestId("explorer-not-found").locator("[data-not-found-home]").click();
    await expect(currentPage(page)).toHaveAttribute("data-explorer-page", "home");

    await goTo(page, "zzz");
    await page.getByTestId("explorer-not-found").locator("[data-not-found-contact]").click();
    await expect(windowById(page, "contact")).toBeVisible();
  });

  test("Start → My Projects ▸ opens a case study; the page survives a reload", async ({ page }) => {
    await startButton(page).click();
    await startItem(page, "my-projects").hover();
    await page.locator('[data-projects-submenu] [data-project-entry="douglasos"]').click();
    await expect(currentPage(page)).toHaveAttribute("data-explorer-page", "douglasos");

    await page.reload();
    await expect(currentPage(page)).toHaveAttribute("data-explorer-page", "douglasos");
    await expect(address(page)).toHaveValue("C:\\DouglasOS\\Projects\\douglasos");
  });
});
