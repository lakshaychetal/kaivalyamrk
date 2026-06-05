/**
 * Unit tests for the About page (task 11.2).
 * ------------------------------------------
 * Feature: kaivalyam-homestay-website
 *
 * Verifies the Req 3.1–3.5 content contract for the About page:
 *   • Req 3.1 — presents the meaning of "Kaivalyam" as liberation and solitude
 *               of the soul.
 *   • Req 3.2 — presents the pet-friendly, tranquil hill-village positioning
 *               suited to long-staying guests.
 *   • Req 3.3 — presents the Wayanad region story (natural + cultural setting).
 *   • Req 3.4 — presents the signature offerings: guided tours, nature walks,
 *               local community interaction, and 24-hour guest assistance.
 *   • Req 3.5 — displays property photos that illustrate the setting, each with
 *               descriptive alt text.
 *
 * The narrative assertions derive their expected copy from the SAME typed
 * `aboutContent` collection the page renders, so the tests stay in lock-step
 * with the authored content rather than hard-coding prose.
 */
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";

import AboutPage, { metadata } from "./page";
import { aboutContent } from "@/content/about";

describe("About page (Req 3.1–3.5)", () => {
  it("renders a single top-level About heading (Req 21.2)", () => {
    render(<AboutPage />);
    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveAccessibleName(/about kaivalyam/i);
  });

  it("declares a self-describing page title in its metadata (Req 21.1)", () => {
    expect(typeof metadata.title).toBe("string");
    expect((metadata.title as string).length).toBeGreaterThan(0);
    expect(typeof metadata.description).toBe("string");
    expect((metadata.description ?? "").length).toBeGreaterThan(0);
  });

  it("presents the meaning of Kaivalyam as liberation and solitude of the soul (Req 3.1)", () => {
    render(<AboutPage />);
    const region = screen.getByRole("region", {
      name: aboutContent.meaning.heading,
    });
    // The authored prose conveying liberation + solitude of the soul is present.
    expect(within(region).getByText(/liberation/i)).toBeInTheDocument();
    expect(within(region).getByText(/solitude of the soul/i)).toBeInTheDocument();
  });

  it("presents the tranquil hill-village long-stay positioning (Req 3.2)", () => {
    render(<AboutPage />);
    const region = screen.getByRole("region", {
      name: aboutContent.positioning.heading,
    });
    expect(within(region).getByText(/long-staying guests/i)).toBeInTheDocument();
    expect(within(region).getByText(/tranquil hill-village/i)).toBeInTheDocument();
  });

  it("presents the Wayanad region story describing its natural and cultural setting (Req 3.3)", () => {
    render(<AboutPage />);
    const region = screen.getByRole("region", {
      name: aboutContent.wayanadStory.heading,
    });
    // Natural setting (Western Ghats / paddy / plantations) ...
    expect(within(region).getByText(/Western Ghats/i)).toBeInTheDocument();
    // ... and cultural setting (tribal communities / heritage).
    expect(within(region).getByText(/tribal communities/i)).toBeInTheDocument();
  });

  it("presents all four signature offerings (Req 3.4)", () => {
    render(<AboutPage />);

    expect(
      screen.getByRole("heading", { name: /signature experiences/i }),
    ).toBeInTheDocument();

    // Each authored offering renders as a heading (card title) with its blurb.
    for (const offering of aboutContent.signatureOfferings) {
      expect(
        screen.getByRole("heading", { name: offering.title }),
      ).toBeInTheDocument();
    }

    // The four required offerings are explicitly present by name.
    expect(screen.getByRole("heading", { name: /guided tours/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /nature walks/i })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /local community interaction/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /24-hour guest assistance/i }),
    ).toBeInTheDocument();
  });

  it("displays illustrative property photos, each with non-empty descriptive alt text (Req 3.5)", () => {
    render(<AboutPage />);

    const setting = screen.getByRole("region", {
      name: /a glimpse of the setting/i,
    });
    const images = within(setting).getAllByRole("img");

    // At least one illustrative photo is shown ...
    expect(images.length).toBeGreaterThan(0);
    // ... and every one carries a descriptive (non-empty) alt (Req 22.2 / 3.5).
    for (const img of images) {
      expect(img).toHaveAccessibleName();
      expect((img.getAttribute("alt") ?? "").trim().length).toBeGreaterThan(0);
    }
  });
});
