/**
 * Property-based test for collection render-completeness — Property 20.
 * -----------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website, Property 20: Collection render-completeness
 *
 * **Validates: Requirements 4.4, 5.1, 5.2, 5.3, 11.1, 11.2**
 *
 * For all room entries, every amenity in the room's amenities list is rendered;
 * for all facilities, each renders with a name, a visual (icon or photo), and a
 * non-empty description; and for all review sets, each review renders its
 * reviewer name and text, with a numeric rating displayed if and only if the
 * review has one.
 *
 * Rooms and facilities are pure data-layer checks (the content collections are
 * the source of truth; the page components iterate them without filtering).
 * Reviews are verified by rendering `ReviewsSection` with generated inputs.
 */
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import fc from "fast-check";

import { assertProperty } from "@/lib/pbt";
import { ReviewsSection } from "./ReviewsSection";
import { rooms } from "@/content/rooms";
import { facilities } from "@/content/facilities";
import type { Review } from "@/content/types";

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** A non-empty string (trimmed, at least 1 char). */
const nonEmptyString = fc
  .string({ minLength: 1, maxLength: 120 })
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

/** A Review with an optional numeric rating (1–5). */
const reviewArbitrary: fc.Arbitrary<Review> = fc.record({
  id: nonEmptyString,
  reviewerName: nonEmptyString,
  text: nonEmptyString,
  rating: fc.option(fc.integer({ min: 1, max: 5 }), { nil: undefined, freq: 2 }),
});

/** A non-empty array of reviews (1–8 entries). */
const reviewSetArbitrary = fc.array(reviewArbitrary, { minLength: 1, maxLength: 8 });

// ---------------------------------------------------------------------------
// Property 20 — Part A: Rooms — every amenity is present in the data
// ---------------------------------------------------------------------------

