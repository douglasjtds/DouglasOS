import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { PlayingCard, useCardLabel } from "@/components/apps/games/shared/PlayingCard";
import { renderWithIntl } from "@/test/renderWithIntl";
import { MESSAGES } from "@/messages";
import type { Card } from "@/lib/games/cards";

const queen: Card = { id: "hearts-12", suit: "hearts", rank: 12 };

describe("PlayingCard", () => {
  it("draws the face with rank + suit, red for hearts", () => {
    const { container } = renderWithIntl(<PlayingCard card={queen} />);
    const card = container.querySelector("[data-card='hearts-12']")!;
    expect(card).toHaveTextContent("Q");
    expect(card).toHaveTextContent("♥");
    expect(card.className).toContain("text-card-red");
  });

  it("draws the back when face down, without revealing the card", () => {
    const { container } = renderWithIntl(<PlayingCard card={queen} faceDown />);
    expect(container.querySelector("[data-card-back]")).toBeInTheDocument();
    expect(container).not.toHaveTextContent("Q");
  });

  it("names cards in EN and PT", () => {
    const wrap = (locale: "en" | "pt") =>
      function Wrapper({ children }: { children: ReactNode }) {
        return (
          <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}>
            {children}
          </NextIntlClientProvider>
        );
      };
    expect(renderHook(() => useCardLabel(), { wrapper: wrap("en") }).result.current(queen)).toBe("Queen of hearts");
    expect(renderHook(() => useCardLabel(), { wrapper: wrap("pt") }).result.current(queen)).toBe("Dama de copas");
  });
});
