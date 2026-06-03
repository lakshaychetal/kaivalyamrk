/**
 * Admin Report page (`/admin/report`) — authenticated SSR analytics dashboard.
 * ---------------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 15.1)
 *
 * Presents the aggregated first-party analytics and booking billing metrics to
 * an authenticated Administrator (Req 17.6). Access is guarded by a server-side
 * session check; unauthenticated requests are redirected to /admin/login.
 *
 * Metrics presented (Req 17.1–17.5):
 *   - Total page views (Req 17.1)
 *   - Total sessions (Req 17.2)
 *   - Average pages per session (Req 17.2)
 *   - Average session duration in minutes (Req 17.3)
 *   - Cumulative visit counter (Req 17.4)
 *   - Booking billing summary: total revenue, booking count, and a table of
 *     individual bookings (Req 17.5)
 *
 * Accessibility:
 *   - Every metric card has an aria-label describing the key insight.
 *   - The billing summary includes a full data table for screen readers.
 *   - Semantic HTML throughout (dl, table, thead, tbody, th[scope]).
 *
 * Security:
 *   - export const dynamic = 'force-dynamic' — never statically cached.
 *   - export const metadata with robots: { index: false, follow: false }.
 *   - Auth guard via requireAdminSession() — redirects to /admin/login if
 *     the session cookie is absent or ADMIN_PASSWORD is not set.
 *   - The admin route is excluded from sitemap.xml (task 15.2).
 *
 * _Requirements: 17.6_
 */
import type { Metadata } from "next";
import { requireAdminSession } from "../auth";
import { getAnalyticsStore } from "@/integration/analytics/store";
import { getBookingsStore } from "@/integration/bookings/store";
import { aggregateReport } from "@/domain/analytics/aggregate";
import type { Report, BookingRecord, AnalyticsEvent } from "@/content/types";

/** Force SSR — never statically cache the admin report. */
export const dynamic = "force-dynamic";

/** Mark noindex so search engines do not index the admin report. */
export const metadata: Metadata = {
  title: "Admin Report",
  description: "Kaivalyam Homestay analytics and booking report.",
  robots: {
    index: false,
    follow: false,
  },
};

// ---------------------------------------------------------------------------
// Metric card component
// ---------------------------------------------------------------------------

interface MetricCardProps {
  label: string;
  value: string | number;
  description: string;
  /** Accessible label describing the key insight for screen readers. */
  ariaLabel: string;
}

function MetricCard({ label, value, description, ariaLabel }: MetricCardProps) {
  return (
    <article
      aria-label={ariaLabel}
      className="rounded-xl border border-border bg-surface p-5 shadow-sm"
    >
      <p className="text-sm font-medium text-on-surface-muted">{label}</p>
      <p className="mt-1 font-serif text-3xl font-semibold text-secondary">
        {value}
      </p>
      <p className="mt-1 text-xs text-on-surface-muted">{description}</p>
      {/* Visual bar: proportional fill capped at 100% for display purposes */}
      <div
        className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-alt"
        aria-hidden="true"
      >
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: "60%" }}
        />
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Billing table component
// ---------------------------------------------------------------------------

interface BillingTableProps {
  bookings: BookingRecord[];
  currency: string;
}

