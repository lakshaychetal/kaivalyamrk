/**
 * Property-based tests for the consent gate `mayNotify` (task 6.10).
 *
 * Feature: kaivalyam-homestay-website, Property 14: WhatsApp notifications are consent-gated
 *
 * For all booking records, `mayNotify` returns true IF AND ONLY IF the booking's
 * WhatsApp consent flag is true; it returns false when consent is false, so
 * notifications fail closed.
 *
 * **Validates: Requirements 16.5**
 */
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { assertProperty } from "@/lib/pbt";
import { mayNotify, type ConsentBearer } from "./consent";

/**
 * Booking-record-like objects carrying a boolean `consent` flag plus arbitrary
 * extra fields, to prove the gate depends ONLY on `consent`.
 */
const arbBooking = fc.record({
  consent: fc.boolean(),
  bookingId: fc.string(),
  amount: fc.integer(),
  guestName: fc.string(),
}) satisfies fc.Arbitrary<ConsentBearer & Record<string, unknown>>;

describe("mayNotify is a consent biconditional (Property 14)", () => {
  // Feature: kaivalyam-homestay-website, Property 14: WhatsApp notifications are consent-gated
  it("returns true if and only if the consent flag is true", () => {
    assertProperty(
      fc.property(arbBooking, (booking) => {
        // Biconditional: the result equals the consent flag, regardless of any
        // other field present on the record.
        expect(mayNotify(booking)).toBe(booking.consent);
      }),
    );
  });

  // Feature: kaivalyam-homestay-website, Property 14: WhatsApp notifications are consent-gated
  it("never permits a notification when consent is false (fails closed)", () => {
    assertProperty(
      fc.property(
        fc.record({ consent: fc.constant(false), bookingId: fc.string() }),
        (booking) => {
          expect(mayNotify(booking)).toBe(false);
        },
      ),
    );
  });

  // Feature: kaivalyam-homestay-website, Property 14: WhatsApp notifications are consent-gated
  it("always permits a notification when consent is true", () => {
    assertProperty(
      fc.property(
        fc.record({ consent: fc.constant(true), bookingId: fc.string() }),
        (booking) => {
          expect(mayNotify(booking)).toBe(true);
        },
      ),
    );
  });
});
