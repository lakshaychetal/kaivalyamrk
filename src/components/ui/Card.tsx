/**
 * `Card` — the surface container of the design system.
 * ----------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 3.1)
 *
 * A composable base `Card` plus four presets — `room`, `attraction`,
 * `facility`, `review` — that the marketing pages compose later (Rooms,
 * Attractions, Facilities, Reviews). All variants share ONE radius + elevation
 * scale and use SEMANTIC surface tokens (`bg-surface`, `border-border`, …),
 * never raw hex, so component styling stays consistent across the site
 * (Req 19.5).
 *
 * Composition slots (all optional, presentational only — these are NOT pages):
 *   • `media`   — a media slot (e.g. a `ResponsiveImage`, owned by task 3.2)
 *                 rendered flush to the card's top edge.
 *   • `children`— the card body.
 *   • `footer`  — an optional action row (e.g. a `BookNowButton`).
 *
 * Elevation scale (consistent shadow tiers — `elevation-consistent`):
 *   flat → none · raised → sm · floating → md. `interactive` adds a
 *   `motion-safe` hover lift (transform/opacity only → no layout shift, and
 *   disabled under `prefers-reduced-motion`, Req 22.7).
 */
import type { ReactNode } from "react";
import { cn, type ClassValue } from "./cn";

export type CardVariant = "base" | "room" | "attraction" | "facility" | "review";
export type CardElevation = "flat" | "raised" | "floating";

/** Shared radius + surface treatment for every card. */
const cardBase = cn(
  "relative flex flex-col overflow-hidden",
  "rounded-xl border border-border bg-surface text-on-surface",
);

/** One elevation/shadow scale reused by every card variant. */
const elevationClasses: Record<CardElevation, string> = {
  flat: "shadow-none",
  raised: "shadow-sm",
  floating: "shadow-md",
};

/** Default elevation per semantic variant (kept consistent across the site). */
const variantElevation: Record<CardVariant, CardElevation> = {
  base: "raised",
  room: "floating",
  attraction: "raised",
  facility: "flat",
  review: "raised",
};

export interface CardProps {
  /** Semantic preset; selects sensible defaults. Defaults to `base`. */
  variant?: CardVariant;
  /** Override the elevation tier for this card. */
  elevation?: CardElevation;
  /** Media slot rendered flush to the top edge (image/video). */
  media?: ReactNode;
  /** Optional footer / action row. */
  footer?: ReactNode;
  /** Add a motion-safe hover lift to signal the whole card is interactive. */
  interactive?: boolean;
  /** Extra classes appended to the card root. */
  className?: ClassValue;
  /** Body content. */
  children?: ReactNode;
}

export function Card({
  variant = "base",
  elevation,
  media,
  footer,
  interactive = false,
  className,
  children,
}: CardProps) {
  const tier = elevation ?? variantElevation[variant];

  return (
    <div
      data-variant={variant}
      className={cn(
        cardBase,
        elevationClasses[tier],
        interactive &&
          "motion-safe:transition motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md",
        className,
      )}
    >
      {media && <div className="relative w-full overflow-hidden">{media}</div>}
      {children != null && (
        <div className="flex flex-1 flex-col gap-2 p-4">{children}</div>
      )}
      {footer && (
        <div className="flex items-center gap-2 border-t border-border p-4">
          {footer}
        </div>
      )}
    </div>
  );
}

/** Optional title sub-component using the heading (serif) font + token color. */
export function CardTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: ClassValue;
}) {
  return (
    <h3
      className={cn(
        "font-serif text-xl font-semibold text-secondary",
        className,
      )}
    >
      {children}
    </h3>
  );
}

/** Optional muted body text sub-component. */
export function CardBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: ClassValue;
}) {
  return (
    <p className={cn("text-base text-on-surface-muted", className)}>
      {children}
    </p>
  );
}
