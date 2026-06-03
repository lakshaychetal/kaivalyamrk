/**
 * WhatsApp deep-link builder — pure, deterministic, framework-free.
 * -----------------------------------------------------------------
 * Feature: kaivalyam-homestay-website
 *
 * Produces a `wa.me` click-to-chat deep link to the homestay's WhatsApp
 * (WATI) account, with an optional prefilled message. This is the single
 * source of truth for the WhatsApp entry points used by:
 *   • Home page         (Req 2.7 / task 11.1)
 *   • Contact page      (Req 9.3 / task 13.1)
 *   • WhatsAppEntryPoint integration control (Req 16.3 / task 14.2)
 *
 * PURE LOGIC — no DOM, no network, no imports from `app/`, `components/`, or
 * `integration/`. Property-tested in isolation (task 6.8, Property 13).
 *
 * Encoding contract:
 *   • The phone number is normalized to DIGITS ONLY for the `wa.me/<number>`
 *     path — `wa.me` requires an international number with no `+`, spaces, or
 *     punctuation. The exact digit sequence is preserved in order.
 *   • The optional message is encoded with `encodeURIComponent`, so it
 *     round-trips EXACTLY under `decodeURIComponent` (`?text=<encoded>`).
 *   • The `?text` query is omitted entirely when no message is supplied.
 *   • Output is always an absolute `https://` URL and is a deterministic
 *     function of its inputs.
 *
 * @see Property 13: WhatsApp URL builder — Validates Requirements 2.7, 9.3, 16.3
 */

/** Base origin for WhatsApp click-to-chat deep links. */
const WA_ME_BASE = "https://wa.me";

/**
 * PLACEHOLDER — Kaivalyam Homestay's WhatsApp / WATI business number.
 *
 * ⚠️ This is NOT the real number. The actual WATI/business WhatsApp number is
 * provided later (during content authoring / environment configuration) and
 * MUST replace this constant. It is written in human-readable international
 * form here; `buildWhatsAppUrl` normalizes it to digits for the deep link
 * (`+91 90000 00000` → `919000000000`).
 */
export const KAIVALYAM_WHATSAPP_NUMBER = "+91 90000 00000";

/** Options for {@link buildWhatsAppUrl}. */
export interface WhatsAppLinkOptions {
  /**
   * The destination WhatsApp account number. May be supplied in any
   * human-readable form (with `+`, spaces, dashes, parentheses); it is
   * normalized to digits only for the `wa.me` path.
   */
  phone: string;
  /**
   * Optional prefilled message. Encoded exactly so it round-trips on decode.
   * When omitted (`undefined`), no `?text` query is emitted.
   */
  message?: string;
}

/**
 * Strip every non-digit character from a phone string, preserving the order of
 * the remaining digits. `wa.me` requires an international number expressed as
 * digits only (no leading `+`, spaces, or punctuation).
 */
function normalizePhoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Build a `wa.me` WhatsApp click-to-chat deep link.
 *
 * @param opts - The destination {@link WhatsAppLinkOptions.phone} and optional
 *               {@link WhatsAppLinkOptions.message}.
 * @returns An absolute `https://wa.me/<digits>` URL, with `?text=<encoded>`
 *          appended only when a message is supplied.
 *
 * @example
 * buildWhatsAppUrl({ phone: "+91 90000 00000" })
 * // → "https://wa.me/919000000000"
 *
 * @example
 * buildWhatsAppUrl({ phone: "+91 90000 00000", message: "Hi Kaivalyam! Is the Luxury Cottage free?" })
 * // → "https://wa.me/919000000000?text=Hi%20Kaivalyam!%20Is%20the%20Luxury%20Cottage%20free%3F"
 */
export function buildWhatsAppUrl(opts: WhatsAppLinkOptions): string {
  const digits = normalizePhoneDigits(opts.phone);
  const base = `${WA_ME_BASE}/${digits}`;

  if (opts.message === undefined) {
    return base;
  }

  return `${base}?text=${encodeURIComponent(opts.message)}`;
}

/**
 * Convenience default deep link to the Kaivalyam WhatsApp account (no prefilled
 * message), so Home (11.1), Contact (13.1), and the WhatsApp entry point (14.2)
 * can share one canonical link without re-deriving it.
 *
 * ⚠️ Derived from the {@link KAIVALYAM_WHATSAPP_NUMBER} PLACEHOLDER — updates
 * automatically once the real WATI number replaces the placeholder.
 */
export const KAIVALYAM_WHATSAPP_URL = buildWhatsAppUrl({
  phone: KAIVALYAM_WHATSAPP_NUMBER,
});
