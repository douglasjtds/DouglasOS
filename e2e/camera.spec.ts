import { test, expect, type Page } from "@playwright/test";
import { gotoDesktop, startButton, startItem, taskButton, windowById } from "./helpers";

/**
 * Retro Cam (stage 9). Live-camera tests need a camera, which only Chromium
 * can fake (`--use-fake-device-for-media-stream`, the `chromium-camera`
 * project); Firefox and WebKit have no equivalent launch switch, so they — and
 * the plain `chromium` project — run only the camera-free tests (opening,
 * idle state, never asking before a click, the denied dialog via a stub).
 */
const FAKE_CAMERA_PROJECT = "chromium-camera";

/** Count getUserMedia calls and keep every stream it returns (to check its tracks). */
async function watchCamera(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __camCalls: number; __camStreams: MediaStream[] };
    w.__camCalls = 0;
    w.__camStreams = [];
    const media = navigator.mediaDevices;
    if (!media?.getUserMedia) return;
    const original = media.getUserMedia.bind(media);
    media.getUserMedia = async (constraints) => {
      w.__camCalls++;
      const stream = await original(constraints);
      w.__camStreams.push(stream);
      return stream;
    };
  });
}

/** Make getUserMedia reject like a blocked permission prompt. */
async function denyCamera(page: Page) {
  await page.addInitScript(() => {
    // Headless WebKit may not expose mediaDevices at all: provide the object.
    const media = navigator.mediaDevices ?? ({} as MediaDevices);
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: media });
    media.getUserMedia = () =>
      Promise.reject(Object.assign(new Error("blocked"), { name: "NotAllowedError" }));
  });
}

async function openRetroCam(page: Page) {
  await startButton(page).click();
  await startItem(page, "all-programs").hover();
  await page.locator('[data-program-folder="accessories"]').hover();
  await page.locator('[data-program-folder-menu="accessories"] [data-program="camera"]').click();
  const win = windowById(page, "camera");
  await expect(win).toBeVisible();
  return win;
}

const liveTracks = (page: Page) =>
  page.evaluate(() =>
    (window as unknown as { __camStreams: MediaStream[] }).__camStreams
      .flatMap((s) => s.getTracks())
      .filter((t) => t.readyState === "live").length,
  );

test.describe("Retro Cam", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name === FAKE_CAMERA_PROJECT, "covered by the default projects");
  });

  test("Start → All Programs → Accessories → Retro Cam opens idle and asks for nothing", async ({ page }) => {
    await watchCamera(page);
    await gotoDesktop(page);
    const win = await openRetroCam(page);
    await expect(win.locator("[data-camera-app]")).toHaveAttribute("data-camera-status", "idle");
    await expect(win.locator("[data-camera-privacy]")).toHaveText("local processing · no upload");
    await expect(win.getByRole("button", { name: "Save photo" })).toBeDisabled();
    // No desktop icon: Retro Cam lives only in the Start menu.
    await expect(page.locator('[data-desktop-icon="camera"]')).toHaveCount(0);
    expect(await page.evaluate(() => (window as unknown as { __camCalls: number }).__camCalls)).toBe(0);
  });

  test("a blocked camera shows the warning dialog; OK keeps a Try again in the window", async ({ page }) => {
    await denyCamera(page);
    await gotoDesktop(page, "pt");
    const win = await openRetroCam(page);
    await win.getByRole("button", { name: "Ligar câmera" }).click();
    const dialog = page.getByRole("alertdialog", { name: "Retro Cam" });
    await expect(dialog).toContainText("Câmera bloqueada");
    await dialog.getByRole("button", { name: "OK" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(win.locator("[data-camera-app]")).toHaveAttribute("data-camera-status", "denied");
    await expect(win.getByRole("button", { name: "Tentar de novo" })).toBeVisible();
  });
});

test.describe("Retro Cam with Chromium's fake camera", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== FAKE_CAMERA_PROJECT,
      "needs Chromium's --use-fake-device-for-media-stream (no equivalent on Firefox/WebKit)",
    );
  });

  test("turn on → pixelated CGA picture at 15–24 FPS → save photo → minimize stops the camera", async ({
    page,
  }, testInfo) => {
    await watchCamera(page);
    await gotoDesktop(page);
    const win = await openRetroCam(page);
    const app = win.locator("[data-camera-app]");

    await win.getByRole("button", { name: "Turn on camera" }).click();
    await expect(app).toHaveAttribute("data-camera-status", "active");
    await win.getByLabel("Palette:").selectOption("cga");
    await win.getByLabel("Pixels:").selectOption("large");

    // The canvas holds one pixel per block, and only CGA colors.
    await expect
      .poll(() => win.locator("[data-camera-canvas]").evaluate((c: HTMLCanvasElement) => c.width))
      .toBe(20);
    const colors = await win.locator("[data-camera-canvas]").evaluate((c: HTMLCanvasElement) => {
      const data = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
      const seen = new Set<string>();
      for (let i = 0; i < data.length; i += 4) seen.add(`${data[i]},${data[i + 1]},${data[i + 2]}`);
      return [...seen];
    });
    const cga = new Set(["0,0,0", "85,255,255", "255,85,255", "255,255,255"]);
    expect(colors.length).toBeGreaterThan(0);
    for (const color of colors) expect(cga.has(color)).toBe(true);

    // Status bar: measured frame rate, local processing, no upload.
    const privacy = win.locator("[data-camera-privacy]");
    await expect(privacy).toHaveText(/^local processing · (1[5-9]|2[0-4]) FPS · no upload$/, { timeout: 5000 });
    testInfo.annotations.push({ type: "fps", description: (await privacy.textContent()) ?? "" });

    const download = page.waitForEvent("download");
    await win.getByRole("button", { name: "Save photo" }).click();
    expect((await download).suggestedFilename()).toMatch(/^douglasos-cam-\d{8}-\d{6}\.png$/);

    expect(await liveTracks(page)).toBeGreaterThan(0);
    await win.getByRole("button", { name: "Minimize" }).click();
    await expect.poll(() => liveTracks(page)).toBe(0);
    await taskButton(page, "camera").click();
    await expect(app).toHaveAttribute("data-camera-status", "idle");
    await expect(win.locator("[data-camera-stopped]")).toHaveAttribute("data-camera-stopped", "minimized");
  });

  test("Turn off and closing the window both release the camera", async ({ page }) => {
    await watchCamera(page);
    await gotoDesktop(page);
    const win = await openRetroCam(page);
    await win.getByRole("button", { name: "Turn on camera" }).click();
    await expect(win.locator("[data-camera-app]")).toHaveAttribute("data-camera-status", "active");
    await win.getByRole("button", { name: "Turn off" }).click();
    await expect.poll(() => liveTracks(page)).toBe(0);

    await win.getByRole("button", { name: "Turn on camera" }).click();
    await expect.poll(() => liveTracks(page)).toBeGreaterThan(0);
    await win.getByRole("button", { name: "Close" }).click();
    await expect(windowById(page, "camera")).toHaveCount(0);
    await expect.poll(() => liveTracks(page)).toBe(0);
  });
});
