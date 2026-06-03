/**
 * `WhatsAppEntryPoint` — click-to-chat WhatsApp control (integration layer).
 * --------------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 14.2)
 *
 * A reusable, accessible "Chat on WhatsApp" control that opens a WhatsApp
 * conversation with the Kaivalyam Homestay account (Req 16.1, 16.3). It is the
 * single WhatsApp entry-point component, placed on the Home page (task 11.1)
 * and the Contact page (task 13.1) by those tasks (Req 16.2) — this task only
 * builds and exports the reusable control.
 *
 * Deep link (single source of truth):
 *   • The `wa.me` URL is built by the pure `buildWhatsAppUrl` domain function
 *     (Req 16.3), which normalizes the number to digits and `encodeURIComponent`s
 *     the optional prefilled message.
 *   • The destination number defaults to `siteInfo.whatsappNumber` (kept in
 *     sync with the `KAIVALYAM_WHATSAPP_NUMBER` placeholder) so there is one
 *     source for contact details, with the constant as an ultimate fallback.
 *   • `wa.me` is EXTERNAL, so the link opens in a new browser context with
 *     `target="_blank"` + `rel="noopener noreferrer"`.
 *
 * Variants:
 *   • `primary` (default) — a labelled, button-style link ("Chat on WhatsApp")
 *     with a leading Lucide `MessageCircle` icon. The visible label is the
 *     accessible name; the icon is decorative.
 *   • `fab` — a floating action button for the corner of the page; icon-only,
 *     so it carries an explicit `aria-label` accessible name (Req 22.5).
 *
 * Styling & accessibility:
 *   • Uses the DS `Icon` (single Lucide family, Req 19.4) and the shared
 *     `focusRing` (visible focus indicator, Req 22.3) — never the reserved
 *     primary-CTA style (that belongs solely to `BookNowButton`, Req 19.6).
 *   • Color is a clearly-named green accent drawn from the `--color-success`
 *     semantic token paired with `--color-on-primary` (white) — ~6.5:1, clears
 *     WCAG AA for normal text (Req 22.1). No raw hex / brand-green guesswork.
 *   • ≥44×44px target at every size (Req 18.5); press/hover feedback is
 *     `motion-safe` only, so it is disabled under `prefers-reduced-motion`
 *     (Req 22.7).
 *
 * No hooks / no event handlers → this is a server-renderable component (good
 * for the SSG marketing pages); it holds no secrets.
 */
import { MessageCircle } from "lucide-react";
import {
  buildWhatsAppUrl,
  KAIVALYAM_WHATSAPP_NUMBER,
} from "@/domain/integration-urls/whatsapp-url";
import { siteInfo } from "@/content/site";
import { Icon } from "@/components/ui/Icon";
import { cn, type ClassValue } from "@/components/ui/cn";
import { focusRing } from "@/components/ui/buttonStyles";

/** Which presentation the entry point uses. */
export type WhatsAppEntryPointVariant = "primary" | "fab";

/** Size of the labelled `primary` variant; every size keeps the ≥44px target. */
export type WhatsAppEntryPointSize = "md" | "lg";

export interface WhatsAppEntryPointProps {
  /** Presentation. Defaults to the labelled `primary` button-style link. */
  variant?: WhatsAppEntryPointVariant;
  /** Visible label for the `primary` variant. Defaults to "Chat on WhatsApp". */
  label?: string;
  /**
   * Optional prefilled message, passed verbatim to {@link buildWhatsAppUrl} so a
   * page can seed context (e.g. "Hi Kaivalyam, I'd like to book the Luxury
   * Cottage…"). Omitted → no `?text` is added to the deep link.
   */
  message?: string;
  /**
   * Destination WhatsApp number in any human-readable form. Defaults to
   * {@link siteInfo.whatsappNumber} (which mirrors the
   * {@link KAIVALYAM_WHATSAPP_NUMBER} placeholder), with the constant as a
   * final fallback. Normalized to digits by {@link buildWhatsAppUrl}.
   */
  phone?: string;
  /** Size of the `primary` variant. Defaults to `md`. */
  size?: WhatsAppEntryPointSize;
  /**
   * Accessible name. REQUIRED in spirit for the icon-only `fab` variant
   * (Req 22.5) — defaults to a descriptive name. For the `primary` variant the
   * visible label is the accessible name, so this is optional there.
   */
  "aria-label"?: string;
  /** Extra classes appended last. */
  className?: ClassValue;
}

/** Default visible label for the labelled control. */
const DEFAULT_LABEL = "Chat on WhatsApp";
/** Default accessible name for the icon-only floating action button. */
const DEFAULT_FAB_LABEL = "Chat with Kaivalyam Homestay on WhatsApp";

/**
 * Affordances shared by both variants: a green accent surface (`--color-success`
 * token) with white text, the DS focus ring, and motion-safe feedback that is
 * disabled under reduced-motion. All color comes from semantic token utilities.
 */
const sharedAffordances = cn(
  "inline-flex items-center justify-center gap-2 select-none",
  "bg-success text-on-primary",
  "cursor-pointer",
  focusRing,
  "motion-safe:transition motion-safe:duration-200 motion-safe:ease-out",
  "motion-safe:hover:opacity-90 motion-safe:active:scale-[0.98]",
);

/** Per-size treatment for the labelled `primary` variant (≥44px min target). */
const primarySizeClasses: Record<WhatsAppEntryPointSize, string> = {
  md: "min-h-11 min-w-11 px-4 text-base",
  lg: "min-h-12 min-w-12 px-6 text-lg",
};

/**
 * Reusable WhatsApp click-to-chat control. Renders an external `<a>` to the
 * `wa.me` deep link produced by {@link buildWhatsAppUrl}.
 */
export function WhatsAppEntryPoint({
  variant = "primary",
  label = DEFAULT_LABEL,
  message,
  phone,
  size = "md",
  "aria-label": ariaLabel,
  className,
}: WhatsAppEntryPointProps) {
  const destinationNumber =
    phone ?? siteInfo.whatsappNumber ?? KAIVALYAM_WHATSAPP_NUMBER;
  const href = buildWhatsAppUrl({ phone: destinationNumber, message });

  // wa.me is external → always open in a new, isolated browser context.
  const externalLinkProps = {
    target: "_blank",
    rel: "noopener noreferrer",
  } as const;

  if (variant === "fab") {
    return (
      <a
        href={href}
        aria-label={ariaLabel ?? DEFAULT_FAB_LABEL}
        className={cn(
          sharedAffordances,
          "fixed bottom-6 right-6 z-50",
          "h-14 w-14 rounded-full shadow-lg",
          className,
        )}
        {...externalLinkProps}
      >
        {/* Icon is decorative — the anchor's aria-label names the control. */}
        <Icon icon={MessageCircle} size="lg" />
      </a>
    );
  }

  return (
    <a
      href={href}
      aria-label={ariaLabel}
      className={cn(
        sharedAffordances,
        "rounded-lg font-medium leading-none text-center align-middle",
        primarySizeClasses[size],
        className,
      )}
      {...externalLinkProps}
    >
      {/* Decorative icon; the visible label below is the accessible name. */}
      <Icon icon={MessageCircle} size={size === "lg" ? "lg" : "md"} />
      {label}
    </a>
  );
}
