# Implementation Plan: Kaivalyam Homestay Website

## Overview

This plan implements the Kaivalyam Homestay Website as a statically-generated (SSG/ISR) Next.js (App Router) + TypeScript application with a Tailwind semantic-token layer, Lucide icons, a `next/image` + `sharp` build-time asset pipeline, GA4 plus a first-party analytics store (serverless route handlers), and an authenticated SSR admin report.

The work is sequenced so the **pure domain layer** (navigation, URL builders, attribution resolution, gallery/tour cursors, consent gate, analytics aggregation, SEO metadata) is built and property-tested before the UI that consumes it, and the **integration layer** (eeabsolute booking/PMS/channel-manager widget host, Razorpay-in-flow, WATI click-to-chat and consent-gated notifications) is isolated behind typed wrappers. No booking, PMS, channel, or payment logic is built — those are external and covered by integration/smoke tests, not PBT.

All 22 correctness properties from the design are implemented as `fast-check` property-based tests integrated with Vitest, each running a **minimum of 100 iterations** and tagged with a comment in the form `Feature: kaivalyam-homestay-website, Property {n}: {property text}`. External booking/PMS/channel/payment behavior is verified with integration and smoke tests. Test sub-tasks are marked optional with `*`.

Asset sources:
- Property photos: `kaivalyam_assets/property/` (10 category folders incl. `night_ambiance`, `nature_details`)
- Attraction images: `kaivalyam_assets/attractions/` (folders `a`–`k`, with `e1`–`e4` mapping to the four religious subgroups)
- Logo: `Kaivalyam Logo apvd.png` at project root

## Tasks

- [x] 1. Project foundation and tooling
  - [x] 1.1 Initialize the Next.js App Router + TypeScript project
    - Scaffold a Next.js (App Router) app with TypeScript strict mode, ESLint, and the `src/` layout (`app/`, `components/`, `domain/`, `content/`, `integration/`, `lib/`)
    - Configure `next.config` for `next/image` (AVIF/WebP formats, device/image sizes) and set up base scripts (dev/build/lint/test)
    - Add `.gitignore`, baseline `tsconfig` path aliases, and a placeholder root layout/page so the app builds
    - _Requirements: 1.1_

  - [x] 1.2 Configure Tailwind with a semantic token layer
    - Install and configure Tailwind CSS wired to CSS variables/`@theme` so semantic tokens (not raw hex) drive utilities
    - Create the global stylesheet importing the token layer and base resets; reserve files for color/type/spacing tokens (populated in task 2.1)
    - _Requirements: 19.2, 19.3_

  - [x] 1.3 Set up the testing toolchain
    - Configure Vitest + React Testing Library + jsdom for unit/component/property tests
    - Install and configure `fast-check`, and add a shared PBT helper that enforces `numRuns >= 100`
    - Configure Playwright + axe for E2E/accessibility tests (config only; specs added later)
    - _Requirements: 19.7_

- [x] 2. Design system tokens
  - [x] 2.1 Define logo-derived design tokens
    - Extract earthy brown + green palette from `Kaivalyam Logo apvd.png` and encode semantic color tokens (`--color-primary`, `--color-secondary`, `--color-accent`, `--color-surface`, `--color-on-surface`, `--color-on-surface-muted`, `--color-on-primary`, `--color-border`, `--color-focus`, `--color-success`, `--color-error`) verified to meet WCAG AA pairs
    - Define the type scale (`12·14·16·18·24·32·48`, base 16, line-height 1.5–1.75, weights 400/500/600–700, `font-display: swap`), the 4/8px spacing scale, and breakpoint tokens (mobile 375, tablet 768, desktop 1024, large 1440)
    - Export typed token modules (e.g. `tokens.ts`) exposing color pairs, interactive size tokens, and body-text style tokens for tests to consume
    - _Requirements: 19.1, 19.2, 18.1, 18.4_

  - [x]* 2.2 Write property test for color-token contrast
    - **Property 5: Contrast meets WCAG AA for all token pairs**
    - **Validates: Requirements 2.8, 22.1**

  - [x]* 2.3 Write property test for touch-target and body-text sizing tokens
    - **Property 21: Touch-target and body-text sizing**
    - **Validates: Requirements 18.4, 18.5**

