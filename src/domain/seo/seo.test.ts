/**
 * Property-based tests for the SEO metadata domain module.
 * ---------------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website
 *   • Property 17 (task 8.2) — Page metadata is complete and unique
 *   • Property 18 (task 8.3) — Heading hierarchy never skips levels
 *   • Property 19 (task 8.4) — LodgingBusiness structured-data completeness
 *
 * Runs through the shared PBT helper (`assertProperty`), enforcing the
 * project-wide `numRuns >= 100` floor.
 */
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { assertProperty } from "@/lib/pbt";
import {
  PAGE_KEYS,
  buildPageMeta,
  validateHeadingOutline,
  LodgingBusinessJsonLd,
  type PageKey,
  type LodgingBusinessConfig,
} from "./seo";

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

const pageKeyArb: fc.Arbitrary<PageKey> = fc.constantFrom<PageKey>(
  ...PAGE_KEYS,
);

/** A non-empty string with at least one non-whitespace character. */
const nonBlankString = (): fc.Arbitrary<string> =>
  fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0);

// ===========================================================================
// Property 17 — task 8.2
// ===========================================================================

describe("seo: page metadata is complete and unique", () => {
  // Feature: kaivalyam-homestay-website, Property 17: Page metadata is complete and unique
  // **Validates: Requirements 21.1, 21.5**

  it("buildPageMeta returns non-empty title, description, and OpenGraph block with a preview image", () => {
    assertProperty(
      fc.property(pageKeyArb, (page) => {
        const meta = buildPageMeta(page);

        // Title + meta description are non-empty (Req 21.1).
        expect(meta.title.trim().length).toBeGreaterThan(0);
        expect(meta.description.trim().length).toBeGreaterThan(0);

        // OpenGraph title + description are non-empty (Req 21.5).
        expect(meta.openGraph.title.trim().length).toBeGreaterThan(0);
        expect(meta.openGraph.description.trim().length).toBeGreaterThan(0);

        // At least one preview image, with a non-empty url + alt (Req 21.5).
        expect(meta.openGraph.images.length).toBeGreaterThanOrEqual(1);
        for (const img of meta.openGraph.images) {
          expect(img.url.trim().length).toBeGreaterThan(0);
          expect(img.alt.trim().length).toBeGreaterThan(0);
        }
      }),
    );
  });

  it("titles are pairwise unique across any subset of the page set", () => {
    // Across the full set the titles must be pairwise unique; this holds for
    // every subset too, so we sample subsets to exercise the invariant broadly.
    const subsetArb = fc.uniqueArray(pageKeyArb, {
      minLength: 1,
      maxLength: PAGE_KEYS.length,
    });
    assertProperty(
      fc.property(subsetArb, (pages) => {
        const titles = pages.map((p) => buildPageMeta(p).title);
        expect(new Set(titles).size).toBe(titles.length);
      }),
    );
  });

  it("the full page set has pairwise-unique titles", () => {
    const titles = PAGE_KEYS.map((p) => buildPageMeta(p).title);
    expect(new Set(titles).size).toBe(titles.length);
  });
});

// ===========================================================================
// Property 18 — task 8.3
// ===========================================================================

describe("seo: heading hierarchy never skips levels", () => {
  // Feature: kaivalyam-homestay-website, Property 18: Heading hierarchy never skips levels
  // **Validates: Requirements 21.2**

  /**
   * Generate a VALID heading outline: begins at h1 and each subsequent level
   * either drops by any amount or rises by at most one, staying within [1, 6].
   */
  const validOutlineArb: fc.Arbitrary<number[]> = fc
    .array(fc.integer({ min: -5, max: 1 }), { minLength: 0, maxLength: 40 })
    .map((deltas) => {
      const levels = [1];
      let current = 1;
      for (const delta of deltas) {
        // Clamp so it never rises by more than 1 and never leaves [1, 6].
        const next = Math.min(6, Math.max(1, current + Math.min(delta, 1)));
        levels.push(next);
        current = next;
      }
      return levels;
    });

  it("accepts every well-formed outline (begins at h1, no upward skip)", () => {
    assertProperty(
      fc.property(validOutlineArb, (levels) => {
        const result = validateHeadingOutline(levels);
        expect(result.valid).toBe(true);
        expect(result.violationIndex).toBe(-1);
      }),
    );
  });

  it("rejects an outline that does not begin at h1", () => {
    const startsAboveOneArb = fc
      .tuple(
        fc.integer({ min: 2, max: 6 }),
        fc.array(fc.integer({ min: 1, max: 6 }), { maxLength: 10 }),
      )
      .map(([first, rest]) => [first, ...rest]);
    assertProperty(
      fc.property(startsAboveOneArb, (levels) => {
        const result = validateHeadingOutline(levels);
        expect(result.valid).toBe(false);
        expect(result.violationIndex).toBe(0);
      }),
    );
  });

  it("rejects an outline that skips a level upward", () => {
    // Build a valid prefix ending at `base`, then jump up by >= 2 levels.
    const skippingArb = fc
      .record({
        base: fc.integer({ min: 1, max: 4 }),
        jump: fc.integer({ min: 2, max: 5 }),
      })
      .map(({ base, jump }) => {
        const target = Math.min(6, base + jump);
        // Only keep cases where the jump is actually > 1 after clamping.
        return { levels: buildAscendingTo(base).concat(target), jumped: target - base };
      })
      .filter(({ jumped }) => jumped >= 2)
      .map(({ levels }) => levels);

    assertProperty(
      fc.property(skippingArb, (levels) => {
        const result = validateHeadingOutline(levels);
        expect(result.valid).toBe(false);
        expect(result.violationIndex).toBeGreaterThan(0);
      }),
    );
  });

  it("the difference between consecutive levels never exceeds +1 in a valid outline", () => {
    assertProperty(
      fc.property(validOutlineArb, (levels) => {
        // Direct restatement of the property over the validated sequence.
        expect(levels[0]).toBe(1);
        for (let i = 1; i < levels.length; i++) {
          expect((levels[i] as number) - (levels[i - 1] as number)).toBeLessThanOrEqual(1);
        }
        expect(validateHeadingOutline(levels).valid).toBe(true);
      }),
    );
  });
});

