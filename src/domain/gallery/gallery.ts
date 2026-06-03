/**
 * Gallery filtering, lossless category grouping, and the sequential
 * navigation cursor (virtual tour + lightbox).
 * ---------------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 7.1)
 *
 * PURE, deterministic, framework-free logic — no React, no DOM, no side
 * effects. This is the property-testing target for:
 *   • Property 7  (gallery category partition + filtering)  → task 7.2
 *   • Property 8  (sequential navigation cursor)            → task 7.3
 *
 * Layering note (`structure.md`): `domain/` may NOT import from `app/`,
 * `components/`, or `integration/`. Importing TYPES and the canonical id tuple
 * from `content/types.ts` is allowed — types are erased at compile time and the
 * `PHOTO_CATEGORY_IDS` tuple is the single source of truth for category order.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */

import {
  PHOTO_CATEGORY_IDS,
  type Photo,
  type PhotoCatalog,
  type PhotoCategoryId,
} from "@/content/types";

// ===========================================================================
// 1. Gallery filtering & lossless grouping (Req 6.1, 6.2, 6.3 — Property 7)
// ===========================================================================

/**
 * The catalog flattened into a single ordered list of photos.
 *
 * Concatenates every category's `photos` in the order the categories appear in
 * `catalog.categories`, preserving each category's internal photo order. This
 * is the canonical "all photos in the catalog" view that {@link filterByCategory}
 * and {@link groupByCategory} operate over (Req 6.2 — the curated set).
 */
export function allPhotos(catalog: PhotoCatalog): Photo[] {
  return catalog.categories.flatMap((category) => category.photos);
}

/**
 * Return EXACTLY the photos whose `category === categoryId` (Req 6.3).
 *
 * Semantics (deliberately chosen for robustness):
 *   The function searches across EVERY category's `photos` and selects a photo
 *   solely by its own `photo.category` field — it does NOT trust the containing
 *   `PhotoCategory.id`. So if a photo were mis-filed under a category whose
 *   `id` differs from the photo's own `category`, it is still returned for the
 *   category it actually belongs to (and never for the one it was mis-filed
 *   under). This makes the result depend only on the data, never on the
 *   grouping structure, which is precisely what Property 7 asserts:
 *   "`filterByCategory(catalog, c)` returns exactly the photos whose category
 *   is `c`".
 *
 * Order is preserved relative to {@link allPhotos}. Pure and total: an empty
 * catalog (or no matches) yields `[]`.
 */
export function filterByCategory(
  catalog: PhotoCatalog,
  categoryId: PhotoCategoryId,
): Photo[] {
  return allPhotos(catalog).filter((photo) => photo.category === categoryId);
}

/** Photos partitioned by gallery category — one entry per canonical category. */
export type PhotoGroups = Record<PhotoCategoryId, Photo[]>;

/**
 * Group a flat list of photos by their `category`, LOSSLESSLY (Req 6.1).
 *
 * Guarantees:
 *   • Every one of the nine canonical {@link PHOTO_CATEGORY_IDS} is present as a
 *     key, in canonical order (categories with no photos map to `[]`).
 *   • Each photo lands in exactly the group matching its own `category` field.
 *   • Within a group, input order is preserved.
 *
 * LOSSLESSNESS: because `Photo.category` is typed as `PhotoCategoryId`, every
 * input photo belongs to exactly one of the nine groups. Therefore the
 * concatenation of all groups (in any fixed order) equals the input as a
 * multiset — no photo is dropped and none is duplicated. {@link flattenGroups}
 * materializes that union for verification.
 */
export function groupByCategory(photos: readonly Photo[]): PhotoGroups {
  // Seed all nine keys in canonical order so the partition is total and the
  // key iteration order matches PHOTO_CATEGORY_IDS.
  const groups = Object.fromEntries(
    PHOTO_CATEGORY_IDS.map((id) => [id, [] as Photo[]]),
  ) as PhotoGroups;

  for (const photo of photos) {
    groups[photo.category].push(photo);
  }
  return groups;
}

/**
 * Group the whole {@link PhotoCatalog} by category — `groupByCategory(allPhotos(catalog))`.
 *
 * The result is keyed by the photo's OWN category (not the containing
 * `PhotoCategory.id`), so it stays consistent with {@link filterByCategory}.
 */
export function groupCatalogByCategory(catalog: PhotoCatalog): PhotoGroups {
  return groupByCategory(allPhotos(catalog));
}

/**
 * Flatten {@link PhotoGroups} back into a single list, walking the nine
 * categories in canonical {@link PHOTO_CATEGORY_IDS} order.
 *
 * Provided so the losslessness guarantee of {@link groupByCategory} is directly
 * checkable: `flattenGroups(groupByCategory(p))` is a permutation of `p`
 * (same multiset, no loss, no duplication).
 */
export function flattenGroups(groups: PhotoGroups): Photo[] {
  return PHOTO_CATEGORY_IDS.flatMap((id) => groups[id]);
}

