"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { AlertDialog } from "radix-ui";
import { FlipHorizontal2, ImageDown, Power } from "lucide-react";
import { useCamera } from "@/hooks/useCamera";
import { useIsMobile } from "@/hooks/useIsMobile";
import { downloadFile } from "@/lib/download";
import {
  DEFAULT_PALETTE,
  DOUGLASOS_PALETTE_TOKENS,
  PALETTES,
  PALETTE_IDS,
  hexToRgb,
  isPaletteId,
  type PaletteId,
} from "@/lib/camera/palettes";
import {
  BLOCK_SIZE,
  CAPTURE_WIDTH,
  DEFAULT_PIXEL_SIZE,
  MAX_FPS,
  PHOTO_WIDTH,
  PIXEL_SIZES,
  addFrame,
  captureSize,
  createFpsMeter,
  createFrameGate,
  downscale,
  gridSize,
  isPixelSize,
  photoFilename,
  quantize,
  upscale,
  type PhotoFrame,
  type PixelSize,
} from "@/lib/camera/pixelate";
import { MessageBox } from "@/components/os/MessageBox";
import { Button } from "@/components/ui/button";
import { CameraIcon } from "@/components/icons/CameraIcons";
import { ErrorIcon, WarningIcon } from "@/components/icons/SystemIcons";
import { cn } from "@/lib/utils";

/** Saved-photo frame: a Luna title-bar blue band around a button-face mat. */
const PHOTO_FRAME: PhotoFrame = {
  border: 16,
  outer: hexToRgb(DOUGLASOS_PALETTE_TOKENS["color-titlebar"]),
  mat: 6,
  inner: hexToRgb(DOUGLASOS_PALETTE_TOKENS["color-button-face"]),
};

interface Settings {
  pixelSize: PixelSize;
  palette: PaletteId;
  mirror: boolean;
}

/** The last rendered (quantized, block-sized) frame, kept only in memory for "Save photo". */
interface Frame {
  pixels: Uint8ClampedArray<ArrayBuffer>;
  cols: number;
  rows: number;
}

const toolButtonClass = cn(
  "flex h-push-button-h shrink-0 items-center gap-1 rounded-button px-1.5 text-system text-text focus-light",
  "hover:shadow-bevel-raised active:shadow-bevel-pressed aria-pressed:shadow-bevel-pressed aria-pressed:bg-surface-muted",
  "disabled:pointer-events-none disabled:text-text-disabled disabled:[&_svg]:opacity-40",
  "max-md:h-touch-target max-md:min-w-touch-target max-md:justify-center",
);

const selectClass =
  "h-push-button-h border border-field-border bg-surface px-1 text-system text-text focus-light max-md:h-touch-target max-md:text-heading max-md:font-normal";

function ToolbarSeparator() {
  return <span aria-hidden className="mx-0.5 h-5 w-px shrink-0 bg-bevel-shadow max-md:hidden" />;
}

/** Beige XP card in the middle of the viewfinder (idle / waiting / problem states). */
function Panel({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div
      data-camera-panel
      className="m-3 flex max-w-sm flex-col items-center gap-3 border border-bevel-dark bg-button-face p-4 text-center shadow-bevel-raised"
    >
      {icon}
      <h3 className="text-heading">{title}</h3>
      {children}
    </div>
  );
}

/**
 * Retro Cam (stage 9, DESKTOP-INTERFACE-SPEC → Retro Cam): a live, pixelated
 * webcam. The camera starts only from the visitor's click; each frame is
 * captured small, block-averaged, snapped to the chosen palette and drawn on
 * a canvas the browser enlarges with `image-rendering: pixelated`. Frames live
 * only in memory — nothing is uploaded, stored or sent anywhere — and the
 * camera turns off when the window is closed, minimized, hidden or the tab is
 * left (`useCamera`).
 */