- [x] 3. Core design-system components
  - [x] 3.1 Implement core DS components
    - Build `Button` (primary/secondary/tertiary), the single `BookNowButton` primary-CTA component, `Card` (room/attraction/facility/review variants), and form controls with visible labels, helper text, inline-on-blur validation, and `role="alert"` errors
    - Enforce min 44×44px targets, ≥8px spacing, visible focus ring (`--color-focus`), press feedback without layout shift, disabled at reduced opacity, and `prefers-reduced-motion` handling for all motion
    - Use Lucide icons exclusively with `aria-label` on icon-only controls
    - _Requirements: 19.4, 19.5, 19.6, 22.3, 22.5, 22.7, 18.5_

  - [x] 3.2 Implement the responsive image component
    - Build a `ResponsiveImage` wrapper over `next/image` that always emits declared width/height (or aspect-ratio), AVIF/WebP sources, `srcset`/`sizes`, `loading="lazy"` for non-priority images and `priority` for hero images, and an `onError` branded placeholder fallback (Req 7.7)
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 7.7_

  - [x]* 3.3 Write property test for the image rendering pipeline
    - **Property 11: Image rendering pipeline invariants**
    - **Validates: Requirements 20.1, 20.2, 20.3, 20.4**

  - [x]* 3.4 Write property test for accessibility invariants of interactive/feedback elements
    - **Property 22: Accessibility invariants for interactive and feedback elements**
    - **Validates: Requirements 22.3, 22.5, 22.6**

- [x] 4. Content model and collections
  - [x] 4.1 Define the typed content model
    - Implement TypeScript interfaces: `ImageAsset` (required non-empty `alt`, required `width`/`height`, `source`), `Attribution`, `Room`, `Facility`, `Photo`/`PhotoCategory`/`PhotoCatalog`, `AttractionItem` (+ `ReligiousSubgroup`), `Review`, `RoadRoute`, `TransportHub`, and the analytics/booking record types
    - Define the category id unions for the 9 gallery categories and 11 attraction categories
    - _Requirements: 1.1, 4.4, 6.1, 7.1, 7.5, 10.1, 10.2, 11.1, 20.3, 23.3_

  - [x] 4.2 Author the static content collections
    - Author typed content for the two rooms (Luxury Cottage duplex + Classic Room with amenities), the ~9 facilities, the Wayanad/About narrative + signature offerings, the Cuisine copy, the Reach Us routes (Kozhikode, Kannur, Nilambur, Ooty, Gudalur, Bengaluru, Mysuru) + airport/railway distances + Padichira/Pulpally fact, reviews data (with empty-state support), and site/contact info (phone, email, address, WhatsApp number, map location)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 5.1, 5.3, 8.1, 8.2, 9.1, 10.1, 10.2, 10.3, 11.1_

- [x] 5. Asset pipeline and attribution
  - [x] 5.1 Build the build-time asset pipeline
    - Implement a `sharp`-based build step that reads each source image under `kaivalyam_assets/property/` (10 categories) and `kaivalyam_assets/attractions/` (`a`–`k`, `e1`–`e4`), probes intrinsic width/height, encodes responsive AVIF/WebP (+JPEG fallback) at 400/800/1200/1600 widths, and emits `srcset`/`sizes`
    - Generate a typed `PhotoCatalog` (mapping the 10 folders to the 9 public gallery categories, flagging `night_ambiance` as hero candidates) and a typed `AttractionItem[]` (mapping `e1`–`e4` to Hindu/Jain/Christian/Muslim subgroups) with `source` tags
    - _Requirements: 20.1, 20.4, 6.1, 6.2, 7.1, 7.5, 2.1_

  - [x] 5.2 Author attribution data and enforce build-time validation
    - Author `attribution.json` (author, license name, license URL, source URL) for the ~60 Wikimedia attraction images; tag the 4 AI-generated and remaining owned images with no attribution
    - Implement the asset-pipeline validator that **fails the build** if any image lacks non-empty `alt` or any `wikimedia`-sourced image lacks complete attribution
    - _Requirements: 23.1, 23.3, 23.4, 6.7, 7.6, 22.2_

  - [x]* 5.3 Write property test for descriptive alternative text
    - **Property 4: Every image has descriptive alternative text**
    - **Validates: Requirements 6.7, 7.6, 22.2**

  - [x]* 5.4 Write property test for the attribution biconditional
    - **Property 6: Image attribution biconditional and completeness**
    - **Validates: Requirements 23.1, 23.3, 23.4**

