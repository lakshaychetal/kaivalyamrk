/**
 * Unit tests for the Facilities page (task 11.4).
 * -----------------------------------------------
 * Feature: kaivalyam-homestay-website
 *
 * Verifies the Req 5.1–5.3 contract against the authored `facilities` content:
 *   • 5.1 — all nine facilities are present and rendered.
 *   • 5.2 — each facility renders a visual (a Lucide icon, or a Property_Photo).
 *   • 5.3 — each facility renders a non-empty textual description.
 */
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";

import FacilitiesPage from "./page";
import { facilities } from "@/content/facilities";

describe("FacilitiesPage", () => {
  it("renders a single h1 page heading and a labelled section", () => {
    render(<FacilitiesPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /facilities/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: /on-property comforts/i }),
    ).toBeInTheDocument();
  });

  it("presents all nine facilities (Req 5.1)", () => {
    render(<FacilitiesPage />);
    // The content collection must hold exactly the nine required facilities…
    expect(facilities).toHaveLength(9);
    // …and the page must render one card per facility.
    expect(screen.getAllByRole("listitem")).toHaveLength(9);
  });

  it("renders each facility's name (Req 5.1)", () => {
    render(<FacilitiesPage />);
    for (const facility of facilities) {
      expect(
        screen.getByRole("heading", { level: 3, name: facility.name }),
      ).toBeInTheDocument();
    }
  });

  it("renders a visual — icon or photo — for every facility (Req 5.2)", () => {
    render(<FacilitiesPage />);
    for (const facility of facilities) {
      const card = screen.getByTestId(`facility-card-${facility.id}`);
      if (facility.image) {
        // A Property_Photo carries the visual via its accessible image.
        const img = within(card).getByRole("img", { name: facility.image.alt });
        expect(img).toBeInTheDocument();
      } else {
        // Otherwise the Lucide icon badge is the visual.
        const visual = within(card).getByTestId("facility-icon");
        expect(visual).toBeInTheDocument();
        // The badge must actually contain a rendered SVG glyph.
        expect(visual.querySelector("svg")).not.toBeNull();
      }
    }
  });

  it("renders a non-empty textual description for every facility (Req 5.3)", () => {
    render(<FacilitiesPage />);
    for (const facility of facilities) {
      const card = screen.getByTestId(`facility-card-${facility.id}`);
      expect(facility.description.trim().length).toBeGreaterThan(0);
      expect(within(card).getByText(facility.description)).toBeInTheDocument();
    }
  });
});