describe("Property 20 (Part A) — Rooms: every amenity in the amenities list is non-empty", () => {
  it("every amenity string in every room's amenities list is non-empty (Req 4.4)", { timeout: 30000 }, () => {
    // Feature: kaivalyam-homestay-website, Property 20: Collection render-completeness
    // **Validates: Requirements 4.4**
    //
    // The rooms content collection is the source of truth consumed by the Rooms
    // page. We verify the invariant on the data layer: every amenity entry is a
    // non-empty string, so the page can render each one without producing a blank
    // list item.
    for (const room of rooms) {
      expect(room.amenities.length).toBeGreaterThan(0);
      for (const amenity of room.amenities) {
        expect(typeof amenity).toBe("string");
        expect(amenity.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("property: for all rooms, every amenity is a non-empty string (Req 4.4)", { timeout: 30000 }, () => {
    // Feature: kaivalyam-homestay-website, Property 20: Collection render-completeness
    // **Validates: Requirements 4.4**
    //
    // We generate subsets of the real amenity lists to confirm the invariant
    // holds across arbitrary slices of the data.
    const allAmenities = rooms.flatMap((r) => r.amenities);

    assertProperty(
      fc.property(
        fc.subarray(allAmenities, { minLength: 1 }),
        (amenitySubset) => {
          return amenitySubset.every(
            (a) => typeof a === "string" && a.trim().length > 0,
          );
        },
      ),
    );
  });
});

// ---------------------------------------------------------------------------
// Property 20 — Part B: Facilities — name, visual, and description are present
// ---------------------------------------------------------------------------

describe("Property 20 (Part B) — Facilities: name, visual (icon or photo), and non-empty description", () => {
  it("every facility has a non-empty name, a non-empty icon or an image, and a non-empty description (Req 5.1, 5.2, 5.3)", { timeout: 30000 }, () => {
    // Feature: kaivalyam-homestay-website, Property 20: Collection render-completeness
    // **Validates: Requirements 5.1, 5.2, 5.3**
    //
    // The facilities content collection is the source of truth consumed by the
    // Facilities page. We verify the invariant on the data layer: every facility
    // has a non-empty name, a visual (either a non-empty icon name or an image),
    // and a non-empty description.
    expect(facilities.length).toBeGreaterThan(0);

    for (const facility of facilities) {
      // Req 5.1 — name is non-empty
      expect(facility.name.trim().length).toBeGreaterThan(0);

      // Req 5.2 — visual: either a non-empty icon name OR an image is present
      const hasIcon = typeof facility.icon === "string" && facility.icon.trim().length > 0;
      const hasImage = facility.image !== undefined;
      expect(hasIcon || hasImage).toBe(true);

      // Req 5.3 — description is non-empty
      expect(facility.description.trim().length).toBeGreaterThan(0);
    }
  });

  it("property: for all facilities, name + visual + description invariants hold (Req 5.1, 5.2, 5.3)", { timeout: 30000 }, () => {
    // Feature: kaivalyam-homestay-website, Property 20: Collection render-completeness
    // **Validates: Requirements 5.1, 5.2, 5.3**
    const facilitiesArray = Array.from(facilities);

    assertProperty(
      fc.property(
        fc.subarray(facilitiesArray, { minLength: 1 }),
        (subset) => {
          return subset.every((f) => {
            const hasName = f.name.trim().length > 0;
            const hasVisual =
              (typeof f.icon === "string" && f.icon.trim().length > 0) ||
              f.image !== undefined;
            const hasDescription = f.description.trim().length > 0;
            return hasName && hasVisual && hasDescription;
          });
        },
      ),
    );
  });
});

// ---------------------------------------------------------------------------
// Property 20 — Part C: Reviews — name + text rendered; rating iff present
// ---------------------------------------------------------------------------

describe("Property 20 (Part C) — Reviews: reviewer name and text rendered; rating iff present", () => {
  it(
    "for all review sets, each review renders its reviewer name and text; a numeric rating is displayed if and only if the review has one (Req 11.1, 11.2)",
    { timeout: 60000 },
    () => {
      // Feature: kaivalyam-homestay-website, Property 20: Collection render-completeness
      // **Validates: Requirements 11.1, 11.2**
      assertProperty(
        fc.property(reviewSetArbitrary, (reviewSet) => {
          const { container, unmount } = render(
            <ReviewsSection reviews={reviewSet} />,
          );

          try {
            // Collect all rendered review card <li> elements (one per review).
            // ReviewCard renders each review inside an <li class="h-full">.
            const listItems = Array.from(
              container.querySelectorAll("ul > li"),
            ) as HTMLElement[];

            if (listItems.length !== reviewSet.length) {
              return false;
            }

            for (let i = 0; i < reviewSet.length; i++) {
              const review = reviewSet[i]!;
              const cardEl = listItems[i]!;

              // Req 11.1 — reviewer name is rendered inside this card.
              // CardTitle renders the reviewerName in an <h3>.
              const cardText = cardEl.textContent ?? "";
              if (!cardText.includes(review.reviewerName)) {
                return false;
              }

              // Req 11.1 — review text is rendered inside this card.
              // CardBody renders the text in a <p>.
              if (!cardText.includes(review.text)) {
                return false;
              }

              // Req 11.2 — rating is displayed IF AND ONLY IF the review has one.
              // RatingDisplay renders role="img" with aria-label "Rated N out of 5".
              const hasRating = typeof review.rating === "number";
              const ratingEl = cardEl.querySelector('[role="img"][aria-label]');
              const ratingLabel = ratingEl?.getAttribute("aria-label") ?? "";
              const ratingRendered =
                ratingEl !== null && /rated .* out of/i.test(ratingLabel);

              if (hasRating && !ratingRendered) {
                // Rating present in data but not rendered — violation
                return false;
              }
              if (!hasRating && ratingRendered) {
                // Rating rendered but not present in data — violation
                return false;
              }
            }

            return true;
          } finally {
            unmount();
          }
        }),
      );
    },
  );
});
