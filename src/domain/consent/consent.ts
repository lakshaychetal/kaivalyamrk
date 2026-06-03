/**
 * Consent gate for server-side WhatsApp notifications — pure, framework-free.
 * ---------------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 6.9)
 *
 * Requirement 16.5: "THE WhatsApp_Service SHALL send notification messages only
 * to Guests who have provided consent for WhatsApp messaging."
 *
 * `mayNotify` is the single source of truth for that rule. The server-side
 * booking webhook (task 14.4) MUST call it before any WATI send, so consent is
 * enforced in exactly one verified place rather than re-checked ad hoc.
 *
 * Layering: this is pure domain logic — no side effects, no DOM, no vendor
 * imports. The input shape mirrors the design's `Pick<BookingNotification,
 * 'consent'>` (structurally `{ consent: boolean }`); it is declared locally to
 * keep this task self-contained within `src/domain/consent/`.
 *
 * Semantics (Property 14): the gate returns `true` IF AND ONLY IF the booking's
 * WhatsApp consent flag is exactly the boolean `true`. It is total and strict —
 * the value `false` (and, by `=== true`, any non-`true` value) yields `false`,
 * so notifications fail closed.
 */

/**
 * The minimal consent slice consumed by {@link mayNotify}.
 *
 * Equivalent to the design's `Pick<BookingNotification, 'consent'>`: the gate
 * needs nothing beyond the boolean consent flag, so it accepts any object that
 * carries one (e.g. a full `BookingNotification` or `BookingRecord`-derived
 * value structurally satisfies this).
 */
export interface ConsentBearer {
  /** Whether the Guest has explicitly opted in to WhatsApp messaging (Req 16.5). */
  consent: boolean;
}

/**
 * Consent gate guarding all server-side WhatsApp notifications (Req 16.5).
 *
 * Pure and total: returns `true` IF AND ONLY IF `n.consent === true`. The value
 * `false` returns `false`, so the gate fails closed — a guest is notified only
 * on an explicit, affirmative consent.
 *
 * @param n - an object carrying the consent flag (`Pick<BookingNotification, 'consent'>`).
 * @returns `true` exactly when consent has been explicitly granted.
 */
export function mayNotify(n: ConsentBearer): boolean {
  return n.consent === true;
}
