/**
 * WCAG 2.1 relative-luminance & contrast-ratio math — pure, framework-free.
 * ------------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website
 *
 * Provided here (domain layer) so the contrast property test (Property 5,
 * task 2.2) and any UI assertions share ONE verified implementation rather
 * than re-deriving the formula. No side effects, no DOM.
 *
 * Reference: WCAG 2.1 relative luminance and contrast-ratio definitions.
 */

import type { ColorPair, HexColor } from "./tokens";
import { CONTRAST_MINIMUMS, colors } from "./tokens";

/** Parse a `#rgb` or `#rrggbb` hex string into 8-bit [r, g, b]. */
export function hexToRgb(hex: HexColor | string): [number, number, number] {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (!/^[0-9a-fA-F]{6}$/.test(h)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  const int = parseInt(h, 16);
  return [(int >> 16) & 0xff, (int >> 8) & 0xff, int & 0xff];
}

/** Linearize a single 0–255 sRGB channel per the WCAG transfer function. */
function channelToLinear(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance of an sRGB color (0 = black, 1 = white). */
export function relativeLuminance(hex: HexColor | string): number {
  const [r, g, b] = hexToRgb(hex);
  return (
    0.2126 * channelToLinear(r) +
    0.7152 * channelToLinear(g) +
    0.0722 * channelToLinear(b)
  );
}

/**
 * WCAG contrast ratio between two colors, in the range [1, 21].
 * Symmetric: order of arguments does not matter.
 */
export function contrastRatio(
  a: HexColor | string,
  b: HexColor | string,
): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Resolve a {@link ColorPair} to its computed contrast ratio. */
export function pairContrastRatio(pair: ColorPair): number {
  return contrastRatio(colors[pair.foreground], colors[pair.background]);
}

/** True iff the pair meets its usage-class WCAG AA minimum. */
export function pairMeetsAA(pair: ColorPair): boolean {
  return pairContrastRatio(pair) >= CONTRAST_MINIMUMS[pair.usage];
}
