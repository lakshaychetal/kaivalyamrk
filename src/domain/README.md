# `domain/` — Pure logic (property-testing target)

Pure, deterministic functions only — no side effects, no rendering, no imports
from `app/`, `components/`, or `integration/`.

Houses: navigation resolution (`resolveActiveNav`), URL builders
(`buildBookingUrl`, `buildDirectionsUrl`, `buildWhatsAppUrl`), attribution
resolution, gallery/tour cursors (`filterByCategory`, `nextTourStep`), the
consent gate (`mayNotify`), analytics aggregation (`aggregateReport`), and SEO
metadata builders (`buildPageMeta`).

This is where the 22 correctness properties live. Co-locate `fast-check`
property tests with the function they exercise, each tagged
`Feature: kaivalyam-homestay-website, Property {n}: ...`.

Populated from task 6.1 onward.