- [x] 6. Domain logic — navigation, URL builders, and consent
  - [x] 6.1 Implement the navigation model and active-route resolver
    - Define the single `navigationModel` (required nav links + `Book Now` CTA) and the pure `resolveActiveNav(path, model)` returning at most one active item
    - _Requirements: 1.2, 1.3, 1.4, 1.5_

  - [x]* 6.2 Write property test for navigation completeness and single active item
    - **Property 2: Navigation completeness and single active item**
    - **Validates: Requirements 1.2, 1.4, 1.5**

  - [x] 6.3 Implement `buildBookingUrl`
    - Pure, deterministic builder producing the eeabsolute embed/deep-link URL parameterized with `country=India`, `state=Kerala`, and the property `city`, plus optional `propertyId`/extra params
    - _Requirements: 12.2, 12.3, 1.3, 4.6, 19.6_

  - [x]* 6.4 Write property test for booking-action resolution
    - **Property 1: Every booking action resolves to the configured booking engine**
    - **Validates: Requirements 1.3, 4.6, 12.2, 12.3, 19.6**

  - [x] 6.5 Implement `buildDirectionsUrl`
    - Pure builder producing a valid external map URL that encodes the property address/coordinates (used by Contact and Reach Us "Get Directions")
    - _Requirements: 9.2, 9.5, 10.4_

  - [x]* 6.6 Write property test for the directions URL builder
    - **Property 12: Directions URL builder**
    - **Validates: Requirements 9.2, 9.5, 10.4**

  - [x] 6.7 Implement `buildWhatsAppUrl`
    - Pure builder producing a `wa.me`/WATI deep link encoding the homestay account number and any optional prefilled message exactly
    - _Requirements: 2.7, 9.3, 16.3_

  - [x]* 6.8 Write property test for the WhatsApp URL builder
    - **Property 13: WhatsApp URL builder**
    - **Validates: Requirements 2.7, 9.3, 16.3**

  - [x] 6.9 Implement the consent gate `mayNotify`
    - Pure gate returning true iff the booking's WhatsApp consent flag is true, to guard all server-side notifications
    - _Requirements: 16.5_

  - [x]* 6.10 Write property test for the consent gate
    - **Property 14: WhatsApp notifications are consent-gated**
    - **Validates: Requirements 16.5**

- [x] 7. Domain logic — gallery and attractions
  - [x] 7.1 Implement gallery filtering and virtual-tour cursor
    - Pure `filterByCategory(catalog, c)`, lossless category grouping, and deterministic `nextTourStep`/`prevTourStep` (and lightbox next/prev) cursors over ordered sequences with defined wrap/clamp rules
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x]* 7.2 Write property test for gallery category partition and filtering
    - **Property 7: Gallery category partition and filtering**
    - **Validates: Requirements 6.1, 6.2, 6.3**

  - [x]* 7.3 Write property test for the sequential navigation cursor
    - **Property 8: Sequential navigation cursor (lightbox and virtual tour)**
    - **Validates: Requirements 6.4, 6.5, 6.6**

  - [x] 7.4 Implement attractions grouping and religious-subgroup logic
    - Pure grouping of `AttractionItem[]` into the 11 categories with lossless partition, and subgroup assignment (Hindu/Jain/Christian/Muslim) present iff category is Religious Sites
    - _Requirements: 7.1, 7.5_

  - [x]* 7.5 Write property test for attractions category and religious-subgroup partition
    - **Property 9: Attractions category and religious-subgroup partition**
    - **Validates: Requirements 7.1, 7.5**