// ===========================================================================
// 2. Sequential navigation cursor (Req 6.4, 6.5, 6.6 — Property 8)
// ===========================================================================
//
// One verified cursor reused by BOTH the lightbox (stepping through the photos
// of a category) and the virtual tour (stepping through the ordered category
// list). The index-based core (`nextIndex`/`prevIndex`) is the single source of
// truth; the element-based tour helpers (`nextTourStep`/`prevTourStep`) are thin
// wrappers over it.
//
// WRAP/CLAMP RULE (precise):
//   Let n = length and let c = current clamped into [0, n - 1].
//     • n <= 0           → return -1 (sentinel: an empty sequence has no index).
//     • wrap === true    → next: (c + 1) mod n ;  prev: (c - 1 + n) mod n
//     • wrap === false   → next: min(c + 1, n - 1) ;  prev: max(c - 1, 0)
//   Out-of-range `current` is CLAMPED into range first (negative → 0,
//   >= n → n - 1), so the cursor is total and deterministic for any integer.
//
//   With wrap === true and n >= 1, repeatedly applying `nextIndex` from any
//   start visits all n positions in order before returning to the start — this
//   is what powers "advance through the tour / lightbox and see every item"
//   (Req 6.6) and Property 8's round-trip guarantee. The lightbox and virtual
//   tour both use wrap === true.

/** Clamp an arbitrary integer index into the valid range `[0, length - 1]`. */
function clampIndex(length: number, current: number): number {
  if (current < 0) return 0;
  if (current > length - 1) return length - 1;
  return current;
}

/**
 * The next index after `current` in a sequence of `length` items.
 *
 * @param wrap `true` cycles past the end back to `0` (lightbox/tour default);
 *             `false` clamps at the last index.
 * @returns the next index, or `-1` when `length <= 0`.
 */
export function nextIndex(
  length: number,
  current: number,
  wrap: boolean,
): number {
  if (length <= 0) return -1;
  const c = clampIndex(length, current);
  return wrap ? (c + 1) % length : Math.min(c + 1, length - 1);
}

/**
 * The previous index before `current` in a sequence of `length` items.
 *
 * @param wrap `true` cycles past the start to the last index (lightbox/tour
 *             default); `false` clamps at `0`.
 * @returns the previous index, or `-1` when `length <= 0`.
 */
export function prevIndex(
  length: number,
  current: number,
  wrap: boolean,
): number {
  if (length <= 0) return -1;
  const c = clampIndex(length, current);
  return wrap ? (c - 1 + length) % length : Math.max(c - 1, 0);
}

/**
 * The next element after `current` in an ordered sequence, wrapping at the end.
 *
 * Used by the virtual tour (`order` = the category sequence) and reusable for
 * any ordered list (generic over `T`). Built on {@link nextIndex} with
 * `wrap = true`, so repeated calls from any starting element visit every
 * element in order then cycle (Req 6.6).
 *
 * Total-function behavior for edge inputs:
 *   • empty `order`            → returns `current` unchanged (nothing to step).
 *   • `current` not in `order` → returns the FIRST element (start the tour).
 *   • elements assumed unique  → uses the first `===` match (`indexOf`).
 */
export function nextTourStep<T>(order: readonly T[], current: T): T {
  if (order.length === 0) return current;
  const idx = order.indexOf(current);
  if (idx === -1) return order[0] as T;
  return order[nextIndex(order.length, idx, true)] as T;
}

/**
 * The previous element before `current` in an ordered sequence, wrapping at the
 * start. Mirror of {@link nextTourStep}.
 *
 * Total-function behavior for edge inputs:
 *   • empty `order`            → returns `current` unchanged.
 *   • `current` not in `order` → returns the LAST element (wrap to the end).
 */
export function prevTourStep<T>(order: readonly T[], current: T): T {
  if (order.length === 0) return current;
  const idx = order.indexOf(current);
  if (idx === -1) return order[order.length - 1] as T;
  return order[prevIndex(order.length, idx, true)] as T;
}

// ===========================================================================
// 3. Virtual-tour category order (Req 6.6)
// ===========================================================================

/**
 * The ordered category sequence the virtual tour steps through, derived from
 * the canonical {@link PHOTO_CATEGORY_IDS} so the tour order can never drift
 * from the gallery's declared category order (Req 6.1, 6.6).
 *
 * Pair with {@link nextTourStep}/{@link prevTourStep} to advance the tour.
 */
export const VIRTUAL_TOUR_CATEGORY_ORDER: readonly PhotoCategoryId[] =
  PHOTO_CATEGORY_IDS;

/**
 * Derive the virtual-tour category order from a specific catalog instead of the
 * static canonical order.
 *
 * Categories are ordered by their `order` field ascending; ties are broken by
 * canonical {@link PHOTO_CATEGORY_IDS} position so the result is always
 * deterministic. This lets the tour follow a catalog's authored ordering while
 * remaining stable (Req 6.6).
 */
export function tourOrderFromCatalog(
  catalog: PhotoCatalog,
): PhotoCategoryId[] {
  const canonicalIndex = (id: PhotoCategoryId): number =>
    PHOTO_CATEGORY_IDS.indexOf(id);

  return [...catalog.categories]
    .sort((a, b) =>
      a.order !== b.order
        ? a.order - b.order
        : canonicalIndex(a.id) - canonicalIndex(b.id),
    )
    .map((category) => category.id);
}
