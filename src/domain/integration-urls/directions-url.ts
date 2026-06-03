/**
 * Google Maps "Get Directions" deep-link builder — pure, framework-free.
 * ----------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website
 *
 * Pure, deterministic builder that encodes the property's
 * address/coordinates into a valid external map URL that opens ROUTE
 * directions to the destination. Consumed by the Contact page (task 13.1)
 * and the Reach Us page (task 11.6) "Get Directions" actions.
 *
 * Requirements:
 *   9.2  — Contact page "Get Directions" opens the property location in an
 *          external map service.
 *   9.5  — Selecting "Get Directions" opens ROUTE directions to the property
 *          (in a separate browser context — opening is the consumer's job).
 *  10.4  — Reach Us page "Get Directions" opens the property location in an
 *          external map service.
 *
 * No side effects, no DOM, no network. The returned value is a stable string
 * for any given config so it can be property-tested in isolation (Property 12,
 * task 6.6).
 */

/**
 * Location input for {@link buildDirectionsUrl}.
 *
 * Provide either precise coordinates (`lat` + `lng`) or a free-text address
 * `query` (or both). Coordinates are preferred when present because they drop
 * a pin on the exact spot rather than relying on geocoding the text.
 */
export interface DirectionsConfig {
  /** Destination latitude in decimal degrees (-90..90). Pair with {@link lng}. */
  lat?: number;
  /** Destination longitude in decimal degrees (-180..180). Pair with {@link lat}. */
  lng?: number;
  /** Free-text destination (address/place name) used when coordinates are absent. */
  query?: string;
}

/**
 * Google Maps URL that opens turn-by-turn DIRECTIONS to a destination.
 * The official Maps URLs API "dir" action with `api=1` is stable and
 * documented: https://developers.google.com/maps/documentation/urls/get-started
 */
const GOOGLE_MAPS_DIR_BASE = "https://www.google.com/maps/dir/";

/** True iff `n` is a finite number usable as a coordinate component. */
function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

/**
 * Build a valid external Google Maps directions URL for the given location.
 *
 * Resolution rule (deterministic):
 *   1. If BOTH `lat` and `lng` are finite numbers, the destination is the
 *      `"lat,lng"` coordinate pair (preferred — exact pin).
 *   2. Otherwise, if a non-empty `query` is provided, the destination is that
 *      address text.
 *   3. Otherwise the config is invalid and an error is thrown.
 *
 * The destination value is always URL-encoded, and the result is an absolute
 * `https://` URL of the form:
 *   `https://www.google.com/maps/dir/?api=1&destination=<encoded>`
 *
 * @throws {Error} when neither valid coordinates nor a non-empty query exist.
 */
export function buildDirectionsUrl(config: DirectionsConfig): string {
  let destination: string;

  if (isFiniteNumber(config.lat) && isFiniteNumber(config.lng)) {
    // Coordinates win — exact pin, no geocoding ambiguity.
    destination = `${config.lat},${config.lng}`;
  } else if (typeof config.query === "string" && config.query.trim() !== "") {
    destination = config.query.trim();
  } else {
    throw new Error(
      "buildDirectionsUrl requires either finite lat & lng coordinates or a non-empty query.",
    );
  }

  const params = new URLSearchParams({
    api: "1",
    destination,
  });

  return `${GOOGLE_MAPS_DIR_BASE}?${params.toString()}`;
}

/**
 * Default location config for Kaivalyam Homestay.
 *
 * The property sits in Padichira, Wayanad, Kerala — roughly 10 km from
 * Pulpally. The coordinates below are an APPROXIMATE placeholder pin near
 * Padichira/Pulpally; the exact lat/lng MUST be confirmed against the real
 * property pin before launch. The `query` provides a human-readable fallback
 * and keeps the destination meaningful even if the pin is refined later.
 */
export const KAIVALYAM_DIRECTIONS_CONFIG: DirectionsConfig = {
  // TODO: confirm exact property pin — approximate Padichira/Pulpally locale.
  lat: 11.8126,
  lng: 76.1059,
  query: "Kaivalyam Homestay, Padichira, Pulpally, Wayanad, Kerala 673579, India",
};

/**
 * Convenience pre-built directions URL for Kaivalyam, so the Contact (13.1)
 * and Reach Us (11.6) pages can reuse a single canonical "Get Directions"
 * destination without re-deriving it.
 */
export const KAIVALYAM_DIRECTIONS_URL: string = buildDirectionsUrl(
  KAIVALYAM_DIRECTIONS_CONFIG,
);