function BillingTable({ bookings, currency }: BillingTableProps) {
  if (bookings.length === 0) {
    return (
      <p className="text-sm text-on-surface-muted italic">
        No bookings recorded yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">
          Individual booking billing records
        </caption>
        <thead>
          <tr className="border-b border-border">
            <th
              scope="col"
              className="py-2 pr-4 text-left font-medium text-on-surface-muted"
            >
              Booking ref
            </th>
            <th
              scope="col"
              className="py-2 pr-4 text-right font-medium text-on-surface-muted"
            >
              Amount ({currency})
            </th>
            <th
              scope="col"
              className="py-2 pr-4 text-left font-medium text-on-surface-muted"
            >
              Date
            </th>
            <th
              scope="col"
              className="py-2 text-left font-medium text-on-surface-muted"
            >
              WhatsApp consent
            </th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr
              key={booking.bookingRef}
              className="border-b border-border last:border-0"
            >
              <td className="py-2 pr-4 font-mono text-on-surface">
                {booking.bookingRef}
              </td>
              <td className="py-2 pr-4 text-right tabular-nums text-on-surface">
                {booking.billing.amount.toLocaleString("en-IN")}
              </td>
              <td className="py-2 pr-4 text-on-surface-muted">
                {new Date(booking.createdAt).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </td>
              <td className="py-2 text-on-surface-muted">
                {booking.whatsappConsent ? "Yes" : "No"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminReportPage() {
  // Auth guard — redirects to /admin/login if unauthenticated.
  await requireAdminSession();

  // Fetch data server-side.
  const analyticsStore = getAnalyticsStore();
  const bookingsStore = getBookingsStore();

  const [events, bookings] = await Promise.all([
    analyticsStore.readEvents(),
    bookingsStore.readBookings(),
  ]);

  // Aggregate the report using the pure domain function.
  // StoredEvent has `type: string`; filter to the known AnalyticsEvent types
  // before passing to the pure aggregation function.
  const VALID_EVENT_TYPES = new Set<AnalyticsEvent["type"]>(["page_view", "session_start"]);
  const analyticsEvents: AnalyticsEvent[] = events
    .filter((e) => VALID_EVENT_TYPES.has(e.type as AnalyticsEvent["type"]))
    .map((e) => ({
      sessionId: e.sessionId,
      type: e.type as AnalyticsEvent["type"],
      ts: e.ts,
      ...(e.path !== undefined ? { path: e.path } : {}),
    }));

  const report: Report = aggregateReport(analyticsEvents, bookings);

  const avgDurationMinutes =
    report.avgSessionDurationMs > 0
      ? (report.avgSessionDurationMs / 60_000).toFixed(1)
      : "0.0";

  const totalRevenue = report.bookingBilling.total.toLocaleString("en-IN");
  const currency = report.bookingBilling.currency;

  return (
    <article className="mx-auto w-full max-w-5xl px-4 py-12 md:px-6 md:py-16">
      {/* Page header */}
      <header className="mb-10">
        <p className="text-sm font-medium uppercase tracking-wide text-on-surface-muted">
          Administrator
        </p>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-secondary sm:text-4xl">
          Analytics Report
        </h1>
        <p className="mt-3 max-w-prose text-base text-on-surface-muted">
          First-party analytics and booking billing summary for Kaivalyam
          Homestay.
        </p>
      </header>

      {/* ── Traffic metrics (Req 17.1–17.4) ── */}
      <section aria-labelledby="traffic-heading">
        <h2
          id="traffic-heading"
          className="mb-4 font-serif text-xl font-semibold text-secondary"
        >
          Traffic overview
        </h2>

        {/* Accessible data table fallback for screen readers */}
        <dl className="sr-only">
          <div>
            <dt>Total page views</dt>
            <dd>{report.totalPageViews}</dd>
          </div>
          <div>
            <dt>Total sessions</dt>
            <dd>{report.totalSessions}</dd>
          </div>
          <div>
            <dt>Average pages per session</dt>
            <dd>{report.avgPagesPerSession.toFixed(1)}</dd>
          </div>
          <div>
            <dt>Average session duration</dt>
            <dd>{avgDurationMinutes} minutes</dd>
          </div>
          <div>
            <dt>Cumulative visits</dt>
            <dd>{report.cumulativeVisits}</dd>
          </div>
        </dl>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            label="Total page views"
            value={report.totalPageViews}
            description="All page_view events captured"
            ariaLabel={`Total page views: ${report.totalPageViews}`}
          />
          <MetricCard
            label="Total sessions"
            value={report.totalSessions}
            description="Distinct visitor sessions"
            ariaLabel={`Total sessions: ${report.totalSessions}`}
          />
          <MetricCard
            label="Avg pages / session"
            value={report.avgPagesPerSession.toFixed(1)}
            description="Mean pages viewed per session"
            ariaLabel={`Average pages per session: ${report.avgPagesPerSession.toFixed(1)}`}
          />
          <MetricCard
            label="Avg session duration"
            value={`${avgDurationMinutes} min`}
            description="Mean time spent per session"
            ariaLabel={`Average session duration: ${avgDurationMinutes} minutes`}
          />
          <MetricCard
            label="Cumulative visits"
            value={report.cumulativeVisits}
            description="Monotonic total visit counter"
            ariaLabel={`Cumulative visits: ${report.cumulativeVisits}`}
          />
        </div>
      </section>

      {/* ── Booking billing summary (Req 17.5) ── */}
      <section aria-labelledby="billing-heading" className="mt-12">
        <h2
          id="billing-heading"
          className="mb-4 font-serif text-xl font-semibold text-secondary"
        >
          Booking billing summary
        </h2>

        {/* Summary cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <MetricCard
            label="Total revenue"
            value={`${currency} ${totalRevenue}`}
            description="Sum of all completed booking amounts"
            ariaLabel={`Total revenue: ${currency} ${totalRevenue}`}
          />
          <MetricCard
            label="Booking count"
            value={report.bookingBilling.bookingCount}
            description="Number of completed reservations"
            ariaLabel={`Booking count: ${report.bookingBilling.bookingCount}`}
          />
        </div>

        {/* Individual bookings data table (Req 17.5, accessibility) */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-on-surface">
            Individual bookings
          </h3>
          <BillingTable
            bookings={report.bookingBilling.bookings}
            currency={currency}
          />
        </div>
      </section>
    </article>
  );
}
