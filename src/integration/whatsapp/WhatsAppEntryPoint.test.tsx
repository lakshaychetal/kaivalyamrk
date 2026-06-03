/**
 * Unit tests for `WhatsAppEntryPoint` (task 14.2).
 * ------------------------------------------------
 * Feature: kaivalyam-homestay-website
 *
 * Verifies the click-to-chat contract the task + Reqs 16.1/16.2/16.3 require:
 *   • Renders an accessible link (Home/Contact entry point) — Req 16.2.
 *   • The destination is the `wa.me` deep link from `buildWhatsAppUrl` to the
 *     homestay account, opened in a new, isolated browser context — Req 16.3.
 *   • An optional prefilled message is seeded into the link's `?text` query.
 *   • Both variants are accessible: the labelled `primary` variant exposes its
 *     visible label as the accessible name; the icon-only `fab` variant carries
 *     an `aria-label` (Req 22.5).
 *   • Color/affordances come from semantic tokens with a visible focus ring.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { WhatsAppEntryPoint } from "./WhatsAppEntryPoint";
import {
  buildWhatsAppUrl,
  KAIVALYAM_WHATSAPP_NUMBER,
} from "@/domain/integration-urls/whatsapp-url";
import { siteInfo } from "@/content/site";

describe("WhatsAppEntryPoint — primary (labelled) variant", () => {
  it("renders an accessible link labelled 'Chat on WhatsApp' by default", () => {
    render(<WhatsAppEntryPoint />);
    const link = screen.getByRole("link", { name: /chat on whatsapp/i });
    expect(link).toBeInTheDocument();
  });

  it("links to the wa.me deep link for the homestay account (no message)", () => {
    render(<WhatsAppEntryPoint />);
    const link = screen.getByRole("link", { name: /chat on whatsapp/i });
    const expected = buildWhatsAppUrl({ phone: siteInfo.whatsappNumber });
    expect(link).toHaveAttribute("href", expected);
    expect(link.getAttribute("href")).toMatch(/^https:\/\/wa\.me\/\d+$/);
  });

  it("opens the external wa.me link in a new, isolated browser context", () => {
    render(<WhatsAppEntryPoint />);
    const link = screen.getByRole("link", { name: /chat on whatsapp/i });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(link).toHaveAttribute("rel", expect.stringContaining("noreferrer"));
  });

  it("seeds an optional prefilled message into the ?text query", () => {
    const message = "Hi Kaivalyam, I'd like to book the Luxury Cottage!";
    render(<WhatsAppEntryPoint message={message} />);
    const link = screen.getByRole("link", { name: /chat on whatsapp/i });
    const expected = buildWhatsAppUrl({
      phone: siteInfo.whatsappNumber,
      message,
    });
    expect(link).toHaveAttribute("href", expected);
    expect(link.getAttribute("href")).toContain(
      `?text=${encodeURIComponent(message)}`,
    );
  });

  it("accepts a custom label and an explicit phone override", () => {
    render(
      <WhatsAppEntryPoint label="Message us" phone="+91 98765 43210" />,
    );
    const link = screen.getByRole("link", { name: "Message us" });
    expect(link).toHaveAttribute(
      "href",
      buildWhatsAppUrl({ phone: "+91 98765 43210" }),
    );
  });

  it("uses semantic token colors and a visible focus ring (no raw hex)", () => {
    render(<WhatsAppEntryPoint />);
    const link = screen.getByRole("link", { name: /chat on whatsapp/i });
    expect(link.className).toContain("bg-success");
    expect(link.className).toContain("text-on-primary");
    expect(link.className).toContain(
      "focus-visible:[outline:2px_solid_var(--color-focus)]",
    );
    // ≥44px touch target (Req 18.5).
    expect(link.className).toContain("min-h-11");
  });

  it("gates hover/press feedback behind motion-safe (reduced-motion safe)", () => {
    render(<WhatsAppEntryPoint />);
    const link = screen.getByRole("link", { name: /chat on whatsapp/i });
    expect(link.className).toContain("motion-safe:active:scale-[0.98]");
  });

  it("keeps the site number in sync with the placeholder constant", () => {
    // siteInfo mirrors the builder placeholder, so the default link is stable.
    expect(siteInfo.whatsappNumber).toBe(KAIVALYAM_WHATSAPP_NUMBER);
  });
});

describe("WhatsAppEntryPoint — fab (icon-only) variant", () => {
  it("exposes a default accessible name for the icon-only control (Req 22.5)", () => {
    render(<WhatsAppEntryPoint variant="fab" />);
    const link = screen.getByRole("link", {
      name: /chat with kaivalyam homestay on whatsapp/i,
    });
    expect(link).toBeInTheDocument();
  });

  it("honors an explicit aria-label override", () => {
    render(
      <WhatsAppEntryPoint variant="fab" aria-label="WhatsApp the homestay" />,
    );
    expect(
      screen.getByRole("link", { name: "WhatsApp the homestay" }),
    ).toBeInTheDocument();
  });

  it("links to the same external wa.me deep link in a new context", () => {
    render(<WhatsAppEntryPoint variant="fab" />);
    const link = screen.getByRole("link", {
      name: /chat with kaivalyam homestay on whatsapp/i,
    });
    expect(link).toHaveAttribute(
      "href",
      buildWhatsAppUrl({ phone: siteInfo.whatsappNumber }),
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });
});
