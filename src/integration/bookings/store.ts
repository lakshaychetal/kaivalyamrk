/**
 * First-party bookings store — server-side persistence abstraction.
 * ---------------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 14.4)
 *
 * This is the thin, swappable seam between the booking webhook
 * (`POST /api/booking/webhook`, task 14.4) and the durable first-party
 * datastore. It persists completed-reservation BILLING details so the admin
 * report (`aggregateReport`, task 14.5) can surface them (Req 17.5).
 *
 * It is deliberately a SEPARATE module from the analytics store
 * (`src/integration/analytics/store.ts`) so task 14.4 can persist
 * {@link BookingRecord}s without changing the analytics store's interface
 * (which task 14.3 depends on). Both follow the same pattern: an interface the
 * server code depends on, an in-memory implementation for dev/tests, and a
 * `globalThis`-pinned singleton.
 *
 * ⚠️ PRODUCTION TODO: {@link InMemoryBookingsStore} is process-local and
 * NON-DURABLE — it resets on cold start / redeploy and is not shared across
 * serverless instances. At deploy time, implement {@link BookingsStore} against
 * the managed SQL store and swap it in via {@link getBookingsStore} (e.g.
 * behind an env flag). Nothing else changes because callers depend only on the
 * interface.
 *
 * Layering (structure.md): `integration/` is server-side only. This module
 * holds no secrets and is never imported by client code. It persists ONLY the
 * billing-bearing {@link BookingRecord} (bookingRef, billing, consent flag,
 * createdAt) — NOT the guest phone number or other PII, which stays in transit
 * to the WATI adapter and is never written to the store.
 */

import type { BookingRecord } from "../../content/types";

/**
 * The persistence contract every bookings store implementation must satisfy.
 *
 * Both methods are async so the in-memory dev store and a future SQL-backed
 * store share one signature (the SQL implementation will do real I/O).
 */
export interface BookingsStore {
  /**
   * Persist one completed-reservation billing record, returning the stored row
   * (Req 17.5). Implementations must not mutate the input.
   */
  persistBooking(record: BookingRecord): Promise<BookingRecord>;

  /** Read every persisted booking record (feeds `aggregateReport`, task 14.5). */
  readBookings(): Promise<BookingRecord[]>;
}

/**
 * In-memory, process-local {@link BookingsStore} for development and tests.
 *
 * Clearly NOT for production durability (see the file header TODO): it keeps
 * records in an array lost on restart. It stores a defensive deep-ish copy of
 * each record so a caller mutating the object it passed in (or the line-items
 * array) cannot retroactively change persisted billing.
 */
export class InMemoryBookingsStore implements BookingsStore {
  private readonly bookings: BookingRecord[] = [];

  async persistBooking(record: BookingRecord): Promise<BookingRecord> {
    const stored: BookingRecord = {
      bookingRef: record.bookingRef,
      billing: {
        amount: record.billing.amount,
        currency: record.billing.currency,
        // Copy each line item so later external mutation can't alter the row.
        lineItems: record.billing.lineItems.map((item) => ({
          description: item.description,
          amount: item.amount,
        })),
      },
      whatsappConsent: record.whatsappConsent,
      createdAt: record.createdAt,
    };
    this.bookings.push(stored);
    return stored;
  }

  async readBookings(): Promise<BookingRecord[]> {
    // Defensive copy so callers cannot mutate the backing array.
    return this.bookings.map((b) => ({
      bookingRef: b.bookingRef,
      billing: {
        amount: b.billing.amount,
        currency: b.billing.currency,
        lineItems: b.billing.lineItems.map((item) => ({ ...item })),
      },
      whatsappConsent: b.whatsappConsent,
      createdAt: b.createdAt,
    }));
  }
}

/**
 * Process-wide singleton store instance.
 *
 * Hung off `globalThis` (like the analytics store) so Next.js dev-mode module
 * reloads and route-handler re-evaluation don't silently spin up a fresh, empty
 * store on every request.
 */
const STORE_GLOBAL_KEY = "__kaivalyamBookingsStore__";

type StoreGlobal = typeof globalThis & {
  [STORE_GLOBAL_KEY]?: BookingsStore;
};

/**
 * Return the active {@link BookingsStore}.
 *
 * Today this always returns the in-memory dev store. ⚠️ PRODUCTION TODO: select
 * a SQL-backed implementation here (e.g. `if (process.env.DATABASE_URL) return
 * new SqlBookingsStore(...)`) so callers pick up durable storage with no other
 * code changes.
 */
export function getBookingsStore(): BookingsStore {
  const store = globalThis as StoreGlobal;
  if (!store[STORE_GLOBAL_KEY]) {
    store[STORE_GLOBAL_KEY] = new InMemoryBookingsStore();
  }
  return store[STORE_GLOBAL_KEY];
}
