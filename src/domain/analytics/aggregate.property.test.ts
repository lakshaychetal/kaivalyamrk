/**
 * Property test — Property 15: Analytics aggregation correctness (task 14.6).
 * ---------------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website
 *
 * Design (Property 15): *For all* sets of analytics events and booking records,
 * `aggregateReport` produces: `totalPageViews` equal to the count of page-view
 * events; `totalSessions` equal to the number of distinct sessions;
 * `avgPagesPerSession` equal to `totalPageViews / totalSessions` (and 0 when
 * there are no sessions); `avgSessionDurationMs` equal to the mean of
 * per-session durations; and a billing summary that includes every booking with
 * a total equal to the sum of the bookings' amounts.
 *
 * The generators below deliberately produce varied event sets — `page_view` and
 * `session_start` events spread across a small pool of session ids so multiple
 * events land in the same session, plus the zero-sessions edge case (empty
 * array) — and booking records with varied billing amounts. Expected values are
 * recomputed independently of the implementation so the test pins the contract,
 * not the implementation's internals.
 */
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { assertProperty } from "@/lib/pbt";
import { aggregateReport } from "@/domain/analytics/aggregate";
import type { AnalyticsEvent, BookingRecord } from "@/content/types";

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/**
 * Session ids drawn from a small pool so generated event sets routinely place
 * several events in the same session (exercising distinct-session counting and
 * per-session duration), with the occasional fresh id for variety.
 */
const sessionIdArb = fc.oneof(
  { weight: 4, arbitrary: fc.constantFrom("s1", "s2", "s3", "s4") },
  { weight: 1, arbitrary: fc.string({ minLength: 1, maxLength: 12 }) },
);

const analyticsEventArb: fc.Arbitrary<AnalyticsEvent> = fc.record({
  sessionId: sessionIdArb,
  type: fc.constantFrom("page_view" as const, "session_start" as const),
  path: fc.option(fc.webPath(), { nil: undefined }),
  ts: fc.integer({ min: 0, max: 10_000_000 }),
});

/** Event sets including the zero-sessions edge case (`minLength: 0`). */
const eventsArb = fc.array(analyticsEventArb, { minLength: 0, maxLength: 60 });

const billingLineItemArb = fc.record({
  description: fc.string({ minLength: 1, maxLength: 20 }),
  // Integer amounts keep the summed total exact (no float drift).
  amount: fc.nat({ max: 100_000 }),
});

const bookingRecordArb: fc.Arbitrary<BookingRecord> = fc.record({
  bookingRef: fc.string({ minLength: 1, maxLength: 16 }),
  billing: fc.record({
    amount: fc.nat({ max: 1_000_000 }),
    currency: fc.constantFrom("INR", "USD", "EUR"),
    lineItems: fc.array(billingLineItemArb, { maxLength: 4 }),
  }),
  whatsappConsent: fc.boolean(),
  createdAt: fc.integer({ min: 0, max: 10_000_000 }),
});

/** Booking sets including the no-bookings edge case. */
const bookingsArb = fc.array(bookingRecordArb, { minLength: 0, maxLength: 25 });

// ---------------------------------------------------------------------------
// Independent reference computation of the expected aggregation
// ---------------------------------------------------------------------------

interface Expected {
  totalPageViews: number;
  totalSessions: number;
  avgPagesPerSession: number;
  avgSessionDurationMs: number;
  billingTotal: number;
}

function expectedReport(
  events: readonly AnalyticsEvent[],
  bookings: readonly BookingRecord[],
): Expected {
  const totalPageViews = events.filter((e) => e.type === "page_view").length;

  // Distinct sessions, first-seen order, with per-session min/max timestamps.
  const order: string[] = [];
  const span = new Map<string, { min: number; max: number }>();
  for (const e of events) {
    const seen = span.get(e.sessionId);
    if (seen === undefined) {
      order.push(e.sessionId);
      span.set(e.sessionId, { min: e.ts, max: e.ts });
    } else {
      if (e.ts < seen.min) seen.min = e.ts;
      if (e.ts > seen.max) seen.max = e.ts;
    }
  }

  const totalSessions = order.length;
  const durations = order.map((id) => {
    const s = span.get(id)!;
    return s.max - s.min;
  });

  const avgPagesPerSession =
    totalSessions === 0 ? 0 : totalPageViews / totalSessions;
  const avgSessionDurationMs =
    totalSessions === 0
      ? 0
      : durations.reduce((sum, d) => sum + d, 0) / totalSessions;

  const billingTotal = bookings.reduce((sum, b) => sum + b.billing.amount, 0);

  return {
    totalPageViews,
    totalSessions,
    avgPagesPerSession,
    avgSessionDurationMs,
    billingTotal,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Property 15: Analytics aggregation correctness", () => {
  // Feature: kaivalyam-homestay-website, Property 15: Analytics aggregation correctness
  // **Validates: Requirements 17.1, 17.2, 17.3, 17.5**
  it("computes page views, distinct sessions, averages, and billing total for all inputs", () => {
    assertProperty(
      fc.property(eventsArb, bookingsArb, (events, bookings) => {
        const report = aggregateReport(events, bookings);
        const expected = expectedReport(events, bookings);

        // Req 17.1 — total page views == count of page-view events.
        expect(report.totalPageViews).toBe(expected.totalPageViews);

        // Req 17.2 — total sessions == number of distinct session ids.
        expect(report.totalSessions).toBe(expected.totalSessions);

        // Req 17.2 — avg pages/session == totalPageViews/totalSessions, 0 when none.
        if (expected.totalSessions === 0) {
          expect(report.avgPagesPerSession).toBe(0);
        } else {
          expect(report.avgPagesPerSession).toBeCloseTo(
            expected.avgPagesPerSession,
            10,
          );
        }

        // Req 17.3 — avg session duration == mean of per-session durations, 0 when none.
        if (expected.totalSessions === 0) {
          expect(report.avgSessionDurationMs).toBe(0);
        } else {
          expect(report.avgSessionDurationMs).toBeCloseTo(
            expected.avgSessionDurationMs,
            6,
          );
        }
        // Durations are non-negative (max ts >= min ts), so the mean is too.
        expect(report.avgSessionDurationMs).toBeGreaterThanOrEqual(0);

        // Req 17.5 — billing summary includes every booking, total == sum of amounts.
        expect(report.bookingBilling.bookingCount).toBe(bookings.length);
        expect(report.bookingBilling.bookings).toHaveLength(bookings.length);
        for (const booking of bookings) {
          expect(report.bookingBilling.bookings).toContainEqual(booking);
        }
        expect(report.bookingBilling.total).toBe(expected.billingTotal);
      }),
    );
  });

  // Feature: kaivalyam-homestay-website, Property 15: Analytics aggregation correctness
  // **Validates: Requirements 17.1, 17.2, 17.3, 17.5**
  it("returns an all-zero report with an empty billing summary for empty inputs (zero sessions)", () => {
    const report = aggregateReport([], []);
    expect(report.totalPageViews).toBe(0);
    expect(report.totalSessions).toBe(0);
    expect(report.avgPagesPerSession).toBe(0);
    expect(report.avgSessionDurationMs).toBe(0);
    expect(report.bookingBilling.total).toBe(0);
    expect(report.bookingBilling.bookingCount).toBe(0);
    expect(report.bookingBilling.bookings).toEqual([]);
  });
});
