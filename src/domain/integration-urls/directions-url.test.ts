/**
 * Property-based tests for `buildDirectionsUrl` (task 6.6).
 *
 * Feature: kaivalyam-homestay-website, Property 12: Directions URL builder
 *
 * For all property location configs, `buildDirectionsUrl(config)` produces a
 * valid external map URL that encodes the property's address/coordinates.
 * (The "opened in a separate browser context" clause is the consumer's job —
 * `target="_blank"` on the link — and is covered by component tests.)
 *
 * **Validates: Requirements 9.2, 9.5, 10.4**
 */
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { assertProperty } from "@/lib/pbt";
import {
  buildDirectionsUrl,
  KAIVALYAM_DIRECTIONS_CONFIG,
  type DirectionsConfig,
} from "./directions-url";

const MAPS_ORIGIN = "https://www.google.com";
const MAPS_DIR_PATH = "/maps/dir/";

/** Finite, in-range coordinate components. */
const arbLat = fc.double({ min: -90, max: 90, noNaN: true, noDefaultInfinity: true });
const arbLng = fc.double({ min: -180, max: 180, noNaN: true, noDefaultInfinity: true });

/** Coordinate-based config (lat + lng present). */
const arbCoordConfig: fc.Arbitrary<DirectionsConfig> = fc.record({
  lat: arbLat,
  lng: arbLng,
  query: fc.option(fc.string(), { nil: undefined }),
});

/** Query-only config: no usable coordinates, non-empty address text. */
const arbQueryConfig: fc.Arbitrary<DirectionsConfig> = fc.record({
  lat: fc.constant(undefined),
  lng: fc.constant(undefined),
  query: fc
    .oneof(
      fc.string({ minLength: 1, maxLength: 60 }),
      fc.constant("Kaivalyam Homestay, Padichira, Wayanad, Kerala 673579, India"),
      fc.constant("café & spices, नगर/road #2"),
    )
    .filter((s) => s.trim() !== ""),
});

describe("buildDirectionsUrl produces a valid encoded map URL (Property 12)", () => {
  // Feature: kaivalyam-homestay-website, Property 12: Directions URL builder
  it("encodes coordinates as the destination when lat & lng are present", () => {
    assertProperty(
      fc.property(arbCoordConfig, (config) => {
        const result = buildDirectionsUrl(config);
        const url = new URL(result);

        // Valid absolute external Google Maps directions URL.
        expect(url.origin).toBe(MAPS_ORIGIN);
        expect(url.pathname).toBe(MAPS_DIR_PATH);
        expect(url.searchParams.get("api")).toBe("1");

        // Coordinates win over any query, encoded exactly as "lat,lng".
        expect(url.searchParams.get("destination")).toBe(`${config.lat},${config.lng}`);
      }),
    );
  });

  // Feature: kaivalyam-homestay-website, Property 12: Directions URL builder
  it("encodes the address query as the destination when coordinates are absent", () => {
    assertProperty(
      fc.property(arbQueryConfig, (config) => {
        const url = new URL(buildDirectionsUrl(config));

        expect(url.origin).toBe(MAPS_ORIGIN);
        expect(url.pathname).toBe(MAPS_DIR_PATH);
        expect(url.searchParams.get("api")).toBe("1");

        // The address round-trips exactly (trimmed) after decoding.
        expect(url.searchParams.get("destination")).toBe(config.query!.trim());
      }),
    );
  });

  // Feature: kaivalyam-homestay-website, Property 12: Directions URL builder
  it("throws for a config with neither valid coordinates nor a non-empty query", () => {
    const arbEmpty = fc.record({
      lat: fc.constant(undefined),
      lng: fc.constant(undefined),
      query: fc.option(
        fc.string({ maxLength: 5 }).filter((s) => s.trim() === ""),
        { nil: undefined },
      ),
    });
    assertProperty(
      fc.property(arbEmpty, (config) => {
        expect(() => buildDirectionsUrl(config)).toThrow();
      }),
    );
  });

  // Feature: kaivalyam-homestay-website, Property 12: Directions URL builder
  it("the canonical Kaivalyam config yields a valid coordinate destination", () => {
    const url = new URL(buildDirectionsUrl(KAIVALYAM_DIRECTIONS_CONFIG));
    expect(url.origin).toBe(MAPS_ORIGIN);
    expect(url.searchParams.get("destination")).toBe(
      `${KAIVALYAM_DIRECTIONS_CONFIG.lat},${KAIVALYAM_DIRECTIONS_CONFIG.lng}`,
    );
  });
});
