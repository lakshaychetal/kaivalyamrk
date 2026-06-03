/**
 * `AnalyticsProvider` — client island that fires page-view events on every
 * route change (Req 17.1).
 * ---------------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 17.1)
 *
 * The analytics client (`analyticsClient.ts`) is browser-only and must be
 * called from a client component. This thin island:
 *
 *   1. Calls `trackPageView(pathname)` on the initial mount (first page load).
 *   2. Re-calls it whenever the Next.js App Router navigates to a new route
 *      (soft navigation via `usePathname`).
 *
 * `trackPageView` internally calls `ensureSession()` so a `session_start`
 * event is emitted exactly once per browser tab (sessionStorage lifetime),
 * followed by a `page_view` event for every route. Both events are forwarded
 * to GA4 (when `NEXT_PUBLIC_GA4_ID` is set) and to the first-party ingestion
 * endpoint `POST /api/analytics/event`.
 *
 * Design principles:
 *   • BEST-EFFORT. `trackPageView` is fire-and-forget and never throws into
 *     the UI — failures are swallowed inside the analytics client.
 *   • CONSENT-GATED. The analytics client checks `isAnalyticsEnabled()` before
 *     emitting; this component does not need to repeat that check.
 *   • RENDERS NOTHING. This is a pure side-effect island; it returns `null`
 *     and adds no DOM nodes.
 *   • MOUNTED ONCE in the root layout, so it runs on every page without
 *     needing to be added to individual page components.
 *
 * Layering (structure.md): lives in `components/layout/` (presentation layer).
 * Depends on `integration/analytics/analyticsClient` (the integration layer)
 * and Next.js App Router hooks — no domain imports needed here.
 */
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackPageView } from "@/integration/analytics/analyticsClient";

/**
 * Mount this once in the root layout. It tracks every page view (including
 * the initial load) by calling `trackPageView` whenever the pathname changes.
 * Renders nothing — pure side-effect island.
 */
export function AnalyticsProvider() {
  const pathname = usePathname();

  useEffect(() => {
    // trackPageView is best-effort and never throws; safe to call unconditionally.
    trackPageView(pathname ?? "/");
  }, [pathname]);

  return null;
}

export default AnalyticsProvider;
