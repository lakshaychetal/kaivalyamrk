/**
 * Property test — Property 16: Cumulative visit counter is monotonic (task 14.7).
 * ---------------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website
 *
 * Design (Property 16): *For all* sequences of visit increments, the cumulative
 * visit counter is monotonically non-decreasing and its final value equals the
 * sum of all increments applied.
 *
 * The actual cumulative visit counter is the server-owned, stateful
 * {@link InMemoryAnalyticsStore} (Req 17.4), which routes every change through
 * the pure domain helper {@link incrementCounter} (and its fold
 * {@link applyVisits}). This test exercises BOTH:
 *   1. the stateful store — applying a generated sequence of increments and
 *      asserting the read-back value never decreases and the final value equals
 *      the (clamped) sum of all increments applied; and
 *   2. the pure reducer {@link applyVisits} — the same invariant on the
 *      side-effect-free fold the store delegates to.
 *
 * Visits are non-negative in the documented domain, so the primary generators
 * produce non-negative increments (including the empty sequence). A second,
 * adversarial property feeds arbitrary integers (including negatives) to confirm
 * the counter is still non-decreasing because the helper clamps `delta` to `>= 0`.
 */
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { assertProperty } from "@/lib/pbt";
import { InMemoryAnalyticsStore } from "@/integration/analytics/store";
import { applyVisits, incrementCounter } from "@/domain/analytics/aggregate";

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** Non-negative visit increments — the documented domain. Includes empty seqs. */
const visitIncrementsArb = fc.array(fc.nat({ max: 10_000 }), {
  minLength: 0,
  maxLength: 100,
});

/** Arbitrary integers (incl. negatives) for the robustness/monotonicity check. */
const signedIncrementsArb = fc.array(
  fc.integer({ min: -10_000, max: 10_000 }),
  { minLength: 0, maxLength: 100 },
);

const sumOf = (xs: readonly number[]): number => xs.reduce((a, b) => a + b, 0);
const clampedSumOf = (xs: readonly number[]): number =>
  xs.reduce((a, b) => a + Math.max(0, b), 0);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Property 16: Cumulative visit counter is monotonic", () => {
  // Feature: kaivalyam-homestay-website, Property 16: Cumulative visit counter is monotonic
  // **Validates: Requirements 17.4**
  it("the stateful store is non-decreasing and ends at the sum of all increments applied", async () => {
    await assertProperty(
      fc.asyncProperty(visitIncrementsArb, async (increments) => {
        const store = new InMemoryAnalyticsStore();

        // The counter starts at zero.
        expect((await store.readCounter()).value).toBe(0);

        let previous = 0;
        for (const delta of increments) {
          const returned = await store.incrementVisitCounter(delta);
          const readBack = (await store.readCounter()).value;

          // The returned value and the read-back value agree.
          expect(readBack).toBe(returned);
          // Monotonic: never decreases step to step.
          expect(readBack).toBeGreaterThanOrEqual(previous);
          previous = readBack;
        }

        // Final value equals the sum of all (non-negative) increments applied.
        const finalValue = (await store.readCounter()).value;
        expect(finalValue).toBe(sumOf(increments));
      }),
    );
  });

  // Feature: kaivalyam-homestay-website, Property 16: Cumulative visit counter is monotonic
  // **Validates: Requirements 17.4**
  it("the pure reducer applyVisits is non-decreasing and ends at the sum of increments", () => {
    assertProperty(
      fc.property(visitIncrementsArb, (increments) => {
        let previous = 0;
        for (let i = 0; i < increments.length; i += 1) {
          const running = applyVisits(increments.slice(0, i + 1));
          expect(running).toBe(incrementCounter(previous, increments[i]!));
          expect(running).toBeGreaterThanOrEqual(previous);
          previous = running;
        }
        expect(applyVisits(increments)).toBe(sumOf(increments));
      }),
    );
  });

  // Feature: kaivalyam-homestay-website, Property 16: Cumulative visit counter is monotonic
  // **Validates: Requirements 17.4**
  it("stays non-decreasing even for adversarial negative deltas (clamped to >= 0)", async () => {
    await assertProperty(
      fc.asyncProperty(signedIncrementsArb, async (increments) => {
        const store = new InMemoryAnalyticsStore();

        let previous = 0;
        for (const delta of increments) {
          const readBack = await store.incrementVisitCounter(delta);
          // Monotonic: a negative delta can never make the counter go down.
          expect(readBack).toBeGreaterThanOrEqual(previous);
          previous = readBack;
        }

        // Final value equals the sum of the clamped (non-negative) contributions.
        expect((await store.readCounter()).value).toBe(clampedSumOf(increments));
      }),
    );
  });
});