- [x] 8. Domain logic — SEO metadata
  - [x] 8.1 Implement SEO builders
    - Pure `buildPageMeta(page)` producing a unique title, meta description, and OpenGraph title/description/preview image per page; a `LodgingBusinessJsonLd` builder with name/location/contact; and a heading-outline helper
    - _Requirements: 21.1, 21.2, 21.4, 21.5_

  - [x]* 8.2 Write property test for page metadata completeness and uniqueness
    - **Property 17: Page metadata is complete and unique**
    - **Validates: Requirements 21.1, 21.5**

  - [x]* 8.3 Write property test for heading hierarchy
    - **Property 18: Heading hierarchy never skips levels**
    - **Validates: Requirements 21.2**

  - [x]* 8.4 Write property test for LodgingBusiness structured data
    - **Property 19: LodgingBusiness structured data completeness**
    - **Validates: Requirements 21.4**

- [x] 9. Checkpoint - pure-logic and component tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Site shell and layout
  - [x] 10.1 Implement the site header and navigation
    - Build `SiteHeader` rendering the logo (official proportions + clear space), `PrimaryNav` + `MobileNavMenu` (collapsible below tablet breakpoint, identical placement, focus management) driven by `navigationModel` with active-state highlighting, and the persistent `BookNowButton` resolving via `buildBookingUrl`
    - _Requirements: 1.2, 1.3, 1.5, 1.6, 1.8_

  - [x] 10.2 Implement the site footer
    - Build `SiteFooter` with homestay name, contact summary, secondary nav links, and the "Photo credits" link to the Photo Credits page
    - _Requirements: 1.7, 23.2_

  - [x] 10.3 Implement the root layout, skip link, and viewport configuration
    - Wire the root layout with `SkipToContent` as the first focusable element jumping to `<main id="main">`, the viewport meta (device-width, initial-scale 1, zoom allowed), the GA4 script slot, and a linked privacy notice
    - _Requirements: 22.8, 18.3, 17.7_

  - [x]* 10.4 Write property test for footer completeness
    - **Property 3: Footer completeness**
    - **Validates: Requirements 1.7, 23.2**

- [x] 11. Content marketing pages
  - [x] 11.1 Implement the Home page
    - Build the hero (`night_ambiance` priority image, tagline "EXPERIENCE ULTIMATE SOLITUDE #KAIVALYAM", primary Book Now CTA with ≥4.5:1 overlaid-text contrast), philosophy intro → About link, room-type summary → Rooms link, facilities summary → Facilities link, reviews preview → Reviews, and a WhatsApp entry point
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 16.2_

  - [x] 11.2 Implement the About page
    - Present the meaning of "Kaivalyam", pet-friendly long-stay positioning, the Wayanad region story, signature offerings (guided tours, nature walks, community interaction, 24-hour assistance), and illustrative property photos
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 11.3 Implement the Rooms page
    - Present Luxury Cottage and Classic Room as separate entries with descriptions, full amenity lists, property photos, and per-room booking action resolving to the booking engine
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 11.4 Implement the Facilities page
    - Present the ~9 facilities each with an icon or photo and a textual description
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 11.5 Implement the Cuisine page
    - Present authentic Malayali veg/non-veg cuisine, home-cooked and outdoor dining experiences, and illustrative photos
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 11.6 Implement the Reach Us page
    - Present road-connectivity directions from the seven origin cities, nearest airport/railway distances, the Padichira (~10km from Pulpally) fact, and a "Get Directions" action via `buildDirectionsUrl`
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [x] 11.7 Implement the Reviews section
    - Build the `ReviewsSection` rendering each review's name, text, and numeric rating when present, with an explicit empty state when no reviews exist; reusable on Home and as a full section
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [x]* 11.8 Write property test for collection render-completeness
    - **Property 20: Collection render-completeness** (room amenities, facilities, reviews)
    - **Validates: Requirements 4.4, 5.1, 5.2, 5.3, 11.1, 11.2**

