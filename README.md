# Kaivalyam Homestay Website

A professional, responsive marketing-and-booking website for **Kaivalyam
Homestay** — a pet-friendly, tranquil hill-village homestay in Padichira,
Wayanad, Kerala, India.

> Brand tagline: **"EXPERIENCE ULTIMATE SOLITUDE #KAIVALYAM"**

## Tech stack

- **Next.js (App Router) + React + TypeScript** (strict mode) — SSG/ISR content
  pages, SSR admin report, serverless route handlers.
- **Tailwind CSS** with a semantic token layer (added in task 1.2).
- **Lucide** icons (single family), `next/image` + build-time `sharp`
  optimization to AVIF/WebP.
- **Vitest + React Testing Library + fast-check** (property-based testing) and
  **Playwright + axe** (E2E/a11y) — configured in task 1.3.

## Project layout

```
src/
├── app/          # App Router pages, layouts, route handlers (API)
├── components/   # Design-system components + page sections (presentation)
├── domain/       # PURE logic — property-tested, no side effects, no rendering
├── integration/  # Typed wrappers for eeabsolute, Razorpay-in-flow, WATI, analytics
├── content/      # Typed content collections (TS modules, MDX, JSON catalogs)
└── lib/          # Shared helpers
```

Source images live under `kaivalyam_assets/` (input to the build-time asset
pipeline); the brand logo is `Kaivalyam Logo apvd.png` at the project root.

The spec under `.kiro/specs/kaivalyam-homestay-website/`
(`requirements.md` → `design.md` → `tasks.md`) is the source of truth.

## Scripts

```bash
npm run dev      # start the local dev server (run manually)
npm run build    # production build
npm run start    # serve the production build
npm run lint     # ESLint
npm test         # Vitest unit + property tests (wired in task 1.3)
```
