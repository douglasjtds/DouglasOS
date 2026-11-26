import { describe, expect, it, vi } from "vitest";
import { cameraConstraints, cameraErrorStatus, hasCameraApi, stopStream } from "@/lib/camera/media";

describe("Retro Cam media helpers", () => {
  it("asks for the front camera, video only, smaller on phones", () => {
    const desktop = cameraConstraints(false);
    const phone = cameraConstraints(true);
    expect(desktop.audio).toBe(false);
    expect(desktop.video).toMatchObject({ facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } });
    expect(phone.video).toMatchObject({ facingMode: "user", width: { ideal: 320 }, height: { ideal: 240 } });
  });

  it("maps getUserMedia errors to denied / unsupported", () => {
    const err = (name: string) => Object.assign(new Error(name), { name });
    expect(cameraErrorStatus(err("NotAllowedError"))).toEqual({ status: "denied", problem: "permission" });
    expect(cameraErrorStatus(err("SecurityError"))).toEqual({ status: "denied", problem: "permission" });
    expect(cameraErrorStatus(err("NotFoundError"))).toEqual({ status: "unsupported", problem: "no-camera" });
    expect(cameraErrorStatus(err("NotReadableError"))).toEqual({ status: "unsupported", problem: "busy" });
    expect(cameraErrorStatus(err("TypeError"))).toEqual({ status: "unsupported", problem: "no-api" });
    expect(cameraErrorStatus("weird")).toEqual({ status: "denied", problem: "permission" });
  });

  it("detects the API", () => {
    expect(hasCameraApi({ mediaDevices: { getUserMedia: () => {} } } as unknown as Navigator)).toBe(true);
    expect(hasCameraApi({} as Navigator)).toBe(false);
    expect(hasCameraApi(undefined)).toBe(false);
  });

  it("stops every track", () => {
    const tracks = [{ stop: vi.fn() }, { stop: vi.fn() }];
    stopStream({ getTracks: () => tracks } as unknown as MediaStream);
    for (const track of tracks) expect(track.stop).toHaveBeenCalledOnce();
    expect(() => stopStream(null)).not.toThrow();
  });
});