/** Helper: a strictly non-skipping ascending outline 1,2,...,base (begins at h1). */
function buildAscendingTo(base: number): number[] {
  const levels: number[] = [];
  for (let l = 1; l <= base; l++) levels.push(l);
  return levels;
}

// ===========================================================================
// Property 19 — task 8.4
// ===========================================================================

describe("seo: LodgingBusiness structured-data completeness", () => {
  // Feature: kaivalyam-homestay-website, Property 19: LodgingBusiness structured data completeness
  // **Validates: Requirements 21.4**

  const configArb: fc.Arbitrary<LodgingBusinessConfig> = fc.record({
    name: nonBlankString(),
    telephone: nonBlankString(),
    address: fc.record({
      streetAddress: nonBlankString(),
      addressLocality: nonBlankString(),
      addressRegion: nonBlankString(),
      addressCountry: nonBlankString(),
      postalCode: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
    }),
    email: fc.option(fc.emailAddress(), { nil: undefined }),
    url: fc.option(fc.webUrl(), { nil: undefined }),
    description: fc.option(fc.string(), { nil: undefined }),
    priceRange: fc.option(fc.constantFrom("$", "$$", "$$$"), { nil: undefined }),
    geo: fc.option(
      fc.record({
        latitude: fc.double({ min: -90, max: 90, noNaN: true }),
        longitude: fc.double({ min: -180, max: 180, noNaN: true }),
      }),
      { nil: undefined },
    ),
  });

  it("generates well-formed LodgingBusiness JSON-LD with name, location, and contact", () => {
    assertProperty(
      fc.property(configArb, (config) => {
        const jsonLd = LodgingBusinessJsonLd(config);

        // Well-formed schema.org node of the correct type.
        expect(jsonLd["@context"]).toBe("https://schema.org");
        expect(jsonLd["@type"]).toBe("LodgingBusiness");

        // Business name (Req 21.4).
        expect(jsonLd.name).toBe(config.name);
        expect(jsonLd.name.trim().length).toBeGreaterThan(0);

        // Location: a structured PostalAddress (Req 21.4).
        expect(jsonLd.address["@type"]).toBe("PostalAddress");
        expect(jsonLd.address.streetAddress.trim().length).toBeGreaterThan(0);
        expect(jsonLd.address.addressLocality.trim().length).toBeGreaterThan(0);
        expect(jsonLd.address.addressRegion.trim().length).toBeGreaterThan(0);
        expect(jsonLd.address.addressCountry.trim().length).toBeGreaterThan(0);

        // Contact: telephone (Req 21.4).
        expect(jsonLd.telephone).toBe(config.telephone);
        expect(jsonLd.telephone.trim().length).toBeGreaterThan(0);

        // Serializable to clean JSON with no `undefined` members.
        const serialized = JSON.stringify(jsonLd);
        expect(serialized).not.toContain("undefined");
        const roundTrip = JSON.parse(serialized);
        expect(roundTrip["@type"]).toBe("LodgingBusiness");
        expect(roundTrip.name).toBe(config.name);
        expect(roundTrip.address.addressLocality).toBe(
          config.address.addressLocality,
        );
        expect(roundTrip.telephone).toBe(config.telephone);
      }),
    );
  });

  it("the default Kaivalyam business config also yields complete JSON-LD", () => {
    const jsonLd = LodgingBusinessJsonLd();
    expect(jsonLd["@type"]).toBe("LodgingBusiness");
    expect(jsonLd.name.trim().length).toBeGreaterThan(0);
    expect(jsonLd.address.addressLocality.trim().length).toBeGreaterThan(0);
    expect(jsonLd.telephone.trim().length).toBeGreaterThan(0);
  });
});
