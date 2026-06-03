/**
 * `POST /api/booking/webhook` — completed-reservation webhook (server-side).
 * ---------------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 14.4)
 *
 * Receives a completed-reservation notification from eeabsolute when a Guest
 * finishes a booking. It does two things, in order:
 *
 *   1. PERSISTS the booking BILLING details to the first-party bookings store
 *      so the admin report can surface them (Req 17.5). This always happens for
 *      a valid payload, regardless of consent.
 *
 *   2. GATES the WhatsApp notification: calls the pure `mayNotify` consent gate
 *      and invokes `watiNotify(booking)` IF AND ONLY IF consent is `true`
 *      (Req 16.4, 16.5). When consent is `false`, no notification is ever
 *      dispatched.
 *
 * ─── Security / trust boundary ───────────────────────────────────────────
 *   • Optional shared-secret authenticity check: when `WEBHOOK_SECRET` is set,
 *     the request must present it in the `x-webhook-secret` header, compared
 *     with a constant-time-ish equality. When the env var is UNSET we
 *     no-op-allow so local dev/build works without a secret — this is
 *     documented and must be configured in production.
 *   • WATI credentials live entirely inside the server-side `watiNotify`
 *     adapter; none are read or returned here.
 *   • The payload is strictly validated and size-limited; invalid input returns
 *     `400` (never a `5xx`). We never log the API secret or the guest phone.
 *   • Notification dispatch is best-effort and fire-and-forget: we return `204`
 *     quickly even if delivery is still in flight, and `watiNotify` never throws
 *     into this handler (booking confirmation is owned by eeabsolute).
 *
 * Runtime: Node.js (matches the in-memory dev stores' process-local singletons).
 */

import { NextResponse } from "next/server";
import type { BillingDetails, BookingRecord } from "../../../../content/types";
import { mayNotify } from "../../../../domain/consent/consent";
import { getBookingsStore } from "../../../../integration/bookings/store";
import { watiNotify } from "../../../../integration/whatsapp/watiNotify";

/** Run on the Node.js runtime (matches the stores' process-local singletons). */
export const runtime = "nodejs";

/** Never cache or statically optimize a webhook endpoint. */
export const dynamic = "force-dynamic";

/** Reject oversized bodies outright (defense against abusive payloads). */
const MAX_BODY_BYTES = 16 * 1024;

/** Field length caps so a valid-shaped but huge value can't pass validation. */
const MAX_BOOKING_REF_LEN = 128;
const MAX_PHONE_LEN = 32;
const MAX_CURRENCY_LEN = 8;
const MAX_DESCRIPTION_LEN = 256;
const MAX_LINE_ITEMS = 100;

/** Header carrying the shared webhook secret (used only when configured). */
const WEBHOOK_SECRET_HEADER = "x-webhook-secret";

/**
 * The validated, trusted payload extracted from the request body. Carries the
 * persisted {@link BookingRecord} fields plus the transient `phone` (used only
 * to address the WhatsApp message; never written to the store).
 */
interface ValidatedBooking extends BookingRecord {
  phone: string;
}

/**
 * Constant-time-ish string comparison to avoid trivially leaking the secret via
 * early-exit timing. Compares full length and XOR-accumulates char differences.
 */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Verify webhook authenticity against the shared secret.
 *
 * When `WEBHOOK_SECRET` is unset (typical in local dev / build), this
 * no-op-allows so the endpoint works without a secret. In production the env
 * var MUST be set; then a matching `x-webhook-secret` header is required.
 */
function isAuthentic(request: Request): boolean {
  const expected = process.env.WEBHOOK_SECRET?.trim();
  if (!expected) return true; // documented dev no-op-allow

  const provided = request.headers.get(WEBHOOK_SECRET_HEADER);
  if (!provided) return false;
  return safeEqual(provided, expected);
}

/** Validate one billing line item into a trusted shape, or return `null`. */
function parseLineItem(value: unknown): { description: string; amount: number } | null {
  if (typeof value !== "object" || value === null) return null;
  const { description, amount } = value as Record<string, unknown>;

  if (
    typeof description !== "string" ||
    description.length === 0 ||
    description.length > MAX_DESCRIPTION_LEN
  ) {
    return null;
  }
  if (typeof amount !== "number" || !Number.isFinite(amount)) return null;

  return { description, amount };
}

