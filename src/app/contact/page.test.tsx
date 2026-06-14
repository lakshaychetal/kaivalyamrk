/**
 * Unit tests for the Contact page (task 13.1).
 * --------------------------------------------
 * Feature: kaivalyam-homestay-website
 *
 * Verifies the Contact_Page contract (Req 9.1–9.5, 16.2):
 *   • Req 9.1  — phone AND email contact details are present and actionable.
 *   • Req 9.2  — a "Get Directions" action whose destination is the
 *                `buildDirectionsUrl` external map URL.
 *   • Req 9.5  — that directions link opens in a SEPARATE browser context
 *                (`target="_blank"` + `rel` containing `noopener`/`noreferrer`).
 *   • Req 9.3 / 16.2 — a WhatsApp chat link built by `buildWhatsAppUrl`
 *                (via the shared `WhatsAppEntryPoint`).
 *   • Req 9.4  — an embedded Wayanad map `<iframe>` with an accessible `title`,
 *                and a directions fallback that surfaces when the iframe errors.
 *
 * jsdom does not actually fetch the iframe, so the fallback path is driven by
 * firing the iframe's `error` event directly.
 */
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within, act } from "@testing-library/react";

import ContactPage, { metadata } from "./page";
import { ContactMap, buildMapEmbedUrl } from "./ContactMap";
import { siteInfo } from "@/content/site";
import { KAIVALYAM_DIRECTIONS_URL } from "@/domain/integration-urls/directions-url";
import { buildWhatsAppUrl } from "@/domain/integration-urls/whatsapp-url";

describe("Contact page — contact details (Req 9.1)", () => {
  it("declares a self-describing page title + description (Req 21.1)", () => {
    expect(typeof metadata.title).toBe("string");
    expect((metadata.title as string).length).toBeGreaterThan(0);
    expect(typeof metadata.description).toBe("string");
    expect((metadata.description as string).length).toBeGreaterThan(0);
  });

  it("renders a single top-level heading", () => {
    render(<ContactPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /contact/i }),
    ).toBeInTheDocument();
  });

  it("displays the phone number as a tel: link", () => {
    render(<ContactPage />);
    const link = screen.getByRole("link", { name: siteInfo.phone });
    expect(link).toBeInTheDocument();
    expect(link.getAttribute("href")).toMatch(/^tel:\+?\d+$/);
  });

  it("displays the email as a mailto: link", () => {
    render(<ContactPage />);
    const link = screen.getByRole("link", { name: siteInfo.email });
    expect(link).toHaveAttribute("href", `mailto:${siteInfo.email}`);
  });
});

describe("Contact page — Get Directions action (Req 9.2, 9.5)", () => {
  it("renders a 'Get Directions' link to the buildDirectionsUrl destination", () => {
    render(<ContactPage />);
    const links = screen
      .getAllByRole("link", { name: /get directions/i })
      .filter((a) => a.getAttribute("href") === KAIVALYAM_DIRECTIONS_URL);
    expect(links.length).toBeGreaterThan(0);
    // The destination really is the owner-verified Google Maps link.
    expect(KAIVALYAM_DIRECTIONS_URL).toMatch(/^https:\/\/maps\.app\.goo\.gl\//);
  });

  it("opens the directions link in a separate browser context", () => {
    render(<ContactPage />);
    const links = screen
      .getAllByRole("link", { name: /get directions/i })
      .filter((a) => a.getAttribute("href") === KAIVALYAM_DIRECTIONS_URL);
    for (const link of links) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
      expect(link).toHaveAttribute("rel", expect.stringContaining("noreferrer"));
    }
  });
});

describe("Contact page — WhatsApp chat link (Req 9.3, 16.2)", () => {
  it("renders a WhatsApp chat link built by buildWhatsAppUrl", () => {
    render(<ContactPage />);
    const link = screen.getByRole("link", { name: /chat on whatsapp/i });
    const href = link.getAttribute("href") ?? "";
    // It is a wa.me deep link to the homestay account.
    expect(href).toMatch(/^https:\/\/wa\.me\/\d+/);
    expect(href).toContain(
      buildWhatsAppUrl({ phone: siteInfo.whatsappNumber }),
    );
    // External → opens in a new, isolated context.
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });
});

