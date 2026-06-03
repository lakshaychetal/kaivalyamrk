/**
 * `Button` — the interactive button of the design system.
 * -------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 3.1)
 *
 * A `<button>` with `primary` / `secondary` / `tertiary` variants, three sizes,
 * optional leading/trailing Lucide icons, and a loading state. All visual
 * treatment comes from {@link buttonClassNames} so styling is consistent across
 * the site (Req 19.5) and the primary look is defined exactly once (Req 19.6).
 *
 * Accessibility & interaction:
 *   • Min 44×44px target, ≥8px icon/label gap (Req 18.5) — from the shared base.
 *   • Visible focus ring in `--color-focus` (Req 22.3).
 *   • Press feedback (scale) and transitions are `motion-safe` only, so they
 *     are disabled under `prefers-reduced-motion` (Req 22.7).
 *   • Disabled (or loading) → reduced opacity + `not-allowed` + `aria-disabled`.
 *   • Icon-only usage REQUIRES `aria-label` (Req 22.5); this is enforced with a
 *     dev-time `console.error` and by the dedicated {@link IconButton} helper.
 *   • While `loading`, the button is disabled and shows a spinning Lucide
 *     `Loader2`; the spin is `motion-safe` (reduced-motion users see a static
 *     icon). `aria-busy` is set for assistive tech.
 *
 * Decorative icons inside the button are `aria-hidden` (the visible label names
 * the control); for icon-only buttons the button's own `aria-label` is the
 * accessible name.
 */
"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Icon, type LucideIcon } from "./Icon";
import {
  buttonClassNames,
  type ButtonSize,
  type ButtonVariant,
} from "./buttonStyles";

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  /** Visual variant. Defaults to `primary`. NOTE: the canonical primary CTA is
   * {@link BookNowButton}; prefer `secondary`/`tertiary` for ordinary actions. */
  variant?: ButtonVariant;
  /** Size; every size keeps the ≥44px min target. Defaults to `md`. */
  size?: ButtonSize;
  /** Optional Lucide icon before the label. */
  leadingIcon?: LucideIcon;
  /** Optional Lucide icon after the label. */
  trailingIcon?: LucideIcon;
  /** When true: disabled + spinner + `aria-busy` (Req 20.5 loading feedback). */
  loading?: boolean;
  /** Stretch to the full inline width. */
  fullWidth?: boolean;
  /** Native button `type`; defaults to `button` (never an accidental submit). */
  type?: "button" | "submit" | "reset";
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      leadingIcon,
      trailingIcon,
      loading = false,
      fullWidth = false,
      type = "button",
      disabled,
      className,
      children,
      ...rest
    },
    ref,
  ) {
    const isDisabled = disabled || loading;

    if (
      process.env.NODE_ENV !== "production" &&
      children == null &&
      !rest["aria-label"] &&
      !rest["aria-labelledby"]
    ) {
      // Icon-only buttons MUST have an accessible name (Req 22.5).
      console.error(
        "Button: icon-only buttons require an `aria-label` (or use <IconButton>).",
      );
    }

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-disabled={isDisabled || undefined}
        aria-busy={loading || undefined}
        className={buttonClassNames({ variant, size, fullWidth, className })}
        {...rest}
      >
        {loading ? (
          <Icon
            icon={Loader2}
            size={size === "lg" ? "lg" : "md"}
            className="motion-safe:animate-spin"
          />
        ) : (
          leadingIcon && (
            <Icon icon={leadingIcon} size={size === "lg" ? "lg" : "md"} />
          )
        )}
        {children}
        {!loading && trailingIcon && (
          <Icon icon={trailingIcon} size={size === "lg" ? "lg" : "md"} />
        )}
      </button>
    );
  },
);

export interface IconButtonProps extends Omit<ButtonProps, "leadingIcon" | "trailingIcon" | "children"> {
  /** The Lucide icon to render. */
  icon: LucideIcon;
  /** Required accessible name for the icon-only control (Req 22.5). */
  "aria-label": string;
}

/**
 * `IconButton` — an icon-only {@link Button} that makes the accessible name
 * mandatory at the type level (Req 22.5). Defaults to the `tertiary` variant so
 * it never reuses the primary CTA style.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton({ icon, size = "md", variant = "tertiary", ...rest }, ref) {
    return (
      <Button ref={ref} variant={variant} size={size} {...rest}>
        <Icon icon={icon} size={size === "lg" ? "lg" : "md"} />
      </Button>
    );
  },
);
