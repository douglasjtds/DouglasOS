"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useShallow } from "zustand/react/shallow";
import { AlertDialog } from "radix-ui";
import { Pause, Play, SkipBack, SkipForward, Square, Volume2, VolumeX } from "lucide-react";
import { usePlaybackStore, type PlaybackStatus } from "@/lib/store/playbackStore";
import { useWindowStore } from "@/lib/store/windowStore";
import { installDanceSync } from "@/lib/media/danceSync";
import { bindMediaSession, updateMediaSession } from "@/lib/media/mediaSession";
import { YOUTUBE_PLAYLIST_ID, youtubePlaylistUrl } from "@/lib/media/source";
import { createYouTubeAdapter, loadYouTubeIframeApi } from "@/lib/media/youtube";
import type { MediaSourceAdapter } from "@/lib/media/types";
import { openLink } from "@/lib/openLink";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { Visualizer } from "@/components/apps/media-player/Visualizer";
import { MessageBox } from "@/components/os/MessageBox";
import { ErrorIcon } from "@/components/icons/SystemIcons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const APP_ID = "media-player" as const;

/** Music is wanted (playing or between tracks): Play becomes Pause. */
function isActive(status: PlaybackStatus): boolean {
  return status === "playing" || status === "buffering";
}

function RoundButton({
  label,
  onClick,
  disabled,
  primary,
  children,
  testId,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  children: ReactNode;
  testId: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      data-media-control={testId}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border border-button-border bg-button-gradient text-text",
        "hover:shadow-button-hover active:bg-button-pressed-gradient focus-light disabled:text-text-disabled disabled:hover:shadow-none",
        primary ? "size-10 max-md:size-12" : "size-8 max-md:size-touch-target",
      )}
    >
      {children}
    </button>
  );
}

/**
 * DouglasOS Media Player (stage 8, DESKTOP-INTERFACE-SPEC → Media Player).
 * An original Luna-style skin around a YouTube IFrame player: the embed is
 * the window's visible "screen" (YouTube's terms require a visible player of
 * at least 200×200 px — never hidden for audio-only), with a "now playing"
 * display, a decorative visualizer, transport controls and volume.
 *
 * The IFrame API script loads only when this window mounts; the playlist is
 * cued, and nothing plays until the visitor presses Play. Minimizing (or, on
 * phones, switching to another full-screen window) pauses, because a hidden
 * player may not keep playing under those terms.
 */
