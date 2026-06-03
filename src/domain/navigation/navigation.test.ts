/**
 * Property-based tests for the navigation domain module (task 6.2).
 *
 * Feature: kaivalyam-homestay-website, Property 2: Navigation completeness and single active item
 *
 * Exercises the single-source-of-truth `navigationModel` and the pure
 * `resolveActiveNav(path, model)` resolver from `./navigation`.
 *
 * **Validates: Requirements 1.2, 1.4, 1.5**
 */
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { assertProperty } from "@/lib/pbt";
import {
  navigationModel,
  resolveActiveNav,
  type NavigationModel,
} from "./navigation";

/**
 * The complete required set of header links (Req 1.2), in display order.
 * Independent of the implementation's `primaryNavItems` so the test acts as an
 * oracle rather than mirroring the source.
 */
const REQUIRED_NAV = [
  { id: "home", label: "Home", href: "/" },
  { id: "about", label: "About", href: "/about" },
  { id: "rooms", label: "Rooms", href: "/rooms" },
  { id: "facilities", label: "Facilities", href: "/facilities" },
  { id: "gallery", label: "Gallery", href: "/gallery" },
  { id: "attractions", label: "Attractions", href: "/attractions" },
  { id: "cuisine", label: "Cuisine", href: "/cuisine" },
  { id: "contact", label: "Contact", href: "/contact" },
] as const;

// ---------------------------------------------------------------------------
// Independent oracle mirroring the documented matching contract.
// ---------------------------------------------------------------------------

function oracleNormalize(input: string): string {
  let p = input;
  const q = p.indexOf("?");
  if (q !== -1) p = p.slice(0, q);
  const h = p.indexOf("#");
  if (h !== -1) p = p.slice(0, h);
  if (!p.startsWith("/")) p = "/" + p;
  p = p.replace(/\/{2,}/g, "/");
  while (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p;
}

function oracleMatches(path: string, href: string): boolean {
  if (href === "/") return path === "/";
  return path === href || path.startsWith(href + "/");
}

/** Compute the expected active id: the longest-href match, first-on-tie, else null. */
function expectedActive(path: string, model: NavigationModel): string | null {
  const np = oracleNormalize(path);
  let bestId: string | null = null;
  let bestLen = -1;
  for (const item of model.items) {
    const nh = oracleNormalize(item.href);
    if (!oracleMatches(np, nh)) continue;
    if (nh.length > bestLen) {
      bestLen = nh.length;
      bestId = item.id;
    }
  }
  return bestId;
}

// ---------------------------------------------------------------------------
// Path generators.
// ---------------------------------------------------------------------------

const HREFS = navigationModel.items.map((i) => i.href);

/** A path likely to match a nav item, with optional sub-path / trailing slash / query / hash. */
const arbDecoratedPath = fc
  .tuple(
    fc.constantFrom(
      ...HREFS,
      "/",
      "/nope",
      "/rooms-suite", // must NOT match "/rooms"
      "/about-us", // must NOT match "/about"
    ),
    fc.constantFrom("", "/luxury", "/x/y"),
    fc.constantFrom("", "/", "//"),
    fc.constantFrom("", "?a=1", "?x=1&y=2"),
    fc.constantFrom("", "#top", "#section"),
  )
  .map(([base, sub, trail, query, hash]) => `${base}${sub}${trail}${query}${hash}`);

/** Mix of structured paths and fully arbitrary strings. */
const arbPath = fc.oneof(arbDecoratedPath, fc.string());

/** A path that is guaranteed to correspond to a specific nav item. */
const arbMatchingPath = fc
  .tuple(
    fc.constantFrom(...navigationModel.items.map((i) => i.id)),
    fc.constantFrom("", "/", "?q=1", "#a", "/child"),
  )
  .map(([id, suffix]) => {
    const item = navigationModel.items.find((i) => i.id === id)!;
    // The root "/" only matches exactly, so don't append a child sub-path to it.
    if (item.href === "/" && suffix === "/child") {
      return { id, path: "/" };
    }
    return { id, path: `${item.href}${suffix}` };
  });

// ---------------------------------------------------------------------------
// Tests.
// ---------------------------------------------------------------------------

describe("navigation completeness (Req 1.2)", () => {
  // Feature: kaivalyam-homestay-website, Property 2: Navigation completeness and single active item
  it("the single navigation model exposes the complete required link set plus a Book Now CTA", () => {
    // The navigation model is the one source every page renders, so "for all
    // pages" reduces to a single check on the shared model.
    expect(navigationModel.items).toHaveLength(REQUIRED_NAV.length);
    for (const required of REQUIRED_NAV) {
      const found = navigationModel.items.find((i) => i.id === required.id);
      expect(found).toBeDefined();
      expect(found?.label).toBe(required.label);
      expect(found?.href).toBe(required.href);
    }
    // The persistent primary CTA (Req 1.3) is present and labeled "Book Now".
    expect(navigationModel.bookNow.label).toBe("Book Now");
    expect(typeof navigationModel.bookNow.href).toBe("string");
    expect(navigationModel.bookNow.href.length).toBeGreaterThan(0);
  });
});

describe("resolveActiveNav single-active resolution (Req 1.4, 1.5)", () => {
  // Feature: kaivalyam-homestay-website, Property 2: Navigation completeness and single active item
  it("marks at most one item active, and exactly the corresponding item when one exists", () => {
    assertProperty(
      fc.property(arbPath, (path) => {
        const active = resolveActiveNav(path, navigationModel);

        // At most one: the resolver returns a scalar id or null.
        if (active !== null) {
          // ...and it is always a real member of the model (never a stray id).
          expect(navigationModel.items.some((i) => i.id === active)).toBe(true);
        }

        // Exactly the corresponding (most-specific) item, per the oracle.
        expect(active).toBe(expectedActive(path, navigationModel));
      }),
    );
  });

  // Feature: kaivalyam-homestay-website, Property 2: Navigation completeness and single active item
  it("activates the owning item for any path that corresponds to its href", () => {
    assertProperty(
      fc.property(arbMatchingPath, ({ id, path }) => {
        expect(resolveActiveNav(path, navigationModel)).toBe(id);
      }),
    );
  });
});
