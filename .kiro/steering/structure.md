# Project Structure

## Current Layout (pre-scaffold)

```
.
├── .kiro/
│   ├── specs/kaivalyam-homestay-website/   # requirements.md, design.md, tasks.md, .config.kiro
│   └── steering/                           # product.md, tech.md, structure.md
├── kaivalyam_assets/                       # source images (input to the build-time asset pipeline)
│   ├── property/                           # property photos → 9 public gallery categories
│   └── attractions/                        # local attraction images → 11 public categories
├── Kaivalyam Logo apvd.png                 # brand logo (header + token derivation)
└── ui-ux-pro-max-skill.md                  # UI/UX guidance the design system conforms to
```

The spec (`requirements.md` → `design.md` → `tasks.md`) is the source of truth. Read it before implementing; each task references the granular requirement clauses it satisfies.

## Source Asset Organization

### `kaivalyam_assets/property/` → Gallery categories

Folder names map to the 9 gallery category ids: `night_ambiance`, `exteriors`, `outdoor_living`, `garden_pathways`, `interiors`, `art_sculptures`, `architecture`, `library_reading`, `play_area` (plus `nature_details`). Night-ambiance images are the Home hero candidates. All property photos are `owned` or `ai-generated` — **no attribution required**.

### `kaivalyam_assets/attractions/` → Attraction categories

Lettered folders (`a`–`k`) map to the 11 public attraction categories. The religious-sites group is split across `e1`–`e4` mapping to **Hindu / Jain / Christian / Muslim** subgroups. Most attraction images are sourced from Wikimedia (`source: 'wikimedia'`, **attribution required**); a few are AI-generated or owned (no attribution).

## Planned Application Layout (`src/`)

Scaffold with the App Router and `src/` layout. Keep the layered separation from the design:

```
src/
├── app/            # Next.js App Router pages, layouts, route handlers (API)
├── components/     # Design-system components + page sections (presentation)
├── domain/         # PURE logic — property-tested, no side effects, no rendering
├── integration/    # Typed wrappers for eeabsolute, Razorpay-in-flow, WATI, analytics
├── content/        # Typed content collections (TS modules, MDX, JSON catalogs)
└── lib/            # Shared helpers
```

## Layer Rules

- **`domain/`** holds pure, deterministic functions only (URL builders, navigation resolver, gallery/tour cursors, consent gate, analytics aggregation, SEO builders). This is the property-testing target. No imports from `app/`, `components/`, or `integration/`.
- **`integration/`** is the only place that touches third-party vendors. It depends on `domain/` for pure logic (e.g. URL building) but the rest of the app depends on `integration/` interfaces, not vendor specifics.
- **`components/`** compose pages from design-system pieces and consume `domain/` + `integration/`. One component per page.
- **`content/`** is typed and version-controlled — compile-time guarantees (every image has alt text, every Wikimedia asset has attribution) map directly onto the correctness properties.
- **`app/` route handlers** (analytics ingestion, booking webhook, WATI notify) are server-side, hold secrets, and write to the analytics store.

## Naming Conventions

- **Feature / category ids:** snake_case to match asset folders and the typed category unions (e.g. `night_ambiance`, `historic_sites_gardens`).
- **Components:** PascalCase (`SiteHeader`, `BookNowButton`, `GalleryGrid`, `AttractionCard`).
- **Pure functions:** camelCase verbs (`buildBookingUrl`, `resolveActiveNav`, `filterByCategory`, `aggregateReport`).
- **Test files:** co-locate property tests with the domain function they exercise; tag each with the `Feature: kaivalyam-homestay-website, Property {n}: ...` comment.
- **Admin report route:** must be excluded from `sitemap.xml` and `robots.txt` and marked `noindex` / non-cacheable.
