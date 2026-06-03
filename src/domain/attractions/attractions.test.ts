/**
 * Property-based tests for the attractions domain module.
 * ---------------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website
 *   • Property 9 (task 7.5) — Attractions category + religious-subgroup partition
 *
 * Runs through the shared PBT helper (`assertProperty`), enforcing the
 * project-wide `numRuns >= 100` floor.
 */
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { assertProperty } from "@/lib/pbt";
import {
  ATTRACTION_CATEGORY_IDS,
  RELIGIOUS_SUBGROUPS,
  type AttractionCategoryId,
  type AttractionItem,
  type ImageAsset,
  type ReligiousSubgroup,
} from "@/content/types";
import {
  groupByCategory,
  flattenGroups,
  groupReligiousBySubgroup,
  flattenReligiousSubgroups,
  isReligious,
  subgroupOf,
} from "./attractions";

// ---------------------------------------------------------------------------
// Test utilities
// ---------------------------------------------------------------------------

/** Reference-based multiset equality — the precise "lossless permutation" check. */
function multisetEqualByRef<T>(a: readonly T[], b: readonly T[]): boolean {
  if (a.length !== b.length) return false;
  const counts = new Map<T, number>();
  for (const x of a) counts.set(x, (counts.get(x) ?? 0) + 1);
  for (const y of b) {
    const c = counts.get(y);
    if (c === undefined || c === 0) return false;
    counts.set(y, c - 1);
  }
  for (const c of counts.values()) if (c !== 0) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** A minimal valid (unattributed) image asset for an attraction. */
const imageArb: fc.Arbitrary<ImageAsset> = fc.record({
  id: fc.string(),
  src: fc.string(),
  alt: fc.string({ minLength: 1 }),
  width: fc.integer({ min: 1, max: 4000 }),
  height: fc.integer({ min: 1, max: 4000 }),
  source: fc.constantFrom<"owned" | "ai-generated">("owned", "ai-generated"),
});

/** The non-religious categories (everything except `religious_sites`). */
const NON_RELIGIOUS_CATEGORY_IDS = ATTRACTION_CATEGORY_IDS.filter(
  (id): id is Exclude<AttractionCategoryId, "religious_sites"> =>
    id !== "religious_sites",
);

/**
 * A non-religious attraction: any category except Religious Sites, never a
 * subgroup. Built through the type so the biconditional holds structurally.
 */
const nonReligiousArb: fc.Arbitrary<AttractionItem> = fc.record({
  id: fc.string(),
  name: fc.string(),
  image: imageArb,
  category: fc.constantFrom(...NON_RELIGIOUS_CATEGORY_IDS),
  externalUrl: fc.option(fc.webUrl(), { nil: undefined }),
});

/** A religious attraction: category fixed to Religious Sites, always a subgroup. */
const religiousArb: fc.Arbitrary<AttractionItem> = fc.record({
  id: fc.string(),
  name: fc.string(),
  image: imageArb,
  category: fc.constant<"religious_sites">("religious_sites"),
  subgroup: fc.constantFrom<ReligiousSubgroup>(...RELIGIOUS_SUBGROUPS),
  externalUrl: fc.option(fc.webUrl(), { nil: undefined }),
});

/** A mix of religious and non-religious attractions. */
const attractionArb: fc.Arbitrary<AttractionItem> = fc.oneof(
  nonReligiousArb,
  religiousArb,
);

const attractionsArb: fc.Arbitrary<AttractionItem[]> = fc.array(attractionArb, {
  maxLength: 30,
});

// ===========================================================================
// Property 9 — task 7.5
// ===========================================================================

describe("attractions: category and religious-subgroup partition", () => {
  // Feature: kaivalyam-homestay-website, Property 9: Attractions category and religious-subgroup partition
  // **Validates: Requirements 7.1, 7.5**

  it("every item's category is one of the eleven valid categories", () => {
    assertProperty(
      fc.property(attractionsArb, (items) => {
        for (const item of items) {
          expect(ATTRACTION_CATEGORY_IDS).toContain(item.category);
        }
      }),
    );
  });

  it("grouping by category is lossless (union == input, no dup/loss)", () => {
    assertProperty(
      fc.property(attractionsArb, (items) => {
        const groups = groupByCategory(items);

        // All eleven canonical categories present; each item in its own bucket.
        for (const id of ATTRACTION_CATEGORY_IDS) {
          expect(Array.isArray(groups[id])).toBe(true);
          for (const item of groups[id]) {
            expect(item.category).toBe(id);
          }
        }

        // Re-flattening is a permutation of the input — nothing lost/duplicated.
        expect(multisetEqualByRef(flattenGroups(groups), items)).toBe(true);
      }),
    );
  });

  it("an item carries a religious subgroup IFF its category is Religious Sites", () => {
    assertProperty(
      fc.property(attractionsArb, (items) => {
        for (const item of items) {
          const hasSubgroup = subgroupOf(item) !== null;
          const isReligiousSites = item.category === "religious_sites";

          // The biconditional: subgroup present  <=>  category is Religious Sites.
          expect(hasSubgroup).toBe(isReligiousSites);
          expect(isReligious(item)).toBe(isReligiousSites);

          if (isReligiousSites) {
            expect(RELIGIOUS_SUBGROUPS).toContain(subgroupOf(item));
          } else {
            expect(subgroupOf(item)).toBeNull();
          }
        }
      }),
    );
  });

  it("the religious-subgroup split is lossless over the religious subset", () => {
    assertProperty(
      fc.property(attractionsArb, (items) => {
        const subgroups = groupReligiousBySubgroup(items);
        const religiousItems = items.filter(isReligious);

        // All four canonical subgroups present; each item in its own subgroup.
        for (const sub of RELIGIOUS_SUBGROUPS) {
          expect(Array.isArray(subgroups[sub])).toBe(true);
          for (const item of subgroups[sub]) {
            expect(item.subgroup).toBe(sub);
          }
        }

        // Re-flattening is a permutation of exactly the religious items.
        expect(
          multisetEqualByRef(
            flattenReligiousSubgroups(subgroups),
            religiousItems,
          ),
        ).toBe(true);
      }),
    );
  });
});
