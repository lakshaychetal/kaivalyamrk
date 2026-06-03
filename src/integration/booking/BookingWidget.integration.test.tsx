/**
 * Integration contract tests for the eeabsolute booking embed (task 17.4).
 * -------------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website
 *
 * These are CONTRACT / EMBED-LEVEL tests — they verify what THIS SITE sends and
 * embeds, not the behavior of eeabsolute, Razorpay, or any live service. No
 * network calls are made; the eeabsolute iframe is never actually fetched.
 *
 * Contracts verified:
 *
 *   1. Booking embed presence and configuration (Req 12.1, 13.1, 14.1):
 *      • The widget renders an <iframe> embed element in the 'ready' state.
 *      • The embed src URL is built from buildBookingUrl with country=India,
 *        state=Kerala, and a non-empty city (Req 12.2).
 *      • The widget shows a loading indicator in the 'loading' state (Req 12.7).
 *      • The widget shows a fallback message with an alternate contact in the
 *        'failed' state (Req 12.6).
 *
 *   2. Razorpay sandbox contract (Req 15.1–15.5):
 *      • The booking widget host URL uses https: (Req 15.5) — Razorpay runs
 *        INSIDE the eeabsolute flow; the site never embeds Razorpay directly.
 *      • The widget host does not expose any Razorpay credentials or payment
 *        state in the rendered DOM.
 *
 * All external HTTP is mocked (no live network calls).
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";

import { BookingWidget } from "./BookingWidget";
import {
  buildBookingUrl,
  kaivalyamBookingConfig,
  KAIVALYAM_PROPERTY_CITY,
} from "@/domain/integration-urls/booking-url";

// ---------------------------------------------------------------------------
// 1. Booking embed presence and configuration (Req 12.1, 13.1, 14.1)
// ---------------------------------------------------------------------------

describe("BookingWidget integration contract — embed presence and configuration", () => {
  it("renders an <iframe> embed element when in the ready state (Req 12.1)", () => {
    render(<BookingWidget />);
    const iframe = screen.getByTitle(/kaivalyam homestay booking/i);

    // Drive to ready state
    fireEvent.load(iframe);

    // The iframe is still in the DOM (it is never unmounted in the ready state)
    expect(iframe.tagName).toBe("IFRAME");
    const section = screen.getByRole("region", { name: /booking/i });
    expect(section).toHaveAttribute("data-state", "ready");
  });

  it("embed src URL is built from buildBookingUrl with country=India, state=Kerala, non-empty city (Req 12.2)", () => {
    render(<BookingWidget />);
    const iframe = screen.getByTitle(/kaivalyam homestay booking/i);
    const src = iframe.getAttribute("src") ?? "";

    // Must match the canonical URL produced by the pure builder
    const expectedUrl = buildBookingUrl(kaivalyamBookingConfig);
    expect(src).toBe(expectedUrl);

    // Verify the three required location parameters are present in the URL
    const parsed = new URL(src);
    expect(parsed.searchParams.get("country")).toBe("India");
    expect(parsed.searchParams.get("state")).toBe("Kerala");

    const city = parsed.searchParams.get("city");
    expect(city).toBeTruthy();
    expect(city!.length).toBeGreaterThan(0);
    // The city must match the configured Kaivalyam property city
    expect(city).toBe(KAIVALYAM_PROPERTY_CITY);
  });

  it("shows a loading indicator in the loading state (Req 12.7)", () => {
    render(<BookingWidget />);

    // Initial state is always 'loading'
    const section = screen.getByRole("region", { name: /booking/i });
    expect(section).toHaveAttribute("data-state", "loading");

    // A polite live region announces the loading state to screen readers
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent(/loading/i);
  });

  it("shows a fallback message with an alternate contact in the failed state (Req 12.6)", () => {
    vi.useFakeTimers();

    render(<BookingWidget loadTimeoutMs={1_000} />);
    act(() => {
      vi.advanceTimersByTime(1_000);
    });

    const section = screen.getByRole("region", { name: /booking/i });
    expect(section).toHaveAttribute("data-state", "failed");

    // Fallback message is present
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/couldn.?t load online booking/i);

    // At least one alternate contact link is present (phone, WhatsApp, or email)
    const links = screen.getAllByRole("link");
    const contactLinks = links.filter((l) => {
      const href = l.getAttribute("href") ?? "";
      return (
        href.startsWith("tel:") ||
        href.startsWith("mailto:") ||
        href.includes("wa.me")
      );
    });
    expect(contactLinks.length).toBeGreaterThanOrEqual(1);

    vi.useRealTimers();
  });

  it("the embed src is the same URL regardless of how many times the widget is rendered (deterministic contract)", () => {
    const { unmount } = render(<BookingWidget />);
    const src1 = screen
      .getByTitle(/kaivalyam homestay booking/i)
      .getAttribute("src");
    unmount();

    render(<BookingWidget />);
    const src2 = screen
      .getByTitle(/kaivalyam homestay booking/i)
      .getAttribute("src");

    expect(src1).toBe(src2);
    expect(src1).toBe(buildBookingUrl(kaivalyamBookingConfig));
  });
});

// ---------------------------------------------------------------------------
// 2. Razorpay sandbox contract (Req 15.1–15.5)
//
// Razorpay runs INSIDE the eeabsolute booking flow — the site does NOT embed
// Razorpay directly. Our contract is:
//   (a) the booking widget host URL uses https: (Req 15.5), and
//   (b) the widget host DOM does not expose any Razorpay credentials or
//       payment state (the site is opaque to the payment flow).
// ---------------------------------------------------------------------------

describe("BookingWidget integration contract — Razorpay contract (Req 15.1–15.5)", () => {
  it("the booking widget host URL uses https: — Razorpay-in-flow stays on an encrypted connection (Req 15.5)", () => {
    render(<BookingWidget />);
    const iframe = screen.getByTitle(/kaivalyam homestay booking/i);
    const src = iframe.getAttribute("src") ?? "";

    expect(src.startsWith("https://")).toBe(true);

    // Confirm the URL is parseable and the protocol is https:
    const parsed = new URL(src);
    expect(parsed.protocol).toBe("https:");
  });

  it("the widget DOM does not expose any Razorpay credentials or payment state", () => {
    render(<BookingWidget />);
    const section = screen.getByRole("region", { name: /booking/i });
    const html = section.innerHTML;

    // No Razorpay key patterns in the rendered markup
    expect(html).not.toMatch(/rzp_live_/i);
    expect(html).not.toMatch(/rzp_test_/i);
    expect(html).not.toMatch(/razorpay[_-]?key/i);
    expect(html).not.toMatch(/payment[_-]?secret/i);
  });

  it("the widget does not embed a Razorpay script or iframe directly — payment is opaque (Req 15.1)", () => {
    render(<BookingWidget />);
    const section = screen.getByRole("region", { name: /booking/i });

    // The only iframe is the eeabsolute embed; no Razorpay iframe is present
    const iframes = section.querySelectorAll("iframe");
    for (const frame of iframes) {
      const src = frame.getAttribute("src") ?? "";
      expect(src).not.toMatch(/razorpay\.com/i);
    }

    // No Razorpay script tags in the widget host
    const scripts = section.querySelectorAll("script");
    for (const script of scripts) {
      const src = script.getAttribute("src") ?? "";
      expect(src).not.toMatch(/razorpay\.com/i);
    }
  });

  it("the eeabsolute embed src host is eeabsolute.com — the booking engine is correctly delegated (Req 12.1, 13.1, 14.1)", () => {
    render(<BookingWidget />);
    const iframe = screen.getByTitle(/kaivalyam homestay booking/i);
    const src = iframe.getAttribute("src") ?? "";
    const parsed = new URL(src);

    expect(parsed.hostname).toBe("eeabsolute.com");
  });
});
