/**
 * Unit tests for `ReviewsSection` (task 11.7).
 * Verifies Req 11.1–11.4 contract.
 */
import { describe, it, expect, beforeAll, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";

import { ReviewsSection } from "./ReviewsSection";
import type { Review } from "@/content/types";

// jsdom doesn't implement scroll methods — mock them so the carousel doesn't throw
beforeAll(() => {
  Element.prototype.scrollTo = vi.fn();
});

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
    expect(screen.getByRole("region", { name: /what our guests say/i })).toBeInTheDocument();
  });

  it("renders each review's reviewer name and review text (Req 11.1)", () => {
    render(<ReviewsSection reviews={sample} />);
    for (const review of sample) {
      // Name rendered as "— Name" in card attribution
      expect(screen.getAllByText(new RegExp(review.reviewerName, "i")).length).toBeGreaterThan(0);
      expect(screen.getAllByText(review.text).length).toBeGreaterThan(0);
    }
  });

  it("shows a numeric rating only for reviews that have one (Req 11.2)", () => {
    render(<ReviewsSection reviews={sample} />);
    const ratingImgs = screen.getAllByRole("img", { name: /rated 5 out of 5/i });
    expect(ratingImgs.length).toBeGreaterThan(0);
    expect(within(ratingImgs[0]!).getByText("5 / 5")).toBeInTheDocument();
  });

  it("conveys the rating with more than color (shape + number + label)", () => {
    render(<ReviewsSection reviews={[rated]} />);
    const ratingImgs = screen.getAllByRole("img", { name: /rated 5 out of 5/i });
    expect(within(ratingImgs[0]!).getByText("5 / 5")).toBeInTheDocument();
  });

  it("renders an explicit empty-state message when there are no reviews (Req 11.4)", () => {
    render(<ReviewsSection reviews={[]} />);
    expect(screen.getByText(/reviews are not yet available/i)).toBeInTheDocument();
  });

  it("respects a preview limit and shows only the first N reviews (Req 11.3)", () => {
    const many: readonly Review[] = [
      { id: "a", reviewerName: "Guest A", text: "Review A text." },
      { id: "b", reviewerName: "Guest B", text: "Review B text." },
      { id: "c", reviewerName: "Guest C", text: "Review C text." },
    ];
    render(<ReviewsSection reviews={many} limit={2} />);
    expect(screen.getAllByText(new RegExp("Guest A", "i")).length).toBeGreaterThan(0);
    expect(screen.getAllByText(new RegExp("Guest B", "i")).length).toBeGreaterThan(0);
    expect(screen.queryByText(new RegExp("Guest C", "i"))).not.toBeInTheDocument();
  });

  it("renders a 'view all' link when given a href (Req 11.3)", () => {
    render(<ReviewsSection reviews={sample} limit={1} viewAllHref="/reviews" />);
    const link = screen.getByRole("link", { name: /read all reviews/i });
    expect(link).toHaveAttribute("href", "/reviews");
  });

  it("omits the 'view all' link when no href is provided", () => {
    render(<ReviewsSection reviews={sample} />);
    expect(screen.queryByRole("link", { name: /read all reviews/i })).not.toBeInTheDocument();
  });

  it("shows all reviews in the section", () => {
    render(<ReviewsSection reviews={sample} />);
    for (const review of sample) {
      expect(screen.getAllByText(new RegExp(review.reviewerName, "i")).length).toBeGreaterThan(0);
    }
  });
});
