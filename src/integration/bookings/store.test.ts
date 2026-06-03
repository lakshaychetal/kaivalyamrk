/**
 * Unit tests for the first-party bookings store (task 14.4).
 *
 * Focus: billing-record persistence shape and defensive copies so external
 * mutation cannot retroactively change persisted billing (Req 17.5).
 */
import { describe, it, expect } from "vitest";
import type { BookingRecord } from "../../content/types";
import { InMemoryBookingsStore, getBookingsStore } from "./store";

function booking(overrides: Partial<BookingRecord> = {}): BookingRecord {
  return {
    bookingRef: "BK-1",
    billing: {
      amount: 5000,
      currency: "INR",
      lineItems: [{ description: "Luxury Cottage x2 nights", amount: 5000 }],
    },
    whatsappConsent: true,
    createdAt: 1_700_000_000_000,
    ...overrides,
  };
}

describe("InMemoryBookingsStore.persistBooking", () => {
  it("persists a record and returns the stored row", async () => {
    const store = new InMemoryBookingsStore();
    const stored = await store.persistBooking(booking());

    expect(stored.bookingRef).toBe("BK-1");
    expect(stored.billing.amount).toBe(5000);
    expect(stored.billing.currency).toBe("INR");
    expect(stored.billing.lineItems).toHaveLength(1);
    expect(stored.whatsappConsent).toBe(true);
  });

  it("stores a defensive copy — mutating the input does not change the row", async () => {
    const store = new InMemoryBookingsStore();
    const input = booking();
    await store.persistBooking(input);

    // Mutate the caller's object and its line items after persisting.
    input.billing.amount = 999_999;
    input.billing.lineItems[0]!.amount = 999_999;

    const [stored] = await store.readBookings();
    expect(stored!.billing.amount).toBe(5000);
    expect(stored!.billing.lineItems[0]!.amount).toBe(5000);
  });

  it("readBookings returns a defensive copy that cannot mutate the store", async () => {
    const store = new InMemoryBookingsStore();
    await store.persistBooking(booking());

    const rows = await store.readBookings();
    rows.push(booking({ bookingRef: "intruder" }));

    expect(await store.readBookings()).toHaveLength(1);
  });

  it("accumulates multiple bookings", async () => {
    const store = new InMemoryBookingsStore();
    await store.persistBooking(booking({ bookingRef: "BK-1" }));
    await store.persistBooking(booking({ bookingRef: "BK-2" }));
    expect(await store.readBookings()).toHaveLength(2);
  });
});

describe("getBookingsStore", () => {
  it("returns a stable singleton within the process", () => {
    expect(getBookingsStore()).toBe(getBookingsStore());
  });
});
