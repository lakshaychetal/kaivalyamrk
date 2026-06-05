/**
 * Unit tests for the Attractions page and its components (task 12.2).
 * -------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website
 *
 * Verifies the Req 7.1–7.7 contract:
 *   • 7.1 — all 11 category headings are rendered.
 *   • 7.2 — each attraction shows its name and image.
 *   • 7.3 — external links rendered only when externalUrl is present.
 *   • 7.4 — external links have target="_blank" and rel="noopener noreferrer".
 *   • 7.5 — Religious Sites split into Hindu/Jain/Christian/Muslim subgroups.
 *   • 7.6 — every image has descriptive alt text.
 *   • 7.7 — image error fallback renders when src fails.
 */
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { AttractionsDirectory } from "@/components/sections/AttractionsDirectory";
import { AttractionCard } from "@/components/sections/AttractionCard";
import type { AttractionItem } from "@/content/types";

// ---------------------------------------------------------------------------
// Fixture data
// ---------------------------------------------------------------------------

const makeImage = (id: string, alt: string) => ({
  id,
  src: `/generated/attractions/${id}.jpg`,
  alt,
  width: 800,
  height: 600,
  source: "wikimedia" as const,
  attribution: {
    author: "Test Author",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    sourceUrl: `https://commons.wikimedia.org/wiki/File:${id}.jpg`,
  },
});

/** One attraction per category to exercise all 11 headings. */
const onePerCategory: AttractionItem[] = [
  {
    id: "a1",
    name: "Banasura Spices Garden",
    category: "historic_sites_gardens",
    image: makeImage("a1", "Banasura Spices Garden"),
    externalUrl: "https://example.com/banasura",
  },
  {
    id: "b1",
    name: "Edakkal Caves",
    category: "dams_caverns_caves",
    image: makeImage("b1", "Edakkal Caves"),
  },
  {
    id: "c1",
    name: "Chembra Peak",
    category: "mountain_sites",
    image: makeImage("c1", "Chembra Peak"),
  },
  {
    id: "d1",
    name: "Soochipara Falls",
    category: "waterfalls_lookouts",
    image: makeImage("d1", "Soochipara Falls"),
  },
  {
    id: "e1",
    name: "Thirunelli Temple",
    category: "religious_sites",
    subgroup: "hindu",
    image: makeImage("e1", "Thirunelli Temple"),
  },
  {
    id: "e2",
    name: "Puliyarmala Jain Temple",
    category: "religious_sites",
    subgroup: "jain",
    image: makeImage("e2", "Puliyarmala Jain Temple"),
  },
  {
    id: "e3",
    name: "St Joseph Church",
    category: "religious_sites",
    subgroup: "christian",
    image: makeImage("e3", "St Joseph Church"),
  },
  {
    id: "e4",
    name: "Varambetta Mosque",
    category: "religious_sites",
    subgroup: "muslim",
    image: makeImage("e4", "Varambetta Mosque"),
  },
  {
    id: "f1",
    name: "Pakshipathalam",
    category: "nature_wildlife_areas",
    image: makeImage("f1", "Pakshipathalam"),
  },
  {
    id: "g1",
    name: "Muthanga Wildlife",
    category: "wildlife_zoos_aquariums",
    image: makeImage("g1", "Muthanga Wildlife"),
  },
  {
    id: "h1",
    name: "Banasura Sagar Dam",
    category: "bodies_of_water",
    image: makeImage("h1", "Banasura Sagar Dam"),
  },
  {
    id: "i1",
    name: "Somatheeram Ayurveda",
    category: "ayurveda_spas",
    image: makeImage("i1", "Somatheeram Ayurveda"),
  },
  {
    id: "j1",
    name: "Wayanad Spice Market",
    category: "specialty_gift_shops",
    image: makeImage("j1", "Wayanad Spice Market"),
  },
  {
    id: "k1",
    name: "Wayanad Heritage Museum",
    category: "art_galleries_theme_parks",
    image: makeImage("k1", "Wayanad Heritage Museum"),
  },
];

// ---------------------------------------------------------------------------
// AttractionsDirectory tests
// ---------------------------------------------------------------------------

