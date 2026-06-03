/**
 * Reviews content collection — guest social proof.
 * ------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 4.2)
 *
 * Authors the {@link Review} entries consumed by the `ReviewsSection`
 * (task 11.7) on the Home page (preview, Req 2.6) and as a full section
 * (Req 11.1, 11.2).
 *
 * EMPTY-STATE SUPPORT (Req 11.4): the reviews collection is modeled as a plain
 * `readonly Review[]`. "No reviews available" is represented by an EMPTY array
 * (`[]`) — there is no separate sentinel. The `ReviewsSection` component checks
 * `reviews.length === 0` and renders the "reviews are not yet available"
 * message in that case. To clear all reviews (e.g. a fresh property), set
 * {@link reviews} to `EMPTY_REVIEWS` / `[]`; everything downstream handles it.
 *
 * `rating` is OPTIONAL (Req 11.2): include it to show a numeric rating, omit it
 * to show name + text only. Both forms appear below so the rendering handles
 * each path.
 *
 * Strongly typed against `content/types.ts`; no React, no side effects.
 *
 * ⚠️ The entries below are representative sample reviews for layout and launch.
 * The client should replace them with real, attributed guest reviews.
 *
 * _Requirements: 11.1, 11.2_ (empty-state per 11.4 is documented above)
 */

import type { Review } from './types';

/**
 * The canonical empty reviews collection — the explicit representation of
 * "no reviews available yet" (Req 11.4). Swap {@link reviews} for this (or any
 * empty array) to exercise the empty state.
 */
export const EMPTY_REVIEWS: readonly Review[] = [] as const;

/**
 * The default, non-empty set of guest reviews. A mix of rated and unrated
 * entries so both rendering paths (Req 11.2) are represented.
 *
 * ⚠️ PLACEHOLDER sample content — replace with real guest reviews before launch.
 */
export const reviews: readonly Review[] = [
  {
    id: 'review-anjali-r',
    reviewerName: 'Anjali R.',
    text: 'The most peaceful few days we have had in years. We woke to birdsong, read in the library all afternoon, and our dog was treated like family. Kaivalyam truly lives up to its name.',
    rating: 5,
  },
  {
    id: 'review-thomas-k',
    reviewerName: 'Thomas K.',
    text: 'Stayed in the Luxury Cottage with our kids — the roof balcony at dusk and the indoor play area were perfect. The home-cooked Malayali food was the highlight of the trip.',
    rating: 5,
  },
  {
    id: 'review-meera-s',
    reviewerName: 'Meera S.',
    text: 'Such warm hosts and genuinely quiet surroundings. The campfire evening and the walks around the plantations made it feel like a proper escape from the city.',
    rating: 4,
  },
  {
    id: 'review-david-george',
    reviewerName: 'David George',
    text: 'A simple, restful long stay. The Classic Room had everything we needed and the 24-hour assistance meant we never had to worry about a thing.',
    // No rating — exercises the optional-rating path (Req 11.2).
  },
] as const;
