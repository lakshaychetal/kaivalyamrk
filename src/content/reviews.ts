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
    id: 'review-sujaya-sundaram',
    reviewerName: 'Sujaya Sundaram, Bangalore',
    text: 'Kaivalyam is truly a haven for those seeking a break from the humdrum of city life and daily work routines. Tucked away unobtrusively in the verdant village of Padichira this lovely getaway was an amazing experience of living life at an unhurried pace, spending time looking at the canopy of trees, eating slow meals outdoors, listening to birdsongs, relaxing the body and so much more. I particularly liked the numerous little cozy spaces across the property where I could just lose myself reading, drawing, meditating or doing nothing. The food was delicious and so satisfying. I will certainly go another time if I get the chance.',
    rating: 5,
  },
  {
    id: 'review-sreeja-mohandas',
    reviewerName: 'Sreeja Mohandas, Bangalore',
    text: 'A blissful little oasis in the middle of dense green forests. I don\'t know what I loved more, the fragrant air or the dinners under the stars or the quiet of the cozy little library. I can only say that time stood still for me at Kaivalyam. Will definitely visit again.',
    rating: 5,
  },
] as const;
