/**
 * Property test — Property 4: Every image has descriptive alternative text (task 5.3).
 * ---------------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website
 *
 * Design (Property 4): *For all* images in the property photo catalog and the
 * attractions set, the image's `alt` is a non-empty descriptive string.
 *
 * The runtime "non-empty alt" contract is also enforced at build time by
 * `scripts/validate-assets.mjs` (Rule a). This property test verifies the same
 * invariant two ways:
 *   1. across a wide space of generated `ImageAsset` inputs (varied source, alt,
 *      and presence/absence of attribution), and
 *   2. as an example-style assertion over the REAL generated catalog, confirming
 *      the actual shipped data complies.
 */
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { assertProperty } from "@/lib/pbt";
import { photoCatalog, attractions } from "@/content/generated";
import type { Attribution, ImageAsset } from "@/content/types";

// ---------------------------------------------------------------------------
// Invariant under test
// ---------------------------------------------------------------------------

/**
 * Property 4 predicate: `alt` is a non-empty descriptive string.
 * "Non-empty" is checked after trimming so whitespace-only alt never passes —
 * matching the build validator's `isBlank` rule (Req 6.7, 7.6, 22.2).
 */
function hasDescriptiveAltText(image: ImageAsset): boolean {
  return typeof image.alt === "string" && image.alt.trim().length > 0;
}

// ---------------------------------------------------------------------------
// Generators — varied, well-formed ImageAsset inputs
// ---------------------------------------------------------------------------

/** A non-empty, visibly-descriptive string (never whitespace-only). */
const nonEmptyTextArb = fc
  .string({ minLength: 1 })
  .filter((s) => s.trim().length > 0);

/**
 * Descriptive `alt` text. A guaranteed-visible subject token is wrapped in
 * optional leading whitespace + an optional contextual suffix, so the value
 * always carries real content while still exercising the trim-based predicate.
 */
const descriptiveAltArb = fc
  .tuple(
    fc.constantFrom("", " ", "  ", "\n", "\t"),
    fc.constantFrom(
      "Gazebo with golden light",
      "Soochipara Falls",
      "Thirunelli Temple façade",
      "Sunlit garden pathway",
      "Duplex cottage amid greenery",
      "Chembra Peak ridgeline",
      "Lakeside at Banasura",
      "Korome Mosque courtyard",
      "Night ambiance over the property",
    ),
    fc.constantFrom(
      "",
      " — Kaivalyam Homestay, Padichira, Wayanad",
      " near Kaivalyam Homestay, Wayanad",
      " at dusk",
    ),
  )
  .map(([lead, subject, suffix]) => `${lead}${subject}${suffix}`);

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
  alt: descriptiveAltArb,
  width: fc.integer({ min: 1, max: 8000 }),
  height: fc.integer({ min: 1, max: 8000 }),
};

/** A Wikimedia image: attribution is present (one branch of the union). */
const wikimediaImageArb: fc.Arbitrary<ImageAsset> = fc.record({
  ...imageBaseArb,
  source: fc.constant("wikimedia" as const),
  attribution: attributionArb,
});

/** An owned / AI-generated image: no attribution (the other branch). */
const unattributedImageArb: fc.Arbitrary<ImageAsset> = fc.record({
  ...imageBaseArb,
  source: fc.constantFrom("owned" as const, "ai-generated" as const),
});

/** Varied ImageAsset spanning every source and attribution shape. */
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

describe("Property 4: Every image has descriptive alternative text", () => {
  // Feature: kaivalyam-homestay-website, Property 4: Every image has descriptive alternative text
  // **Validates: Requirements 6.7, 7.6, 22.2**
  it("holds for all generated ImageAsset inputs (varied source, alt, attribution)", () => {
    assertProperty(
      fc.property(imageAssetArb, (image) => {
        expect(hasDescriptiveAltText(image)).toBe(true);
      }),
    );
  });

  // Feature: kaivalyam-homestay-website, Property 4: Every image has descriptive alternative text
  // **Validates: Requirements 6.7, 7.6, 22.2**
  it("holds for every image in the real generated photo catalog and attractions set", () => {
    expect(allCatalogImages.length).toBeGreaterThan(0);
    for (const image of allCatalogImages) {
      expect(
        hasDescriptiveAltText(image),
        `image "${image.id}" must have non-empty descriptive alt text`,
      ).toBe(true);
    }
  });
});
