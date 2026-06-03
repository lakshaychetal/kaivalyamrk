/**
 * `Icon` — the single Lucide icon wrapper for the design system.
 * --------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 3.1)
 *
 * Lucide is the ONLY icon family on the site (Req 19.4 — vector icons from a
 * single family; no emoji). Every interface icon is rendered through one of
 * Lucide's React components, sized from the shared `iconSizes` scale so stroke
 * weight and dimensions stay consistent across the product.
 *
 * Accessibility (Req 22.5 — accessible names for icon-only controls):
 *   • A purely DECORATIVE icon (label provided by adjacent text, e.g. a button
 *     with both an icon and a visible label) is hidden from assistive tech via
 *     `aria-hidden` + `focusable={false}`. This is the default.
 *   • A MEANINGFUL icon-only control passes `label`, which renders
 *     `role="img"` + `aria-label`, giving screen-reader users an accessible
 *     name. (Icon-only *buttons* should additionally label the button itself —
 *     see {@link Button}/{@link IconButton}.)
 *
 * `LucideIcon` is re-exported so consumers can type icon props without importing
 * from `lucide-react` directly, keeping the single-family contract in one place.
 */
import type { LucideIcon, LucideProps } from "lucide-react";

export type { LucideIcon };

/** Consistent icon sizing scale (px), aligned with the 4/8px system. */
export const iconSizes = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

export type IconSize = keyof typeof iconSizes;

export interface IconProps extends Omit<LucideProps, "size" | "ref"> {
  /** The Lucide icon component to render (single icon family, Req 19.4). */
  icon: LucideIcon;
  /** Named size from {@link iconSizes}; defaults to `md` (20px). */
  size?: IconSize;
  /**
   * Accessible name. When provided the icon is exposed to assistive tech as an
   * image with this name (Req 22.5). When omitted the icon is treated as
   * decorative and hidden from screen readers.
   */
  label?: string;
}

/**
 * Render a Lucide icon at a consistent size with correct a11y semantics.
 */
export function Icon({
  icon: LucideGlyph,
  size = "md",
  label,
  ...rest
}: IconProps) {
  const px = iconSizes[size];
  const a11y = label
    ? ({ role: "img", "aria-label": label } as const)
    : ({ "aria-hidden": true, focusable: false } as const);

  return <LucideGlyph width={px} height={px} {...a11y} {...rest} />;
}
