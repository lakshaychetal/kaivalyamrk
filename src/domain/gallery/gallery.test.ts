/**
 * Property-based tests for the gallery domain module.
 * ---------------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website
 *   • Property 7 (task 7.2) — Gallery category partition and filtering
 *   • Property 8 (task 7.3) — Sequential navigation cursor (lightbox + tour)
 *
 * All properties run through the shared PBT helper (`assertProperty`), which
 * enforces the project-wide `numRuns >= 100` floor.
 */
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { assertProperty } from "@/lib/pbt";
import {
  PHOTO_CATEGORY_IDS,
  type Photo,
  type PhotoCategory,
  type PhotoCatalog,
  type PhotoCategoryId,
} from "@/content/types";
import {
  allPhotos,
  filterByCategory,
  groupCatalogByCategory,
  flattenGroups,
  nextIndex,
  prevIndex,
  nextTourStep,
  prevTourStep,
} from "./gallery";

// ---------------------------------------------------------------------------
// Test utilities
// ---------------------------------------------------------------------------

/**
 * Multiset (bag) equality by OBJECT REFERENCE: `a` and `b` contain exactly the
 * same elements with the same multiplicities, in any order. This is the precise
 * notion of "lossless, no duplication or loss" — a permutation, not just equal
 * length or equal contents.
 */
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

/**
 * An arbitrary gallery {@link Photo}. Property photos are always `owned` or
 * `ai-generated` (no attribution). The photo's own `category` is chosen
 * independently of any containing category, so generated catalogs can include
 * "mis-filed" photos — exactly the stress case that proves `filterByCategory`
 * and grouping depend only on `photo.category`, never on the container.
 */
const photoArb: fc.Arbitrary<Photo> = fc
  .record({
    id: fc.string(),
    src: fc.string(),
    alt: fc.string({ minLength: 1 }),
    width: fc.integer({ min: 1, max: 4000 }),
    height: fc.integer({ min: 1, max: 4000 }),
    source: fc.constantFrom<"owned" | "ai-generated">("owned", "ai-generated"),
    category: fc.constantFrom<PhotoCategoryId>(...PHOTO_CATEGORY_IDS),
  })
  .map((r): Photo => ({ ...r }));

const photoCategoryArb: fc.Arbitrary<PhotoCategory> = fc.record({
  id: fc.constantFrom<PhotoCategoryId>(...PHOTO_CATEGORY_IDS),
  label: fc.string(),
  photos: fc.array(photoArb, { maxLength: 8 }),
  order: fc.integer({ min: 0, max: 100 }),
});

const catalogArb: fc.Arbitrary<PhotoCatalog> = fc.record({
  categories: fc.array(photoCategoryArb, { maxLength: 11 }),
});

// ===========================================================================
// Property 7 — task 7.2
// ===========================================================================

describe("gallery: category partition and filtering", () => {
  // Feature: kaivalyam-homestay-website, Property 7: Gallery category partition and filtering
  // **Validates: Requirements 6.1, 6.2, 6.3**

  it("every photo's category is one of the nine valid ids", () => {
    assertProperty(
      fc.property(catalogArb, (catalog) => {
        for (const photo of allPhotos(catalog)) {
          expect(PHOTO_CATEGORY_IDS).toContain(photo.category);
        }
      }),
    );
  });

  it("grouping the catalog by category is lossless (union == catalog, no dup/loss)", () => {
    assertProperty(
      fc.property(catalogArb, (catalog) => {
        const photos = allPhotos(catalog);
        const groups = groupCatalogByCategory(catalog);

        // Every one of the nine canonical categories is present as a key, and
        // every photo lands in the group matching its OWN category.
        for (const id of PHOTO_CATEGORY_IDS) {
          expect(Array.isArray(groups[id])).toBe(true);
          for (const photo of groups[id]) {
            expect(photo.category).toBe(id);
          }
        }

        // Re-flattening the groups yields a permutation of the catalog photos:
        // nothing is dropped, nothing is duplicated.
        const reflattened = flattenGroups(groups);
        expect(multisetEqualByRef(reflattened, photos)).toBe(true);
      }),
    );
  });

  it("filterByCategory(catalog, c) returns exactly the photos whose category is c", () => {
    assertProperty(
      fc.property(
        catalogArb,
        fc.constantFrom<PhotoCategoryId>(...PHOTO_CATEGORY_IDS),
        (catalog, category) => {
          const filtered = filterByCategory(catalog, category);
          const expected = allPhotos(catalog).filter(
            (photo) => photo.category === category,
          );

          // Soundness: every returned photo really is in category `c`.
          for (const photo of filtered) {
            expect(photo.category).toBe(category);
          }
          // Completeness + exactness: same multiset as the hand-filtered set.
          expect(multisetEqualByRef(filtered, expected)).toBe(true);
        },
      ),
    );
  });
});

