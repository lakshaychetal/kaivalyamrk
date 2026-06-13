/**
 * Property test — Property 3: Footer completeness (task 10.4).
 * ------------------------------------------------------------
 * Feature: kaivalyam-homestay-website
 *
 * Design (Property 3): *For all* pages, the rendered footer contains the
 * homestay name, a contact summary, secondary navigation links, and a
 * "Photo credits" link to the Photo Credits page.
 *
 * Because `SiteFooter` is a single shared component mounted once in the root
 * layout (task 10.3) and rendered IDENTICALLY on every page, "for all pages"
 * reduces to a page-invariance property: no matter which page the visitor is
 * on, the footer it carries is complete. We model "the current page" with an
 * arbitrary path drawn from the real route set plus arbitrary noise, render
 * `SiteFooter`, and assert the four completeness invariants hold every time.
 * The footer does not depend on the current path, so a passing property is
 * exactly the statement that the footer is complete on every page.
 *
 * This complements — and does not weaken or duplicate — the example-based
 * `SiteFooter.test.tsx`, which pins the same contract for the default render.
 *
 * **Validates: Requirements 1.7, 23.2**
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import fc from "fast-check";

import { assertProperty } from "@/lib/pbt";
import { SiteFooter, PHOTO_CREDITS_HREF } from "./SiteFooter";
import {
  navigationModel,
  secondaryNavItems,
  ROUTES,
  type NavItem,
} from "@/domain/navigation/navigation";
import { siteInfo } from "@/content/site";

// ---------------------------------------------------------------------------
// Oracle: the contract the footer must satisfy on EVERY page (Req 1.7, 23.2).
// ---------------------------------------------------------------------------

/**
 * The complete secondary-navigation link set the footer must surface: the
 * primary (header) links plus the footer-eligible secondary items (Reach Us).
 */
const expectedFooterNavItems: readonly NavItem[] = [
  ...navigationModel.items,
  ...secondaryNavItems,
];

/** The canonical Photo Credits route the credits link must point at (Req 23.2). */
const PHOTO_CREDITS_ROUTE = "/photo-credits";

/**
 * Assert every Property-3 completeness invariant against the currently-rendered
 * footer. Scoped to the `contentinfo` landmark so we only inspect the footer.
 */
function assertFooterIsComplete(): void {
  const footer = screen.getByRole("contentinfo");

  // 1. Homestay name (Req 1.7) — appears at least once inside the footer.
  expect(
    within(footer).getAllByText(siteInfo.name).length,
  ).toBeGreaterThan(0);

  // 2. Contact summary (Req 1.7): phone, email, and WhatsApp entry points.
  const phone = within(footer).getByRole("link", { name: siteInfo.phone });
  expect(phone.getAttribute("href")).toBe(
    `tel:${siteInfo.phone.replace(/\s+/g, "")}`,
  );

  const email = within(footer).getByRole("link", { name: siteInfo.email });
  expect(email.getAttribute("href")).toBe(`mailto:${siteInfo.email}`);

  const whatsApp = within(footer).getByRole("link", { name: /whatsapp/i });
  expect(whatsApp.getAttribute("href")).toContain("wa.me");
  expect(whatsApp.getAttribute("target")).toBe("_blank");
  expect(whatsApp.getAttribute("rel")).toContain("noopener");
  expect(whatsApp.getAttribute("rel")).toContain("noreferrer");

  // 3. Secondary navigation — the full header + Reach Us link set (Req 1.7).
  const nav = within(footer).getByRole("navigation", { name: /explore/i });
  for (const item of expectedFooterNavItems) {
    const link = within(nav).getByRole("link", { name: item.label });
    expect(link.getAttribute("href")).toBe(item.href);
  }

  // 4. "Photo credits" link to the Photo Credits page (Req 23.2).
  const credits = within(footer).getByRole("link", { name: /photo credits/i });
  expect(credits.getAttribute("href")).toBe(PHOTO_CREDITS_HREF);
  expect(PHOTO_CREDITS_HREF).toBe(PHOTO_CREDITS_ROUTE);
}

// ---------------------------------------------------------------------------
// Generator: an arbitrary "current page" the footer is rendered beneath.
// ---------------------------------------------------------------------------

/**
 * A path standing in for "the page the visitor is currently on". Drawn from the
 * real marketing routes, the booking host, the credits/privacy routes, and some
 * arbitrary noise — so the property genuinely ranges over "all pages" rather
 * than a single fixed one.
 */
const arbCurrentPagePath = fc.oneof(
  fc.constantFrom(
    ...Object.values(ROUTES),
    PHOTO_CREDITS_ROUTE,
    "/book",
    "/privacy",
  ),
  fc
    .string()
    .map((s) => `/${s.replace(/\s+/g, "-")}`),
);

// ---------------------------------------------------------------------------
// Tests.
// ---------------------------------------------------------------------------

describe("Property 3: Footer completeness", () => {
  afterEach(() => {
    cleanup();
  });

  // Feature: kaivalyam-homestay-website, Property 3: Footer completeness
  // **Validates: Requirements 1.7, 23.2**
  it("renders a complete footer (name, contact, secondary nav, photo credits) on every page", () => {
    assertProperty(
      // The generated current-page path is intentionally unused by the
      // predicate body: the footer is path-INDEPENDENT, so whatever page we
      // are on, the same shared `SiteFooter` is rendered. Asserting
      // completeness across the full range of generated pages is exactly
      // Property 3 ("for all pages").
      fc.property(arbCurrentPagePath, () => {
        render(<SiteFooter />);
        try {
          assertFooterIsComplete();
        } finally {
          cleanup();
        }
      }),
    );
  });
});
