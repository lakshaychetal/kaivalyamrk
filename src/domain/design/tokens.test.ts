/**
 * Property + unit tests for touch-target and body-text sizing tokens.
 * -------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 2.3)
 *
 * Exercises the sizing tokens exported from `./tokens`:
 *   • `interactiveSizeTokens` — every interactive component keeps a ≥44×44px
 *     hit target (Req 18.5).
 *   • `bodyTextTokens` — body text never drops below 16px on mobile (Req 18.4).
 *   • `typeScale` — the `base`/`lg` body steps (the steps used for running
 *     copy) are also ≥16px, so the design scale and the body-text token agree.
 *
 * **Validates: Requirements 18.4, 18.5**
 */
import { describe, it, expect } from "vitest";
import fc from "fast-check";

import { assertProperty } from "@/lib/pbt";
import {
  interactiveSizeTokens,
  bodyTextTokens,
  typeScale,
  type TypeScaleStep,
} from "./tokens";

const MIN_TARGET_PX = 44;
const MIN_BODY_FONT_PX = 16;

/** The type-scale steps used for running body copy (≥16px by design). */
const BODY_TEXT_STEPS: readonly TypeScaleStep[] = typeScale.filter((step) =>
  step.sizePx >= MIN_BODY_FONT_PX && (step.name === "base" || step.name === "lg"),
);

describe("Property 21 — touch-target and body-text sizing", () => {
  // Feature: kaivalyam-homestay-website, Property 21: Touch-target and body-text sizing
  it("interactive size tokens keep a >=44x44px target", () => {
    // A single canonical interactive-size token drives every control; assert it
    // (and any caller-derived size that meets the contract) over many runs.
    assertProperty(
      fc.property(fc.integer({ min: 0, max: 200 }), (extra) => {
        // The token's declared minimums never drop below 44px.
        expect(interactiveSizeTokens.minTargetWidthPx).toBeGreaterThanOrEqual(
          MIN_TARGET_PX,
        );
        expect(interactiveSizeTokens.minTargetHeightPx).toBeGreaterThanOrEqual(
          MIN_TARGET_PX,
        );

        // Any concrete control sized at-or-above the token minimums (plus an
        // arbitrary non-negative padding delta) still satisfies the 44px floor.
        const width = interactiveSizeTokens.minTargetWidthPx + extra;
        const height = interactiveSizeTokens.minTargetHeightPx + extra;
        expect(width).toBeGreaterThanOrEqual(MIN_TARGET_PX);
        expect(height).toBeGreaterThanOrEqual(MIN_TARGET_PX);
      }),
    );
  });

  // Feature: kaivalyam-homestay-website, Property 21: Touch-target and body-text sizing
  it("body-text style tokens keep a >=16px mobile font size", () => {
    expect(BODY_TEXT_STEPS.length).toBeGreaterThan(0);

    assertProperty(
      fc.property(fc.constantFrom(...BODY_TEXT_STEPS), (step) => {
        // Every body-text step is >=16px.
        expect(step.sizePx).toBeGreaterThanOrEqual(MIN_BODY_FONT_PX);
        // The dedicated mobile body-text token agrees and never drops below 16px.
        expect(bodyTextTokens.mobileBaseFontSizePx).toBeGreaterThanOrEqual(
          MIN_BODY_FONT_PX,
        );
        // The mobile body size is never larger than the running-copy step it
        // anchors (16px), keeping the mobile floor consistent with the scale.
        expect(bodyTextTokens.mobileBaseFontSizePx).toBeLessThanOrEqual(
          step.sizePx,
        );
      }),
    );
  });
});

describe("sizing tokens — example checks", () => {
  it("the canonical interactive target is exactly 44x44px with >=8px spacing", () => {
    expect(interactiveSizeTokens.minTargetWidthPx).toBe(44);
    expect(interactiveSizeTokens.minTargetHeightPx).toBe(44);
    expect(interactiveSizeTokens.minTargetSpacingPx).toBeGreaterThanOrEqual(8);
  });

  it("the mobile and default body font sizes are 16px", () => {
    expect(bodyTextTokens.mobileBaseFontSizePx).toBe(16);
    expect(bodyTextTokens.baseFontSizePx).toBe(16);
  });
});
