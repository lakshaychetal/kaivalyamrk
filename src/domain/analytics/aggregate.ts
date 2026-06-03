/**
 * Analytics aggregation — pure, deterministic, side-effect-free domain logic.
 * ---------------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 14.5)
 *
 * `aggregateReport` turns the raw first-party analytics events and completed
 * booking records into the {@link Report} surfaced in the authenticated admin
 * view (Req 17.1–17.6). It is the property-tested heart of the analytics
 * pipeline:
 *   - Property 15 (task 14.6) checks the aggregation math (page views, distinct
 *     sessions, pages/session, mean session duration, billing total).
 *   - Property 16 (task 14.7) checks that the cumulative visit counter is
 *     monotonically non-decreasing — see {@link incrementCounter} /
 *     {@link applyVisits}.
 *
 * Layering (structure.md): this module lives in `src/domain/` and is PURE — no
 * imports from `app/`, `components/`, or `integration/`, no I/O, no DOM, no
 * vendor SDKs. The only imports are TYPE-ONLY from `src/content/types.ts`
 * (erased at compile time), which the layering rules explicitly permit. The
 * server route handler / store (tasks 14.3, 14.4 — in `src/integration/` and
 * `src/app/api/`) supply the `events`/`bookings` arrays; this function never
 * reaches out for them itself, so the same inputs always yield the same output.
 *
 * Sibling-task note: the analytics *client* and ingestion endpoint (task 14.3)
 * live in `src/integration/` and `src/app/api/`, not here. To avoid a barrel
 * collision this module deliberately exposes its API from this named file
 * (`aggregate.ts`) and adds no generic `index.ts`.
 */

import type {
  AnalyticsEvent,
  BillingSummary,
  BookingRecord,
  Report,
  SessionStats,
} from "../../content/types";

/**
 * Default reporting currency used when no bookings are present and therefore no
 * currency can be derived from the data (Req 17.5). The homestay prices in
 * Indian Rupees, so an empty billing summary reports `"INR"`.
 */
export const DEFAULT_REPORTING_CURRENCY = "INR";

// ---------------------------------------------------------------------------
// Monotonic cumulative-visit counter (Property 16, Req 17.4)
// ---------------------------------------------------------------------------

/**
 * Apply a single visit increment to the running cumulative counter (Req 17.4).
 *
 * Pure, total, and **obviously monotonic**: a counter that tracks visits may
 * only ever go up, so a negative `delta` is treated as `0`. The result is
 * therefore always `>= current`, which is exactly the non-decreasing guarantee
 * Property 16 asserts. Over the valid domain (non-negative deltas) the clamp is
 * a no-op, so the counter advances by precisely `delta`.
 *
 * @param current - the current counter value (assumed already non-negative).
 * @param delta - the number of visits to add; values `< 0` contribute `0`.
 * @returns `current + max(0, delta)` — never less than `current`.
 */
export function incrementCounter(current: number, delta: number): number {
  return current + Math.max(0, delta);
}

/**
 * Fold a sequence of visit increments over a starting counter value (Req 17.4).
 *
 * Built from {@link incrementCounter}, so the running value is non-decreasing
 * at every step regardless of input. For a sequence of non-negative increments
 * (the documented domain — visits are never negative) the final value equals
 * `start` plus the sum of all increments, satisfying both halves of Property 16
 * (monotonic non-decreasing AND final value === sum of increments applied).
 *
 * @param start - the initial counter value (defaults to `0`).
 * @param increments - the ordered visit increments to apply.
 * @returns the final cumulative counter value.
 */
export function applyVisits(
  increments: readonly number[],
  start = 0,
): number {
  return increments.reduce(
    (counter, delta) => incrementCounter(counter, delta),
    start,
  );
}

// ---------------------------------------------------------------------------
// Per-session statistics
// ---------------------------------------------------------------------------

/**
 * Derive per-session stats from a flat event list (Req 17.2, 17.3).
 *
 * A session is the set of events sharing a `sessionId`. For each session:
 *   - `pageCount` is the number of `'page_view'` events in that session;
 *   - `durationMs` is `max(ts) - min(ts)` across ALL of that session's events
 *     (page views and session-start alike). A session with a single event has
 *     a duration of `0`. Durations are non-negative because `max >= min`.
 *
 * Sessions are returned in first-seen order so the output is deterministic for
 * a given input ordering.
 *
 * @param events - the analytics events to group.
 * @returns one {@link SessionStats} entry per distinct session id.
 */
