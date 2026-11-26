import { PROJECTS } from "@/lib/content/projects";

/**
 * Offline intent matcher (DESKTOP-INTERFACE-SPEC §13 → Search): turns a free
 * text question into one of a few portfolio intents. Pure, UI-agnostic and
 * network-free — shared by the mini Douglas assistant (stage 5), the
 * DouglasOS Messenger (stage 5b) and Run / the command palette (stage 7).
 *
 * How it works:
 * 1. `normalizeText` lowercases, strips accents and punctuation, and rewrites
 *    a few tech spellings (`C#` → `csharp`, `.NET` → `dotnet`).
 * 2. Each intent has EN + PT keywords. A keyword is a single word, a stem
 *    ending in `*` (prefix match: `contrat*` → contratar, contratação) or a
 *    multi-word phrase. Every matched keyword adds its weight to the intent.
 * 3. A project name, slug or alias anywhere in the text (`gasolinha`, "the
 *    wedding post") adds a strong vote for `projects` and sets `projectSlug`.
 * 4. Highest score wins; ties go to the earlier intent in `INTENT_IDS`
 *    (CV and Contact first: the golden rule). Nothing matched → fallback.
 */

/** Every intent, in tie-break priority order. */
export const INTENT_IDS = [
  "cv",
  "contact",
  "projects",
  "skills",
  "availability",
  "ai-workflow",
  "experience",
  "about",
] as const;

export type IntentId = (typeof INTENT_IDS)[number];

/** A recognized intent. `score` is the sum of matched keyword weights (≥ 1). */
export interface IntentMatch {
  intent: IntentId;
  score: number;
  /** Set when the text named a specific project (only with `projects`). */
  projectSlug?: string;
}

/** Nothing matched: the caller should offer `suggestions` instead. */
export interface IntentFallback {
  intent: "fallback";
  score: 0;
  suggestions: readonly IntentId[];
}

export type IntentResult = IntentMatch | IntentFallback;

/** What to suggest when nothing matches (recruiter-first order). */
export const FALLBACK_SUGGESTIONS: readonly IntentId[] = ["projects", "cv", "contact"];

/** Score a project mention adds to `projects`. */
const PROJECT_MENTION_WEIGHT = 3;
/** Longest project name, in words, looked up as an n-gram. */
const MAX_NGRAM = 4;

/** `[keyword, weight]`; a bare string has weight 1. */
type Keyword = string | readonly [string, number];

/**
 * Keywords per intent, already normalized (lowercase, no accents). EN and PT
 * share one list: the visitor may mix languages.
 */
const KEYWORDS: Record<IntentId, readonly Keyword[]> = {
  cv: [
    ["cv", 3], ["curriculo", 3], ["curriculum", 3], ["resume", 3], ["vitae", 2],
    ["pdf", 2], "download", "baixar", "baixa", ["resume pdf", 1],
  ],
  contact: [
    ["contact*", 3], ["contat*", 3], ["hire", 3], ["hiring", 3], ["contrat*", 3],
    ["recruit*", 2], ["recrut*", 2], ["email", 2], ["e mail", 2], ["whatsapp", 2], ["zap", 2],
    ["linkedin", 2], "mail", "talk", "falar", "fala", "convers*", "chat", "message",
    "mensagem", "reach", "call", "ligar", "phone", "telefone", "interview*", "entrevist*",
    ["get in touch", 3], ["entrar em contato", 3], ["fale comigo", 3],
  ],
  projects: [
    ["project*", 3], ["projeto*", 3], ["portfolio", 2], ["case stud*", 2], ["estudo* de caso", 2],
    "cases", "trabalhos", "app", "apps", "site", "sites", "demo", "github", "repo*",
    "codigo", "code", "built", "build", "construiu", "criou", "fez",
  ],
  skills: [
    ["stack", 3], ["skill*", 3], ["habilidade*", 3], ["tecnologia*", 3], ["technolog*", 3],
    ["tech", 2], ["linguage*", 2], ["language*", 2], ["framework*", 2], "ferramenta*", "tools",
    "dotnet", "csharp", "node", "nodejs", "react", "typescript", "javascript", "aws",
    "backend", "frontend", "fullstack", "know", "sabe", "conhecimento*",
  ],
  availability: [
    ["remot*", 3], ["disponib*", 3], ["availab*", 3], ["disponivel", 3], ["relocat*", 3],
    ["where", 2], ["onde", 2], ["location", 2], ["localizacao", 2], ["based", 2], ["mora", 2],
    "live", "lives", "city", "cidade", "brazil", "brasil", "country", "pais", "timezone",
    "fuso", "horario", "presencial", "onsite", "hybrid", "hibrido", "freelanc*",
    ["open to", 2], ["aberto a", 2], ["home office", 3],
  ],
  "ai-workflow": [
    ["ai", 3], ["ia", 3], ["inteligencia artificial", 3], ["artificial intelligence", 3],
    ["ai first", 3], ["llm*", 3], ["claude", 3], ["copilot", 3], ["chatgpt", 3], ["gpt", 2],
    ["prompt*", 2], ["agent*", 2], ["agente*", 2], ["workflow", 2], ["fluxo", 2], "vibe",
  ],
  experience: [
    ["experienc*", 3], ["experiencia", 3], ["career", 3], ["carreira", 3], ["trajetoria", 3],
    ["job*", 2], ["emprego*", 2], ["worked", 2], ["trabalhou", 2], ["empresa*", 2], ["compan*", 2],
    "serasa", "experian", "clearsale", "zup", "dti", "rumo", "years", "anos", "senior*",
  ],
  about: [
    ["about", 2], ["sobre", 2], ["who", 2], ["quem", 2], ["bio", 2], ["yourself", 2],
    "voce", "hobby", "hobbies", "introduce", "apresenta*",
  ],
};

