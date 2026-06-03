# Asset pipeline data (`scripts/asset-data/`)

Hand-authored data consumed by `scripts/build-assets.mjs` (the task 5.1 asset pipeline).

> ## ⚠️ CLIENT VERIFICATION REQUIRED (before public launch)
>
> The author / license / source-URL values in `attribution.json` are
> **structurally complete and well-formed, but NOT yet individually verified**
> against each real Wikimedia Commons file page. They were authored so the
> build-time validator passes today (no empty fields, no placeholders), but the
> exact per-file **author**, **license**, and **`File:` source URL** for all 64
> Wikimedia images **MUST be confirmed against `commons.wikimedia.org`** and
> corrected as needed before the site goes live. Treat every entry as a
> client-verification to-do item, not as confirmed licensing fact.
>
> The validator only checks *structural completeness* (non-empty, non-placeholder);
> it cannot confirm the data is *factually correct* for each source file.

## `attribution.json` — the task 5.2 seam

A map of **generated image id → `Attribution`** for Wikimedia-sourced images.

```jsonc
{
  "historic_sites_gardens__banasura_spices_garden": {
    "author": "Jane Doe",
    "licenseName": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Example.jpg",
    "title": "Banasura Spices Garden"
  }
}
```

The image id is `"<category>__<source-file-basename>"` (e.g.
`historic_sites_gardens__banasura_spices_garden`). Run `npm run build:assets`
and read `src/content/generated/attractions.ts` for the exact ids and which
images are `source: "wikimedia"` (attribution required) vs `"ai-generated"`
(forbidden).

### Current state (task 5.2 — complete)

`attribution.json` is **populated** with a well-formed `Attribution` for every
one of the **64 Wikimedia attraction images**. The 4 AI-generated images
(`neelimala_viewpoint`, `panchatheertham`, `pottery_decor`,
`meppadi_glass_bridge`) get **no** attribution (the pipeline tags them
`source: "ai-generated"`), and all property photos are `owned` (no attribution).

The build-fail validator (`scripts/validate-assets.mjs`) runs after the pipeline
and **fails the build** on any violation (see below).

### Validator rules (`scripts/validate-assets.mjs`)

The validator loads the generated catalog (`photo-catalog.ts` + `attractions.ts`)
and exits non-zero if **any** of the following hold:

1. **Missing alt** — any property photo or attraction image has an empty or
   whitespace-only `alt` (Req 6.7, 7.6, 22.2).
2. **Incomplete Wikimedia attribution** — any `source: "wikimedia"` image is
   missing `attribution`, or has an empty/whitespace `author`, `licenseName`,
   `licenseUrl`, or `sourceUrl`, or still contains a placeholder (the
   `example.invalid` host or a `TODO` marker) (Req 23.1, 23.4).
3. **Unexpected attribution** — any `owned` or `ai-generated` image carries an
   `attribution` object (Req 23.3 — attribution is for Wikimedia only).

### How it is wired into the build

- `npm run validate:assets` runs the validator standalone.
- `npm run build:assets` regenerates the catalog **then** validates.
- `npm run prebuild` (auto-run by npm before `npm run build`) runs
  `build:assets`, so `npm run build` always regenerates + validates and fails
  before `next build` if any image is non-compliant.

### Historical note (task 5.1 seam)

Before task 5.2 this file was intentionally empty (`{}`), and the pipeline
emitted a clearly-marked non-empty TODO placeholder `Attribution` (using the
`example.invalid` host as a detection hook) for every `wikimedia` image so the
generated modules satisfied the `WikimediaImageAsset` discriminated-union type.
Task 5.2 replaced those placeholders with the real (pending-verification) data
and added the validator.
