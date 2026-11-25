"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AppId } from "@/lib/apps/registry";
import { useWindowStore } from "@/lib/store/windowStore";
import { MOBILE_BREAKPOINT } from "@/lib/store/desktopGrid";
import {
  cameraConstraints,
  cameraErrorStatus,
  hasCameraApi,
  stopStream,
  type CameraProblem,
  type CameraStatus,
  type CameraStopReason,
} from "@/lib/camera/media";

export interface CameraState {
  status: CameraStatus;
  /** Set for "denied" / "unsupported": which copy to show. */
  problem: CameraProblem | null;
  /** Set when the camera was turned off for the visitor (minimize, hidden tab, device gone). */
  stopReason: CameraStopReason | null;
}

const IDLE: CameraState = { status: "idle", problem: null, stopReason: null };

/** Whether `windowId` is out of sight: minimized, or (touch shell) behind another window. */
function windowHidden(windowId: AppId): boolean {
  const { windows, focusedId } = useWindowStore.getState();
  const w = windows[windowId];
  if (!w) return true;
  if (w.minimized) return true;
  const touch = typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT;
  return touch && focusedId !== windowId;
}

/**
 * Camera lifecycle for Retro Cam (stage 9). The camera is requested only from
 * `start()` (an explicit click) and every track is stopped — the camera light
 * goes off — on `stop()`, on unmount (window closed), when the window is
 * minimized or hidden behind another one on a phone, when the tab is hidden,
 * and when the device ends the track. It never restarts by itself.
 */
export function useCamera({ windowId, mobile }: { windowId: AppId; mobile: boolean }) {
  const [state, setState] = useState<CameraState>(IDLE);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // Bumped on every start/stop so a late getUserMedia answer is discarded.
  const requestRef = useRef(0);
  // True while the permission prompt / device start is in flight.
  const pendingRef = useRef(false);

  const release = useCallback(() => {
    requestRef.current++;
    pendingRef.current = false;
    stopStream(streamRef.current);
    streamRef.current = null;
  }, []);

  const stop = useCallback(
    (reason: CameraStopReason | null = null) => {
      const wasOn = streamRef.current !== null || pendingRef.current;
      release();
      setStream(null);
      setState((s) =>
        s.status === "active" || s.status === "requesting"
          ? { status: "idle", problem: null, stopReason: wasOn ? reason : null }
          : s,
      );
    },
    [release],
  );

  const start = useCallback(async () => {
    if (streamRef.current) return;
    if (!hasCameraApi()) {
      setState({ status: "unsupported", problem: "no-api", stopReason: null });
      return;
    }
    if (pendingRef.current) return;
    const request = ++requestRef.current;
    pendingRef.current = true;
    setState({ status: "requesting", problem: null, stopReason: null });
    try {
      const media = await navigator.mediaDevices.getUserMedia(cameraConstraints(mobile));
      if (request !== requestRef.current) {
        // Turned off, closed or hidden while the prompt was up.
        stopStream(media);
        return;
      }
      pendingRef.current = false;
      streamRef.current = media;
      media.getVideoTracks().forEach((track) =>
        track.addEventListener("ended", () => {
          if (streamRef.current === media) stop("ended");
        }),
      );
      setStream(media);
      setState({ status: "active", problem: null, stopReason: null });
    } catch (error) {
      if (request !== requestRef.current) return;
      pendingRef.current = false;
      const { status, problem } = cameraErrorStatus(error);
      setState({ status, problem, stopReason: null });
    }
  }, [mobile, stop]);

  /** Back to idle from denied/unsupported (the dialog's OK keeps the panel; this clears it). */
  const reset = useCallback(() => setState(IDLE), []);

  // Window minimized / hidden behind another window on a phone → off.
  useEffect(
    () =>
      useWindowStore.subscribe(() => {
        if ((streamRef.current || pendingRef.current) && windowHidden(windowId)) stop("minimized");
      }),
    [windowId, stop],
  );

  // Tab hidden (or page being left) → off.
  useEffect(() => {
    const onHidden = () => {
      if (document.visibilityState === "hidden") stop("hidden");
    };
    const onPageHide = () => stop("hidden");
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [stop]);

  // Window closed (unmount) → off.
  useEffect(() => release, [release]);

  return { ...state, stream, start, stop: () => stop(null), reset };
}
