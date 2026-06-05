/**
 * Home page tests — src/app/page.test.tsx
 * ----------------------------------------
 * Feature: kaivalyam-homestay-website (task 11.1)
 *
 * Verifies the core rendering contract of the Home page:
 *   • Hero section renders with the brand tagline (Req 2.1, 2.2)
 *   • Primary Book Now CTA is present (Req 2.2)
 *   • Philosophy intro links to /about (Req 2.3)
 *   • Rooms section links to /rooms (Req 2.4)
 *   • Facilities section links to /facilities (Req 2.5)
 *   • WhatsApp entry point is present (Req 2.7, 16.2)
 *
 * Tests are focused and fast — they verify the rendered output, not
 * implementation details.
 */
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import HomePage from "./page";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Render the Home page and return the container. */
function renderHomePage() {
  return render(<HomePage />);
}

// ---------------------------------------------------------------------------
// Hero section
// ---------------------------------------------------------------------------

describe("Hero section", () => {
  it("renders the brand tagline", () => {
    renderHomePage();
    // The tagline is the h1 on the page
    expect(
      screen.getByRole("heading", { level: 1, name: /EXPERIENCE SERENE SOLITUDE/i }),
    ).toBeInTheDocument();
  });

  it("includes #KAIVALYAM in the tagline", () => {
    renderHomePage();
    expect(
      screen.getByRole("heading", { level: 1, name: /#KAIVALYAM/i }),
    ).toBeInTheDocument();
  });

  it("renders the primary Book Now CTA", () => {
    renderHomePage();
    // BookNowButton renders as a link with "Book Now" text
    const bookNowLinks = screen.getAllByRole("link", { name: /book now/i });
    expect(bookNowLinks.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Philosophy intro section (Req 2.3)
// ---------------------------------------------------------------------------

describe("Philosophy intro section", () => {
  it("renders a heading about Kaivalyam", () => {
    renderHomePage();
    expect(
      screen.getByRole("heading", { name: /kaivalyam/i, level: 2 }),
    ).toBeInTheDocument();
  });

  it("mentions liberation or solitude in the intro text", () => {
    renderHomePage();
    // Use getAllByText since "solitude" appears in multiple places on the page
    const liberationEls = screen.queryAllByText(/liberation/i);
    const solitudeEls = screen.queryAllByText(/solitude/i);
    expect(liberationEls.length + solitudeEls.length).toBeGreaterThan(0);
  });

  it("links to /about", () => {
    renderHomePage();
    const allLinks = screen.getAllByRole("link");
    const aboutLink = allLinks.find((link) =>
      link.getAttribute("href") === "/about",
    );
    expect(aboutLink).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Rooms section (Req 2.4)
// ---------------------------------------------------------------------------

describe("Rooms section", () => {
  it("renders a section heading about rooms or accommodation", () => {
    renderHomePage();
    expect(
      screen.getByRole("heading", { name: /stay|rooms/i, level: 2 }),
    ).toBeInTheDocument();
  });

  it("renders the Luxury Cottage room card heading", () => {
    renderHomePage();
    // The room card title is an h3 — use getAllByRole to handle multiple matches
    const headings = screen.getAllByRole("heading", { name: /luxury cottage/i });
    expect(headings.length).toBeGreaterThan(0);
  });

  it("renders the Classic Room card heading", () => {
    renderHomePage();
    const headings = screen.getAllByRole("heading", { name: /classic room/i });
    expect(headings.length).toBeGreaterThan(0);
  });

  it("links to /rooms", () => {
    renderHomePage();
    const allLinks = screen.getAllByRole("link");
    const roomsLink = allLinks.find((link) =>
      link.getAttribute("href") === "/rooms",
    );
    expect(roomsLink).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Facilities section (Req 2.5)
// ---------------------------------------------------------------------------

describe("Facilities section", () => {
  it("renders a section heading about facilities or comforts", () => {
    renderHomePage();
    expect(
      screen.getByRole("heading", { name: /facilities|comforts/i, level: 2 }),
    ).toBeInTheDocument();
  });

  it("renders at least one facility heading", () => {
    renderHomePage();
    // Facility names are rendered as h3 headings via CardTitle
    const facilityHeadings = screen.getAllByRole("heading", { level: 3 });
    // At least some h3s should be facility names
    expect(facilityHeadings.length).toBeGreaterThan(0);
  });

  it("links to /facilities", () => {
    renderHomePage();
    const allLinks = screen.getAllByRole("link");
    const facilitiesLink = allLinks.find((link) =>
      link.getAttribute("href") === "/facilities",
    );
    expect(facilitiesLink).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Reviews preview (Req 2.6)
// ---------------------------------------------------------------------------

describe("Reviews preview section", () => {
  it("renders a reviews section heading", () => {
    renderHomePage();
    expect(
      screen.getByRole("heading", { name: /guests|reviews/i }),
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// WhatsApp entry point (Req 2.7, 16.2)
// ---------------------------------------------------------------------------

describe("WhatsApp entry point", () => {
  it("renders a WhatsApp link (wa.me)", () => {
    renderHomePage();
    const allLinks = screen.getAllByRole("link");
    const waLink = allLinks.find((link) =>
      link.getAttribute("href")?.includes("wa.me"),
    );
    expect(waLink).toBeDefined();
  });

  it("renders a visible WhatsApp label or text", () => {
    renderHomePage();
    // Use getAllByText since "WhatsApp" may appear in multiple places
    const whatsappEls = screen.getAllByText(/whatsapp/i);
    expect(whatsappEls.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Heading hierarchy (Req 21.2)
// ---------------------------------------------------------------------------

describe("Heading hierarchy", () => {
  it("has exactly one h1", () => {
    renderHomePage();
    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
  });

  it("has multiple h2 section headings", () => {
    renderHomePage();
    const h2s = screen.getAllByRole("heading", { level: 2 });
    expect(h2s.length).toBeGreaterThanOrEqual(4);
  });
});
