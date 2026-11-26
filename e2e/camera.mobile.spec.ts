import { test, expect } from "@playwright/test";
import { gotoDesktop, startButton, windowById } from "./helpers";

/**
 * Retro Cam on phones (stage 9, DESKTOP-INTERFACE-SPEC → Retro Cam → Mobile).
 * Phone projects have no fake-camera switch (WebKit has none at all), so the
 * camera is a stub: a canvas test pattern streamed through `captureStream()`.
 * It records the constraints Retro Cam asked for and whether its tracks were
 * stopped.
 */
test("Retro Cam: front camera, full screen, off when another window comes up", async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as {
      __camConstraints: MediaStreamConstraints | null;
      __camTracks: MediaStreamTrack[];
    };
    w.__camConstraints = null;
    w.__camTracks = [];
    const media = navigator.mediaDevices ?? ({} as MediaDevices);
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: media });
    media.getUserMedia = async (constraints) => {
      w.__camConstraints = constraints ?? null;
      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext("2d")!;
      let hue = 0;
      const paint = () => {
        hue = (hue + 7) % 360;
        ctx.fillStyle = `hsl(${hue} 70% 50%)`;
        ctx.fillRect(0, 0, 320, 240);
        ctx.fillStyle = "#fff";
        ctx.fillRect(100, 60, 120, 120);
      };
      paint();
      setInterval(paint, 50);
      const stream = canvas.captureStream(20);
      w.__camTracks.push(...stream.getTracks());
      return stream;
    };
  });
  await gotoDesktop(page);

  await startButton(page).tap();
  const entry = page.locator('[data-all-programs] [data-program-folder="accessories"] [data-program="camera"]');
  await entry.scrollIntoViewIfNeeded();
  await entry.tap();
  const win = windowById(page, "camera");
  await expect(win).toHaveAttribute("data-presentation", "fullscreen");

  // Touch targets on the toolbar.
  const power = win.locator("[data-camera-power]");
  const box = (await power.boundingBox())!;
  expect(box.height).toBeGreaterThanOrEqual(44);

  await win.getByRole("button", { name: "Turn on camera" }).tap();
  await expect(win.locator("[data-camera-app]")).toHaveAttribute("data-camera-status", "active");
  const constraints = await page.evaluate(
    () => (window as unknown as { __camConstraints: MediaStreamConstraints }).__camConstraints,
  );
  expect(constraints).toMatchObject({ audio: false, video: { facingMode: "user", width: { ideal: 320 } } });

  // Quick Launch → Contact covers the camera: it turns off.
  await page.locator("[data-quick-launch='contact']").tap();
  await expect(windowById(page, "contact")).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as unknown as { __camTracks: MediaStreamTrack[] }).__camTracks.every((t) => t.readyState === "ended"),
      ),
    )
    .toBe(true);
});
