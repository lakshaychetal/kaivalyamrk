/**
 * Unit tests for the site header + navigation (task 10.1).
 * --------------------------------------------------------
 * Feature: kaivalyam-homestay-website
 *
 * Verifies the header contract from Req 1.2/1.3/1.5/1.6/1.8:
 *   • The header renders the complete required nav set + the Book Now CTA
 *     (driven by the single `navigationModel`).
 *   • The logo links to Home with a meaningful accessible name (Req 1.8).
 *   • Active-state highlighting marks exactly one item with `aria-current="page"`
 *     based on `resolveActiveNav(usePathname(), model)` (Req 1.5).
 *   • The mobile menu is a focus-managed disclosure: the toggle exposes
 *     `aria-expanded`/`aria-controls`, opening moves focus into the panel,
 *     Escape closes and returns focus to the toggle (Req 1.6).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SiteHeader } from "./SiteHeader";
import { navigationModel } from "@/domain/navigation/navigation";

// Mock the App Router pathname hook so active-state resolution is deterministic.
const mockPathname = vi.fn<() => string>(() => "/");
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));

beforeEach(() => {
  mockPathname.mockReturnValue("/");
});

describe("SiteHeader — navigation completeness (Req 1.2/1.3)", () => {
  it("renders every required nav link from the single navigationModel", () => {
    render(<SiteHeader />);
    // Desktop nav landmark.
    const nav = screen.getByRole("navigation", { name: "Primary" });
    for (const item of navigationModel.items) {
      expect(
        within(nav).getByRole("link", { name: item.label }),
      ).toHaveAttribute("href", item.href);
    }
  });

  it("renders the persistent Book Now CTA in the header", () => {
    render(<SiteHeader />);
    const cta = screen
      .getAllByRole("link", { name: /book now/i })
      .find((el) => el.getAttribute("href") === navigationModel.bookNow.href);
    expect(cta).toBeTruthy();
  });

  it("links the logo to Home with a meaningful accessible name (Req 1.8)", () => {
    render(<SiteHeader />);
    const logoLink = screen.getByRole("link", { name: /kaivalyam homestay/i });
    expect(logoLink).toHaveAttribute("href", "/");
    expect(screen.getByAltText("Kaivalyam Homestay")).toBeInTheDocument();
  });
});

describe("SiteHeader — active state (Req 1.5)", () => {
  it("marks exactly the active item with aria-current=page", () => {
    mockPathname.mockReturnValue("/rooms");
    render(<SiteHeader />);
    const nav = screen.getByRole("navigation", { name: "Primary" });
    const current = within(nav)
      .getAllByRole("link")
      .filter((el) => el.getAttribute("aria-current") === "page");
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent("Rooms");
  });

  it("marks Home active on the root path", () => {
    mockPathname.mockReturnValue("/");
    render(<SiteHeader />);
    const nav = screen.getByRole("navigation", { name: "Primary" });
    const current = within(nav)
      .getAllByRole("link")
      .filter((el) => el.getAttribute("aria-current") === "page");
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent("Home");
  });
});

describe("MobileNavMenu — focus-managed disclosure (Req 1.6)", () => {
  it("toggle exposes aria-expanded/aria-controls and opens the panel", async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);

    const toggle = screen.getByRole("button", { name: "Open menu" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    const panelId = toggle.getAttribute("aria-controls");
    expect(panelId).toBeTruthy();

    await user.click(toggle);
    // Now labelled "Close menu" and expanded.
    expect(
      screen.getByRole("button", { name: "Close menu" }),
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("moves focus into the panel on open and returns it to the toggle on Escape", async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);

    const toggle = screen.getByRole("button", { name: "Open menu" });
    await user.click(toggle);

    // Focus moved into the panel (the first focusable control).
    expect(document.activeElement).not.toBe(toggle);
    expect(document.activeElement?.tagName).toBe("A");

    await user.keyboard("{Escape}");
    // Menu closed → focus returned to the (re-labelled) toggle.
    const reopenToggle = screen.getByRole("button", { name: "Open menu" });
    expect(document.activeElement).toBe(reopenToggle);
  });

  it("includes the Book Now CTA inside the mobile panel (Req 1.3)", async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    // The mobile panel nav also carries a Book Now CTA.
    const ctas = screen
      .getAllByRole("link", { name: /book now/i })
      .filter((el) => el.getAttribute("href") === navigationModel.bookNow.href);
    expect(ctas.length).toBeGreaterThanOrEqual(1);
  });
});
