/**
 * Message catalogs per locale. Each game (stage 12) keeps its own strings in
 * `messages/games/<id>.<locale>.json`; they are mounted under `games.<id>` so a
 * game reads them with `useTranslations("games.<id>")` and never edits the
 * shared catalogs (titles and descriptions stay in `apps.<id>`).
 */
import en from "./en.json";
import pt from "./pt.json";
import minesEn from "./games/mines.en.json";
import minesPt from "./games/mines.pt.json";
import solitaireEn from "./games/solitaire.en.json";
import solitairePt from "./games/solitaire.pt.json";
import freecellEn from "./games/freecell.en.json";
import freecellPt from "./games/freecell.pt.json";
import heartsEn from "./games/hearts.en.json";
import heartsPt from "./games/hearts.pt.json";
import spiderEn from "./games/spider.en.json";
import spiderPt from "./games/spider.pt.json";
import pinballEn from "./games/pinball.en.json";
import pinballPt from "./games/pinball.pt.json";

export const MESSAGES = {
  en: {
    ...en,
    games: {
      mines: minesEn,
      solitaire: solitaireEn,
      freecell: freecellEn,
      hearts: heartsEn,
      spider: spiderEn,
      pinball: pinballEn,
    },
  },
  pt: {
    ...pt,
    games: {
      mines: minesPt,
      solitaire: solitairePt,
      freecell: freecellPt,
      hearts: heartsPt,
      spider: spiderPt,
      pinball: pinballPt,
    },
  },
} as const;

export type MessageLocale = keyof typeof MESSAGES;
