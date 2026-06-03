/**
 * Property + unit tests for WCAG contrast across the design-token pairs.
 * ---------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 2.2)
 *
 * Exercises the pure contrast math in `./contrast` against the exhaustive set
 * of foreground/background pairs the UI relies on (`colorPairs` in `./tokens`),
 * proving every pair clears its WCAG 2.1 AA minimum for its usage class
 * (normal text 4.5:1, large text / non-text 3:1).
 *
 * **Validates: Requirements 2.8, 22.1**
 */
import { describe, it, expect } from "vitest";
import fc from "fast-check";

import { assertProperty } from "@/lib/pbt";
import { colorPairs, CONTRAST_MINIMUMS, colors } from "./tokens";
import {
  contrastRatio,
  pairContrastRatio,
  pairMeetsAA,
  relativeLuminance,
} from "./contrast";

describe("Property 5 — contrast meets WCAG AA for all token pairs", () => {
  // Feature: kaivalyam-homestay-website, Property 5: Contrast meets WCAG AA for all token pairs
  it("every UI color-token pair clears its usage-class AA minimum", () => {
    expect(colorPairs.length).toBeGreaterThan(0);

    assertProperty(
      fc.property(fc.constantFrom(...colorPairs), (pair) => {
        const ratio = pairContrastRatio(pair);
        const minimum = CONTRAST_MINIMUMS[pair.usage];

        // The computed ratio meets the WCAG AA floor for the pair's usage:
        // normal text → 4.5:1, large text / meaningful non-text → 3:1.
        expect(ratio).toBeGreaterThanOrEqual(minimum);
        // The convenience predicate agrees with the raw comparison.
        expect(pairMeetsAA(pair)).toBe(true);
        // Contrast is always within the WCAG-defined [1, 21] range.
        expect(ratio).toBeGreaterThanOrEqual(1);
        expect(ratio).toBeLessThanOrEqual(21);
      }),
    );
  });

  // Feature: kaivalyam-homestay-website, Property 5: Contrast meets WCAG AA for all token pairs
  it("contrast is symmetric for any pair of semantic colors", () => {
    const names = Object.keys(colors) as Array<keyof typeof colors>;
    assertProperty(
      fc.property(
        fc.constantFrom(...names),
        fc.constantFrom(...names),
        (a, b) => {
          const ab = contrastRatio(colors[a], colors[b]);
          const ba = contrastRatio(colors[b], colors[a]);
          expect(ab).toBeCloseTo(ba, 10);
        },
      ),
    );
  });
});

describe("contrast math — example checks", () => {
  it("black-on-white is the maximum 21:1 ratio", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
  });

  it("identical colors have a 1:1 ratio", () => {
    expect(contrastRatio("#356a23", "#356a23")).toBeCloseTo(1, 10);
  });

  it("relative luminance is 0 for black and 1 for white", () => {
    expect(relativeLuminance("#000000")).toBeCloseTo(0, 10);
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 10);
  });
});
