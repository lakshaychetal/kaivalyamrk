/**
 * `ReviewsSection` — guest reviews & social proof (Req 11.1–11.4).
 *
 * Mobile  : CSS scroll-snap carousel — one card fills the screen at a time,
 *           swipeable left/right, auto-advances every 6 seconds.
 *           Prev/Next buttons + dot indicators for manual control.
 * sm+     : Standard 2-column side-by-side grid.
 *
 * Single DOM tree — no duplicate rendering.
 */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
 * On mobile: CSS scroll-snap + JS index tracking so one card is always
 * centred. Auto-advances every 6 s. Prev/Next arrows + dot nav.
 * On sm+: plain 2-column grid (scroll container hidden via CSS).
 */
function ReviewsDisplay({ reviews }: { reviews: readonly Review[] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const count = reviews.length;

  /* Scroll the snap container to the target slide */
  const scrollTo = useCallback((idx: number) => {
    const container = scrollRef.current;
    if (!container) return;
    const slide = container.children[idx] as HTMLElement | undefined;
    if (slide) {
      container.scrollTo({ left: slide.offsetLeft, behavior: "smooth" });
    }
    setActiveIdx(idx);
  }, []);

  const goPrev = useCallback(() => scrollTo((activeIdx - 1 + count) % count), [activeIdx, count, scrollTo]);
  const goNext = useCallback(() => scrollTo((activeIdx + 1) % count), [activeIdx, count, scrollTo]);

  /* Auto-advance every 6 seconds */
  useEffect(() => {
    if (count < 2) return;
    const t = setInterval(() => {
      setActiveIdx((i) => {
        const next = (i + 1) % count;
        const container = scrollRef.current;
        if (container) {
          const slide = container.children[next] as HTMLElement | undefined;
          if (slide) container.scrollTo({ left: slide.offsetLeft, behavior: "smooth" });
        }
        return next;
      });
    }, 6000);
    return () => clearInterval(t);
  }, [count]);

  /* Keep activeIdx in sync when user swipes manually */
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const onScroll = () => {
      const idx = Math.round(container.scrollLeft / container.clientWidth);
      setActiveIdx(idx);
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* ── MOBILE: scroll-snap carousel (hidden on sm+) ── */}
      <div className="sm:hidden">
        {/* Snap container — overflow-x scroll, each child = full width */}
        <div
          ref={scrollRef}
          className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth gap-4"
          style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
          aria-label="Guest reviews"
        >
          {reviews.map((review) => (
            <div
              key={review.id}
              className="flex-none w-full snap-center"
            >
              <ReviewCard review={review} />
            </div>
          ))}
        </div>

        {/* Controls: prev · dots · next */}
        {count > 1 && (
          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              aria-label="Previous review"
              onClick={goPrev}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full shrink-0",
                "bg-surface-alt border border-border text-on-surface",
                "hover:bg-primary hover:text-on-primary hover:border-primary",
                "motion-safe:transition motion-safe:duration-150",
                focusRing,
              )}
            >
              <ChevronLeft size={18} aria-hidden />
            </button>

            {/* Dot indicators */}
            <div className="flex items-center justify-center gap-2" aria-hidden="true">
              {Array.from({ length: count }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => scrollTo(i)}
                  aria-label={`Go to review ${i + 1}`}
                  className={cn(
                    "h-2 rounded-full motion-safe:transition-all motion-safe:duration-300",
                    i === activeIdx ? "w-6 bg-primary" : "w-2 bg-border",
                  )}
                />
              ))}
            </div>

            <button
              type="button"
              aria-label="Next review"
              onClick={goNext}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full shrink-0",
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
      </div>

      {/* ── DESKTOP (sm+): 2-column grid ── */}
      <ul className="hidden sm:grid grid-cols-2 gap-6">
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