/**
 * Lowercase, strip accents, rewrite tech spellings and turn any run of
 * non-alphanumerics into a single space. `"Currículo  (PDF)?"` → `"curriculo pdf"`.
 */
export function normalizeText(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/c#/g, " csharp ")
    .replace(/\.net\b/g, " dotnet ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Normalized words of the input. */
export function tokenize(input: string): string[] {
  const normalized = normalizeText(input);
  return normalized ? normalized.split(" ") : [];
}

interface CompiledKeyword {
  weight: number;
  matches: (tokens: string[], padded: string) => boolean;
}

function compileKeyword(keyword: Keyword): CompiledKeyword {
  const [raw, weight] = typeof keyword === "string" ? [keyword, 1] : keyword;
  const prefix = raw.endsWith("*");
  const term = prefix ? raw.slice(0, -1) : raw;
  if (term.includes(" ")) {
    // Phrase: whole words, in order; a `*` stems only the last word.
    const pattern = new RegExp(` ${term}${prefix ? "[a-z0-9]*" : ""} `);
    return { weight, matches: (_tokens, padded) => pattern.test(padded) };
  }
  return {
    weight,
    matches: prefix
      ? (tokens) => tokens.some((t) => t.startsWith(term))
      : (tokens) => tokens.includes(term),
  };
}

const COMPILED = INTENT_IDS.map((intent) => ({
  intent,
  keywords: KEYWORDS[intent].map(compileKeyword),
}));

/** Plain keyword terms, so a generic alias ("portfolio") stays a keyword. */
const KEYWORD_TERMS = new Set(
  Object.values(KEYWORDS).flatMap((list) =>
    list.map((k) => (typeof k === "string" ? k : k[0]).replace(/\*$/, "").replace(/ /g, "")),
  ),
);

/**
 * Project key (letters/digits only) → slug, from slugs, brand names and
 * aliases. Aliases that are also intent keywords are skipped: "show me your
 * portfolio" asks for the project list, not for the DouglasOS case study.
 */
const PROJECT_BY_KEY = new Map<string, string>();
for (const project of PROJECTS) {
  for (const name of [project.slug, project.name, ...project.aliases]) {
    const key = normalizeText(name).replace(/ /g, "");
    if (name !== project.slug && name !== project.name && KEYWORD_TERMS.has(key)) continue;
    PROJECT_BY_KEY.set(key, project.slug);
  }
}

/** The first project named in the text (any 1–4 word span), if any. */
export function findProjectSlug(tokens: string[]): string | undefined {
  for (let size = Math.min(MAX_NGRAM, tokens.length); size >= 1; size--) {
    for (let start = 0; start + size <= tokens.length; start++) {
      const slug = PROJECT_BY_KEY.get(tokens.slice(start, start + size).join(""));
      if (slug) return slug;
    }
  }
  return undefined;
}

/** Every intent with a positive score, best first (ties: `INTENT_IDS` order). */
export function rankIntents(input: string): IntentMatch[] {
  const tokens = tokenize(input);
  if (tokens.length === 0) return [];
  const padded = ` ${tokens.join(" ")} `;
  const projectSlug = findProjectSlug(tokens);

  const ranked: IntentMatch[] = [];
  for (const { intent, keywords } of COMPILED) {
    let score = 0;
    for (const keyword of keywords) {
      if (keyword.matches(tokens, padded)) score += keyword.weight;
    }
    if (intent === "projects" && projectSlug) score += PROJECT_MENTION_WEIGHT;
    if (score <= 0) continue;
    ranked.push(
      intent === "projects" && projectSlug ? { intent, score, projectSlug } : { intent, score },
    );
  }
  // Array.prototype.sort is stable, so equal scores keep INTENT_IDS order.
  return ranked.sort((a, b) => b.score - a.score);
}

/** Best intent for the text, or a fallback with suggestions. */
export function matchIntent(input: string): IntentResult {
  const [best] = rankIntents(input);
  return best ?? { intent: "fallback", score: 0, suggestions: FALLBACK_SUGGESTIONS };
}

export function isFallback(result: IntentResult): result is IntentFallback {
  return result.intent === "fallback";
}