describe("Contact page — embedded map + fallback (Req 9.4)", () => {
  it("renders an embedded map iframe with an accessible title", () => {
    const { container } = render(<ContactPage />);
    const iframe = container.querySelector("iframe");
    expect(iframe).not.toBeNull();
    expect(iframe).toHaveAttribute(
      "title",
      expect.stringMatching(/kaivalyam homestay/i),
    );
    // Points at the embed URL derived from the typed map location.
    expect(iframe).toHaveAttribute(
      "src",
      buildMapEmbedUrl(siteInfo.mapLocation),
    );
    // Deferred, non-blocking load.
    expect(iframe).toHaveAttribute("loading", "lazy");
  });

  it("a directions fallback is available alongside the map even before any error", () => {
    render(<ContactPage />);
    // The persistent fallback link in the map region points at the directions URL.
    const fallbackLinks = screen
      .getAllByRole("link", { name: /get directions/i })
      .filter((a) => a.getAttribute("href") === KAIVALYAM_DIRECTIONS_URL);
    expect(fallbackLinks.length).toBeGreaterThan(0);
  });

  it("swaps to the directions fallback panel when the iframe fails to load", async () => {
    // Render ContactMap directly to test the error state transition in isolation.
    const { container } = render(<ContactMap />);
    const iframe = container.querySelector("iframe");
    expect(iframe).not.toBeNull();

    // React 19 attaches onError to iframes via a capture listener at the document
    // level. Access the React internal fiber to call the handler directly.
    // This is the most reliable way to trigger React event handlers in jsdom
    // when the native DOM event doesn't propagate as expected.
    const reactPropsKey = Object.keys(iframe!).find(
      (k) => k.startsWith("__reactProps"),
    );

    if (reactPropsKey && (iframe as unknown as Record<string, unknown>)[reactPropsKey]) {
      const props = (iframe as unknown as Record<string, unknown>)[reactPropsKey] as Record<string, unknown>;
      if (typeof props["onError"] === "function") {
        await act(async () => {
          (props["onError"] as () => void)();
        });
      }
    } else {
      // Fallback: fire the native error event
      await act(async () => {
        fireEvent.error(iframe!);
      });
    }

    // The iframe is gone and an alert fallback offers external directions.
    expect(container.querySelector("iframe")).toBeNull();
    const alert = screen.getByRole("alert");
    const fallbackLink = within(alert).getByRole("link", {
      name: /get directions/i,
    });
    expect(fallbackLink).toHaveAttribute("href", KAIVALYAM_DIRECTIONS_URL);
    expect(fallbackLink).toHaveAttribute("target", "_blank");
    expect(fallbackLink).toHaveAttribute(
      "rel",
      expect.stringContaining("noopener"),
    );
  });
});

describe("buildMapEmbedUrl — pure embed URL builder", () => {
  it("encodes coordinates as the q param when lat & lng are present", () => {
    const url = new URL(buildMapEmbedUrl({ lat: 11.8126, lng: 76.1059 }));
    expect(url.origin + url.pathname).toBe("https://www.google.com/maps");
    expect(url.searchParams.get("q")).toBe("11.8126,76.1059");
    expect(url.searchParams.get("output")).toBe("embed");
  });

  it("falls back to the embedQuery text when coordinates are absent", () => {
    const url = new URL(
      buildMapEmbedUrl({ embedQuery: "Kaivalyam Homestay, Wayanad" }),
    );
    expect(url.searchParams.get("q")).toBe("Kaivalyam Homestay, Wayanad");
    expect(url.searchParams.get("output")).toBe("embed");
  });

  it("throws when neither coordinates nor a query are usable", () => {
    expect(() => buildMapEmbedUrl({})).toThrow();
    expect(() => buildMapEmbedUrl({ embedQuery: "   " })).toThrow();
  });
});
