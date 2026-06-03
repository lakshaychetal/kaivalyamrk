/**
 * Shared button styling — the SINGLE definition of the button visual system.
 * --------------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 3.1)
 *
 * This module is the one place the primary / secondary / tertiary button looks
 * are defined. Both the interactive {@link Button} (a `<button>`) and the
 * link-based {@link BookNowButton} (an `<a>`) compose their classes from
 * {@link buttonClassNames}, so:
 *
 *   • The PRIMARY style is centralized here and is the canonical primary CTA
 *     (Req 19.6). `BookNowButton` is the only intended consumer of the
 *     `primary` variant — every other surface uses `secondary` / `tertiary`.
 *   • Component styling stays consistent across the site (Req 19.5).
 *
 * Every utility resolves to a SEMANTIC design token (`bg-primary`,
 * `text-on-primary`, `var(--color-focus)`, …) — never a raw hex value.
 *
 * Enforced interaction affordances:
 *   • Min 44×44px hit target (`min-h-11 min-w-11`, Req 18.5) at every size.
 *   • ≥8px internal gap between an icon and its label (`gap-2`, Req 18.5).
 *   • Visible focus ring drawn as an OFFSET outline in `--color-focus`
 *     (Req 22.3) — the offset leaves a surface-colored gap so the ring's
 *     contrast is measured against the surface, not the button.
 *   • Press feedback via a transform scale (no layout shift), gated behind
 *     `motion-safe` so it is disabled under `prefers-reduced-motion` (Req 22.7).
 *   • Disabled state at reduced opacity (~0.5) + `not-allowed` cursor.
 *   • `cursor-pointer` on the clickable, enabled control.
 */
import { cn, type ClassValue } from "./cn";

export type ButtonVariant = "primary" | "secondary" | "tertiary";
export type ButtonSize = "sm" | "md" | "lg";

/**
 * Visible focus indicator (Req 22.3), shared by every interactive DS control.
 * Rendered as a 2px solid outline in the `--color-focus` token with a 2px
 * offset, so a surface-colored gap separates the ring from the control (the
 * token's contrast is verified against the surface — see tokens.ts).
 */
export const focusRing =
  "outline-none focus-visible:[outline:2px_solid_var(--color-focus)] focus-visible:[outline-offset:2px]";

/**
 * Press feedback + state transitions, gated behind `motion-safe` so ALL of
 * this motion is disabled when the user prefers reduced motion (Req 22.7).
 * Scale is a transform → no layout shift. Duration sits in the 150–300ms band.
 */
const motion =
  "motion-safe:transition motion-safe:duration-200 motion-safe:ease-out motion-safe:active:scale-[0.98]";

/** Base classes common to every button/CTA, independent of variant/size. */
const base = cn(
  "inline-flex items-center justify-center gap-2 select-none",
  "rounded-lg font-medium leading-none text-center align-middle",
  "min-h-11 min-w-11", // 44×44px minimum touch target (Req 18.5)
  "cursor-pointer",
  "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
  "aria-disabled:opacity-50 aria-disabled:cursor-not-allowed",
  focusRing,
  motion,
);

/** Per-variant color treatment — all values are semantic tokens. */
const variantClasses: Record<ButtonVariant, string> = {
  // THE primary CTA style (Req 19.6) — filled brand green, white label.
  primary: "bg-primary text-on-primary hover:bg-primary-hover",
  // Outline button on the surface.
  secondary:
    "bg-transparent text-primary border-2 border-primary hover:bg-surface-alt",
  // Text button.
  tertiary:
    "bg-transparent text-primary border-2 border-transparent underline-offset-4 hover:bg-surface-alt hover:underline",
};

/** Per-size padding + type scale. Every size keeps the 44px min height. */
const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 text-sm",
  md: "px-4 text-base",
  lg: "min-h-12 px-6 text-lg",
};

export interface ButtonClassOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Stretch to fill the available inline width. */
  fullWidth?: boolean;
  /** Extra classes appended last. */
  className?: ClassValue;
}

/**
 * Compose the full className string for a button-styled element.
 * Used by both {@link Button} and {@link BookNowButton} so the look is defined
 * exactly once.
 */
export function buttonClassNames({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
}: ButtonClassOptions = {}): string {
  return cn(
    base,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && "w-full",
    className,
  );
}
