# Tech Stack

> The project is fully specced but not yet scaffolded. This document captures the chosen stack and conventions from the design so implementation stays consistent.

## Core Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js (App Router) + React + TypeScript (strict mode) |
| Rendering | SSG/ISR for content pages; SSR only for the authenticated admin report; serverless route handlers for APIs |
| Styling | Tailwind CSS with a semantic token layer (CSS variables / `@theme`) |
| Icons | Lucide only — one icon family, SVG, no emoji |
| Content | Typed TypeScript modules + MDX for prose, JSON for catalogs (no CMS) |
| Images | `next/image` + build-time `sharp` optimization to AVIF/WebP (+ JPEG fallback) |
| Analytics | Google Analytics 4 (gtag) + first-party serverless endpoints with a lightweight SQL store |
| Auth | Server-side session/credential auth for the admin report view only |
| Hosting | Edge/serverless platform with ISR support (Vercel-class) |
| Testing | Vitest + React Testing Library + fast-check (PBT) + Playwright + axe (E2E/a11y) |

## Architecture Conventions

- **Pure domain layer is the heart of correctness.** Navigation resolution, URL builders (`buildBookingUrl`, `buildDirectionsUrl`, `buildWhatsAppUrl`), attribution resolution, gallery/tour cursors, the consent gate (`mayNotify`), analytics aggregation (`aggregateReport`), and SEO metadata builders are **pure, deterministic functions**. Keep them free of side effects and rendering concerns so they can be property-tested in isolation.
- **Isolate all third-party embeds** behind typed wrappers in an `integration/` module. The rest of the app depends on stable interfaces, never vendor specifics. Build no booking/PMS/channel/payment logic.
- **Secrets stay server-side.** WATI and eeabsolute credentials live in environment secrets, never shipped to the client. WhatsApp notifications are triggered only from the server-side webhook handler, after a consent check.
- **Resilient embeds.** Every external embed (booking widget, map iframe, attraction images) needs a loading state and a graceful fallback (alternate contact, placeholder visual).
- **Single source of truth for navigation.** Header and mobile menu both consume one `navigationModel`; active state is derived by `resolveActiveNav(path, model)`.
- **One primary CTA.** The "Book Now" primary-CTA style is used by exactly one component (`BookNowButton`); no other component may reuse it.

## Asset Pipeline

A build-time `sharp` step reads source images, probes intrinsic dimensions, generates responsive AVIF/WebP variants at 400/800/1200/1600 widths, emits `srcset`/`sizes`, and produces a typed `PhotoCatalog` + `AttractionItem[]`. The build **fails** if any image lacks non-empty `alt` text or any Wikimedia-sourced image lacks complete attribution.

## Property-Based Testing

- All 22 correctness properties from the design are implemented with **fast-check + Vitest**.
- Each property test runs a **minimum of 100 iterations** (`numRuns >= 100` via the shared PBT helper).
- Tag each test with a comment: `Feature: kaivalyam-homestay-website, Property {n}: {property text}`.
- External booking/PMS/channel/payment behavior is **not** property-tested — it is covered by integration and smoke tests.
- Optional test sub-tasks are marked with `*` in tasks.md and can be skipped for a faster MVP; core implementation tasks are never optional.

## Common Commands

> Scaffold the project with the `src/` layout and these npm scripts during task 1.1. Until then, these are the expected commands.

```bash
npm run dev        # start the local dev server (run manually; do not launch from automated steps)
npm run build      # production build (runs the asset pipeline + validation; fails on missing alt/attribution)
npm run start      # serve the production build
npm run lint       # ESLint
npm test           # Vitest unit + property tests
npm run test -- --run   # single run (no watch) — preferred for CI / one-off checks
npx playwright test     # E2E + accessibility tests
```

Run long-lived processes (`npm run dev`, watchers) manually in a terminal rather than from blocking automated commands.
