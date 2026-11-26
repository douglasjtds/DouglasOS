import type { AssistantMessage } from "@/lib/assistant/script";
import { useAssistantStore } from "@/lib/store/assistantStore";

/**
 * The "all eggs found" reward (stage 11): a special mini Douglas line that
 * offers the CV again (plus Display Properties, where the secret wallpaper
 * just unlocked, and Contact). Not automatic: it stays until closed.
 */
export function completionMessage(): AssistantMessage {
  return {
    id: "eggsComplete",
    titleKey: "assistant.messages.eggsComplete.title",
    textKey: "assistant.messages.eggsComplete.text",
    actions: [{ kind: "downloadCv" }, { kind: "openApp", app: "display" }, { kind: "openApp", app: "contact" }],
  };
}

/**
 * Deliver the reward line: to mini Douglas when he's around (`say()`, he
 * takes the balloon slot in turn), or — when he was dismissed this session —
 * report `"balloon"` so the easter-egg toast shows the same line itself. The
 * character never comes back uninvited (same rule as the Recycle Bin).
 */
export function deliverCompletionReward(): "assistant" | "balloon" {
  const assistant = useAssistantStore.getState();
  if (assistant.dismissed) return "balloon";
  assistant.say(completionMessage());
  return "assistant";
}
