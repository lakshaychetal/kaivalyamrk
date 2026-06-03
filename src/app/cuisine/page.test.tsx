/**
 * Unit tests for the Cuisine page (task 11.5).
 * --------------------------------------------
 * Feature: kaivalyam-homestay-website
 *
 * Verifies the Req 8.1 / 8.2 / 8.3 content contract:
 *   • Req 8.1 — the page presents the authentic Malayali cuisine offering,
 *               including BOTH vegetarian and non-vegetarian options.
 *   • Req 8.2 — the page describes the home-cooked and outdoor dining
 *               experiences available on the property.
 *   • Req 8.3 — the page displays property photos that illustrate the dining
 *               experience, each rendered with non-empty descriptive alt text.
 *
 * Assertions are driven by the SAME typed sources the page consumes (the cuisine
 * content collection + the generated photo catalog), so the tests stay in
 * lock-step with the authored content rather than hard-coding copy.
 */
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";

import CuisinePage, { metadata, selectDiningPhotos } from "./page";
import { cuisineContent } from "@/content/cuisine";
import { filterByCategory } from "@/domain/gallery";
import { photoCatalog } from "@/content/generated";

describe("Cuisine page (Req 8.1, 8.2, 8.3)", () => {
  it("renders a single top-level Cuisine heading", () => {
    render(<CuisinePage />);
    expect(
      screen.getAllByRole("heading", { level: 1 }),
    ).toHaveLength(1);
    expect(
      screen.getByRole("heading", { level: 1, name: /cuisine/i }),
    ).toBeInTheDocument();
  });

  it("declares a self-describing page title in its metadata (Req 21.1)", () => {
    expect(typeof metadata.title).toBe("string");
    expect((metadata.title as string).length).toBeGreaterThan(0);
    expect(typeof metadata.description).toBe("string");
    expect((metadata.description as string).length).toBeGreaterThan(0);
  });

  it("maintains a sequential heading hierarchy with no skipped levels (Req 21.2)", () => {
    render(<CuisinePage />);
    const levels = screen
      .getAllByRole("heading")
      .map((h) => Number(h.tagName.slice(1)));
    expect(levels[0]).toBe(1);
    // Every heading after the first is at most one level deeper than the
    // maximum depth seen so far → no skipped levels.
    let maxSeen: number = levels[0] ?? 1;
    for (const level of levels) {
      expect(level).toBeLessThanOrEqual(maxSeen + 1);
      maxSeen = Math.max(maxSeen, level);
    }
  });

  it("presents the authentic Malayali cuisine offering with veg + non-veg options (Req 8.1)", () => {
    render(<CuisinePage />);

    // The Malayali cuisine section heading is rendered from the content model.
    expect(
      screen.getByRole("heading", { name: cuisineContent.malayaliCuisine.heading }),
    ).toBeInTheDocument();

    // Each authored paragraph of the cuisine narrative is present verbatim.
    for (const paragraph of cuisineContent.malayaliCuisine.paragraphs) {
      expect(screen.getByText(paragraph)).toBeInTheDocument();
    }

    // The offering explicitly covers BOTH vegetarian and non-vegetarian food.
    const cuisineProse = cuisineContent.malayaliCuisine.paragraphs
      .join(" ")
      .toLowerCase();
    expect(cuisineProse).toContain("vegetarian");
    expect(cuisineProse).toContain("non-vegetarian");
  });

  it("describes the home-cooked and outdoor dining experiences (Req 8.2)", () => {
    render(<CuisinePage />);

    // Every authored dining experience is rendered with its title + description.
    for (const experience of cuisineContent.diningExperiences) {
      expect(
        screen.getByRole("heading", { name: experience.title }),
      ).toBeInTheDocument();
      expect(screen.getByText(experience.description)).toBeInTheDocument();
    }

    // The two required experiences — home-cooked and outdoor — are both present.
    const ids = cuisineContent.diningExperiences.map((e) => e.id);
    expect(ids).toContain("home-cooked");
    expect(ids).toContain("outdoor-dining");
  });

  it("displays dining photos, each with non-empty descriptive alt text (Req 8.3)", () => {
    render(<CuisinePage />);

    const diningPhotos = selectDiningPhotos();
    expect(diningPhotos.length).toBeGreaterThan(0);

    // Every selected dining photo is rendered as an image with its catalog alt.
    for (const photo of diningPhotos) {
      const img = screen.getByAltText(photo.alt);
      expect(img).toBeInTheDocument();
      expect(photo.alt.trim().length).toBeGreaterThan(0);
    }

    // No more images than the dining set are rendered (the gallery is scoped to
    // the dining-illustrating photos, not the whole property catalog).
    const gallery = screen.getByRole("region", {
      name: /the table, out in the open/i,
    });
    expect(within(gallery).getAllByRole("img")).toHaveLength(
      diningPhotos.length,
    );
  });

  it("sources the dining photos from the property's outdoor-living catalog (Req 8.3)", () => {
    // The illustrative photos are the property's open-air dining areas — drawn
    // from the generated `outdoor_living` gallery category, not invented.
    const expected = filterByCategory(photoCatalog, "outdoor_living");
    const selected = selectDiningPhotos();
    expect(selected).toHaveLength(expected.length);
    expect(new Set(selected.map((p) => p.id))).toEqual(
      new Set(expected.map((p) => p.id)),
    );
    for (const photo of selected) {
      expect(photo.category).toBe("outdoor_living");
    }
  });
});
