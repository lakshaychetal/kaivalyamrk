# `content/` — Typed content collections

Version-controlled, typed content (TypeScript modules, MDX for prose, JSON for
catalogs). No CMS.

Compile-time guarantees map directly onto the correctness properties: every
`ImageAsset` has non-empty `alt` and declared `width`/`height`; every
`wikimedia`-sourced asset has complete attribution.

Holds the two rooms, ~9 facilities, the photo `PhotoCatalog`, the
`AttractionItem[]` directory, reviews, and Reach Us routes.

Populated from task 4.1 onward. Generated catalogs from the asset pipeline land
in `content/generated/` (gitignored).
