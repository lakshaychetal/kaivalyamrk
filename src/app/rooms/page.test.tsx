/**
 * Unit tests for the Rooms page (task 11.3).
 * -------------------------------------------
 * Feature: kaivalyam-homestay-website
 *
 * Verifies the Req 4.1–4.6 content contract for the Rooms page:
 *   • Req 4.1 — Luxury Cottage and Classic Room rendered as separate entries.
 *   • Req 4.4 — Full amenity list present for each room type.
 *   • Req 4.5 — At least one photo per room with descriptive alt text.
 *   • Req 4.6 — "Book This Room" / "Book Now" CTA present for each room.
 *
 * Assertions derive expected values from the same typed `rooms` collection the
 * page renders, so tests stay in lock-step with authored content.
 */
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";

import RoomsPage, { metadata } from "./page";
import { rooms, luxuryCottage, classicRoom } from "@/content/rooms";

describe("Rooms page (Req 4.1–4.6)", () => {
  // ---------------------------------------------------------------------------
  // Heading hierarchy and metadata
  // ---------------------------------------------------------------------------

  it("renders a single top-level 'Our Rooms' heading (Req 21.2)", () => {
    render(<RoomsPage />);
    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveAccessibleName(/our rooms/i);
  });

  it("declares a self-describing page title in its metadata (Req 21.1)", () => {
    expect(metadata.title).toMatch(/rooms/i);
    expect(typeof metadata.description).toBe("string");
    expect((metadata.description ?? "").length).toBeGreaterThan(0);
  });

  // ---------------------------------------------------------------------------
  // Req 4.1 — both room names rendered as separate h2 entries
  // ---------------------------------------------------------------------------

  it("renders both room names as separate h2 headings (Req 4.1)", () => {
    render(<RoomsPage />);

    const luxuryHeading = screen.getByRole("heading", {
      level: 2,
      name: /luxury cottage/i,
    });
    const classicHeading = screen.getByRole("heading", {
      level: 2,
      name: /classic room/i,
    });

    expect(luxuryHeading).toBeInTheDocument();
    expect(classicHeading).toBeInTheDocument();
    // They must be distinct elements (separate entries, Req 4.1).
    expect(luxuryHeading).not.toBe(classicHeading);
  });

  it("renders both rooms from the typed rooms collection (Req 4.1)", () => {
    render(<RoomsPage />);
    for (const room of rooms) {
      expect(
        screen.getByRole("heading", { level: 2, name: room.name }),
      ).toBeInTheDocument();
    }
  });

  // ---------------------------------------------------------------------------
  // Req 4.4 — amenity lists present for each room
  // ---------------------------------------------------------------------------

  it("renders the full amenity list for the Luxury Cottage (Req 4.4)", () => {
    render(<RoomsPage />);

    // Scope to the Luxury Cottage section.
    const luxurySection = screen
      .getByRole("heading", { level: 2, name: /luxury cottage/i })
      .closest("section");
    expect(luxurySection).not.toBeNull();

    const amenitiesRegion = within(luxurySection!).getByRole("region", {
      name: /amenities/i,
    });

    // Every authored amenity must appear in the list.
    for (const amenity of luxuryCottage.amenities) {
      expect(within(amenitiesRegion).getByText(amenity)).toBeInTheDocument();
    }
  });

  it("renders the full amenity list for the Classic Room (Req 4.4)", () => {
    render(<RoomsPage />);

    const classicSection = screen
      .getByRole("heading", { level: 2, name: /classic room/i })
      .closest("section");
    expect(classicSection).not.toBeNull();

    const amenitiesRegion = within(classicSection!).getByRole("region", {
      name: /amenities/i,
    });

    for (const amenity of classicRoom.amenities) {
      expect(within(amenitiesRegion).getByText(amenity)).toBeInTheDocument();
    }
  });

  it("renders amenity lists for every room in the collection (Req 4.4)", () => {
    render(<RoomsPage />);

    for (const room of rooms) {
      const section = screen
        .getByRole("heading", { level: 2, name: room.name })
        .closest("section");
      expect(section).not.toBeNull();

      const amenitiesRegion = within(section!).getByRole("region", {
        name: /amenities/i,
      });
      // At least one amenity is rendered.
      expect(amenitiesRegion).toBeInTheDocument();
      expect(room.amenities.length).toBeGreaterThan(0);
    }
  });

  // ---------------------------------------------------------------------------
  // Req 4.5 — at least one photo per room with descriptive alt text
  // ---------------------------------------------------------------------------

  it("renders at least one photo with non-empty alt text for the Luxury Cottage (Req 4.5)", () => {
    render(<RoomsPage />);

    const luxurySection = screen
      .getByRole("heading", { level: 2, name: /luxury cottage/i })
      .closest("section");
    expect(luxurySection).not.toBeNull();

    const images = within(luxurySection!).getAllByRole("img");
    // At least one photo is shown.
    expect(images.length).toBeGreaterThan(0);
    // Every rendered image has a non-empty alt (Req 22.2).
    for (const img of images) {
      expect((img.getAttribute("alt") ?? "").trim().length).toBeGreaterThan(0);
    }
  });

  it("renders at least one photo with non-empty alt text for the Classic Room (Req 4.5)", () => {
    render(<RoomsPage />);

    const classicSection = screen
      .getByRole("heading", { level: 2, name: /classic room/i })
      .closest("section");
    expect(classicSection).not.toBeNull();

    const images = within(classicSection!).getAllByRole("img");
    expect(images.length).toBeGreaterThan(0);
    for (const img of images) {
      expect((img.getAttribute("alt") ?? "").trim().length).toBeGreaterThan(0);
    }
  });

  // ---------------------------------------------------------------------------
  // Req 4.6 — Book Now / Book This Room CTA present for each room
  // ---------------------------------------------------------------------------

  it("renders a booking CTA for the Luxury Cottage (Req 4.6)", () => {
    render(<RoomsPage />);

    const luxurySection = screen
      .getByRole("heading", { level: 2, name: /luxury cottage/i })
      .closest("section");
    expect(luxurySection).not.toBeNull();

    // The CTA is a link with an accessible name containing "book".
    const bookLinks = within(luxurySection!).getAllByRole("link");
    const bookingLink = bookLinks.find((link) =>
      /book/i.test(link.textContent ?? link.getAttribute("aria-label") ?? ""),
    );
    expect(bookingLink).toBeDefined();
  });

  it("renders a booking CTA for the Classic Room (Req 4.6)", () => {
    render(<RoomsPage />);

    const classicSection = screen
      .getByRole("heading", { level: 2, name: /classic room/i })
      .closest("section");
    expect(classicSection).not.toBeNull();

    const bookLinks = within(classicSection!).getAllByRole("link");
    const bookingLink = bookLinks.find((link) =>
      /book/i.test(link.textContent ?? link.getAttribute("aria-label") ?? ""),
    );
    expect(bookingLink).toBeDefined();
  });

  it("renders a booking CTA for every room in the collection (Req 4.6)", () => {
    render(<RoomsPage />);

    for (const room of rooms) {
      const section = screen
        .getByRole("heading", { level: 2, name: room.name })
        .closest("section");
      expect(section).not.toBeNull();

      const bookLinks = within(section!).getAllByRole("link");
      const bookingLink = bookLinks.find((link) =>
        /book/i.test(link.textContent ?? link.getAttribute("aria-label") ?? ""),
      );
      expect(bookingLink).toBeDefined();
    }
  });

  it("booking CTAs resolve to the in-site enquiry page (Req 4.6)", () => {
    render(<RoomsPage />);

    // All booking links on the page should point to the /book enquiry form.
    const allLinks = screen.getAllByRole("link");
    const bookingLinks = allLinks.filter((link) =>
      /book/i.test(link.textContent ?? link.getAttribute("aria-label") ?? ""),
    );

    expect(bookingLinks.length).toBeGreaterThanOrEqual(rooms.length);

    for (const link of bookingLinks) {
      const href = link.getAttribute("href") ?? "";
      // Every booking link routes to the in-site lead/enquiry form.
      expect(href).toBe("/book");
    }
  });
});
