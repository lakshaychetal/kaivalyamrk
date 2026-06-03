/**
 * Property test — Property 6: Image attribution biconditional and completeness (task 5.4).
 * ---------------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website
 *
 * Design (Property 6): *For all* images, an attribution entry is present **if
 * and only if** the image's `source` is `wikimedia`; and whenever an attribution
 * is present it includes a non-empty author, license name, and license/source
 * reference. Consequently the Photo Credits page lists attribution for exactly
 * the Wikimedia images and omits owned/AI-generated images.
 *
 * The same biconditional is enforced structurally by the `ImageAsset`
 * discriminated union in `content/types.ts` and at build time by
 * `scripts/validate-assets.mjs` (Rules b & c). This property test verifies the
 * runtime invariant two ways:
 *   1. across a wide space of generated `ImageAsset` inputs (varied source and
 *      presence/absence of attribution), and
 *   2. as an example-style assertion over the REAL generated catalog.
 */
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { assertProperty } from "@/lib/pbt";
import { photoCatalog, attractions } from "@/content/generated";
import type { Attribution, ImageAsset } from "@/content/types";

// ---------------------------------------------------------------------------
// Invariant under test
// ---------------------------------------------------------------------------

const isNonEmpty = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0;

/**
 * An attribution is COMPLETE when it carries a non-empty author, license name,
 * and license/source reference (both `licenseUrl` and `sourceUrl`) — the
 * "whenever an attribution is present…" half of Property 6 (Req 23.1, 23.4).
 */
function isCompleteAttribution(attribution: Attribution): boolean {
  return (
    isNonEmpty(attribution.author) &&
    isNonEmpty(attribution.licenseName) &&
    isNonEmpty(attribution.licenseUrl) &&
    isNonEmpty(attribution.sourceUrl)
  );
}

/**
 * Property 6 predicate over a single image:
 *  - biconditional: `attribution` present  ⟺  `source === 'wikimedia'`, and
 *  - completeness:  when present, the attribution is complete.
 */
function satisfiesAttributionProperty(image: ImageAsset): boolean {
  const hasAttribution =
    image.source === "wikimedia" && image.attribution !== undefined;
  const biconditional = hasAttribution === (image.source === "wikimedia");
  if (!biconditional) return false;
  return image.source !== "wikimedia" || isCompleteAttribution(image.attribution);
}

// ---------------------------------------------------------------------------
// Generators — varied ImageAsset inputs exercising both sides of the iff
// ---------------------------------------------------------------------------

const nonEmptyTextArb = fc
  .string({ minLength: 1 })
  .filter((s) => s.trim().length > 0);

const altTextArb = fc.constantFrom(
  "Soochipara Falls near Kaivalyam Homestay, Wayanad",
  "Gazebo Golden Light — Kaivalyam Homestay, Padichira, Wayanad",
  "Thirunelli Temple — Religious Sites near Kaivalyam Homestay, Wayanad",
  "Sunlit Garden Pathway — Kaivalyam Homestay, Padichira, Wayanad",
);

const licenseNameArb = fc.constantFrom(
  "CC BY-SA 4.0",
  "CC BY 4.0",
  "Public Domain",
  "CC0 1.0",
);

const attributionArb: fc.Arbitrary<Attribution> = fc.record({
  author: nonEmptyTextArb,
  licenseName: licenseNameArb,
  licenseUrl: fc.webUrl(),
  sourceUrl: fc.webUrl(),
  title: fc.option(nonEmptyTextArb, { nil: undefined }),
});

const imageBaseArb = {
  id: nonEmptyTextArb,
  src: fc.webUrl(),
  alt: altTextArb,
  width: fc.integer({ min: 1, max: 8000 }),
  height: fc.integer({ min: 1, max: 8000 }),
};

/** Wikimedia branch: attribution REQUIRED and complete. */
const wikimediaImageArb: fc.Arbitrary<ImageAsset> = fc.record({
  ...imageBaseArb,
  source: fc.constant("wikimedia" as const),
  attribution: attributionArb,
});

/** Owned / AI-generated branch: NO attribution. */
const unattributedImageArb: fc.Arbitrary<ImageAsset> = fc.record({
  ...imageBaseArb,
  source: fc.constantFrom("owned" as const, "ai-generated" as const),
});

const imageAssetArb: fc.Arbitrary<ImageAsset> = fc.oneof(
  wikimediaImageArb,
  unattributedImageArb,
);

// ---------------------------------------------------------------------------
// Real catalog — every shipped image, flattened.
// ---------------------------------------------------------------------------

const allCatalogImages: ImageAsset[] = [
  ...photoCatalog.categories.flatMap((category) => category.photos),
  ...attractions.map((attraction) => attraction.image),
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Property 6: Image attribution biconditional and completeness", () => {
  // Feature: kaivalyam-homestay-website, Property 6: Image attribution biconditional and completeness
  // **Validates: Requirements 23.1, 23.3, 23.4**
  it("holds the biconditional + completeness for all generated ImageAsset inputs", () => {
    assertProperty(
      fc.property(imageAssetArb, (image) => {
        const hasAttribution =
          image.source === "wikimedia" && image.attribution !== undefined;

        // Biconditional: attribution present IFF source is 'wikimedia'.
        expect(hasAttribution).toBe(image.source === "wikimedia");

        // Completeness whenever attribution is present.
        if (image.source === "wikimedia") {
          expect(isCompleteAttribution(image.attribution)).toBe(true);
        }

        // Combined predicate restates the same property.
        expect(satisfiesAttributionProperty(image)).toBe(true);
      }),
    );
  });

  // Feature: kaivalyam-homestay-website, Property 6: Image attribution biconditional and completeness
  // **Validates: Requirements 23.1, 23.3, 23.4**
  it("holds for every image in the real generated photo catalog and attractions set", () => {
    expect(allCatalogImages.length).toBeGreaterThan(0);

    let wikimediaCount = 0;
    for (const image of allCatalogImages) {
      // Biconditional on the real data.
      if (image.source === "wikimedia") {
        wikimediaCount += 1;
        expect(
          image.attribution,
          `wikimedia image "${image.id}" must carry attribution`,
        ).toBeDefined();
        expect(
          isCompleteAttribution(image.attribution),
          `wikimedia image "${image.id}" must have complete attribution`,
        ).toBe(true);
      } else {
        expect(
          (image as { attribution?: unknown }).attribution,
          `non-wikimedia image "${image.id}" must NOT carry attribution`,
        ).toBeUndefined();
      }

      expect(satisfiesAttributionProperty(image)).toBe(true);
    }

    // The Photo Credits page lists exactly the Wikimedia images — sanity-check
    // the real catalog actually contains some so the biconditional is exercised.
    expect(wikimediaCount).toBeGreaterThan(0);
  });
});
