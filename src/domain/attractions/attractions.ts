/**
 * Attractions category grouping and the religious-sites subgroup split.
 * ---------------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 7.4)
 *
 * PURE, deterministic, framework-free logic — no React, no DOM, no side
 * effects. This is the property-testing target for:
 *   • Property 9 (attractions category + religious-subgroup partition) → task 7.5
 *
 * Layering note (`structure.md`): `domain/` may NOT import from `app/`,
 * `components/`, or `integration/`. Importing TYPES and the canonical id tuples
 * from `content/types.ts` IS allowed — types are erased at compile time and the
 * `ATTRACTION_CATEGORY_IDS` / `RELIGIOUS_SUBGROUPS` tuples are the single source
 * of truth for category and subgroup order, so the grouping order can never
 * drift from the content model.
 *
 * Requirements: 7.1, 7.5
 */

import {
  ATTRACTION_CATEGORY_IDS,
  RELIGIOUS_SUBGROUPS,
  type AttractionCategoryId,
  type AttractionItem,
  type ReligiousAttractionItem,
  type ReligiousSubgroup,
} from "@/content/types";

// ===========================================================================
// 1. Predicates & safe subgroup extraction (Property 9 biconditional)
// ===========================================================================
//
// The content model already encodes the biconditional "a religious subgroup is
// present IF AND ONLY IF category === 'religious_sites'" structurally, via the
// `AttractionItem` discriminated union (`ReligiousAttractionItem` REQUIRES a
// `subgroup`; `NonReligiousAttractionItem` FORBIDS one). The helpers below give
// the runtime grouping code a single, type-narrowing way to respect/verify that
// invariant instead of re-deriving it ad hoc.

/**
 * Type guard: is this attraction in the Religious Sites category?
 *
 * Narrows to {@link ReligiousAttractionItem}, so callers can read `.subgroup`
 * without a non-null assertion. Decides solely on the discriminant
 * (`item.category === 'religious_sites'`) — the one carrier of truth for the
 * biconditional (Req 7.5).
 */
export function isReligious(
  item: AttractionItem,
): item is ReligiousAttractionItem {
  return item.category === "religious_sites";
}

/**
 * Safely extract an item's religious subgroup.
 *
 * Returns the {@link ReligiousSubgroup} for a Religious Sites item, and `null`
 * for every other category. This is the runtime witness of the biconditional:
 * `subgroupOf(item) !== null` is true EXACTLY when `isReligious(item)` is true
 * (Property 9). Total and pure — defined for every `AttractionItem`.
 */
export function subgroupOf(item: AttractionItem): ReligiousSubgroup | null {
  return isReligious(item) ? item.subgroup : null;
}

// ===========================================================================
// 2. Lossless category grouping (Req 7.1 — Property 9)
// ===========================================================================

/**
 * Attractions partitioned by category — one entry per canonical category.
 *
 * A `Record` keyed by every {@link AttractionCategoryId}. Chosen over an
 * `{ id, items }[]` array because it gives O(1) keyed access while still being
 * iterable in canonical order: `Object.keys` follows insertion order, and the
 * keys are seeded from {@link ATTRACTION_CATEGORY_IDS}, so iterating the record
 * walks the 11 categories in their declared display order (Req 7.1). Mirrors the
 * gallery module's `PhotoGroups` shape for consistency.
 */
export type AttractionGroups = Record<AttractionCategoryId, AttractionItem[]>;

/**
 * Group a flat list of attractions by their `category`, LOSSLESSLY (Req 7.1).
 *
 * Guarantees:
 *   • Every one of the eleven canonical {@link ATTRACTION_CATEGORY_IDS} is
 *     present as a key, in canonical order — categories with zero items map to
 *     `[]` (empty groups are present, not omitted), so the partition is total
 *     and the output shape is independent of the input.
 *   • Each item lands in exactly the group matching its own `category` field.
 *   • Within a group, input order is preserved.
 *
 * LOSSLESSNESS: because `AttractionItem.category` is typed as
 * `AttractionCategoryId`, every input item belongs to exactly one of the eleven
 * groups. Therefore the concatenation of all groups (in any fixed order) equals
 * the input as a multiset — no item is dropped and none is duplicated.
 * {@link flattenGroups} materializes that union for verification.
 *
 * Pure and total: an empty input yields the 11 canonical keys each mapped to `[]`.
 */
