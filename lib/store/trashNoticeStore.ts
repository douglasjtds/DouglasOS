import { create } from "zustand";
import type { AssistantMessage } from "@/lib/assistant/script";
import { useAssistantStore } from "@/lib/store/assistantStore";

/**
 * Where a Recycle Bin rescue line goes (stage 6).
 *
 * The joke reacts to something the visitor just did, so it must land even
 * when mini Douglas was dismissed ("Not now") — but "Not now" also means he
 * stays gone (and his chunk unloaded) for the session. So:
 * - assistant available → `replace()` puts the line in his bubble right away
 *   (it's a direct reaction, so it takes the bubble over whatever was there);
 * - assistant dismissed → the Recycle Bin itself shows the same line in a
 *   balloon (this store + `components/os/desktop/TrashNotice.tsx`), through
 *   the shared balloon slot. The character never comes back uninvited.
 */
interface TrashNoticeState {
  /** The line on show (null = none). */
  notice: AssistantMessage | null;
  /** Bumped on every new notice, so a repeat of the same line restarts its timer. */
  seq: number;
  show: (message: AssistantMessage) => void;
  close: () => void;
}

export const useTrashNoticeStore = create<TrashNoticeState>()((set) => ({
  notice: null,
  seq: 0,
  show: (message) => set((s) => ({ notice: message, seq: s.seq + 1 })),
  close: () => set({ notice: null }),
}));

/** Deliver a rescue line to mini Douglas, or to the bin's own balloon. */
export function announceRescue(message: AssistantMessage): "assistant" | "notice" {
  const assistant = useAssistantStore.getState();
  if (!assistant.dismissed) {
    assistant.replace(message);
    return "assistant";
  }
  useTrashNoticeStore.getState().show(message);
  return "notice";
}