- [x] 12. Gallery, attractions, and photo credits pages
  - [x] 12.1 Implement the Gallery page with lightbox and virtual tour
    - Build `GalleryGrid` (grouped by the 9 categories, category filtering), `Lightbox` (enlarged view, next/previous/close, focus trap, Escape/arrow keys, ≥44px aria-labeled controls), and `VirtualTour` stepping through categories in sequence — all using the task 7.1 cursors and `ResponsiveImage`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [x] 12.2 Implement the Attractions Directory page
    - Build `AttractionsDirectory` grouping items into the 11 categories with Religious Sites split into Hindu/Jain/Christian/Muslim subgroups, and `AttractionCard` (name + image with alt + error placeholder + optional external link opening in a new context via `target="_blank" rel="noopener noreferrer"`)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [x]* 12.3 Write property test for conditional, safe external attraction links
    - **Property 10: External attraction links are conditional and safe**
    - **Validates: Requirements 7.3, 7.4**

  - [x] 12.4 Implement the Photo Credits page
    - Render attribution (text + license reference) for exactly the Wikimedia images, omitting owned/AI-generated assets, sourced from the validated attribution data
    - _Requirements: 23.1, 23.3, 23.4_

- [x] 13. Contact page and map
  - [x] 13.1 Implement the Contact page
    - Present phone/email, a "Get Directions" action (`buildDirectionsUrl`, opens external map in a new context), a WhatsApp chat link (`buildWhatsAppUrl`), and an embedded Wayanad map with a graceful fallback to the external directions link if the iframe fails
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 16.2_

- [x] 14. Integration layer — booking, WhatsApp, and analytics
  - [x] 14.1 Implement the BookingWidget host
    - Host the eeabsolute.com embed using `buildBookingUrl`, with a `loading → ready → failed` state machine: loading indicator/skeleton while initializing, and an error-boundary fallback message with an alternate booking contact (phone/WhatsApp/email) on failure; serve over HTTPS so the Razorpay-in-flow stays opaque to the site
    - _Requirements: 12.1, 12.6, 12.7, 13.1, 13.2, 14.1, 15.1, 15.5_

  - [x] 14.2 Implement the WhatsApp entry point
    - Build `WhatsAppEntryPoint` click-to-chat control (icon + accessible name) using `buildWhatsAppUrl`, for use on Home and Contact
    - _Requirements: 16.1, 16.2, 16.3_

  - [x] 14.3 Implement the analytics client, ingestion endpoint, and cumulative counter
    - Build the client emitting page-view/session events to GA4 (gtag) and to `POST /api/analytics/event` (best-effort, fire-and-forget), the server route persisting events to the first-party store, and the monotonic cumulative visit counter
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.7_

  - [x] 14.4 Implement the booking webhook and consent-gated WATI notification
    - Build `POST /api/booking/webhook` to persist completed-reservation billing details and trigger `watiNotify(booking)` only when `mayNotify` passes, with server-side retry/backoff and credentials held server-side
    - _Requirements: 17.5, 16.4, 16.5_

  - [x] 14.5 Implement `aggregateReport`
    - Pure aggregation computing total page views, distinct sessions, avg pages/session (0 when no sessions), avg session duration, monotonic cumulative visits, and a billing summary summing booking amounts
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

  - [x]* 14.6 Write property test for analytics aggregation correctness
    - **Property 15: Analytics aggregation correctness**
    - **Validates: Requirements 17.1, 17.2, 17.3, 17.5**

  - [x]* 14.7 Write property test for the cumulative visit counter
    - **Property 16: Cumulative visit counter is monotonic**
    - **Validates: Requirements 17.4**

- [x] 15. Admin report and SEO artifacts
  - [x] 15.1 Implement the authenticated Admin Report page
    - Build the SSR-authenticated report view consuming `aggregateReport`, presenting accessible charts with data-table fallbacks; guard unauthenticated access with a redirect and mark the route `noindex`/non-cacheable
    - _Requirements: 17.6_

  - [x] 15.2 Generate sitemap and robots files
    - Generate `sitemap.xml` and `robots.txt` at build time, excluding the admin report path from both
    - _Requirements: 21.3_

  - [x] 15.3 Wire page metadata, OpenGraph, and JSON-LD into all pages
    - Connect `buildPageMeta` to each page's `generateMetadata` (unique titles/descriptions + OpenGraph), and inject `LodgingBusinessJsonLd` structured data
    - _Requirements: 21.1, 21.4, 21.5_

