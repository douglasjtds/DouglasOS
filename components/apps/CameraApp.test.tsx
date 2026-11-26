import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "@/test/renderWithIntl";
import CameraApp from "@/components/apps/CameraApp";
import { Z_BASE, useWindowStore } from "@/lib/store/windowStore";

/** A fake camera stream whose tracks record `stop()`. */
function fakeStream() {
  const listeners: Record<string, () => void> = {};
  const track = {
    kind: "video",
    stop: vi.fn(),
    addEventListener: (type: string, fn: () => void) => {
      listeners[type] = fn;
    },
  };
  const stream = {
    getTracks: () => [track],
    getVideoTracks: () => [track],
  } as unknown as MediaStream;
  return { stream, track, end: () => listeners.ended?.() };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const getUserMedia = vi.fn();

function installCamera() {
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia },
  });
}

function setVisibility(state: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", { configurable: true, value: state });
  document.dispatchEvent(new Event("visibilitychange"));
}

const status = () => document.querySelector("[data-camera-app]")?.getAttribute("data-camera-status");

async function turnOn(media: MediaStream) {
  getUserMedia.mockResolvedValueOnce(media);
  await userEvent.click(screen.getByRole("button", { name: "Turn on camera" }));
  await waitFor(() => expect(status()).toBe("active"));
}

