/**
 * `GoogleAnalytics` — the GA4 (gtag) script SLOT in the root layout.
 * ------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 10.3)
 *
 * This task only RESERVES the GA4 placement in the document `<head>` and loads
 * the gtag library + base config when a measurement id is configured. The
 * actual page-view / session event emission and the consent wiring live in the
 * `analyticsClient` and are mounted in task 14.3 / 17.1 — this component does
 * NOT emit events itself.
 *
 * Behaviour:
 *   • The measurement id is read from the PUBLIC env var `NEXT_PUBLIC_GA4_ID`
 *     (the same var the `analyticsClient` reads). No id is ever hardcoded.
 *   • When the id is ABSENT (the default in dev / preview / tests), the
 *     component renders nothing — a clean no-op, so no network requests are
 *     made and nothing leaks into the page.
 *   • When present, it injects the standard async gtag loader + an inline init
 *     that sets `dataLayer`/`gtag` and calls `gtag('config', <id>)`. We pass
 *     `send_page_view: false` so the first-party `analyticsClient` stays the
 *     single source of page-view truth (avoids double-counting); GA4 still
 *     records the session.
 *
 * Privacy (Req 17.7): collection is governed by the published privacy notice
 * (linked from the footer) and the `analyticsClient` consent gate. A visitor
 * who opts out triggers the standard `window['ga-disable-<id>']` flag, so even
 * this already-loaded gtag stops sending.
 *
 * Uses `next/script` with `afterInteractive` so analytics never blocks paint.
 */
import Script from "next/script";

/** The GA4 measurement id, configured per environment (Req 17.1). */
const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID;

export function GoogleAnalytics() {
  // No id configured → render nothing (no-op). GA4 is optional.
  if (!GA4_ID) return null;

  return (
    <>
      <Script
        id="ga4-loader"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA4_ID}', { send_page_view: false });
        `}
      </Script>
    </>
  );
}

export default GoogleAnalytics;
