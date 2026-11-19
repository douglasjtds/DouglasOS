import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import pt from "@/messages/pt.json";
import ProjectsApp from "@/components/apps/ProjectsApp";

function renderProjects() {
  return render(
    <NextIntlClientProvider locale="pt" messages={pt}>
      <ProjectsApp />
    </NextIntlClientProvider>,
  );
}

describe("ProjectsApp", () => {
  it("renders every project in order, starting with the landing-page site", () => {
    renderProjects();
    const names = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(names).toEqual(pt.apps.projects.items.map((p) => p.name));
    expect(names[0]).toMatch(/landing pages/i);
    expect(names).not.toContain("DouglasOS");
  });

  it("shows a screenshot only for the prospecting tool, which has no link", () => {
    renderProjects();
    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(1);

    const card = images[0].closest("li")!;
    expect(within(card).getByRole("heading").textContent).toMatch(/prospecção/i);
    expect(within(card).queryByRole("link")).toBeNull();
  });

  it("labels external links with the localized copy", () => {
    renderProjects();
    const [link] = screen.getAllByRole("link", { name: /Ver site/ });
    expect(link).toHaveAttribute("href", "https://douglastertuliano.vercel.app/");
  });
});
