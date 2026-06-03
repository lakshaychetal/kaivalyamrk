# End-to-End & Accessibility Tests

Playwright + `@axe-core/playwright` specs live here. This directory is configured
by `playwright.config.ts` (task 1.3) but the specs themselves are authored later:

- **Task 17.2** — keyboard navigation, tab order, skip link, focus indicators,
  icon-only accessible names, and reduced-motion behavior (axe accessibility scans).
- **Task 17.3** — responsive layout: no horizontal scroll at 375 / 768 / 1024 /
  1440px, nav collapse below 768px, portrait/landscape legibility.

Spec files must match `*.e2e.ts` or `*.spec.ts`. Run them with:

```bash
npx playwright test       # or: npm run test:e2e
```

With no specs present, the runner exits cleanly (zero tests is not a failure).
