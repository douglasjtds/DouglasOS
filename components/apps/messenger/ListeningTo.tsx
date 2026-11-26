"use client";

import { useTranslations } from "next-intl";
import { usePlaybackStore } from "@/lib/store/playbackStore";
import { NowPlayingIcon } from "@/components/icons/MediaIcons";
import { showMediaPlayer } from "@/components/os/taskbar/MediaTray";

/**
 * The visitor's "what I'm listening to" line in the Messenger (the old
 * messenger personal-message trick): while DouglasOS Media Player is playing,
 * it shows the current track; a click brings the player forward. Hidden when
 * nothing plays (paused, stopped, closed).
 */
export function ListeningTo() {
  const t = useTranslations("messenger.contacts");
  const playing = usePlaybackStore((s) => s.status === "playing");
  const title = usePlaybackStore((s) => s.title);

  if (!playing) return null;

  const text = title ? t("listeningTo", { title }) : t("listeningToUntitled");

  return (
    <button
      type="button"
      data-messenger-listening
      onClick={showMediaPlayer}
      title={t("listeningToAction")}
      aria-label={`${text}. ${t("listeningToAction")}`}
      className="flex max-w-full min-w-0 items-center gap-1 rounded-button text-left text-system text-text-muted italic hover:underline focus-light"
    >
      <NowPlayingIcon size={12} />
      <span className="truncate">{text}</span>
    </button>
  );
}