describe("AttractionsDirectory", () => {
  it("renders all 11 category headings (Req 7.1)", () => {
    render(<AttractionsDirectory attractions={onePerCategory} />);

    const expectedHeadings = [
      "Historic Sites & Gardens",
      "Dams, Caverns & Caves",
      "Mountain Sites",
      "Waterfalls & Lookouts",
      "Religious Sites",
      "Nature & Wildlife Areas",
      "Wildlife, Zoos & Aquariums",
      "Bodies of Water",
      "Ayurveda & SPAs",
      "Specialty & Gift Shops",
      "Art Galleries & Theme Parks",
    ];

    for (const heading of expectedHeadings) {
      expect(
        screen.getByRole("heading", { name: new RegExp(heading, "i") }),
      ).toBeInTheDocument();
    }
  });

  it("renders all religious sites together without sub-group headings (client request)", () => {
    render(<AttractionsDirectory attractions={onePerCategory} />);

    // The single "Religious Sites" h2 heading should be present
    expect(
      screen.getByRole("heading", { name: /religious sites/i }),
    ).toBeInTheDocument();

    // Sub-group headings (Hindu / Jain / Christian / Muslim) should NOT appear
    for (const subgroup of ["Hindu", "Jain", "Christian", "Muslim"]) {
      expect(
        screen.queryByRole("heading", { name: new RegExp(`^${subgroup}$`, "i") }),
      ).not.toBeInTheDocument();
    }
  });

  it("renders attraction names (Req 7.2)", () => {
    render(<AttractionsDirectory attractions={onePerCategory} />);
    expect(screen.getByText("Chembra Peak")).toBeInTheDocument();
    expect(screen.getByText("Soochipara Falls")).toBeInTheDocument();
    expect(screen.getByText("Thirunelli Temple")).toBeInTheDocument();
  });

  it("renders attraction images with alt text (Req 7.2, 7.6)", () => {
    render(<AttractionsDirectory attractions={onePerCategory} />);
    const img = screen.getByAltText("Chembra Peak");
    expect(img).toBeInTheDocument();
  });

  it("renders external links with correct target and rel (Req 7.3, 7.4)", () => {
    render(<AttractionsDirectory attractions={onePerCategory} />);
    const link = screen.getByRole("link", {
      name: /Banasura Spices Garden/i,
    });
    expect(link).toHaveAttribute("href", "https://example.com/banasura");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("does not render an external link for attractions without externalUrl (Req 7.3)", () => {
    render(<AttractionsDirectory attractions={onePerCategory} />);
    // "Edakkal Caves" has no externalUrl — its name should not be a link
    const links = screen.queryAllByRole("link");
    const edakkalLink = links.find((l) => l.textContent?.includes("Edakkal Caves"));
    expect(edakkalLink).toBeUndefined();
  });

  it("renders an empty directory without crashing when no attractions are provided", () => {
    const { container } = render(<AttractionsDirectory attractions={[]} />);
    // No category sections rendered (all empty)
    expect(container.querySelectorAll("section")).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// AttractionCard tests
// ---------------------------------------------------------------------------

describe("AttractionCard", () => {
  const withLink: AttractionItem = {
    id: "test-link",
    name: "Test Attraction With Link",
    category: "mountain_sites",
    image: makeImage("test-link", "Test Attraction With Link scenic view"),
    externalUrl: "https://example.com/test",
  };

  const withoutLink: AttractionItem = {
    id: "test-no-link",
    name: "Test Attraction No Link",
    category: "mountain_sites",
    image: makeImage("test-no-link", "Test Attraction No Link scenic view"),
  };

  it("renders the attraction name (Req 7.2)", () => {
    render(<AttractionCard attraction={withLink} />);
    expect(screen.getByText("Test Attraction With Link")).toBeInTheDocument();
  });

  it("renders the attraction image with descriptive alt text (Req 7.2, 7.6)", () => {
    render(<AttractionCard attraction={withLink} />);
    expect(
      screen.getByAltText("Test Attraction With Link scenic view"),
    ).toBeInTheDocument();
  });

  it("renders an external link when externalUrl is present (Req 7.3)", () => {
    render(<AttractionCard attraction={withLink} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://example.com/test");
  });

  it("external link has target=_blank and rel=noopener noreferrer (Req 7.4)", () => {
    render(<AttractionCard attraction={withLink} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("does NOT render a link when externalUrl is absent (Req 7.3)", () => {
    render(<AttractionCard attraction={withoutLink} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders the image error fallback when the image fails to load (Req 7.7)", () => {
    render(<AttractionCard attraction={withLink} />);
    const img = screen.getByAltText("Test Attraction With Link scenic view");
    // Simulate image load error
    fireEvent.error(img);
    // The branded placeholder should appear
    expect(screen.getByTestId("responsive-image-fallback")).toBeInTheDocument();
  });
});
