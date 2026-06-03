/**
 * Property-based tests for `buildWhatsAppUrl` (task 6.8).
 *
 * Feature: kaivalyam-homestay-website, Property 13: WhatsApp URL builder
 *
 * For all configured account numbers and optional prefilled messages,
 * `buildWhatsAppUrl(...)` produces a valid WhatsApp deep link that encodes the
 * homestay account number (as the `wa.me` digits-only path) and any message
 * exactly (round-trips under `decodeURIComponent`).
 *
 * **Validates: Requirements 2.7, 9.3, 16.3**
 */
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { assertProperty } from "@/lib/pbt";
import { buildWhatsAppUrl, KAIVALYAM_WHATSAPP_NUMBER } from "./whatsapp-url";

const WA_ORIGIN = "https://wa.me";

/** Digits-only oracle mirroring the documented normalization rule. */
const digitsOnly = (s: string): string => s.replace(/\D/g, "");

/**
 * Account numbers in assorted human-readable forms — with `+`, spaces, dashes,
 * and parentheses — that contain at least one digit so the deep link is valid.
 */
const arbPhone = fc
  .oneof(
    fc.constantFrom(
      "+91 90000 00000",
      "+91-90000-00000",
      "+1 (415) 555-0100",
      "919000000000",
      "00 91 90000 00000",
    ),
    fc
      .tuple(
        fc.constantFrom("+", "", "00"),
        fc.stringMatching(/^[0-9]{6,14}$/),
      )
      .map(([prefix, num]) => `${prefix}${num}`),
  )
  .filter((p) => digitsOnly(p).length > 0);

/** Messages spanning spaces, reserved URL chars, emoji, and Unicode. */
const arbMessage = fc.oneof(
  fc.string(),
  fc.constantFrom(
    "Hi Kaivalyam! Is the Luxury Cottage free?",
    "Booking for 2 adults & 1 child #weekend",
    "rate = ₹/night? 100% sure",
    "नमस्ते 🙏 café",
  ),
);

describe("buildWhatsAppUrl produces a valid encoded deep link (Property 13)", () => {
  // Feature: kaivalyam-homestay-website, Property 13: WhatsApp URL builder
  it("encodes the account number as the digits-only wa.me path, with no text query when omitted", () => {
    assertProperty(
      fc.property(arbPhone, (phone) => {
        const result = buildWhatsAppUrl({ phone });
        const url = new URL(result);

        expect(url.origin).toBe(WA_ORIGIN);
        // Path is exactly "/<digits>" preserving the digit sequence/order.
        expect(url.pathname).toBe(`/${digitsOnly(phone)}`);
        // No prefilled message => no query string at all.
        expect(url.search).toBe("");
      }),
    );
  });

  // Feature: kaivalyam-homestay-website, Property 13: WhatsApp URL builder
  it("encodes the account number AND round-trips the message exactly when provided", () => {
    assertProperty(
      fc.property(arbPhone, arbMessage, (phone, message) => {
        const result = buildWhatsAppUrl({ phone, message });
        const url = new URL(result);

        expect(url.origin).toBe(WA_ORIGIN);
        expect(url.pathname).toBe(`/${digitsOnly(phone)}`);

        // The message round-trips EXACTLY (no loss, no mangling) under decode.
        expect(url.searchParams.get("text")).toBe(message);
      }),
    );
  });

  // Feature: kaivalyam-homestay-website, Property 13: WhatsApp URL builder
  it("is deterministic for identical inputs", () => {
    assertProperty(
      fc.property(arbPhone, fc.option(arbMessage, { nil: undefined }), (phone, message) => {
        const opts = message === undefined ? { phone } : { phone, message };
        expect(buildWhatsAppUrl(opts)).toBe(buildWhatsAppUrl(opts));
      }),
    );
  });

  // Feature: kaivalyam-homestay-website, Property 13: WhatsApp URL builder
  it("the canonical Kaivalyam number normalizes to a valid digits-only link", () => {
    const url = new URL(buildWhatsAppUrl({ phone: KAIVALYAM_WHATSAPP_NUMBER }));
    expect(url.origin).toBe(WA_ORIGIN);
    expect(url.pathname).toBe(`/${digitsOnly(KAIVALYAM_WHATSAPP_NUMBER)}`);
  });
});
