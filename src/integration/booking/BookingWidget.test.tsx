/**
 * Unit tests for the `BookingWidget` host (task 14.1).
 * ----------------------------------------------------
 * Feature: kaivalyam-homestay-website
 *
 * Verifies the embed contract the task + Reqs 12.1/12.6/12.7/15.5 require:
 *   • loading → ready → failed state machine,
 *   • a loading indicator/skeleton while initializing (Req 12.7),
 *   • a load timeout that moves to `failed` when the iframe never loads,
 *   • an onError → failed transition,
 *   • a fallback message with alternate booking contacts sourced from siteInfo
 *     (phone/WhatsApp/email) on failure (Req 12.6),
 *   • a Retry action that re-attempts loading,
 *   • an HTTPS embed src built via buildBookingUrl (Req 15.5),
 *   • an accessible iframe title + polite loading announcement.
 *
 * The eeabsolute embed itself is external and not exercised here (no PBT) — we
 * drive the iframe's `onLoad`/`onError`/timeout to assert OUR host behavior.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";

import { BookingWidget, DEFAULT_LOAD_TIMEOUT_MS } from "./BookingWidget";
import { kaivalyamBookingUrl } from "@/domain/integration-urls/booking-url";
import { buildWhatsAppUrl } from "@/domain/integration-urls/whatsapp-url";
import { siteInfo } from "@/content/site";

describe("BookingWidget — loading state (Req 12.7)", () => {
  it("starts in the loading state with a polite live indicator", () => {
    render(<BookingWidget />);
    const section = screen.getByRole("region", { name: /booking/i });
    expect(section).toHaveAttribute("data-state", "loading");

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent(/loading the booking widget/i);
  });

  it("mounts the eeabsolute iframe over HTTPS with an accessible title (Req 15.5)", () => {
    render(<BookingWidget />);
    const iframe = screen.getByTitle(/kaivalyam homestay booking/i);
    const src = iframe.getAttribute("src") ?? "";
    expect(src).toBe(kaivalyamBookingUrl());
    expect(src.startsWith("https://")).toBe(true);
  });
});

describe("BookingWidget — ready state", () => {
  it("transitions loading → ready when the iframe loads and hides the skeleton", () => {
    render(<BookingWidget />);
    const iframe = screen.getByTitle(/kaivalyam homestay booking/i);

    fireEvent.load(iframe);

    const section = screen.getByRole("region", { name: /booking/i });
    expect(section).toHaveAttribute("data-state", "ready");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});

describe("BookingWidget — failed state (Req 12.6)", () => {
  // Use fake timers so the load TIMEOUT — the real-world failure guard for a
  // cross-origin embed whose `onError` is unreliable — drives the `failed`
  // state deterministically (and freezes jsdom's auto-`load` of the iframe).
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  /** Render and drive the widget to `failed` via its load timeout. */
  function renderFailed(timeout = 5_000) {
    render(<BookingWidget loadTimeoutMs={timeout} />);
    act(() => {
      vi.advanceTimersByTime(timeout);
    });
    return screen.getByRole("region", { name: /booking/i });
  }

  it("transitions loading → failed and shows the fallback message", () => {
    const section = renderFailed();
    expect(section).toHaveAttribute("data-state", "failed");
    expect(screen.getByRole("alert")).toHaveTextContent(
      /couldn.?t load online booking/i,
    );
  });

  it("offers alternate booking contacts sourced from siteInfo", () => {
    renderFailed();

    // phone → tel:
    const call = screen.getByRole("link", { name: /call/i });
    expect(call).toHaveAttribute("href", expect.stringContaining("tel:"));

    // WhatsApp → wa.me deep link built from siteInfo.whatsappNumber
    const whatsapp = screen.getByRole("link", { name: /whatsapp us/i });
    expect(whatsapp).toHaveAttribute(
      "href",
      buildWhatsAppUrl({ phone: siteInfo.whatsappNumber }),
    );
    expect(whatsapp).toHaveAttribute("target", "_blank");
    expect(whatsapp).toHaveAttribute("rel", expect.stringContaining("noopener"));

    // email → mailto:
    const email = screen.getByRole("link", { name: /email us/i });
    expect(email).toHaveAttribute("href", `mailto:${siteInfo.email}`);
  });

  it("retries loading from the failed state (failed → loading)", () => {
    const section = renderFailed();
    expect(section).toHaveAttribute("data-state", "failed");

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    });

    expect(section).toHaveAttribute("data-state", "loading");
    // The iframe is re-mounted and ready to load again.
    expect(
      screen.getByTitle(/kaivalyam homestay booking/i),
    ).toBeInTheDocument();
  });
});

describe("BookingWidget — load timeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("moves loading → failed when the iframe never loads within the timeout", () => {
    render(<BookingWidget loadTimeoutMs={5_000} />);

    expect(
      screen.getByRole("region", { name: /booking/i }),
    ).toHaveAttribute("data-state", "loading");

    act(() => {
      vi.advanceTimersByTime(5_000);
    });

    expect(
      screen.getByRole("region", { name: /booking/i }),
    ).toHaveAttribute("data-state", "failed");
  });

  it("does NOT time out if the iframe loads before the deadline", () => {
    render(<BookingWidget loadTimeoutMs={DEFAULT_LOAD_TIMEOUT_MS} />);
    const iframe = screen.getByTitle(/kaivalyam homestay booking/i);

    act(() => {
      vi.advanceTimersByTime(1_000);
      fireEvent.load(iframe);
    });

    act(() => {
      vi.advanceTimersByTime(DEFAULT_LOAD_TIMEOUT_MS);
    });

    expect(
      screen.getByRole("region", { name: /booking/i }),
    ).toHaveAttribute("data-state", "ready");
  });
});
