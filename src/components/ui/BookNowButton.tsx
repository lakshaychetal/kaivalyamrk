/**
 * `BookNowButton` — the SINGLE primary call-to-action of the site.
 * ----------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 3.1)
 *
 * Req 19.6 mandates ONE primary-CTA style applied to the "Book Now" action.
 * This component is that canonical CTA: it is the only component that renders
 * the `primary` button look (defined once in {@link buttonClassNames}), so the
 * primary style is never re-defined elsewhere. Ordinary actions use the
 * `secondary` / `tertiary` {@link Button} variants instead.
 *
 * Destination (single source of truth):
 *   • By default it links to the IN-SITE booking host `BOOKING_HREF` (`/book`,
 *     from the navigation domain) — the page that embeds the eeabsolute booking
 *     widget (the widget itself builds the external eeabsolute deep-link via
 *     `buildBookingUrl`). This matches `navigationModel.bookNow.href`.
 *   • Pass `external` to link straight to the eeabsolute booking URL produced by
 *     `kaivalyamBookingUrl()` (opened in a new browser context with safe `rel`).
 *   • Or pass an explicit `href` to override.
 *
 * Because it is an anchor (navigation, not an action) it renders as a styled
 * link via `next/link`, but carries the identical primary button affordances:
 * 44×44 min target, visible focus ring, motion-safe press feedback, and an
 * optional leading Lucide icon. Label defaults to "Book Now".
 */
import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { BOOKING_HREF } from "@/domain/navigation/navigation";
import { kaivalyamBookingUrl } from "@/domain/integration-urls/booking-url";
import { Icon, type LucideIcon } from "./Icon";
import { buttonClassNames, type ButtonSize } from "./buttonStyles";
import type { ClassValue } from "./cn";

export interface BookNowButtonProps {
  /** CTA label. Defaults to "Book Now" (Req 19.6 / 1.3). */
  label?: string;
  /** Size; defaults to `md`. Every size keeps the ≥44px min target. */
  size?: ButtonSize;
  /** Stretch to full inline width (useful in mobile menus / cards). */
  fullWidth?: boolean;
  /**
   * When true, link directly to the external eeabsolute booking URL
   * (`kaivalyamBookingUrl()`) and open it in a new browser context. When false
   * (default) link to the in-site booking host (`BOOKING_HREF`).
   */
  external?: boolean;
  /** Explicit destination override (takes precedence over `external`). */
  href?: string;
  /** Optional leading Lucide icon; defaults to a calendar-check glyph. */
  icon?: LucideIcon | null;
  /** Extra classes appended to the primary CTA style. */
  className?: ClassValue;
  /** Optional accessible-name override (e.g. "Book the Luxury Cottage"). */
  "aria-label"?: string;
}

export function BookNowButton({
  label = "Book Now",
  size = "md",
  fullWidth = false,
  external = false,
  href,
  icon = CalendarCheck,
  className,
  "aria-label": ariaLabel,
}: BookNowButtonProps) {
  const destination = href ?? (external ? kaivalyamBookingUrl() : BOOKING_HREF);
  const opensNewContext = external && href === undefined;

  return (
    <Link
      href={destination}
      aria-label={ariaLabel}
      // Always the canonical PRIMARY style (Req 19.6).
      className={buttonClassNames({ variant: "primary", size, fullWidth, className })}
      {...(opensNewContext
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
    >
      {icon && <Icon icon={icon} size={size === "lg" ? "lg" : "md"} />}
      {label}
    </Link>
  );
}