// ===========================================================================
// Property 8 — task 7.3
// ===========================================================================

describe("gallery: sequential navigation cursor", () => {
  // Feature: kaivalyam-homestay-website, Property 8: Sequential navigation cursor (lightbox and virtual tour)
  // **Validates: Requirements 6.4, 6.5, 6.6**

  const lengthArb = fc.integer({ min: 1, max: 50 });
  const anyCurrentArb = fc.integer({ min: -100, max: 150 });

  it("wrap mode moves to the deterministically adjacent index", () => {
    assertProperty(
      fc.property(lengthArb, fc.integer({ min: 0, max: 1000 }), (n, raw) => {
        const c = raw % n; // an in-range current position
        expect(nextIndex(n, c, true)).toBe((c + 1) % n);
        expect(prevIndex(n, c, true)).toBe((c - 1 + n) % n);
        // next/previous are inverse operations under wrap.
        expect(prevIndex(n, nextIndex(n, c, true), true)).toBe(c);
        expect(nextIndex(n, prevIndex(n, c, true), true)).toBe(c);
      }),
    );
  });

  it("clamp mode stays in range and clamps out-of-range input", () => {
    assertProperty(
      fc.property(lengthArb, anyCurrentArb, (n, c) => {
        const next = nextIndex(n, c, false);
        const prev = prevIndex(n, c, false);
        const clamped = Math.max(0, Math.min(n - 1, c));

        expect(next).toBe(Math.min(clamped + 1, n - 1));
        expect(prev).toBe(Math.max(clamped - 1, 0));
        // Always a valid index — never escapes [0, n - 1].
        for (const idx of [next, prev]) {
          expect(idx).toBeGreaterThanOrEqual(0);
          expect(idx).toBeLessThanOrEqual(n - 1);
        }
      }),
    );
  });

  it("an empty sequence yields the -1 sentinel for both directions", () => {
    assertProperty(
      fc.property(anyCurrentArb, fc.boolean(), (c, wrap) => {
        expect(nextIndex(0, c, wrap)).toBe(-1);
        expect(prevIndex(0, c, wrap)).toBe(-1);
      }),
    );
  });

  it("repeated advancement (wrap) visits every index exactly once, in order", () => {
    assertProperty(
      fc.property(lengthArb, fc.integer({ min: 0, max: 1000 }), (n, raw) => {
        const start = raw % n;
        const visited: number[] = [];
        let cur = start;
        for (let k = 0; k < n; k++) {
          visited.push(cur);
          cur = nextIndex(n, cur, true);
        }
        // Each step advances by exactly +1 (mod n), in order from `start`...
        for (let k = 0; k < n; k++) {
          expect(visited[k]).toBe((start + k) % n);
        }
        // ...every index is visited exactly once...
        expect(new Set(visited).size).toBe(n);
        // ...and after n steps the cursor returns to the start.
        expect(cur).toBe(start);
      }),
    );
  });

  it("element cursor: next/previous are inverse for elements in the sequence", () => {
    const uniqueSeqArb = fc.uniqueArray(fc.integer(), {
      minLength: 1,
      maxLength: 30,
    });
    assertProperty(
      fc.property(uniqueSeqArb, (order) => {
        for (const x of order) {
          expect(prevTourStep(order, nextTourStep(order, x))).toBe(x);
          expect(nextTourStep(order, prevTourStep(order, x))).toBe(x);
        }
      }),
    );
  });

  it("element cursor: repeated advancement visits every element in order", () => {
    const uniqueSeqArb = fc.uniqueArray(fc.integer(), {
      minLength: 1,
      maxLength: 30,
    });
    assertProperty(
      fc.property(uniqueSeqArb, (order) => {
        const visited: number[] = [];
        let cur = order[0] as number;
        for (let k = 0; k < order.length; k++) {
          visited.push(cur);
          cur = nextTourStep(order, cur);
        }
        // Visits the sequence in its declared order, then wraps to the start.
        expect(visited).toEqual([...order]);
        expect(cur).toBe(order[0]);
      }),
    );
  });
});