- [x] 16. Checkpoint - pages and integrations render and tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 17. Final wiring and cross-cutting verification
  - [x] 17.1 Wire analytics, GA4, and Book Now CTAs across the app
    - Mount the analytics client/GA4 in the root layout, confirm every page routes its Book Now actions through `BookNowButton` + `buildBookingUrl`, and verify all marketing pages are reachable through the shared navigation with no orphaned routes
    - _Requirements: 1.4, 2.2, 4.6, 12.3, 16.2, 17.1_

  - [x]* 17.2 Write E2E accessibility tests (Playwright + axe)
    - Verify full keyboard navigation and tab order matching visual order, the skip link, focus indicators, icon-only accessible names, and reduced-motion behavior
    - _Requirements: 22.3, 22.4, 22.5, 22.7, 22.8_

  - [x]* 17.3 Write responsive E2E tests
    - Verify no horizontal scrolling at 375/768/1024/1440px, nav collapse below 768px, and portrait/landscape legibility on mobile/tablet
    - _Requirements: 18.2, 18.6, 1.6_

  - [x]* 17.4 Write integration tests for external platforms
    - Verify the eeabsolute booking embed presence and configuration (12.1, 13, 14 at the contract/embed level), the WATI adapter sending for a consented booking against a mock, and the Razorpay sandbox flow including failure/retry
    - _Requirements: 12.1, 13.1, 13.2, 13.3, 14.1, 14.2, 14.3, 15.1, 15.2, 15.3, 15.4, 16.1, 16.4_

  - [x]* 17.5 Write smoke/config tests
    - Verify HTTPS for the booking host, viewport meta, breakpoint/semantic/type/spacing tokens, single icon family (no emoji), privacy notice present and linked, design-system documentation present, and sitemap/robots generated with the admin path excluded
    - _Requirements: 15.5, 18.1, 18.3, 19.2, 19.4, 19.7, 17.7, 21.3_

- [x] 18. Final checkpoint - full suite passes
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional test sub-tasks and can be skipped for a faster MVP; core implementation tasks are never optional.
- Each task references specific granular requirement clauses for traceability.
- Property-based tests (`fast-check` + Vitest) cover the 22 universal correctness properties at the pure-domain layer with integration adapters mocked; each runs ≥100 iterations and is tagged `Feature: kaivalyam-homestay-website, Property {n}: {text}`.
- External booking/PMS/channel-manager/payment behavior (eeabsolute + Razorpay) is verified by integration/smoke tests (17.4, 17.5), not PBT — the site builds no booking logic.
- The asset-pipeline build step (5.1/5.2) is itself a guard, failing the build if any image lacks alt text or any Wikimedia image lacks attribution (enforcing Properties 4 and 6 before code ships).
- Checkpoints (tasks 9, 16, 18) ensure incremental validation at natural breaks.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["2.1", "4.1"] },
    { "id": 3, "tasks": ["2.2", "2.3", "3.1", "3.2", "4.2", "5.1", "6.1", "6.3", "6.5", "6.7", "6.9", "7.1", "7.4", "8.1", "14.3", "14.5"] },
    { "id": 4, "tasks": ["3.3", "3.4", "5.2", "6.2", "6.4", "6.6", "6.8", "6.10", "7.2", "7.3", "7.5", "8.2", "8.3", "8.4", "10.1", "10.2", "10.3", "14.1", "14.2", "14.4", "14.6", "14.7"] },
    { "id": 5, "tasks": ["5.3", "5.4", "10.4", "11.7", "12.4"] },
    { "id": 6, "tasks": ["11.1", "11.2", "11.3", "11.4", "11.5", "11.6", "12.1", "12.2", "13.1", "15.1"] },
    { "id": 7, "tasks": ["11.8", "12.3", "15.2", "15.3"] },
    { "id": 8, "tasks": ["17.1"] },
    { "id": 9, "tasks": ["17.2", "17.3", "17.4", "17.5"] }
  ]
}
```
