/**
 * Unit tests for the Reach Us page (task 11.6).
 * -----------------------------------------------
 * Feature: kaivalyam-homestay-website
 *
 * Verifies the Reach_Us_Page contract (Req 10.1–10.4):
 *   • Req 10.1 — all 7 origin cities are present in the rendered output.
 *   • Req 10.2 — nearest airport and railway station distances are present.
 *   • Req 10.3 — the Padichira / ~10 km from Pulpally fact is present.
 *   • Req 10.4 — a "Get Directions" link is present, points to the correct
 *                `buildDirectionsUrl` destination, and opens in a separate
 *                browser context (`target="_blank"` + `rel` containing
 *                `noopener`/`noreferrer`).
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import ReachUsPage, { metadata } from "./page";
import { roadRoutes, transportHubs, propertyLocation } from "@/content/reach-us";
import { KAIVALYAM_DIRECTIONS_URL } from "@/domain/integration-urls/directions-url";

const directionsUrl = KAIVALYAM_DIRECTIONS_URL;

describe("Reach Us page — metadata (Req 21.1)", () => {
  it("declares the correct page title", () => {
    expect(typeof metadata.title).toBe("string");
    expect((metadata.title as string).length).toBeGreaterThan(0);
    // Title comes from buildPageMeta('reach-us') — non-empty and unique.
    expect(metadata.title).toContain("Reach");
  });

  it("declares a non-empty description", () => {
    expect(typeof metadata.description).toBe("string");
    expect((metadata.description as string).length).toBeGreaterThan(0);
  });
});

describe("Reach Us page — heading structure", () => {
  it("renders a single top-level h1 heading", () => {
    render(<ReachUsPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /how to reach us/i }),
    ).toBeInTheDocument();
  });
});

describe("Reach Us page — all 7 origin cities present (Req 10.1)", () => {
  it("renders all 7 required origin cities", () => {
    render(<ReachUsPage />);
    const requiredOrigins = [
      "Kozhikode",
      "Kannur",
      "Nilambur",
      "Ooty",
      "Gudalur",
      "Bengaluru",
      "Mysuru",
    ];
    for (const city of requiredOrigins) {
      const matches = screen.getAllByText(new RegExp(city, "i"));
      expect(
        matches.length,
        `Expected city "${city}" to be present`,
      ).toBeGreaterThan(0);
    }
  });

  it("renders exactly 7 road route cards (one per origin city)", () => {
    render(<ReachUsPage />);
    // roadRoutes has 7 entries; each card renders the origin as an h2
    expect(roadRoutes).toHaveLength(7);
    for (const route of roadRoutes) {
      expect(
        screen.getByRole("heading", { level: 2, name: route.origin }),
      ).toBeInTheDocument();
    }
  });
});

describe("Reach Us page — airport and railway distances (Req 10.2)", () => {
  it("renders all transport hub names", () => {
    render(<ReachUsPage />);
    for (const hub of transportHubs) {
      expect(screen.getByText(hub.name)).toBeInTheDocument();
    }
  });

  it("renders at least one airport hub", () => {
    render(<ReachUsPage />);
    const airports = transportHubs.filter((h) => h.type === "airport");
    expect(airports.length).toBeGreaterThan(0);
    for (const airport of airports) {
      expect(screen.getByText(airport.name)).toBeInTheDocument();
    }
  });

  it("renders at least one railway hub", () => {
    render(<ReachUsPage />);
    const railways = transportHubs.filter((h) => h.type === "railway");
    expect(railways.length).toBeGreaterThan(0);
    for (const railway of railways) {
      expect(screen.getByText(railway.name)).toBeInTheDocument();
    }
  });

  it("renders the distance for each transport hub", () => {
    render(<ReachUsPage />);
    for (const hub of transportHubs) {
      // Each hub card shows its distanceKm value
      const distanceText = screen.getAllByText(
        new RegExp(`${hub.distanceKm}`, "i"),
      );
      expect(distanceText.length).toBeGreaterThan(0);
    }
  });
});

describe("Reach Us page — Padichira / Pulpally location fact (Req 10.3)", () => {
  it("states the property is in Padichira", () => {
    render(<ReachUsPage />);
    // Multiple elements may contain "Padichira" (header, route descriptions) — that's fine
    const matches = screen.getAllByText(new RegExp(propertyLocation.village, "i"));
    expect(matches.length).toBeGreaterThan(0);
  });

  it("states the property is approximately 10 km from Pulpally", () => {
    render(<ReachUsPage />);
    // Multiple elements may contain "Pulpally" — that's fine
    const pulpallyMatches = screen.getAllByText(new RegExp(propertyLocation.nearestTown, "i"));
    expect(pulpallyMatches.length).toBeGreaterThan(0);
    // The distance "10" appears in the location statement
    const distanceMatches = screen.getAllByText(
      new RegExp(`${propertyLocation.distanceFromPulpallyKm}`, "i"),
    );
    expect(distanceMatches.length).toBeGreaterThan(0);
  });

  it("renders the full location statement from propertyLocation.statement", () => {
    render(<ReachUsPage />);
    // The statement is rendered verbatim in the header paragraph
    expect(
      screen.getByText(propertyLocation.statement),
    ).toBeInTheDocument();
  });
});

describe("Reach Us page — Get Directions action (Req 10.4)", () => {
  it("renders at least one 'Get Directions' link", () => {
    render(<ReachUsPage />);
    const links = screen.getAllByRole("link", { name: /get directions/i });
    expect(links.length).toBeGreaterThan(0);
  });

  it("the Get Directions link points to the verified location URL", () => {
    render(<ReachUsPage />);
    const links = screen
      .getAllByRole("link", { name: /get directions/i })
      .filter((a) => a.getAttribute("href") === directionsUrl);
    expect(links.length).toBeGreaterThan(0);
    // Confirm the URL is the owner-verified Google Maps link.
    expect(directionsUrl).toMatch(/^https:\/\/maps\.app\.goo\.gl\//);
  });

  it("the Get Directions link opens in a separate browser context", () => {
    render(<ReachUsPage />);
    const links = screen
      .getAllByRole("link", { name: /get directions/i })
      .filter((a) => a.getAttribute("href") === directionsUrl);
    for (const link of links) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
      expect(link).toHaveAttribute(
        "rel",
        expect.stringContaining("noreferrer"),
      );
    }
  });
});
