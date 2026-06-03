/**
 * Unit tests for the Privacy Notice page (task 10.3).
 * ---------------------------------------------------
 * Feature: kaivalyam-homestay-website
 *
 * Verifies Req 17.7: a real, published privacy notice exists that states what
 * analytics data is collected and the visitor's choices. The footer links here
 * (covered by the SiteFooter test); this asserts the page itself is meaningful.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import PrivacyPage, { metadata } from "./page";

describe("Privacy Notice page (Req 17.7)", () => {
  it("renders a top-level Privacy Notice heading", () => {
    render(<PrivacyPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /privacy notice/i }),
    ).toBeInTheDocument();
  });

  it("states what analytics data is collected", () => {
    render(<PrivacyPage />);
    expect(
      screen.getByRole("heading", { name: /analytics data we collect/i }),
    ).toBeInTheDocument();
    // Mentions the concrete analytics signals (page views + visit count).
    expect(screen.getByText(/page views/i)).toBeInTheDocument();
    expect(screen.getByText(/cumulative count of total visits/i)).toBeInTheDocument();
  });

  it("describes the visitor's opt-out choice", () => {
    render(<PrivacyPage />);
    expect(
      screen.getByRole("heading", { name: /your choices/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/opt out of analytics/i)).toBeInTheDocument();
  });

  it("declares a self-describing page title in its metadata", () => {
    expect(metadata.title).toBe("Privacy Notice");
    expect(typeof metadata.description).toBe("string");
  });
});