export default function MediaPlayerApp() {
  const t = useTranslations("mediaPlayer");
  const tApps = useTranslations("apps");
  const screenRef = useRef<HTMLDivElement>(null);
  const adapterRef = useRef<MediaSourceAdapter | null>(null);
  const reduced = useReducedMotion();
  const mobile = useIsMobile();
  const { status, title, position, notice, failure, volume, muted } = usePlaybackStore(
    useShallow((s) => ({
      status: s.status,
      title: s.title,
      position: s.position,
      notice: s.notice,
      failure: s.failure,
      volume: s.volume,
      muted: s.muted,
    })),
  );
  const visible = useWindowStore((s) => {
    const w = s.windows[APP_ID];
    return Boolean(w) && !w.minimized && (!mobile || s.focusedId === APP_ID);
  });

  useEffect(() => {
    installDanceSync();
  }, []);

  // Load the API + mount the player when the window opens; tear down on close.
  useEffect(() => {
    const container = screenRef.current;
    if (!container) return;
    let cancelled = false;
    let unsubscribe = () => {};
    usePlaybackStore.getState().startLoading();
    loadYouTubeIframeApi()
      .then((YT) => {
        if (cancelled) return;
        const { volume: v, muted: m } = usePlaybackStore.getState();
        const adapter = createYouTubeAdapter(YT, container, {
          playlistId: YOUTUBE_PLAYLIST_ID,
          volume: v,
          muted: m,
          origin: window.location.origin,
        });
        adapterRef.current = adapter;
        unsubscribe = adapter.onEvent((event) => usePlaybackStore.getState().applySourceEvent(event));
      })
      .catch(() => {
        if (!cancelled) usePlaybackStore.getState().failLoading();
      });
    return () => {
      cancelled = true;
      unsubscribe();
      adapterRef.current?.destroy();
      adapterRef.current = null;
      usePlaybackStore.getState().reset();
    };
  }, []);

  useEffect(() => {
    adapterRef.current?.setVolume(volume);
  }, [volume]);
  useEffect(() => {
    adapterRef.current?.mute(muted);
  }, [muted]);

  // The player must stay visible to play: pause when minimized/hidden.
  useEffect(() => {
    if (visible) return;
    if (!isActive(usePlaybackStore.getState().status)) return;
    usePlaybackStore.getState().pausedWhileHidden();
    adapterRef.current?.pause();
  }, [visible]);

  const play = useCallback(() => adapterRef.current?.play(), []);
  const pause = useCallback(() => adapterRef.current?.pause(), []);
  const stop = useCallback(() => adapterRef.current?.stop(), []);
  const next = useCallback(() => adapterRef.current?.next(), []);
  const prev = useCallback(() => adapterRef.current?.prev(), []);

  useEffect(() => bindMediaSession({ play, pause, stop, next, prev }), [play, pause, stop, next, prev]);
  useEffect(() => {
    updateMediaSession(title, status, tApps(`${APP_ID}.title`));
  }, [title, status, tApps]);

  const active = isActive(status);
  const loaded = status !== "idle" && status !== "loading";
  const statusText = t(`status.${status}`);
  const shownTitle = title ?? (status === "playing" || status === "paused" ? t("untitled") : "—");
  const noticeText = notice ? t(`notices.${notice.kind}`) : null;

  return (
    <div
      data-media-player
      data-status={status}
      className="flex min-h-0 flex-1 flex-col overflow-auto overscroll-contain bg-button-face"
    >
      {/* "Now playing" display */}
      <section
        aria-label={t("nowPlaying")}
        className="mx-1.5 mt-1.5 shrink-0 rounded-button bg-media-display px-2.5 py-1.5 text-media-display-text shadow-bevel-sunken"
      >
        <p className="text-system text-media-display-muted">{t("nowPlaying")}</p>
        <p data-media-title className="truncate text-body font-bold" title={title ?? undefined}>
          {shownTitle}
        </p>
        <p className="flex items-center justify-between gap-2 text-system text-media-display-muted">
          <span role="status" aria-live="polite" data-media-status className="truncate">
            {statusText}
          </span>
          {position && (
            <span className="shrink-0">{t("track", { index: position.index + 1, total: position.total })}</span>
          )}
        </p>
      </section>

      {/* The screen: YouTube's iframe is inserted here (never hidden). */}
      <div className="mx-1.5 mt-1.5 shrink-0 border border-bevel-dark bg-media-screen">
        <div
          ref={screenRef}
          role="region"
          aria-label={t("screenLabel")}
          data-media-screen
          className="relative aspect-video min-h-[200px] w-full min-w-[200px] [&>*]:absolute [&>*]:inset-0 [&>*]:size-full"
        />
      </div>

      {/* Visualizer */}
      <div className="mx-1.5 mt-1.5 h-10 shrink-0 rounded-button bg-media-screen p-1 shadow-bevel-sunken">
        <Visualizer running={status === "playing" && visible} reduced={reduced} label={t("visualizer")} />
      </div>

      {/* Transport + volume */}
      <div
        role="group"
        aria-label={t("controls.label")}
        className="flex shrink-0 flex-wrap items-center gap-1.5 px-1.5 py-2"
      >
        <RoundButton testId="prev" label={t("controls.previous")} onClick={prev} disabled={!loaded}>
          <SkipBack className="size-3.5" aria-hidden />
        </RoundButton>
        <RoundButton
          testId={active ? "pause" : "play"}
          primary
          label={active ? t("controls.pause") : t("controls.play")}
          onClick={active ? pause : play}
          disabled={status === "idle"}
        >
          {active ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
        </RoundButton>
        <RoundButton testId="stop" label={t("controls.stop")} onClick={stop} disabled={!loaded}>
          <Square className="size-3" aria-hidden />
        </RoundButton>
        <RoundButton testId="next" label={t("controls.next")} onClick={next} disabled={!loaded}>
          <SkipForward className="size-3.5" aria-hidden />
        </RoundButton>
        <div className="ml-auto flex items-center gap-1">
          <RoundButton
            testId="mute"
            label={muted ? t("controls.unmute") : t("controls.mute")}
            onClick={() => usePlaybackStore.getState().toggleMute()}
          >
            {muted ? <VolumeX className="size-3.5" aria-hidden /> : <Volume2 className="size-3.5" aria-hidden />}
          </RoundButton>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={volume}
            aria-label={t("controls.volume")}
            aria-valuetext={`${volume}%`}
            data-media-volume
            onChange={(e) => usePlaybackStore.getState().setVolume(Number(e.target.value))}
            className="w-24 accent-highlight focus-light max-md:h-touch-target max-md:w-28"
          />
        </div>
      </div>

      {/* Status bar */}
      <div className="mt-auto flex h-statusbar shrink-0 items-stretch gap-0.5 p-0.5 text-system text-text">
        <span data-media-notice={notice?.kind} className="flex min-w-0 flex-1 items-center px-1.5 shadow-bevel-sunken">
          <span className="truncate">{noticeText ?? t("source")}</span>
        </span>
        <span className="flex items-center px-1.5 shadow-bevel-sunken">
          <Button variant="link" onClick={() => openLink(youtubePlaylistUrl(), true)} className="text-system">
            {t("openOnYouTube")}
          </Button>
        </span>
      </div>

      <MessageBox
        testId="media-error-dialog"
        open={failure !== null}
        onOpenChange={(open) => {
          if (!open) usePlaybackStore.getState().clearFailure();
        }}
        title={t("error.title")}
        icon={<ErrorIcon size={32} />}
        actions={
          <>
            <AlertDialog.Action asChild>
              <Button onClick={() => openLink(youtubePlaylistUrl(), true)}>{t("openOnYouTube")}</Button>
            </AlertDialog.Action>
            <AlertDialog.Cancel asChild>
              <Button variant="primary">{t("error.ok")}</Button>
            </AlertDialog.Cancel>
          </>
        }
      >
        {failure ? t(`error.${failure}`) : null}
      </MessageBox>
    </div>
  );
}
