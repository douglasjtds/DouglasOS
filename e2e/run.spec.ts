import { test, expect, type Page } from "@playwright/test";
import { desktopIcon, gotoDesktop, startButton, startItem, windowById } from "./helpers";
import { mockYouTube } from "./fakeYouTube";

function runDialog(page: Page) {
  return page.getByTestId("run-dialog");
}

function runField(page: Page) {
  return page.locator("[data-run-input]");
}

async function openRunFromStart(page: Page) {
  await startButton(page).click();
  await startItem(page, "run").click();
  await expect(runField(page)).toBeFocused();
}

/** A point on the wallpaper clear of the default icon columns and the bin. */
async function emptyDesktopPoint(page: Page) {
  const vp = page.viewportSize()!;
  return { x: Math.round(vp.width * 0.55), y: Math.round(vp.height * 0.45) };
}

test.describe("Run…, command palette and desktop context menus (stage 7)", () => {
  test("Start → Run… → 'cv' + Enter downloads the PDF", async ({ page }) => {
    await gotoDesktop(page);
    await openRunFromStart(page);
    const downloadPromise = page.waitForEvent("download");
    await runField(page).fill("cv");
    await runField(page).press("Enter");
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain(".pdf");
    await expect(runDialog(page)).toHaveCount(0);
  });

  test("Alt+Shift+R → a project name opens its case study; suggestions autocomplete", async ({ page }) => {
    await gotoDesktop(page);
    await page.keyboard.press("Alt+Shift+KeyR");
    await expect(runField(page)).toBeFocused();
    await runField(page).pressSequentially("gaso");
    const option = page.locator('[data-run-option="project:gasolinha"]');
    await expect(option).toBeVisible();
    await runField(page).press("ArrowDown");
    await expect(runField(page)).toHaveValue("gasolinha");
    await runField(page).press("Enter");
    const explorer = windowById(page, "projects");
    await expect(explorer).toBeVisible();
    await expect(explorer.locator("[data-explorer-address]")).toHaveValue(/gasolinha/);
    await expect(explorer).toBeFocused();
  });

  test("an unknown name shows the 'couldn't find' error and returns to the field", async ({ page }) => {
    await gotoDesktop(page);
    await openRunFromStart(page);
    await runField(page).fill("xyz");
    await runField(page).press("Enter");
    const error = page.getByTestId("run-error-dialog");
    await expect(error).toBeVisible();
    await expect(error).toContainText("DouglasOS couldn't find “xyz”");
    await error.getByRole("button", { name: "OK" }).click();
    await expect(error).toHaveCount(0);
    await expect(runField(page)).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(runDialog(page)).toHaveCount(0);
  });

  test("Ctrl+K opens the command palette; typing + Enter opens the app", async ({ page }) => {
    await gotoDesktop(page);
    await page.keyboard.press("Control+KeyK");
    const palette = page.getByTestId("command-palette");
    await expect(palette).toBeVisible();
    const input = palette.locator("[data-palette-input]");
    await expect(input).toBeFocused();
    await input.pressSequentially("contato");
    await expect(palette.locator('[data-run-option="launcher:contact"]')).toHaveAttribute("aria-selected", "true");
    await input.press("Enter");
    await expect(palette).toHaveCount(0);
    await expect(windowById(page, "contact")).toBeVisible();
  });

  test("right-click on the desktop → Arrange Icons puts a moved icon back", async ({ page }) => {
    await gotoDesktop(page);
    const skills = desktopIcon(page, "skills");
    const home = (await skills.boundingBox())!;
    // Drag Skills somewhere else on the desktop.
    await page.mouse.move(home.x + home.width / 2, home.y + 20);
    await page.mouse.down();
    await page.mouse.move(home.x + home.width / 2 + 40, home.y + 60, { steps: 5 });
    await page.mouse.move(home.x + 420, home.y + 120, { steps: 15 });
    await page.mouse.up();
    await expect.poll(async () => (await skills.boundingBox())!.x).toBeGreaterThan(home.x + 200);

    const point = await emptyDesktopPoint(page);
    await page.mouse.click(point.x, point.y, { button: "right" });
    const menu = page.locator("[data-desktop-menu]");
    await expect(menu).toBeVisible();
    await expect(page.locator("[data-icon-menu]")).toHaveCount(0);
    await menu.locator('[data-icon-menu-item="arrange"]').click();
    await expect.poll(async () => (await skills.boundingBox())!).toEqual(home);
  });

  test("desktop menu → New ▸ joke and Properties → Display Properties", async ({ page }) => {
    await gotoDesktop(page);
    const point = await emptyDesktopPoint(page);
    await page.mouse.click(point.x, point.y, { button: "right" });
    await page.locator('[data-desktop-menu] [data-icon-menu-item="new"]').click();
    await page.locator('[data-icon-submenu="new"] [data-icon-menu-item="new-folder"]').click();
    const joke = page.getByTestId("new-item-dialog");
    await expect(joke).toContainText("not a file system");
    await joke.getByRole("button", { name: "OK" }).click();
    await page.mouse.click(point.x, point.y, { button: "right" });
    await page.locator('[data-desktop-menu] [data-icon-menu-item="properties"]').click();
    await expect(windowById(page, "display")).toBeVisible();
  });

  test("icon menu → Properties; Shift+F10 opens the focused icon's menu", async ({ page }) => {
    await gotoDesktop(page);
    await desktopIcon(page, "experience").click({ button: "right" });
    await page.locator('[data-icon-menu] [data-icon-menu-item="properties"]').click();
    const props = page.getByTestId("icon-properties-dialog");
    await expect(props).toContainText("Experience Properties");
    await expect(props).toContainText("8 years, five companies");
    await props.getByRole("button", { name: "OK" }).click();
    await expect(props).toHaveCount(0);

    await desktopIcon(page, "about").focus();
    await page.keyboard.press("Shift+F10");
    const menu = page.locator("[data-icon-menu]");
    await expect(menu).toBeVisible();
    await expect(menu.locator('[data-icon-menu-item="open"]')).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(menu).toHaveCount(0);
  });

  test("Run → 'music' opens the Media Player; Run → 'webcam' opens Retro Cam", async ({ page }) => {
    await mockYouTube(page);
    await gotoDesktop(page);

    await openRunFromStart(page);
    await runField(page).fill("music");
    await runField(page).press("Enter");
    await expect(runDialog(page)).toHaveCount(0);
    await expect(windowById(page, "media-player")).toBeVisible();

    await openRunFromStart(page);
    await runField(page).fill("webcam");
    await runField(page).press("Enter");
    await expect(runDialog(page)).toHaveCount(0);
    await expect(windowById(page, "camera")).toBeVisible();
  });

  test("Run → 'paint' opens Paint; Run → 'dontopen' plays the first egg and Esc closes it", async ({ page }) => {
    await gotoDesktop(page);

    await openRunFromStart(page);
    await runField(page).fill("paint");
    await runField(page).press("Enter");
    await expect(runDialog(page)).toHaveCount(0);
    await expect(windowById(page, "paint")).toBeVisible();

    await openRunFromStart(page);
    await runField(page).fill("dontopen");
    await runField(page).press("Enter");
    await expect(runDialog(page)).toHaveCount(0);
    const egg = page.locator("[data-easter-egg]");
    await expect(egg).toHaveAttribute("data-easter-egg", "not-found");
    await expect(page.locator('[data-egg-action="cv"]')).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(egg).toHaveCount(0);
    // Esc left the egg only: Paint is still open.
    await expect(windowById(page, "paint")).toBeVisible();
  });
});