export function computeSessionStats(
  events: readonly AnalyticsEvent[],
): SessionStats[] {
  const order: string[] = [];
  const bySession = new Map<
    string,
    { pageCount: number; minTs: number; maxTs: number }
  >();

  for (const event of events) {
    const existing = bySession.get(event.sessionId);
    const isPageView = event.type === "page_view";

    if (existing === undefined) {
      order.push(event.sessionId);
      bySession.set(event.sessionId, {
        pageCount: isPageView ? 1 : 0,
        minTs: event.ts,
        maxTs: event.ts,
      });
      continue;
    }

    if (isPageView) {
      existing.pageCount += 1;
    }
    if (event.ts < existing.minTs) {
      existing.minTs = event.ts;
    }
    if (event.ts > existing.maxTs) {
      existing.maxTs = event.ts;
    }
  }

  return order.map((sessionId) => {
    // Non-null assertion is safe: every id in `order` was inserted into the map.
    const agg = bySession.get(sessionId)!;
    return {
      sessionId,
      pageCount: agg.pageCount,
      durationMs: agg.maxTs - agg.minTs,
    };
  });
}

// ---------------------------------------------------------------------------
// Billing summary (Req 17.5, Property 15)
// ---------------------------------------------------------------------------

/**
 * Summarize booking billing for the admin report (Req 17.5).
 *
 * `total` is the exact sum of every booking's `billing.amount`; `bookingCount`
 * is `bookings.length`; `bookings` echoes every included record. `currency` is
 * the single reporting currency: it is derived from the first booking's billing
 * currency when any booking exists, and falls back to
 * {@link DEFAULT_REPORTING_CURRENCY} (`"INR"`) for an empty set. The summary
 * assumes a single reporting currency across bookings (the homestay bills in
 * one currency); it does not convert between currencies.
 *
 * @param bookings - the completed-reservation records to summarize.
 * @returns a {@link BillingSummary} with a total equal to the sum of amounts.
 */
export function summarizeBilling(
  bookings: readonly BookingRecord[],
): BillingSummary {
  const total = bookings.reduce(
    (sum, booking) => sum + booking.billing.amount,
    0,
  );
  const currency =
    bookings.length > 0
      ? bookings[0]!.billing.currency
      : DEFAULT_REPORTING_CURRENCY;

  return {
    total,
    currency,
    bookingCount: bookings.length,
    bookings: [...bookings],
  };
}

// ---------------------------------------------------------------------------
// Top-level report aggregation (Req 17.1–17.5, Property 15)
// ---------------------------------------------------------------------------

/**
 * Aggregate raw analytics events and booking records into the admin {@link Report}.
 *
 * Pure, total, and deterministic — the same inputs always produce the same
 * report, and empty inputs produce an all-zero report with an empty billing
 * summary. The computed fields (Req 17.1–17.5, Property 15):
 *
 *   - `totalPageViews`     — count of events with `type === 'page_view'` (Req 17.1).
 *   - `totalSessions`      — number of DISTINCT `sessionId`s across all events.
 *   - `avgPagesPerSession` — `totalPageViews / totalSessions`, defined as `0`
 *                            when there are no sessions to avoid a divide-by-zero
 *                            (Req 17.2).
 *   - `avgSessionDurationMs` — mean of per-session durations, where a session's
 *                            duration is `max(ts) - min(ts)` across that
 *                            session's events; `0` when there are no sessions
 *                            (Req 17.3). See {@link computeSessionStats}.
 *   - `cumulativeVisits`   — defined as the number of distinct sessions (one
 *                            visit per session). This is non-decreasing as
 *                            events are appended: appending events can only
 *                            introduce new session ids, never remove one, so the
 *                            distinct count never drops (Req 17.4, Property 16).
 *                            The standalone {@link applyVisits} counter models
 *                            the persisted, incrementally-updated counter row.
 *   - `bookingBilling`     — see {@link summarizeBilling} (Req 17.5).
 *
 * @param events - the analytics events captured by the first-party store.
 * @param bookings - the completed-reservation billing records.
 * @returns the aggregated {@link Report} for the admin view.
 */
export function aggregateReport(
  events: readonly AnalyticsEvent[],
  bookings: readonly BookingRecord[],
): Report {
  const totalPageViews = events.reduce(
    (count, event) => (event.type === "page_view" ? count + 1 : count),
    0,
  );

  const sessions = computeSessionStats(events);
  const totalSessions = sessions.length;

  const avgPagesPerSession =
    totalSessions === 0 ? 0 : totalPageViews / totalSessions;

  const avgSessionDurationMs =
    totalSessions === 0
      ? 0
      : sessions.reduce((sum, session) => sum + session.durationMs, 0) /
        totalSessions;

  return {
    totalPageViews,
    totalSessions,
    avgPagesPerSession,
    avgSessionDurationMs,
    // One cumulative visit per distinct session; monotonic under event append.
    cumulativeVisits: totalSessions,
    bookingBilling: summarizeBilling(bookings),
  };
}
