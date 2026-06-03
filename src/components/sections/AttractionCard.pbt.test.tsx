/**
 * Property-based test for `AttractionCard` — Property 10.
 * --------------------------------------------------------
 * Feature: kaivalyam-homestay-website, Property 10: External attraction links are conditional and safe
 *
 * **Validates: Requirements 7.3, 7.4**
 *
 * For all attractions, an external hyperlink is rendered IF AND ONLY IF the
 * attraction has an `externalUrl`; and every rendered external hyperlink opens
 * in a separate browser context (`target="_blank"` with `rel` containing
 * `noopener noreferrer`).
 */
import { describe, it } from "vitest";
import { render, screen } from "@testing-library/react";
import fc from "fast-check";

import { assertProperty } from "@/lib/pbt";
import { AttractionCard } from "./AttractionCard";
import type { AttractionItem, AttractionCategoryId } from "@/content/types";
import { ATTRACTION_CATEGORY_IDS } from "@/content/types";

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** A non-empty string (trimmed, at least 1 char). */
const nonEmptyString = fc
  .string({ minLength: 1, maxLength: 80 })
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

/** A valid attraction category id. */
const attractionCategoryId: fc.Arbitrary<AttractionCategoryId> = fc.constantFrom(
  ...ATTRACTION_CATEGORY_IDS,
);

/** A minimal owned ImageAsset (no attribution required). */
const imageAsset = fc.record({
  id: nonEmptyString,
  src: fc.constant("/placeholder.jpg"),
  alt: nonEmptyString,
  width: fc.integer({ min: 100, max: 1600 }),
  height: fc.integer({ min: 100, max: 1200 }),
  source: fc.constant("owned" as const),
});

/**
 * An AttractionItem whose `externalUrl` is either a valid https URL or absent.
 * We use a non-religious category to keep the type simple (no subgroup needed).
 */
const nonReligiousAttractionItem = fc
  .record({
    id: nonEmptyString,
    name: nonEmptyString,
    image: imageAsset,
    category: attractionCategoryId.filter((c) => c !== "religious_sites"),
    // externalUrl is present ~50% of the time
    externalUrl: fc.option(
      fc.webUrl({ validSchemes: ["https"] }),
      { nil: undefined, freq: 2 },
    ),
  })
  .map((rec) => {
    // Build a properly typed AttractionItem (non-religious branch)
    const item: AttractionItem = {
      id: rec.id,
      name: rec.name,
      image: rec.image,
      category: rec.category as Exclude<AttractionCategoryId, "religious_sites">,
      ...(rec.externalUrl !== undefined ? { externalUrl: rec.externalUrl } : {}),
    };
    return item;
  });

// ---------------------------------------------------------------------------
// Property 10
// ---------------------------------------------------------------------------

describe("AttractionCard — Property 10: External attraction links are conditional and safe", () => {
  it(
    "renders an external link IF AND ONLY IF externalUrl is present, and every such link has target=_blank and rel containing noopener noreferrer",
    { timeout: 60000 },
    () => {
      // Feature: kaivalyam-homestay-website, Property 10: External attraction links are conditional and safe
      // **Validates: Requirements 7.3, 7.4**
      assertProperty(
        fc.property(nonReligiousAttractionItem, (attraction) => {
          const { unmount } = render(<AttractionCard attraction={attraction} />);

          // Query for any <a> element rendered inside the card
          const links = screen.queryAllByRole("link");

          if (attraction.externalUrl !== undefined) {
            // IF externalUrl is present → exactly one link must be rendered
            if (links.length !== 1) {
              unmount();
              return false;
            }
            const link = links[0]!;

            // The link must point to the externalUrl
            if (link.getAttribute("href") !== attraction.externalUrl) {
              unmount();
              return false;
            }

            // target="_blank" (Req 7.4)
            if (link.getAttribute("target") !== "_blank") {
              unmount();
              return false;
            }

            // rel must contain both "noopener" and "noreferrer" (Req 7.4)
            const rel = link.getAttribute("rel") ?? "";
            const relParts = rel.split(/\s+/);
            if (!relParts.includes("noopener") || !relParts.includes("noreferrer")) {
              unmount();
              return false;
            }
          } else {
            // IF externalUrl is absent → no link must be rendered
            if (links.length !== 0) {
              unmount();
              return false;
            }
          }

          unmount();
          return true;
        }),
      );
    },
  );
});