export default function CameraApp() {
  const t = useTranslations("apps.camera");
  const mobile = useIsMobile();
  const camera = useCamera({ windowId: "camera", mobile });
  const { status, problem, stopReason, stream } = camera;

  const [settings, setSettings] = useState<Settings>({
    pixelSize: DEFAULT_PIXEL_SIZE,
    palette: DEFAULT_PALETTE,
    mirror: true,
  });
  const [framed, setFramed] = useState(true);
  const [fps, setFps] = useState(0);
  const [dialogDismissed, setDialogDismissed] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const settingsRef = useRef(settings);
  const frameRef = useRef<Frame | null>(null);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const active = status === "active";

  // Render loop: only while the camera is on. Throttled to MAX_FPS.
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!active || !stream || !video || !canvas) return;
    video.srcObject = stream;
    Promise.resolve()
      .then(() => video.play())
      .catch(() => {});

    const capture = document.createElement("canvas");
    const captureCtx = capture.getContext("2d", { willReadFrequently: true });
    const ctx = canvas.getContext("2d");
    const gate = createFrameGate(MAX_FPS);
    const meter = createFpsMeter();
    let raf = 0;
    let lastFpsUpdate = 0;

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!captureCtx || !ctx || video.readyState < 2 || !gate.shouldRender(now)) return;
      const { width, height } = captureSize(
        video.videoWidth,
        video.videoHeight,
        mobile ? CAPTURE_WIDTH.mobile : CAPTURE_WIDTH.desktop,
      );
      if (capture.width !== width) capture.width = width;
      if (capture.height !== height) capture.height = height;
      captureCtx.drawImage(video, 0, 0, width, height);
      const source = captureCtx.getImageData(0, 0, width, height).data;

      const s = settingsRef.current;
      const { cols, rows } = gridSize(width, height, BLOCK_SIZE[s.pixelSize]);
      const pixels = quantize(downscale(source, width, height, cols, rows, s.mirror), PALETTES[s.palette], cols);
      if (canvas.width !== cols) canvas.width = cols;
      if (canvas.height !== rows) canvas.height = rows;
      ctx.putImageData(new ImageData(pixels, cols, rows), 0, 0);
      frameRef.current = { pixels, cols, rows };

      const current = meter.tick(now);
      if (now - lastFpsUpdate > 500) {
        lastFpsUpdate = now;
        setFps(current);
      }
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      video.pause();
      video.srcObject = null;
      frameRef.current = null;
      setFps(0);
    };
  }, [active, stream, mobile]);

  function turnOn() {
    setDialogDismissed(false);
    void camera.start();
  }

  function savePhoto() {
    const frame = frameRef.current;
    if (!frame) return;
    const factor = Math.max(1, Math.round(PHOTO_WIDTH / frame.cols));
    let pixels = upscale(frame.pixels, frame.cols, frame.rows, factor);
    let width = frame.cols * factor;
    let height = frame.rows * factor;
    if (framed) ({ pixels, width, height } = addFrame(pixels, width, height, PHOTO_FRAME));
    const out = document.createElement("canvas");
    out.width = width;
    out.height = height;
    const ctx = out.getContext("2d");
    if (!ctx) return;
    ctx.putImageData(new ImageData(pixels, width, height), 0, 0);
    const name = photoFilename(new Date());
    // The PNG is built and downloaded locally (a blob: URL), never uploaded.
    out.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      downloadFile(url, name);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setAnnouncement(t("saved", { name }));
    }, "image/png");
  }

  const problemState = status === "denied" || status === "unsupported";
  const dialogOpen = problemState && !dialogDismissed;
  const problemText =
    status === "denied" ? t("denied.body") : problem && problem !== "permission" ? t(`unsupported.${problem}`) : "";
  const problemTitle = status === "denied" ? t("denied.title") : t("unsupported.title");
  // "no-api" can't be fixed by trying again; everything else can.
  const canRetry = problemState && problem !== "no-api";

  return (
    <div data-camera-app data-camera-status={status} className="flex min-h-0 flex-1 flex-col">
      {/* Toolbar */}
      <div
        role="toolbar"
        aria-label={t("toolbar.label")}
        className="flex shrink-0 flex-wrap items-center gap-1 border-b border-bevel-shadow px-1 py-1 max-md:gap-x-1.5 max-md:gap-y-0.5 max-md:py-0.5"
      >
        <button
          type="button"
          data-camera-power
          aria-pressed={active}
          onClick={active ? camera.stop : turnOn}
          disabled={status === "requesting"}
          className={toolButtonClass}
        >
          <Power className={cn("size-4", active ? "text-icon-success" : "text-text-muted")} aria-hidden />
          {active ? t("toolbar.turnOff") : t("toolbar.turnOn")}
        </button>
        <ToolbarSeparator />
        <label className="flex items-center gap-1 text-system text-text">
          {t("toolbar.pixelSize")}
          <select
            data-camera-pixel-size
            value={settings.pixelSize}
            onChange={(e) => {
              const value = e.target.value;
              if (isPixelSize(value)) setSettings((s) => ({ ...s, pixelSize: value }));
            }}
            className={selectClass}
          >
            {PIXEL_SIZES.map((size) => (
              <option key={size} value={size}>
                {t(`pixelSizes.${size}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1 text-system text-text">
          {t("toolbar.palette")}
          <select
            data-camera-palette
            value={settings.palette}
            onChange={(e) => {
              const value = e.target.value;
              if (isPaletteId(value)) setSettings((s) => ({ ...s, palette: value }));
            }}
            className={selectClass}
          >
            {PALETTE_IDS.map((id) => (
              <option key={id} value={id}>
                {t(`palettes.${id}`)}
              </option>
            ))}
          </select>
        </label>
        <ToolbarSeparator />
        <button
          type="button"
          data-camera-mirror
          aria-pressed={settings.mirror}
          onClick={() => setSettings((s) => ({ ...s, mirror: !s.mirror }))}
          className={toolButtonClass}
        >
          <FlipHorizontal2 className="size-4" aria-hidden />
          {t("toolbar.mirror")}
        </button>
        <label className="flex items-center gap-1 px-1 text-system text-text max-md:min-h-touch-target">
          <input
            type="checkbox"
            data-camera-frame
            checked={framed}
            onChange={(e) => setFramed(e.target.checked)}
            className="size-3.25 accent-icon-success focus-light max-md:size-5"
          />
          {t("toolbar.frame")}
        </label>
        <button
          type="button"
          data-camera-save
          onClick={savePhoto}
          disabled={!active}
          className={toolButtonClass}
        >
          <ImageDown className="size-4" aria-hidden />
          {t("toolbar.save")}
        </button>
      </div>

      {/* Viewfinder */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-viewfinder">
        {/* The raw feed is never shown: only the pixelated canvas is. */}
        <video
          ref={videoRef}
          muted
          playsInline
          aria-hidden
          tabIndex={-1}
          className="pointer-events-none absolute size-px opacity-0"
        />
        <canvas
          ref={canvasRef}
          data-camera-canvas
          role="img"
          aria-label={t("viewfinder")}
          hidden={!active}
          className="size-full object-contain [image-rendering:pixelated]"
        />
        {status === "idle" && (
          <Panel icon={<CameraIcon size={48} />} title={t("idle.title")}>
            {stopReason && (
              <p data-camera-stopped={stopReason} className="text-body font-bold">
                {t(`stopped.${stopReason}`)}
              </p>
            )}
            <p className="text-body text-text-muted">{t("idle.body")}</p>
            <Button variant="primary" data-camera-start onClick={turnOn}>
              {t("idle.action")}
            </Button>
          </Panel>
        )}
        {status === "requesting" && (
          <Panel icon={<CameraIcon size={48} />} title={t("requesting.title")}>
            <p className="text-body text-text-muted">{t("requesting.body")}</p>
          </Panel>
        )}
        {problemState && (
          <Panel
            icon={status === "denied" ? <WarningIcon size={32} /> : <ErrorIcon size={32} />}
            title={problemTitle}
          >
            <p className="text-body text-text-muted">{problemText}</p>
            {canRetry && <Button onClick={turnOn}>{t("retry")}</Button>}
          </Panel>
        )}
      </div>

      {/* Status bar */}
      <div className="flex h-statusbar shrink-0 items-stretch gap-0.5 p-0.5 text-system text-text">
        <span data-camera-status-text className="flex items-center gap-1 px-1.5 shadow-bevel-sunken">
          <span
            aria-hidden
            className={cn("size-2 rounded-full", active ? "bg-icon-success" : "bg-bevel-shadow")}
          />
          {active ? t("status.active") : t("status.off")}
        </span>
        <span data-camera-privacy className="flex min-w-0 flex-1 items-center truncate px-1.5 shadow-bevel-sunken">
          {[t("status.local"), ...(active ? [t("status.fps", { fps })] : []), t("status.noUpload")].join(" · ")}
        </span>
      </div>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <MessageBox
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) setDialogDismissed(true);
        }}
        title={t("title")}
        icon={status === "denied" ? <WarningIcon size={32} /> : <ErrorIcon size={32} />}
        testId="camera-dialog"
        actions={
          <>
            {canRetry && (
              <Button
                onClick={() => {
                  setDialogDismissed(true);
                  turnOn();
                }}
              >
                {t("retry")}
              </Button>
            )}
            <AlertDialog.Cancel asChild>
              <Button variant="primary">{t("ok")}</Button>
            </AlertDialog.Cancel>
          </>
        }
      >
        <strong className="block pb-1">{problemTitle}</strong>
        {problemText}
      </MessageBox>
    </div>
  );
}
