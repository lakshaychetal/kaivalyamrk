/**
 * Unit tests for `SiteFooter` (task 10.2).
 * ----------------------------------------
 * Feature: kaivalyam-homestay-website
 *
 * Verifies the Req 1.7 / 23.2 footer contract: the footer is a single
 * `contentinfo` landmark that shows the homestay name, a contact summary
 * (phone / email / WhatsApp / address), the secondary navigation link set, and
 * a "Photo credits" link to the Photo Credits page (`/photo-credits`).
 */
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";

import { SiteFooter, PHOTO_CREDITS_HREF, PRIVACY_HREF } from "./SiteFooter";
import {
  navigationModel,
  secondaryNavItems,
} from "@/domain/navigation/navigation";
import { siteInfo } from "@/content/site";

describe("SiteFooter", () => {
  it("renders a single contentinfo landmark", () => {
    render(<SiteFooter />);
    expect(screen.getByRole("contentinfo")).toBeTruthy();
  });

  it("displays the homestay name", () => {
    render(<SiteFooter />);
    const footer = screen.getByRole("contentinfo");
    expect(within(footer).getAllByText(siteInfo.name).length).toBeGreaterThan(0);
  });

  it("shows a contact summary: phone, email, and WhatsApp links", () => {
    render(<SiteFooter />);
    const footer = screen.getByRole("contentinfo");

    const phone = within(footer).getByRole("link", { name: /\+91/ });
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
  });

  it("includes the address postal code in the contact summary", () => {
    render(<SiteFooter />);
    const footer = screen.getByRole("contentinfo");
    expect(
      within(footer).getByText(new RegExp(siteInfo.address.postalCode)),
    ).toBeTruthy();
  });

  it("renders the full secondary navigation link set (header links + Reach Us)", () => {
    render(<SiteFooter />);
    const nav = screen.getByRole("navigation", { name: /explore/i });

    for (const item of [...navigationModel.items, ...secondaryNavItems]) {
      const link = within(nav).getByRole("link", { name: item.label });
      expect(link.getAttribute("href")).toBe(item.href);
    }
  });

  it("links 'Photo credits' to the Photo Credits page", () => {
    render(<SiteFooter />);
    const footer = screen.getByRole("contentinfo");
    const credits = within(footer).getByRole("link", {
      name: /photo credits/i,
    });
    expect(credits.getAttribute("href")).toBe(PHOTO_CREDITS_HREF);
    expect(PHOTO_CREDITS_HREF).toBe("/photo-credits");
  });

  it("links 'Privacy notice' to the Privacy Notice page (Req 17.7)", () => {
    render(<SiteFooter />);
    const footer = screen.getByRole("contentinfo");
    const privacy = within(footer).getByRole("link", {
      name: /privacy notice/i,
    });
    expect(privacy.getAttribute("href")).toBe(PRIVACY_HREF);
    expect(PRIVACY_HREF).toBe("/privacy");
  });
});
