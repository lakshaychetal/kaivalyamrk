/**
 * Toolchain smoke tests (task 1.3).
 *
 * These are NOT feature tests — they exist only to prove the testing toolchain
 * is wired end-to-end:
 *   1. A trivial Vitest unit test (Vitest runs, globals available).
 *   2. A minimal example property test through the shared PBT helper
 *      (`assertProperty`), proving fast-check + the `numRuns >= 100` floor work.
 *
 * Real feature unit/property tests are added by later tasks and co-located with
 * the domain functions they exercise.
 */
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { assertProperty, MIN_PBT_RUNS } from "@/lib/pbt";

describe("toolchain smoke: Vitest unit", () => {
  it("runs a trivial assertion", () => {
    expect(1 + 1).toBe(2);
  });
});

describe("toolchain smoke: fast-check via shared PBT helper", () => {
  it("runs an example property with the default >=100 iterations", () => {
    // Trivial universal property: reversing a string array twice is identity.
    assertProperty(
      fc.property(fc.array(fc.string()), (xs) => {
        const roundTrip = [...xs].reverse().reverse();
        expect(roundTrip).toEqual(xs);
      }),
    );
  });

  it("honors an explicitly higher numRuns", () => {
    assertProperty(
      fc.property(fc.integer(), (n) => {
        expect(Number.isInteger(n)).toBe(true);
      }),
      { numRuns: 250 },
    );
  });

  it(`rejects numRuns below the ${MIN_PBT_RUNS}-iteration floor`, () => {
    expect(() =>
      assertProperty(
        fc.property(fc.integer(), () => true),
        { numRuns: 10 },
      ),
    ).toThrow(/numRuns must be >= 100/);
  });
});
