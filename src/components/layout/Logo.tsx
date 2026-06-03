/**
 * `Logo` — the Kaivalyam brand mark, linked to Home.
 * --------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 10.1)
 *
 * Renders the official brand logo in the site header (Req 1.8):
 *   • Served from `/brand/kaivalyam-logo.png` (a web copy of the project-root
 *     "Kaivalyam Logo apvd.png", intrinsic 1920×1210).
 *   • Rendered through `next/image` with explicit `width`/`height` in the
 *     asset's OFFICIAL proportions (1920:1210 ≈ 1.587:1) so the box is reserved
 *     and the aspect ratio is never distorted (no CLS — Req 20.3).
 *   • Displayed size is controlled with `h-* w-auto`, preserving proportions
 *     across breakpoints.
 *   • Wrapped in adequate CLEAR SPACE (padding around the mark, Req 1.8) so the
 *     logo is never crowded by adjacent nav/CTA elements.
 *   • Links to Home (`/`) and carries a meaningful `alt` ("Kaivalyam Homestay").
 *
 * `priority` is set because the logo sits in the always-visible header (above
 * the fold on every page), so it should load eagerly rather than lazily.
 */
import Image from "next/image";
import Link from "next/link";

/** Intrinsic dimensions of the source logo, in OFFICIAL proportions (1920×1210). */
const LOGO_INTRINSIC_WIDTH = 192;
const LOGO_INTRINSIC_HEIGHT = 121;

export interface LogoProps {
  /** Extra classes for the Home link wrapper (clear space lives here). */
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <Link
      href="/"
      aria-label="Kaivalyam Homestay — home"
      // Clear space (Req 1.8): padding keeps breathing room around the mark;
      // the focus ring matches the design system's accent focus token.
      className={[
        "inline-flex shrink-0 items-center p-1",
        "outline-none focus-visible:[outline:2px_solid_var(--color-focus)] focus-visible:[outline-offset:2px]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Image
        src="/brand/kaivalyam-logo.png"
        alt="Kaivalyam Homestay"
        width={LOGO_INTRINSIC_WIDTH}
        height={LOGO_INTRINSIC_HEIGHT}
        priority
        // Displayed size: preserve official proportions with `w-auto`.
        className="h-12 w-auto md:h-16"
      />
    </Link>
  );
}

export default Logo;
