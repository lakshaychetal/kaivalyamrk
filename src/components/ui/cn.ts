/**
 * `cn` — tiny, dependency-free className joiner for the design system.
 * --------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 3.1)
 *
 * Filters out falsy values (`false`/`null`/`undefined`/`''`) and joins the
 * rest with a single space, so components can compose conditional Tailwind
 * utility strings without pulling in `clsx`/`classnames`.
 *
 *   cn('a', cond && 'b', undefined, 'c') // → 'a c' (when cond is false)
 */
export type ClassValue = string | false | null | undefined;

export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
