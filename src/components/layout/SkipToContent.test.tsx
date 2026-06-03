/**
 * Unit tests for `SkipToContent` (task 10.3).
 * -------------------------------------------
 * Feature: kaivalyam-homestay-website
 *
 * Verifies the Req 22.8 skip-link contract:
 *   • It is a link that targets the `#main` content landmark.
 *   • It is visually hidden until focused, then revealed (`sr-only` →
 *     `focus:not-sr-only`).
 *   • It exposes a meaningful accessible name and points at the same id the
 *     shell gives its `<main>` (`MAIN_CONTENT_ID`).
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { SkipToContent, MAIN_CONTENT_ID } from "./SkipToContent";

describe("SkipToContent (Req 22.8)", () => {
  it("renders a link targeting the #main content landmark", () => {
    render(<SkipToContent />);
    const link = screen.getByRole("link", { name: /skip to main content/i });
    expect(link).toHaveAttribute("href", `#${MAIN_CONTENT_ID}`);
    expect(MAIN_CONTENT_ID).toBe("main");
  });

  it("is visually hidden until focused, then revealed on focus", () => {
    render(<SkipToContent />);
    const link = screen.getByRole("link", { name: /skip to main content/i });
    // Hidden by default…
    expect(link.className).toContain("sr-only");
    // …revealed when focused.
    expect(link.className).toContain("focus:not-sr-only");
  });

  it("supports a custom label", () => {
    render(<SkipToContent label="Skip navigation" />);
    expect(
      screen.getByRole("link", { name: "Skip navigation" }),
    ).toHaveAttribute("href", `#${MAIN_CONTENT_ID}`);
  });
});
