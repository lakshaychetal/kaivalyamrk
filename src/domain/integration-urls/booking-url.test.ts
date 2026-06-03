/**
 * Property-based tests for `buildBookingUrl` (task 6.4).
 *
 * Feature: kaivalyam-homestay-website, Property 1: Every booking action resolves to the configured booking engine
 *
 * The pure-domain slice of Property 1: for all configs, `buildBookingUrl(config)`
 * targets the configured base URL and carries `country`, `state`, `city` query
 * parameters equal to the configured property-location values. (The rendered
 * "single primary-CTA style" half of the property is covered by component tests.)
 *
 * **Validates: Requirements 1.3, 4.6, 12.2, 12.3, 19.6**
 */
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { assertProperty } from "@/lib/pbt";
import {
  buildBookingUrl,
  kaivalyamBookingConfig,
  type BookingConfig,
} from "./booking-url";

/** Hostnames the URL constructor accepts; kept simple/registrable. */
const arbHost = fc
  .tuple(
    fc.constantFrom("eeabsolute.com", "book.eeabsolute.com", "example.org", "localhost"),
    fc.constantFrom("", "/booking", "/embed/widget"),
  )
  .map(([host, path]) => `https://${host}${path}`);

/** Location values include spaces, Unicode, and reserved chars to exercise encoding. */
const arbLocationValue = fc.oneof(
  fc.constantFrom("India", "Kerala", "Wayanad", "Tamil Nadu", "New York"),
  fc.string({ minLength: 1, maxLength: 24 }),
  fc.constantFrom("A&B", "x=y", "space here", "café/नगर", "100% sure"),
);

const arbConfig: fc.Arbitrary<BookingConfig> = fc.record(
  {
    baseUrl: arbHost,
    country: arbLocationValue,
    state: arbLocationValue,
    city: arbLocationValue,
    propertyId: fc.option(fc.string({ minLength: 1, maxLength: 12 }), { nil: undefined }),
    extraParams: fc.option(
      fc.dictionary(
        fc.string({ minLength: 1, maxLength: 8 }).filter(
          (k) => !["country", "state", "city", "propertyId"].includes(k),
        ),
        fc.string({ maxLength: 16 }),
        { maxKeys: 3 },
      ),
      { nil: undefined },
    ),
  },
  { requiredKeys: ["baseUrl", "country", "state", "city"] },
);

describe("buildBookingUrl resolves to the configured booking engine (Property 1)", () => {
  // Feature: kaivalyam-homestay-website, Property 1: Every booking action resolves to the configured booking engine
  it("targets the configured base origin/path and carries country/state/city equal to the config", () => {
    assertProperty(
      fc.property(arbConfig, (config) => {
        const result = buildBookingUrl(config);
        const url = new URL(result);

        // Always an absolute https URL (booking host served over HTTPS, Req 15.5/19.6).
        expect(url.protocol).toBe("https:");

        // Targets the configured base: same origin, and the base path is a prefix.
        const base = new URL(
          config.baseUrl.includes("://") ? config.baseUrl : `https://${config.baseUrl}`,
        );
        expect(url.origin).toBe(base.origin);
        const expectedPath = base.pathname.replace(/\/+$/, "");
        expect(url.pathname.replace(/\/+$/, "")).toBe(expectedPath);

        // Carries the configured property-location params, decoded EXACTLY.
        expect(url.searchParams.get("country")).toBe(config.country);
        expect(url.searchParams.get("state")).toBe(config.state);
        expect(url.searchParams.get("city")).toBe(config.city);
      }),
    );
  });

  // Feature: kaivalyam-homestay-website, Property 1: Every booking action resolves to the configured booking engine
  it("the canonical Kaivalyam config encodes India / Kerala / its configured city", () => {
    const url = new URL(buildBookingUrl(kaivalyamBookingConfig));
    expect(url.searchParams.get("country")).toBe(kaivalyamBookingConfig.country);
    expect(url.searchParams.get("state")).toBe(kaivalyamBookingConfig.state);
    expect(url.searchParams.get("city")).toBe(kaivalyamBookingConfig.city);
  });

  // Feature: kaivalyam-homestay-website, Property 1: Every booking action resolves to the configured booking engine
  it("is deterministic — identical config yields an identical URL", () => {
    assertProperty(
      fc.property(arbConfig, (config) => {
        expect(buildBookingUrl(config)).toBe(buildBookingUrl(config));
      }),
    );
  });
});
