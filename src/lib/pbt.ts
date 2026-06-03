/**
 * Shared property-based-testing (PBT) helper for the Kaivalyam Homestay Website.
 *
 * All 22 correctness properties from the design are implemented with
 * `fast-check` + Vitest. This module is the single entry point for running a
 * property so that the project-wide invariant — **every property runs a minimum
 * of 100 iterations** (`numRuns >= 100`) — is enforced in one place rather than
 * trusted to each test author (see tech.md "Property-Based Testing").
 *
 * ## Tagging convention
 *
 * Every property test MUST carry a comment identifying the property it exercises,
 * in exactly this form:
 *
 * ```ts
 * // Feature: kaivalyam-homestay-website, Property 7: Gallery category partition and filtering
 * ```
 *
 * and the test body SHOULD link the validated requirements with a JSDoc line:
 *
 * ```ts
 * // **Validates: Requirements 6.1, 6.2, 6.3**
 * ```
 *
 * ## Usage
 *
 * ```ts
 * import fc from "fast-check";
 * import { assertProperty } from "@/lib/pbt";
 *
 * assertProperty(
 *   fc.property(fc.integer(), (n) => Number.isInteger(n)),
 * );
 *
 * // Run more than the floor when a property warrants deeper exploration:
 * assertProperty(myProperty, { numRuns: 500 });
 * ```
 */
import fc from "fast-check";

/**
 * The project-wide minimum number of iterations every property must run.
 * Enforced by {@link assertProperty}; callers may request more but never fewer.
 */
export const MIN_PBT_RUNS = 100;

/**
 * Options accepted by {@link assertProperty}. Mirrors a subset of
 * `fast-check`'s {@link fc.Parameters}, but `numRuns` is clamped up to
 * {@link MIN_PBT_RUNS} so a property can never silently run fewer iterations.
 */
export type AssertPropertyOptions<Ts = unknown> = fc.Parameters<Ts>;

/**
 * Run a `fast-check` property, enforcing the project-wide `numRuns >= 100` floor.
 *
 * Behavior:
 * - If `numRuns` is omitted, it defaults to {@link MIN_PBT_RUNS} (100).
 * - If `numRuns` is greater than or equal to {@link MIN_PBT_RUNS}, it is honored
 *   as-is (callers may run more iterations for deeper exploration).
 * - If `numRuns` is below {@link MIN_PBT_RUNS}, the helper throws, surfacing the
 *   misconfiguration loudly instead of clamping it away. This keeps the
 *   "minimum 100 iterations" contract impossible to violate by accident.
 *
 * @param property A `fc.property` / `fc.asyncProperty` (sync or async).
 * @param options  Optional `fast-check` parameters; `numRuns` is validated/defaulted.
 * @returns The result of `fc.assert` (void for sync, Promise for async properties).
 */
export function assertProperty<Ts>(
  property: fc.IRawProperty<Ts>,
  options: AssertPropertyOptions<Ts> = {},
): ReturnType<typeof fc.assert> {
  const requested = options.numRuns;

  if (requested !== undefined && requested < MIN_PBT_RUNS) {
    throw new Error(
      `assertProperty: numRuns must be >= ${MIN_PBT_RUNS} (the Kaivalyam PBT floor), ` +
        `but received ${requested}. Property tests must run at least ${MIN_PBT_RUNS} iterations.`,
    );
  }

  const numRuns = requested ?? MIN_PBT_RUNS;

  return fc.assert(property, { ...options, numRuns });
}
