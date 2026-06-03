/**
 * Analytics integration barrel.
 * Feature: kaivalyam-homestay-website (task 14.3)
 *
 * Re-exports the browser analytics client (GA4 + first-party emit) and the
 * server-side first-party store abstraction. The ingestion route handler lives
 * in `src/app/api/analytics/event/route.ts`; the pure aggregation
 * (`aggregateReport`) lives in `src/domain/analytics/` (task 14.5).
 *
 * NOTE: `analyticsClient` is browser-only and `store` is server-only — import
 * the specific module you need rather than relying on this barrel in code where
 * the client/server boundary matters (e.g. a route handler should import
 * `./store` directly to avoid pulling client code into the server bundle).
 */
export * from "./analyticsClient";
export * from "./store";
