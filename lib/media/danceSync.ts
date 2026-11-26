import { useAssistantStore } from "@/lib/store/assistantStore";
import { usePlaybackStore, type PlaybackStatus } from "@/lib/store/playbackStore";
import { useEasterEggStore } from "@/lib/store/easterEggStore";

/**
 * mini Douglas dances while the music plays (stage 8). Pure decision: start
 * on `playing`; keep going through buffering (track changes, skips); stop on
 * anything else (paused, stopped, ended, error, window closed). Stopping says
 * the after-dance line ("Phew!… want to see a project?") through the
 * assistant's own queue, so his dismissal and the single balloon slot are
 * respected by construction.
 */
export function danceCommand(dancing: boolean, status: PlaybackStatus): "dance" | "stop" | null {
  if (status === "playing") return dancing ? null : "dance";
  if (status === "buffering" || status === "loading") return null;
  return dancing ? "stop" : null;
}

let uninstall: (() => void) | null = null;

/**
 * Subscribe the assistant to the playback store (idempotent). Called by the
 * player window; stays installed so the "window closed" transition still
 * stops the dance.
 */
export function installDanceSync(): () => void {
  if (uninstall) return uninstall;
  let dancing = false;
  const unsubscribe = usePlaybackStore.subscribe((state, previous) => {
    if (state.status === previous.status) return;
    const command = danceCommand(dancing, state.status);
    if (command === "dance") {
      dancing = true;
      useAssistantStore.getState().dance();
      // Easter egg (stage 11): mini Douglas dancing to the player — only when
      // he actually dances (a dismissed assistant stays away).
      if (useAssistantStore.getState().state === "dancing") {
        useEasterEggStore.getState().discover("music-dance");
      }
    } else if (command === "stop") {
      dancing = false;
      useAssistantStore.getState().stopDance();
    }
  });
  uninstall = () => {
    unsubscribe();
    uninstall = null;
  };
  return uninstall;
}
