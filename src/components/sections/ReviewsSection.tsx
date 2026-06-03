/**
 * `ReviewsSection` — guest reviews & social proof (Req 11.1–11.4).
 * ----------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 11.7)
 *
 * A single, reusable section that renders guest reviews. It is used in two
 * places, driven only by props (no duplicate components):
 *
 *   • As a COMPACT PREVIEW on the Home page (Req 2.6 / 11.3) — pass `limit`
 *     to cap how many reviews show, and `viewAllHref` to render a link through
 *     to the full Reviews section so it stays reachable from Home.
 *   • As the FULL section/page — render with no `limit` (every review shows).
 *
 * Rendering contract (maps directly onto the acceptance criteria):
 *   • Req 11.1 — every rendered review shows its reviewer NAME and review TEXT.
 *   • Req 11.2 — a numeric RATING is shown IF AND ONLY IF the review has one.
 *     The rating is presented as filled/outline star SHAPES plus a visible
 *     numeric value ("4 / 5"), and an accessible name ("Rated 4 out of 5"), so
 *     the information is never conveyed by color alone (Req 22.6).
 *   • Req 11.4 — when there are NO reviews, an explicit "reviews are not yet
 *     available" message is rendered instead of an empty list.
 *
 * Presentation contract (Design System):
 *   • SEMANTIC tokens only (`bg-surface`, `text-on-surface`, `text-accent`, …)
 *     — never raw hex.
 *   • Lucide is the single icon family, rendered through the DS `Icon`.
 *   • The "view all" link is a ≥44×44px touch target with the shared visible
 *     focus ring (Req 18.5, 22.3); any motion is `motion-safe` (Req 22.7).
 *   • Mobile-first responsive grid (1 → 2 → 3 columns).
 *
 * Server component — no client interactivity. Defaults `reviews` to the
 * authored content collection so callers can use `<ReviewsSection />` directly,
 * while tests can inject their own review sets (including an empty one).
 */
import Link from "next/link";
import { Star, ArrowRight } from "lucide-react";

import { Card, CardTitle, CardBody } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/components/ui/cn";
import { focusRing } from "@/components/ui/buttonStyles";
import { reviews as defaultReviews } from "@/content/reviews";
import type { Review } from "@/content/types";

/** The rating scale the star presentation renders against (a 1–5 scale). */
export const RATING_SCALE_MAX = 5;

export interface ReviewsSectionProps {
  /**
   * The reviews to render. Defaults to the authored content collection so the
   * component is drop-in on the Home page and the full section; tests inject
   * their own sets (including `[]` to exercise the empty state, Req 11.4).
   */
  reviews?: readonly Review[];
  /**
   * Cap on how many reviews to display (preview mode, Req 11.3 / 2.6). When
   * omitted, ALL reviews are shown (the full section). The empty state is keyed
   * off the source collection, never off the limit.
   */
  limit?: number;
  /**
   * Optional link to the full Reviews section. When provided (typically in the
   * Home preview) a "Read all reviews" link is rendered so the full section is
   * reachable from the Home page (Req 11.3).
   */
  viewAllHref?: string;
  /** Section title. */
  title?: string;
  /** Heading level for the section title, to keep a valid outline (Req 21.2). */
  headingLevel?: 2 | 3;
  /** Optional anchor id for the section landmark (e.g. `reviews`). */
  id?: string;
  /** Extra classes appended to the section root. */
  className?: string;
}

/** Format a rating for display: integers stay whole, otherwise one decimal. */
function formatRating(rating: number): string {
  return Number.isInteger(rating) ? String(rating) : rating.toFixed(1);
}

/**
 * The numeric rating presentation (Req 11.2). Uses star SHAPE (filled vs
 * outline) AND a visible numeric value, with an accessible name — so the rating
 * is conveyed by more than color alone (Req 22.6).
 */
function RatingDisplay({ rating }: { rating: number }) {
  const filled = Math.max(0, Math.min(RATING_SCALE_MAX, Math.round(rating)));
  const accessibleName = `Rated ${formatRating(rating)} out of ${RATING_SCALE_MAX}`;

  return (
    <p
      className="mt-1 flex items-center gap-2"
      role="img"
      aria-label={accessibleName}
    >
      <span className="flex items-center gap-0.5" aria-hidden="true">
        {Array.from({ length: RATING_SCALE_MAX }, (_, i) => {
          const isFilled = i < filled;
          return (
            <Icon
              key={i}
              icon={Star}
              size="sm"
              className={cn(
                isFilled
                  ? "fill-current text-accent"
                  : "fill-none text-on-surface-muted",
              )}
            />
          );
        })}
      </span>
      <span className="text-sm font-medium text-on-surface">
        {formatRating(rating)} / {RATING_SCALE_MAX}
      </span>
    </p>
  );
}

/** A single review card: reviewer name, review text, optional rating. */
function ReviewCard({ review }: { review: Review }) {
  const hasRating = typeof review.rating === "number";

  return (
    <li className="h-full">
      <Card variant="review" className="h-full">
        <CardTitle>{review.reviewerName}</CardTitle>
        {hasRating && <RatingDisplay rating={review.rating as number} />}
        <CardBody className="mt-1">{review.text}</CardBody>
      </Card>
    </li>
  );
}

/**
 * The reviews section. Reusable as a Home-page preview (`limit` + `viewAllHref`)
 * and as the full section (no `limit`).
 */
export function ReviewsSection({
  reviews = defaultReviews,
  limit,
  viewAllHref,
  title = "What Our Guests Say",
  headingLevel = 2,
  id,
  className,
}: ReviewsSectionProps) {
  const headingId = `${id ?? "reviews"}-heading`;
  const Heading = `h${headingLevel}` as "h2" | "h3";
  const hasReviews = reviews.length > 0;
  const shown =
    typeof limit === "number" ? reviews.slice(0, Math.max(0, limit)) : reviews;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn("bg-surface text-on-surface", className)}
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-12 md:px-6 md:py-16">
        <Heading
          id={headingId}
          className="font-serif text-2xl font-semibold text-secondary md:text-3xl"
        >
          {title}
        </Heading>

        {hasReviews ? (
          <>
            <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </ul>

            {viewAllHref && (
              <div className="mt-8">
                <Link
                  href={viewAllHref}
                  className={cn(
                    "inline-flex min-h-11 items-center gap-2 rounded-lg px-1 py-2",
                    "font-medium text-primary underline-offset-4 hover:underline",
                    "motion-safe:transition-colors motion-safe:duration-200",
                    focusRing,
                  )}
                >
                  <span>Read all reviews</span>
                  <Icon icon={ArrowRight} size="sm" />
                </Link>
              </div>
            )}
          </>
        ) : (
          /* Req 11.4 — explicit empty state, never an empty list. */
          <p className="mt-6 max-w-prose text-base text-on-surface-muted">
            Guest reviews are not yet available. Please check back soon.
          </p>
        )}
      </div>
    </section>
  );
}

export default ReviewsSection;
