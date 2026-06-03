/**
 * Unit tests for `SiteShell` (task 10.3).
 * ---------------------------------------
 * Feature: kaivalyam-homestay-website
 *
 * Verifies the shared shell composition wired into the root layout:
 *   • It renders the header (banner), the `<main id="main">` landmark, and the
 *     footer (contentinfo) around the page content.
 *   • The skip link is the FIRST focusable element and targets `<main>`
 *     (Req 22.8) — confirming the skip-to-main-content control is present and
 *     points at a real landmark.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

import { SiteShell } from "./SiteShell";
import { MAIN_CONTENT_ID } from "./SkipToContent";

// The header is a client island that reads the pathname; mock it for determinism.
const mockPathname = vi.fn<() => string>(() => "/");
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));

beforeEach(() => {
  mockPathname.mockReturnValue("/");
});

describe("SiteShell — composition (Req 1.6/1.7/22.8)", () => {
  it("renders header, main landmark, and footer around the page content", () => {
    render(
      <SiteShell>
        <p>Page body content</p>
      </SiteShell>,
    );

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();

    const main = document.querySelector(`main#${MAIN_CONTENT_ID}`);
    expect(main).not.toBeNull();
    expect(main).toHaveTextContent("Page body content");
  });

  it("makes the skip link the first focusable element targeting #main", () => {
    render(
      <SiteShell>
        <p>Body</p>
      </SiteShell>,
    );

    const skip = screen.getByRole("link", { name: /skip to main content/i });
    expect(skip).toHaveAttribute("href", `#${MAIN_CONTENT_ID}`);

    // It precedes the header in DOM order, so keyboard users reach it first.
    const header = screen.getByRole("banner");
    const order = skip.compareDocumentPosition(header);
    // DOCUMENT_POSITION_FOLLOWING (4) → header comes after the skip link.
    expect(order & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("gives the main landmark tabIndex=-1 so focus can move to it", () => {
    render(
      <SiteShell>
        <p>Body</p>
      </SiteShell>,
    );
    const main = document.querySelector(`main#${MAIN_CONTENT_ID}`);
    expect(main).toHaveAttribute("tabindex", "-1");
  });
});
