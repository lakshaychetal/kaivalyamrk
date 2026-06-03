/**
 * `buildBookingUrl` — pure, deterministic eeabsolute.com booking-URL builder.
 * ---------------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 6.3)
 *
 * Produces the absolute https embed/deep-link URL for the eeabsolute.com
 * Booking_Engine, parameterized with the property location (`country`,
 * `state`, `city`) plus optional `propertyId` and arbitrary extra params.
 *
 * The reference pattern `eeabsolute.com/?country=India&state=Punjab&city=Ludhiana`
 * is only a SAMPLE — the Kaivalyam configuration uses the real property
 * location: `country=India`, `state=Kerala`, `city=Wayanad` (see
 * {@link kaivalyamBookingConfig}).
 *
 * Layering: this is pure domain logic (no React, no DOM, no vendor SDK, no I/O)
 * so it can be reused by the `BookNowButton` href (task 6.1), the
 * `BookingWidget` host (task 14.1), and property-tested in isolation (task 6.4).
 * No imports from `app/`, `components/`, or `integration/`.
 *
 * Design contract (Property 1, Req 12.2/12.3/1.3/4.6/19.6): the produced URL
 * targets the configured base URL and carries `country`, `state`, and `city`
 * query parameters equal to the configured property-location values.
 *
 * Determinism & encoding rules (documented, binding):
 *   1. Parameter ORDER is fixed and stable: `country`, `state`, `city`, then
 *      `propertyId` (only when provided), then every `extraParams` entry in
 *      its own insertion order. Identical input always yields an identical
 *      string — no sorting, no Map/Set iteration surprises.
 *   2. Every key and value is percent-encoded with `encodeURIComponent`, so a
 *      space becomes `%20` (NOT `+`). This guarantees values round-trip
 *      EXACTLY under `decodeURIComponent` — `&`, `=`, `#`, spaces, and Unicode
 *      are all preserved verbatim after decoding.
 *   3. The result is always an absolute `https://` URL. A `baseUrl` without a
 *      scheme is treated as https; an `http://` base is upgraded to https
 *      (Req 15.5 — the booking host is served over HTTPS).
 *   4. The function NEVER returns an invalid URL: the assembled string is
 *      validated with the `URL` constructor before return. Genuinely
 *      unparseable input (e.g. an empty `baseUrl`) throws rather than
 *      returning a malformed string.
 */

/**
 * Configuration for {@link buildBookingUrl}. Mirrors the design's
 * `BookingConfig` interface.
 */
export interface BookingConfig {
  /** Booking host, e.g. `https://eeabsolute.com`. Scheme optional; forced to https. */
  baseUrl: string;
  /** Property country, e.g. `India` (Req 12.2). */
  country: string;
  /** Property state, e.g. `Kerala` (Req 12.2). */
  state: string;
  /** Property city, e.g. `Wayanad` (Req 12.2). */
  city: string;
  /** Optional eeabsolute property identifier. */
  propertyId?: string;
  /** Optional additional query params, emitted in insertion order. */
  extraParams?: Record<string, string>;
}

/**
 * Default eeabsolute.com booking host. HTTPS so the Razorpay-in-flow payment
 * stays on an encrypted connection (Req 15.5).
 */
export const EEABSOLUTE_BASE_URL = 'https://eeabsolute.com' as const;

/**
 * The configured Kaivalyam property city, in Wayanad, Kerala.
 *
 * Kaivalyam Homestay sits in Padichira (~10 km from Pulpally), Wayanad. `Wayanad`
 * is used as the booking-location `city` because it is the recognizable
 * destination travelers search for and the level eeabsolute expects for the
 * reference `country/state/city` pattern. This is a single configurable
 * constant — change it here (or pass a different `city` in the config) to point
 * the booking engine at a more specific town if eeabsolute supports one.
 */
export const KAIVALYAM_PROPERTY_CITY = 'Wayanad' as const;

/** Fixed, ordered reserved keys emitted before any `extraParams`. */
const RESERVED_PARAM_KEYS = ['country', 'state', 'city', 'propertyId'] as const;

/**
 * Normalize a base URL to an absolute https origin+path with no trailing slash.
 * Throws if the input cannot be parsed into a valid URL.
 */
function normalizeBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim();
  if (trimmed === '') {
    throw new Error('buildBookingUrl: baseUrl must be a non-empty URL');
  }

  // Add a scheme if the caller omitted one (e.g. "eeabsolute.com").
  const withScheme = /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    throw new Error(`buildBookingUrl: invalid baseUrl "${baseUrl}"`);
  }

  // Force HTTPS (Req 15.5): upgrade http/other schemes to https.
  parsed.protocol = 'https:';

  // origin + pathname, with any trailing slash stripped so we can append "/?...".
  const path = parsed.pathname.replace(/\/+$/, '');
  return `${parsed.origin}${path}`;
}

/** Percent-encode one `key=value` pair with `encodeURIComponent` (space → %20). */
function encodePair(key: string, value: string): string {
  return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
}

/**
 * Build the absolute https eeabsolute booking URL for the given configuration.
 *
 * Pure and deterministic: same input → same output, no side effects.
 *
 * @example
 * buildBookingUrl({ baseUrl: 'https://eeabsolute.com', country: 'India',
 *   state: 'Kerala', city: 'Wayanad' })
 * // → 'https://eeabsolute.com/?country=India&state=Kerala&city=Wayanad'
 */
export function buildBookingUrl(config: BookingConfig): string {
  const base = normalizeBaseUrl(config.baseUrl);

  // (1) Fixed, stable parameter order.
  const pairs: string[] = [
    encodePair('country', config.country),
    encodePair('state', config.state),
    encodePair('city', config.city),
  ];

  if (config.propertyId !== undefined) {
    pairs.push(encodePair('propertyId', config.propertyId));
  }

  if (config.extraParams) {
    for (const [key, value] of Object.entries(config.extraParams)) {
      // Skip reserved keys so they cannot duplicate the canonical params above.
      if ((RESERVED_PARAM_KEYS as readonly string[]).includes(key)) {
        continue;
      }
      pairs.push(encodePair(key, value));
    }
  }

  const url = `${base}/?${pairs.join('&')}`;

  // (4) Guarantee we never return an invalid URL.
  try {
    void new URL(url);
  } catch {
    throw new Error(`buildBookingUrl: produced an invalid URL "${url}"`);
  }

  return url;
}

/**
 * The default Kaivalyam booking configuration: India / Kerala / Wayanad on the
 * eeabsolute.com host. Reused by the `BookNowButton` href (task 6.1) and the
 * `BookingWidget` (task 14.1) so every booking action resolves to one place.
 */
export const kaivalyamBookingConfig: BookingConfig = {
  baseUrl: EEABSOLUTE_BASE_URL,
  country: 'India',
  state: 'Kerala',
  city: KAIVALYAM_PROPERTY_CITY,
};

/**
 * Convenience: the canonical Kaivalyam "Book Now" destination href.
 *
 * @example
 * kaivalyamBookingUrl()
 * // → 'https://eeabsolute.com/?country=India&state=Kerala&city=Wayanad'
 */
export function kaivalyamBookingUrl(): string {
  return buildBookingUrl(kaivalyamBookingConfig);
}
