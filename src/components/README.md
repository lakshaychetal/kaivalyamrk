# `components/` — Presentation layer

Design-system components and page sections (PascalCase, e.g. `SiteHeader`,
`BookNowButton`, `GalleryGrid`, `AttractionCard`). One component per page.

Composes pages from design-system pieces and consumes `domain/` (pure logic)
and `integration/` (third-party wrappers). Components never embed vendor
specifics directly — they go through `integration/`.

Populated from task 3.1 onward.
