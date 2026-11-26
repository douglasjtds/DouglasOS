"use client";

import { useTranslations } from "next-intl";
import { Popover } from "radix-ui";
import { launch } from "@/lib/apps/launch";
import { usePlaybackStore } from "@/lib/store/playbackStore";
import { useWindowStore } from "@/lib/store/windowStore";
import { useIsMobile } from "@/hooks/useIsMobile";
import { NowPlayingIcon, VolumeIcon } from "@/components/icons/MediaIcons";
import { Tooltip } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { menuSurfaceClass } from "@/components/os/menuStyles";
import { cn } from "@/lib/utils";

const trayButton =
  "relative flex size-task-button items-center justify-center rounded-button hover:bg-task-button-hover focus-inverse max-md:size-touch-target";

/** Bring DouglasOS Media Player forward (also used by the Messenger "listening to" line). */
export function showMediaPlayer() {
  launch("media-player");
  requestAnimationFrame(() =>
    document.querySelector<HTMLElement>('[data-window="media-player"]')?.focus({ preventScroll: true }),
  );
}

/**
 * Tray icons of DouglasOS Media Player (DESKTOP-INTERFACE-SPEC §4): a
 * "now playing" note while music plays (click focuses the player) and a
 * volume control while the player is open (slider + mute, persisted).
 * Phones get a single 44px button — the note while playing, the speaker
 * otherwise — whose panel also has "Show player", so the tray stays narrow.
 */
export function MediaTray() {
  const t = useTranslations("mediaPlayer.tray");
  const tControls = useTranslations("mediaPlayer.controls");
  const mobile = useIsMobile();
  const open = useWindowStore((s) => Boolean(s.windows["media-player"]));
  const playing = usePlaybackStore((s) => s.status === "playing");
  const title = usePlaybackStore((s) => s.title);
  const volume = usePlaybackStore((s) => s.volume);
  const muted = usePlaybackStore((s) => s.muted);

  if (!open) return null;

  const nowPlayingLabel = title ? t("nowPlaying", { title }) : t("nowPlayingUntitled");
  const volumeLabel = muted ? t("muted") : t("volume", { level: volume });

  const panel = (
    <Popover.Portal>
      <Popover.Content
        data-media-volume-panel
        side="top"
        align="end"
        sideOffset={4}
        aria-label={t("panel")}
        className={cn(menuSurfaceClass, "z-1200 flex w-44 flex-col gap-2 p-2 outline-none")}
      >
        <label className="flex flex-col gap-1">
          <span>{tControls("volume")}</span>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={volume}
            aria-valuetext={`${volume}%`}
            onChange={(e) => usePlaybackStore.getState().setVolume(Number(e.target.value))}
            className="accent-highlight focus-light max-md:h-touch-target"
          />
        </label>
        <label className="flex items-center gap-1.5 max-md:min-h-touch-target">
          <input
            type="checkbox"
            checked={muted}
            onChange={(e) => usePlaybackStore.getState().setMuted(e.target.checked)}
            className="accent-highlight focus-light"
          />
          {tControls("mute")}
        </label>
        {mobile && (
          <Popover.Close asChild>
            <Button onClick={showMediaPlayer}>{t("showPlayer")}</Button>
          </Popover.Close>
        )}
      </Popover.Content>
    </Popover.Portal>
  );

  if (mobile) {
    return (
      <Popover.Root>
        <Popover.Trigger asChild>
          <button
            type="button"
            aria-label={playing ? `${nowPlayingLabel}. ${volumeLabel}` : volumeLabel}
            data-tray-volume
            data-tray-now-playing={playing || undefined}
            className={trayButton}
          >
            {playing ? <NowPlayingIcon size={16} /> : <VolumeIcon size={16} muted={muted} />}
          </button>
        </Popover.Trigger>
        {panel}
      </Popover.Root>
    );
  }

  return (
    <>
      {playing && (
        <Tooltip content={nowPlayingLabel}>
          <button
            type="button"
            aria-label={nowPlayingLabel}
            data-tray-now-playing
            onClick={showMediaPlayer}
            className={trayButton}
          >
            <NowPlayingIcon size={16} />
          </button>
        </Tooltip>
      )}
      <Popover.Root>
        <Tooltip content={volumeLabel}>
          <Popover.Trigger asChild>
            <button type="button" aria-label={volumeLabel} data-tray-volume className={trayButton}>
              <VolumeIcon size={16} muted={muted} />
            </button>
          </Popover.Trigger>
        </Tooltip>
        {panel}
      </Popover.Root>
    </>
  );
}