export function groupByCategory(
  items: readonly AttractionItem[],
): AttractionGroups {
  // Seed all eleven keys in canonical order so the partition is total and the
  // key iteration order matches ATTRACTION_CATEGORY_IDS.
  const groups = Object.fromEntries(
    ATTRACTION_CATEGORY_IDS.map((id) => [id, [] as AttractionItem[]]),
  ) as AttractionGroups;

  for (const item of items) {
    groups[item.category].push(item);
  }
  return groups;
}

/**
 * Flatten {@link AttractionGroups} back into a single list, walking the eleven
 * categories in canonical {@link ATTRACTION_CATEGORY_IDS} order.
 *
 * Provided so the losslessness guarantee of {@link groupByCategory} is directly
 * checkable: `flattenGroups(groupByCategory(items))` is a permutation of
 * `items` (same multiset, no loss, no duplication).
 */
export function flattenGroups(groups: AttractionGroups): AttractionItem[] {
  return ATTRACTION_CATEGORY_IDS.flatMap((id) => groups[id]);
}

// ===========================================================================
// 3. Religious-sites subgroup split (Req 7.5 — Property 9)
// ===========================================================================

/**
 * Religious-sites attractions partitioned by subgroup — one entry per canonical
 * subgroup. Keyed by every {@link ReligiousSubgroup} in canonical order
 * (Hindu → Jain → Christian → Muslim), matching {@link RELIGIOUS_SUBGROUPS}.
 *
 * Only {@link ReligiousAttractionItem}s appear here, so the value type is the
 * narrowed religious item (each carries a `subgroup`).
 */
export type ReligiousSubgroups = Record<
  ReligiousSubgroup,
  ReligiousAttractionItem[]
>;

/**
 * Split the Religious Sites items into the four canonical subgroups (Req 7.5).
 *
 * Behavior:
 *   • Non-religious items are IGNORED — only items with
 *     `category === 'religious_sites'` are considered (selected via
 *     {@link isReligious}, which also narrows the type).
 *   • Every one of the four canonical {@link RELIGIOUS_SUBGROUPS} is present as
 *     a key, in canonical order; subgroups with zero items map to `[]`.
 *   • Within a subgroup, input order is preserved.
 *
 * LOSSLESSNESS over the religious subset: every religious item carries exactly
 * one `subgroup` (guaranteed by the type), so it lands in exactly one of the
 * four buckets. The concatenation of all four buckets equals the religious
 * subset of the input as a multiset — no religious item is dropped or
 * duplicated. {@link flattenReligiousSubgroups} materializes that union for
 * verification.
 *
 * Pure and total: input with no religious items yields the 4 canonical keys
 * each mapped to `[]`.
 */
export function groupReligiousBySubgroup(
  items: readonly AttractionItem[],
): ReligiousSubgroups {
  // Seed all four keys in canonical order so the partition is total and the key
  // iteration order matches RELIGIOUS_SUBGROUPS.
  const subgroups = Object.fromEntries(
    RELIGIOUS_SUBGROUPS.map((id) => [id, [] as ReligiousAttractionItem[]]),
  ) as ReligiousSubgroups;

  for (const item of items) {
    if (isReligious(item)) {
      subgroups[item.subgroup].push(item);
    }
  }
  return subgroups;
}

/**
 * Flatten {@link ReligiousSubgroups} back into a single list, walking the four
 * subgroups in canonical {@link RELIGIOUS_SUBGROUPS} order.
 *
 * Provided so the losslessness guarantee of {@link groupReligiousBySubgroup} is
 * directly checkable: `flattenReligiousSubgroups(groupReligiousBySubgroup(items))`
 * is a permutation of `items.filter(isReligious)`.
 */
export function flattenReligiousSubgroups(
  subgroups: ReligiousSubgroups,
): ReligiousAttractionItem[] {
  return RELIGIOUS_SUBGROUPS.flatMap((id) => subgroups[id]);
}