/** Validate the billing object into a trusted {@link BillingDetails}, or `null`. */
function parseBilling(value: unknown): BillingDetails | null {
  if (typeof value !== "object" || value === null) return null;
  const { amount, currency, lineItems } = value as Record<string, unknown>;

  if (typeof amount !== "number" || !Number.isFinite(amount)) return null;
  if (
    typeof currency !== "string" ||
    currency.length === 0 ||
    currency.length > MAX_CURRENCY_LEN
  ) {
    return null;
  }
  if (!Array.isArray(lineItems) || lineItems.length > MAX_LINE_ITEMS) return null;

  const parsedItems: BillingDetails["lineItems"] = [];
  for (const item of lineItems) {
    const parsed = parseLineItem(item);
    if (parsed === null) return null;
    parsedItems.push(parsed);
  }

  return { amount, currency, lineItems: parsedItems };
}

/**
 * Validate and normalize an unknown parsed body into a {@link ValidatedBooking},
 * or return `null` when the shape is invalid (→ `400`).
 *
 * Enforces: object shape, a bounded non-empty `bookingRef` and `phone`, a
 * strict boolean `whatsappConsent` (defaults to `false` when absent so it FAILS
 * CLOSED), a valid nested `billing`, and a finite `createdAt` (server stamps
 * receipt time when absent).
 */
function parseBooking(body: unknown): ValidatedBooking | null {
  if (typeof body !== "object" || body === null) return null;
  const record = body as Record<string, unknown>;
  const { bookingRef, billing, whatsappConsent, phone, createdAt } = record;

  if (
    typeof bookingRef !== "string" ||
    bookingRef.length === 0 ||
    bookingRef.length > MAX_BOOKING_REF_LEN
  ) {
    return null;
  }

  if (
    typeof phone !== "string" ||
    phone.length === 0 ||
    phone.length > MAX_PHONE_LEN
  ) {
    return null;
  }

  // Consent must be an explicit boolean. Absent → false (fail closed); any
  // non-boolean value is rejected outright so a truthy string can't sneak in.
  let consent: boolean;
  if (whatsappConsent === undefined) {
    consent = false;
  } else if (typeof whatsappConsent === "boolean") {
    consent = whatsappConsent;
  } else {
    return null;
  }

  const parsedBilling = parseBilling(billing);
  if (parsedBilling === null) return null;

  const ts =
    typeof createdAt === "number" && Number.isFinite(createdAt)
      ? createdAt
      : Date.now();

  return {
    bookingRef,
    billing: parsedBilling,
    whatsappConsent: consent,
    createdAt: ts,
    phone,
  };
}

/**
 * Handle a completed-reservation webhook POST.
 *
 * Returns:
 *   • `204 No Content` — payload valid: billing persisted and (if consented)
 *     notification dispatched best-effort.
 *   • `400 Bad Request` — malformed JSON, oversized, or invalid shape.
 *   • `401 Unauthorized` — `WEBHOOK_SECRET` configured but header missing/wrong.
 */
export async function POST(request: Request): Promise<NextResponse> {
  // Authenticity check first (cheap, and avoids doing work for spoofed calls).
  if (!isAuthentic(request)) {
    return new NextResponse(null, { status: 401 });
  }

  // Cheap pre-check on the declared body size before reading it.
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
    return new NextResponse(null, { status: 400 });
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  // Enforce the size limit even when Content-Length was absent/incorrect.
  if (raw.length > MAX_BODY_BYTES) {
    return new NextResponse(null, { status: 400 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const booking = parseBooking(parsed);
  if (booking === null) {
    return new NextResponse(null, { status: 400 });
  }

  // 1) Persist billing details (Req 17.5). The store only ever sees the
  //    BookingRecord fields — the transient `phone` is not part of it.
  const record: BookingRecord = {
    bookingRef: booking.bookingRef,
    billing: booking.billing,
    whatsappConsent: booking.whatsappConsent,
    createdAt: booking.createdAt,
  };

  try {
    await getBookingsStore().persistBooking(record);
  } catch (error) {
    // Persisting billing is the webhook's primary job; a store failure here is
    // logged but still acknowledged so eeabsolute does not hammer retries.
    console.error("[booking-webhook] failed to persist booking billing", error);
  }

  // 2) Consent-gated notification (Req 16.4, 16.5): dispatch IF AND ONLY IF
  //    consent is true. mayNotify is the single source of truth for the rule.
  if (mayNotify({ consent: booking.whatsappConsent })) {
    // Best-effort + fire-and-forget: watiNotify retries with backoff internally
    // and never throws, so we don't await it on the response path. We attach a
    // catch as belt-and-suspenders against an unexpected synchronous rejection.
    void watiNotify({
      phone: booking.phone,
      bookingRef: booking.bookingRef,
      billing: booking.billing,
    }).catch((error) => {
      console.error("[booking-webhook] watiNotify rejected unexpectedly", error);
    });
  }

  // Acknowledge quickly even if notification delivery is still in flight.
  return new NextResponse(null, { status: 204 });
}
