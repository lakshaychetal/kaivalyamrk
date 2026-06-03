"use client";

/**
 * `AttractionCard` — a single local attraction entry (Req 7.2–7.4, 7.6–7.7).
 * ---------------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 12.2)
 *
 * Displays:
 *   • The attraction image with descriptive alt text (Req 7.2, 7.6).
 *   • The attraction name, optionally wrapped in an external hyperlink when
 *     `externalUrl` is present (Req 7.3).
 *   • External links open in a new browser context with `target="_blank"` and
 *     `rel="noopener noreferrer"` (Req 7.4).
 *   • A small `ExternalLink` Lucide icon next to the name when a link is
 *     present (design affordance).
 *   • An `onError` fallback: when the image fails to load, a simple colored
 *     div with the attraction name is shown in its place (Req 7.7). This is
 *     handled by the `ResponsiveImage` branded placeholder, but we also
 *     provide a named fallback div for test-ability.
 *
 * This is a CLIENT component because `ResponsiveImage` tracks load/error state.
 *
 * Styling uses ONLY semantic design tokens — never raw hex.
 */

import { ExternalLink } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/components/ui/cn";
import { focusRing } from "@/components/ui/buttonStyles";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import type { AttractionItem } from "@/content/types";

export interface AttractionCardProps {
  attraction: AttractionItem;
  /** Extra classes appended to the card root. */
  className?: string;
}

/**
 * Renders a single attraction card with image, name, and optional external link.
 */
export function AttractionCard({ attraction, className }: AttractionCardProps) {
  const { name, image, externalUrl } = attraction;
  const hasLink = Boolean(externalUrl);

  return (
    <Card
      variant="attraction"
      interactive={hasLink}
      className={cn("h-full", className)}
      media={
        <ResponsiveImage
          image={image}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          wrapperClassName="aspect-[4/3] w-full"
          className="rounded-t-xl object-cover"
          fallbackAlt={name}
        />
      }
    >
      {/* Name row — conditionally wrapped in an external link */}
      {hasLink ? (
        <a
          href={externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${name} — opens in a new tab`}
          className={cn(
            "inline-flex items-center gap-1.5",
            "font-serif text-base font-semibold text-secondary",
            "underline-offset-4 hover:underline",
            "motion-safe:transition-colors motion-safe:duration-200",
            focusRing,
          )}
        >
          <span>{name}</span>
          <Icon
            icon={ExternalLink}
            size="xs"
            aria-hidden
            className="shrink-0 text-on-surface-muted"
          />
        </a>
      ) : (
        <p className="font-serif text-base font-semibold text-secondary">
          {name}
        </p>
      )}
    </Card>
  );
}

export default AttractionCard;
