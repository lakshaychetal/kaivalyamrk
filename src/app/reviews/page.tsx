/**
 * Reviews page (`/reviews`) — full guest reviews section.
 * --------------------------------------------------------
 * Feature: kaivalyam-homestay-website
 *
 * Renders the complete ReviewsSection (all reviews, no limit) so the
 * "Read all reviews" link from the Home page preview has a destination.
 *
 * _Requirements: 11.1, 11.2, 11.3, 11.4_
 */
import type { Metadata } from "next";
import { Star } from "lucide-react";

import { Icon } from "@/components/ui/Icon";
import { ReviewsSection } from "@/components/sections/ReviewsSection";

export const metadata: Metadata = {
  title: "Guest Reviews — Kaivalyam Homestay",
  description:
    "Read what guests say about their stay at Kaivalyam Homestay in Padichira, Wayanad, Kerala.",
};

export default function ReviewsPage() {
  return (
    <article className="w-full">
      {/* Page header */}
      <header className="border-b border-border bg-surface-alt">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 md:px-6 md:py-16">
          <p className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.16em] text-on-surface-muted">
            <Icon icon={Star} size="sm" aria-hidden className="text-accent" />
            Guest Stories
          </p>
          <h1 className="mt-3 font-serif text-3xl font-semibold text-secondary sm:text-4xl">
            Guest Reviews
          </h1>
          <p className="mt-4 max-w-prose text-lg leading-relaxed text-on-surface-muted">
            What our guests remember most about their stay — in their own words.
            Real impressions of the quiet, the food, and the warm Kaivalyam
            welcome.
          </p>
        </div>
      </header>

      {/* Full reviews list (no limit) */}
      <ReviewsSection
        title="What Our Guests Say"
        headingLevel={2}
        id="reviews"
      />
    </article>
  );
}
