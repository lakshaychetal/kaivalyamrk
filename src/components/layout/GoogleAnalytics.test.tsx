/**
 * Unit tests for the GA4 script slot `GoogleAnalytics` (task 10.3).
 * ----------------------------------------------------------------
 * Feature: kaivalyam-homestay-website
 *
 * The slot must be a clean NO-OP when no measurement id is configured (the
 * default in dev / preview / tests) so no analytics requests are made and no
 * id is hardcoded (Req 17.1 / 17.7 — collection only under a configured,
 * privacy-noticed setup).
 *
 * `NEXT_PUBLIC_GA4_ID` is inlined at build time, so we cannot meaningfully flip
 * it at runtime in jsdom; the default (unset) case is the one that matters for
 * the slot's safety guarantee and is what we assert here.
 */
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";

import { GoogleAnalytics } from "./GoogleAnalytics";

describe("GoogleAnalytics (Req 17.1/17.7)", () => {
  it("renders nothing when no GA4 measurement id is configured", () => {
    // No NEXT_PUBLIC_GA4_ID in the test environment → no-op.
    expect(process.env.NEXT_PUBLIC_GA4_ID).toBeFalsy();
    const { container } = render(<GoogleAnalytics />);
    expect(container).toBeEmptyDOMElement();
  });
});