describe("CameraApp (Retro Cam)", () => {
  beforeEach(() => {
    getUserMedia.mockReset();
    installCamera();
    // jsdom has no canvas: the render loop just idles.
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    useWindowStore.setState({ windows: {}, order: [], focusedId: null, topZ: Z_BASE, openCount: 0 });
    useWindowStore.getState().openWindow("camera");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    setVisibility("visible");
  });

  it("starts idle and never asks for the camera before a click", () => {
    renderWithIntl(<CameraApp />);
    expect(status()).toBe("idle");
    expect(getUserMedia).not.toHaveBeenCalled();
    expect(screen.getByText(/never uploaded/)).toBeInTheDocument();
    expect(document.querySelector("[data-camera-privacy]")).toHaveTextContent("local processing · no upload");
    expect(screen.getByRole("button", { name: "Save photo" })).toBeDisabled();
  });

  it("click → requesting → active with the front camera, video only", async () => {
    const pending = deferred<MediaStream>();
    getUserMedia.mockReturnValueOnce(pending.promise);
    renderWithIntl(<CameraApp />);
    await userEvent.click(screen.getByRole("button", { name: "Turn on camera" }));
    expect(status()).toBe("requesting");
    expect(screen.getByText("Waiting for permission…")).toBeInTheDocument();
    expect(getUserMedia).toHaveBeenCalledWith(
      expect.objectContaining({ audio: false, video: expect.objectContaining({ facingMode: "user" }) }),
    );

    const { stream } = fakeStream();
    await act(async () => pending.resolve(stream));
    expect(status()).toBe("active");
    expect(screen.getByRole("button", { name: "Turn off" })).toHaveAttribute("aria-pressed", "true");
    expect(document.querySelector("[data-camera-status-text]")).toHaveTextContent("Camera on");
    expect(document.querySelector("[data-camera-privacy]")).toHaveTextContent(/local processing · \d+ FPS · no upload/);
  });

  it("Turn off stops every track", async () => {
    const { stream, track } = fakeStream();
    renderWithIntl(<CameraApp />);
    await turnOn(stream);
    await userEvent.click(screen.getByRole("button", { name: "Turn off" }));
    expect(track.stop).toHaveBeenCalled();
    expect(status()).toBe("idle");
  });

  it("closing the window (unmount) stops the tracks", async () => {
    const { stream, track } = fakeStream();
    const { unmount } = renderWithIntl(<CameraApp />);
    await turnOn(stream);
    unmount();
    expect(track.stop).toHaveBeenCalled();
  });

  it("minimizing the window stops the camera and says why; restoring doesn't restart it", async () => {
    const { stream, track } = fakeStream();
    renderWithIntl(<CameraApp />);
    await turnOn(stream);
    act(() => useWindowStore.getState().minimizeWindow("camera"));
    expect(track.stop).toHaveBeenCalled();
    expect(status()).toBe("idle");
    expect(screen.getByText("The camera turned off when the window was minimized.")).toBeInTheDocument();
    act(() => useWindowStore.getState().restoreWindow("camera"));
    expect(getUserMedia).toHaveBeenCalledTimes(1);
    expect(status()).toBe("idle");
  });

  it("hiding the tab stops the camera", async () => {
    const { stream, track } = fakeStream();
    renderWithIntl(<CameraApp />);
    await turnOn(stream);
    act(() => setVisibility("hidden"));
    expect(track.stop).toHaveBeenCalled();
    expect(screen.getByText("The camera turned off when you left the tab.")).toBeInTheDocument();
  });

  it("on a phone, another window in front stops the camera", async () => {
    window.innerWidth = 390;
    const { stream, track } = fakeStream();
    renderWithIntl(<CameraApp />);
    await turnOn(stream);
    act(() => useWindowStore.getState().openWindow("contact"));
    expect(track.stop).toHaveBeenCalled();
    expect(status()).toBe("idle");
  });

  it("a stream that arrives after Turn off / minimize is stopped at once", async () => {
    const pending = deferred<MediaStream>();
    getUserMedia.mockReturnValueOnce(pending.promise);
    renderWithIntl(<CameraApp />);
    await userEvent.click(screen.getByRole("button", { name: "Turn on camera" }));
    act(() => useWindowStore.getState().minimizeWindow("camera"));
    const { stream, track } = fakeStream();
    await act(async () => pending.resolve(stream));
    expect(track.stop).toHaveBeenCalled();
    expect(status()).toBe("idle");
  });

  it("the device ending the track turns the camera off", async () => {
    const { stream, end } = fakeStream();
    renderWithIntl(<CameraApp />);
    await turnOn(stream);
    act(() => end());
    expect(status()).toBe("idle");
    expect(screen.getByText("The camera was disconnected.")).toBeInTheDocument();
  });

  it("permission denied shows the XP warning dialog; Try again asks again", async () => {
    getUserMedia.mockRejectedValueOnce(Object.assign(new Error("no"), { name: "NotAllowedError" }));
    renderWithIntl(<CameraApp />);
    await userEvent.click(screen.getByRole("button", { name: "Turn on camera" }));
    const dialog = await screen.findByRole("alertdialog", { name: "Retro Cam" });
    expect(dialog).toHaveTextContent("Camera blocked");
    expect(status()).toBe("denied");

    await userEvent.click(screen.getByRole("button", { name: "OK" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    // The panel keeps the explanation and a retry.
    const { stream } = fakeStream();
    getUserMedia.mockResolvedValueOnce(stream);
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(status()).toBe("active"));
    expect(getUserMedia).toHaveBeenCalledTimes(2);
  });

  it("no camera API → unsupported, without a retry", async () => {
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: undefined });
    renderWithIntl(<CameraApp />);
    await userEvent.click(screen.getByRole("button", { name: "Turn on camera" }));
    const dialog = await screen.findByRole("alertdialog", { name: "Retro Cam" });
    expect(dialog).toHaveTextContent("No camera available");
    expect(status()).toBe("unsupported");
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
  });

  it("mirror is on by default and toggles; palette and pixel size are selectable", async () => {
    renderWithIntl(<CameraApp />);
    const mirror = screen.getByRole("button", { name: "Mirror" });
    expect(mirror).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(mirror);
    expect(mirror).toHaveAttribute("aria-pressed", "false");
    await userEvent.selectOptions(screen.getByLabelText("Palette:"), "CGA style");
    expect(screen.getByLabelText("Palette:")).toHaveValue("cga");
    await userEvent.selectOptions(screen.getByLabelText("Pixels:"), "Large");
    expect(screen.getByLabelText("Pixels:")).toHaveValue("large");
  });
});
