/**
 * Retro Cam camera states and `getUserMedia` helpers (stage 9). Pure, so the
 * permission/error mapping and the requested constraints are unit-tested.
 *
 * Privacy contract (DESKTOP-INTERFACE-SPEC → Retro Cam): the camera is only
 * requested from an explicit click, video only (never audio), and every track
 * is stopped when the visitor turns it off, closes or minimizes the window, or
 * the tab is hidden. Frames never leave the page.
 */

export type CameraStatus = "idle" | "requesting" | "active" | "denied" | "unsupported";

/** Why the camera is unavailable (picks the copy of the denied/unsupported states). */
export type CameraProblem =
  | "permission" // the visitor or the browser said no
  | "no-api" // no mediaDevices.getUserMedia (old browser or insecure context)
  | "no-camera" // no video input device
  | "busy"; // the device exists but another app holds it

/** Why an active camera was turned off without the visitor pressing "Turn off". */
export type CameraStopReason = "minimized" | "hidden" | "ended";

/** Whether this browser can be asked for a camera at all. */
export function hasCameraApi(nav: Navigator | undefined = globalThis.navigator): boolean {
  return typeof nav?.mediaDevices?.getUserMedia === "function";
}

/**
 * Constraints for the camera request: front camera, small resolution (smaller
 * still on phones, for performance), modest frame rate, never audio.
 */
export function cameraConstraints(mobile: boolean): MediaStreamConstraints {
  return {
    audio: false,
    video: {
      facingMode: "user",
      width: { ideal: mobile ? 320 : 640 },
      height: { ideal: mobile ? 240 : 480 },
      frameRate: { ideal: 24, max: 30 },
    },
  };
}

/** Map a `getUserMedia` rejection to the state and copy the window shows. */
export function cameraErrorStatus(error: unknown): {
  status: Extract<CameraStatus, "denied" | "unsupported">;
  problem: CameraProblem;
} {
  const name = error && typeof error === "object" && "name" in error ? String(error.name) : "";
  switch (name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
    case "SecurityError":
      return { status: "denied", problem: "permission" };
    case "NotFoundError":
    case "DevicesNotFoundError":
    case "OverconstrainedError":
      return { status: "unsupported", problem: "no-camera" };
    case "NotReadableError":
    case "TrackStartError":
    case "AbortError":
      return { status: "unsupported", problem: "busy" };
    case "TypeError":
      return { status: "unsupported", problem: "no-api" };
    default:
      return { status: "denied", problem: "permission" };
  }
}

/** Stop every track of a stream (the camera light goes off). Safe on null. */
export function stopStream(stream: MediaStream | null | undefined): void {
  stream?.getTracks().forEach((track) => track.stop());
}
