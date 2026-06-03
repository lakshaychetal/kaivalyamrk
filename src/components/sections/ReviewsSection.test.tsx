/**
 * Unit tests for `ReviewsSection` (task 11.7).
 * --------------------------------------------
 * Feature: kaivalyam-homestay-website
 *
 * Verifies the Req 11.1–11.4 contract:
 *   • 11.1 — every rendered review shows its reviewer name and review text.
 *   • 11.2 — a numeric rating is shown IF AND ONLY IF the review has one.
 *   • 11.3 — reusable: a `limit` produces a compact preview and `viewAllHref`
 *            renders a link through to the full section (reachable from Home).
 *   • 11.4 — an explicit "reviews are not yet available" message replaces the
 *            list when there are no reviews (never an empty list).
 */
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";

import { ReviewsSection } from "./ReviewsSection";
import type { Review } from "@/content/types";

const rated: Review = {
  id: "r-rated",
  reviewerName: "Anjali R.",
  text: "The most peaceful few days we have had in years.",
  rating: 5,
};

const unrated: Review = {
  id: "r-unrated",
  reviewerName: "David George",
  text: "A simple, restful long stay with everything we needed.",
};

const sample: readonly Review[] = [rated, unrated];

describe("ReviewsSection", () => {
  it("renders a labelled section landmark", () => {
    render(<ReviewsSection reviews={sample} />);
    expect(
      screen.getByRole("region", { name: /what our guests say/i }),
    ).toBeInTheDocument();
  });

  it("renders each review's reviewer name and review text (Req 11.1)", () => {
    render(<ReviewsSection reviews={sample} />);
    for (const review of sample) {
      expect(screen.getByText(review.reviewerName)).toBeInTheDocument();
      expect(screen.getByText(review.text)).toBeInTheDocument();
    }
  });

  it("shows a numeric rating only for reviews that have one (Req 11.2)", () => {
    render(<ReviewsSection reviews={sample} />);

    // The rated review exposes an accessible rating image with its value.
    const ratingImg = screen.getByRole("img", { name: /rated 5 out of 5/i });
    expect(ratingImg).toBeInTheDocument();
    expect(within(ratingImg).getByText("5 / 5")).toBeInTheDocument();

    // Exactly one rating is shown — the unrated review contributes none.
    expect(screen.getAllByRole("img", { name: /rated/i })).toHaveLength(1);
  });

  it("conveys the rating with more than color (shape + number + label)", () => {
    render(<ReviewsSection reviews={[rated]} />);
    const ratingImg = screen.getByRole("img", { name: /rated 5 out of 5/i });
    // A visible numeric value accompanies the star shapes (Req 22.6).
    expect(within(ratingImg).getByText("5 / 5")).toBeInTheDocument();
  });

  it("renders an explicit empty-state message when there are no reviews (Req 11.4)", () => {
    render(<ReviewsSection reviews={[]} />);
    expect(screen.getByText(/reviews are not yet available/i)).toBeInTheDocument();
    // No review list is rendered (empty state, not an empty list).
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("respects a preview limit and shows only the first N reviews (Req 11.3)", () => {
    const many: readonly Review[] = [
      { id: "a", reviewerName: "Guest A", text: "Review A text." },
      { id: "b", reviewerName: "Guest B", text: "Review B text." },
      { id: "c", reviewerName: "Guest C", text: "Review C text." },
    ];
    render(<ReviewsSection reviews={many} limit={2} />);

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(screen.getByText("Guest A")).toBeInTheDocument();
    expect(screen.getByText("Guest B")).toBeInTheDocument();
    expect(screen.queryByText("Guest C")).not.toBeInTheDocument();
  });

  it("renders a 'view all' link to the full section when given a href (Req 11.3)", () => {
    render(
      <ReviewsSection reviews={sample} limit={1} viewAllHref="/reviews" />,
    );
    const link = screen.getByRole("link", { name: /read all reviews/i });
    expect(link).toHaveAttribute("href", "/reviews");
  });

  it("omits the 'view all' link when no href is provided (full section)", () => {
    render(<ReviewsSection reviews={sample} />);
    expect(
      screen.queryByRole("link", { name: /read all reviews/i }),
    ).not.toBeInTheDocument();
  });

  it("shows all reviews when no limit is given (full section)", () => {
    render(<ReviewsSection reviews={sample} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(sample.length);
  });
});
