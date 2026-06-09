/**
 * `ReviewsSection` — guest reviews & social proof (Req 11.1–11.4).
 *
 * Mobile  : State-driven — ONLY the active card renders in the DOM at a time.
 *           Auto-advances every 6 s. Prev/Next + dot indicators.
 * sm+     : 2-column grid.
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Star, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/components/ui/cn";
import { focusRing } from "@/components/ui/buttonStyles";
import { reviews as defaultReviews } from "@/content/reviews";
import type { Review } from "@/content/types";

export const RATING_SCALE_MAX = 5;

export interface ReviewsSectionProps {
  reviews?: readonly Review[];
  limit?: number;
  viewAllHref?: string;
  title?: string;
  headingLevel?: 2 | 3;
  id?: string;
  className?: string;
}

function formatRating(rating: number): string {
  return Number.isInteger(rating) ? String(rating) : rating.toFixed(1);
}

function RatingDisplay({ rating }: { rating: number }) {
  const filled = Math.max(0, Math.min(RATING_SCALE_MAX, Math.round(rating)));
  const label = `Rated ${formatRating(rating)} out of ${RATING_SCALE_MAX}`;
  return (
    <p className="flex items-center gap-2" role="img" aria-label={label}>
      <span className="flex items-center gap-0.5" aria-hidden="true">
        {Array.from({ length: RATING_SCALE_MAX }, (_, i) => (
          <Icon
            key={i}
            icon={Star}
            size="sm"
            className={cn(i < filled ? "fill-current text-accent" : "fill-none text-on-surface-muted")}
          />
        ))}
      </span>
      <span className="text-sm font-medium text-on-surface">
        {formatRating(rating)} / {RATING_SCALE_MAX}
      </span>
    </p>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const hasRating = typeof review.rating === "number";
  return (
    <Card variant="review" className="h-full">
      {hasRating && <RatingDisplay rating={review.rating as number} />}
      <span aria-hidden="true" className="mt-3 block font-serif text-5xl leading-none text-primary/30 select-none">
        &ldquo;
      </span>
      <p className="mt-1 text-sm leading-relaxed text-on-surface italic">
        {review.text}
      </p>
      <p className="mt-4 border-t border-border pt-3 text-sm font-semibold text-secondary">
        — {review.reviewerName}
      </p>
    </Card>
  );
}

/**
 * Mobile: only ONE card in the DOM at a time (state-driven).
 * Desktop (sm+): all cards in a 2-column grid.
 */
function ReviewsDisplay({ reviews }: { reviews: readonly Review[] }) {
  const [idx, setIdx] = useState(0);
  const count = reviews.length;

  const goPrev = useCallback(() => setIdx((i) => (i - 1 + count) % count), [count]);
  const goNext = useCallback(() => setIdx((i) => (i + 1) % count), [count]);

  /* Auto-advance every 6 s */
  useEffect(() => {
    if (count < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % count), 6000);
    return () => clearInterval(t);
  }, [count]);

  const current = reviews[idx]!;

  return (
    <>
      {/* ── MOBILE: one card at a time (below md/tablet breakpoint) ── */}
      <div className="md:hidden">
        {/* Only the active card renders */}
        <div key={current.id} className="w-full">
          <ReviewCard review={current} />
        </div>

        {count > 1 && (
          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              type="button"
              aria-label="Previous review"
              onClick={goPrev}
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                "bg-surface-alt border border-border text-on-surface",
                "hover:bg-primary hover:text-on-primary hover:border-primary",
                "motion-safe:transition motion-safe:duration-150",
                focusRing,
              )}
            >
              <ChevronLeft size={18} aria-hidden />
            </button>

            {/* Dots */}
            <div className="flex items-center gap-2" aria-hidden="true">
              {Array.from({ length: count }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIdx(i)}
                  aria-label={`Go to review ${i + 1}`}
                  className={cn(
                    "h-2 rounded-full motion-safe:transition-all motion-safe:duration-300",
                    i === idx ? "w-6 bg-primary" : "w-2 bg-border hover:bg-on-surface-muted",
                  )}
                />
              ))}
            </div>

            <button
              type="button"
              aria-label="Next review"
              onClick={goNext}
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                "bg-surface-alt border border-border text-on-surface",
                "hover:bg-primary hover:text-on-primary hover:border-primary",
                "motion-safe:transition motion-safe:duration-150",
                focusRing,
              )}
            >
              <ChevronRight size={18} aria-hidden />
            </button>
          </div>
        )}

        {/* Counter e.g. "1 / 2" */}
        {count > 1 && (
          <p className="mt-3 text-center text-xs text-on-surface-muted">
            {idx + 1} / {count}
          </p>
        )}
      </div>

      {/* ── DESKTOP (md+): 2-column grid, all cards visible ── */}
      <ul className="hidden md:grid grid-cols-2 gap-6">
        {reviews.map((review) => (
          <li key={review.id} className="h-full">
            <ReviewCard review={review} />
          </li>
        ))}
      </ul>
    </>
  );
}

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
  const shown = typeof limit === "number" ? reviews.slice(0, Math.max(0, limit)) : reviews;

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
            <div className="mt-8">
              <ReviewsDisplay reviews={shown} />
            </div>

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
          <p className="mt-6 max-w-prose text-base text-on-surface-muted">
            Guest reviews are not yet available. Please check back soon.
          </p>
        )}
      </div>
    </section>
  );
}

export default ReviewsSection;
