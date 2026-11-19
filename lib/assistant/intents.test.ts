import { describe, expect, it } from "vitest";
import {
  FALLBACK_SUGGESTIONS,
  INTENT_IDS,
  findProjectSlug,
  isFallback,
  matchIntent,
  normalizeText,
  rankIntents,
  tokenize,
} from "@/lib/assistant/intents";

describe("normalizeText", () => {
  it("lowercases, strips accents and punctuation", () => {
    expect(normalizeText("  Currículo  (PDF)?! ")).toBe("curriculo pdf");
    expect(normalizeText("Você trabalha REMOTO?")).toBe("voce trabalha remoto");
    expect(normalizeText("Inteligência artificial")).toBe("inteligencia artificial");
  });

  it("rewrites tech spellings before dropping punctuation", () => {
    expect(normalizeText("C# and .NET")).toBe("csharp and dotnet");
  });

  it("tokenizes empty input to nothing", () => {
    expect(tokenize("   ?! ")).toEqual([]);
  });
});

describe("matchIntent", () => {
  const cases: [string, string][] = [
    // EN
    ["Can I download your resume?", "cv"],
    ["cv", "cv"],
    ["How do I contact you?", "contact"],
    ["We'd like to hire you", "contact"],
    ["show me your projects", "projects"],
    ["what's your stack?", "skills"],
    ["Do you know React and Node?", "skills"],
    ["are you open to remote work?", "availability"],
    ["where are you based", "availability"],
    ["how do you use AI in your workflow", "ai-workflow"],
    ["tell me about your career", "experience"],
    ["who are you?", "about"],
    // PT, with and without accents
    ["quero baixar seu currículo", "cv"],
    ["quero baixar seu curriculo", "cv"],
    ["como faço pra entrar em contato?", "contact"],
    ["vocês estão contratando? quero te contratar", "contact"],
    ["me mostra seus projetos", "projects"],
    ["quais tecnologias você usa?", "skills"],
    ["Você trabalha remoto? Qual sua disponibilidade?", "availability"],
    ["onde você mora", "availability"],
    ["como você usa inteligência artificial", "ai-workflow"],
    ["qual sua experiência?", "experience"],
    ["quem é você", "about"],
  ];

  for (const [input, intent] of cases) {
    it(`"${input}" → ${intent}`, () => {
      expect(matchIntent(input).intent).toBe(intent);
    });
  }

  it("names a project by slug, brand name or alias", () => {
    expect(matchIntent("gasolinha")).toEqual(
      expect.objectContaining({ intent: "projects", projectSlug: "gasolinha" }),
    );
    expect(matchIntent("tell me about The Wedding Post")).toEqual(
      expect.objectContaining({ intent: "projects", projectSlug: "the-wedding-post" }),
    );
    expect(matchIntent("e esse site, o DouglasOS?")).toEqual(
      expect.objectContaining({ intent: "projects", projectSlug: "douglasos" }),
    );
  });

  it("keeps generic aliases as keywords (portfolio → project list, no slug)", () => {
    const result = matchIntent("show me your portfolio");
    expect(result.intent).toBe("projects");
    expect("projectSlug" in result).toBe(false);
  });

  it("breaks ties in favor of the golden-rule intents", () => {
    // "contato" (contact, 3) vs "cv" (cv, 3): CV comes first in INTENT_IDS.
    expect(matchIntent("cv ou contato").intent).toBe("cv");
  });

  it("returns a scored match", () => {
    const result = matchIntent("download cv pdf");
    expect(isFallback(result)).toBe(false);
    expect(result.score).toBeGreaterThanOrEqual(5);
  });

  it("falls back with suggestions when nothing matches", () => {
    for (const input of ["", "   ", "banana split", "qwerty"]) {
      const result = matchIntent(input);
      expect(isFallback(result)).toBe(true);
      expect(result).toEqual({ intent: "fallback", score: 0, suggestions: FALLBACK_SUGGESTIONS });
    }
  });

  it("only suggests real intents", () => {
    for (const id of FALLBACK_SUGGESTIONS) expect(INTENT_IDS).toContain(id);
  });
});

describe("rankIntents", () => {
  it("orders every positive intent best-first", () => {
    const ranked = rankIntents("remote job, CV and your stack");
    expect(ranked.length).toBeGreaterThan(2);
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1].score).toBeGreaterThanOrEqual(ranked[i].score);
    }
  });

  it("matches stems by prefix but not inside words", () => {
    expect(rankIntents("contratação").map((m) => m.intent)).toContain("contact");
    // "ai" is a whole-word keyword: "said" or "maior" must not match it.
    expect(rankIntents("he said it was maior").map((m) => m.intent)).not.toContain("ai-workflow");
  });
});

describe("findProjectSlug", () => {
  it("looks up multi-word names as n-grams", () => {
    expect(findProjectSlug(tokenize("the wedding post"))).toBe("the-wedding-post");
    expect(findProjectSlug(tokenize("nothing here"))).toBeUndefined();
  });
});
