import type { ShellAction } from "@/lib/assistant/actions";
import type { AssistantMessage } from "@/lib/assistant/script";
import type { EasterEggId } from "@/lib/easterEgg";

/**
 * mini Douglas's comment after a "DON'T OPEN THIS.exe" egg is dismissed
 * (stage 10). Pure; copy in `messages/*.json` → `easterEgg.assistant.*`.
 * Sent with `say()`, which does nothing after "Not now": the egg never brings
 * the assistant back.
 */
export const EASTER_EGG_MESSAGE_ID = "dont-open-this";

const CV: ShellAction = { kind: "downloadCv" };
const CONTACT: ShellAction = { kind: "openApp", app: "contact" };

/** Shortcuts per egg: CV and Contact always, ordered by the egg's punchline. */
const ACTIONS: Record<EasterEggId, readonly ShellAction[]> = {
  "not-found": [CV, CONTACT],
  scramble: [CV, CONTACT],
  "access-denied": [CONTACT, CV],
};

export function easterEggMessage(egg: EasterEggId): AssistantMessage {
  return {
    id: EASTER_EGG_MESSAGE_ID,
    titleKey: `easterEgg.assistant.${egg}.title`,
    textKey: `easterEgg.assistant.${egg}.text`,
    actions: ACTIONS[egg],
  };
}
