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
  {
    id: 'review-anand-th',
    reviewerName: 'Anand TH, Qatar',
    text: 'A peaceful retreat, well away from the town center. From waking up to birdsong and reading in the library to watching the sunset from the roof balcony, every moment here feels like a proper escape from city life. The warm hosts treat everyone — including kids and family pets — like royalty, offering flawless 24-hour assistance, cozy campfire evenings, and refreshing plantation walks. Ultimately, it is the exceptional, home-cooked Keralite food that serves as the true highlight of the trip, making this peaceful haven a genuinely unforgettable place to stay.',
    rating: 5,
  },
  {
    id: 'review-manoj-madhavan',
    reviewerName: 'Manoj Madhavan, Chennai',
    text: 'Our stay at Kaivalyam Homestay in Padichira, Wayanad, was absolutely wonderful! The peaceful surroundings and beautiful green views made it the perfect getaway for our family. The hosts were incredibly warm and welcoming, treating us just like family from the moment we arrived. The highlight was identifying birds from bird calls using a mobile app suggested by the owner — we were able to identify 25 birds at one point. The supporting staff were extremely humble, helpful and friendly. We loved the clean, cozy rooms and the delicious home-cooked meals that tasted amazing. It was so nice to unplug, relax together, and enjoy the fresh air. In short, it was a home away from home, far away from the madding crowd. We left with full hearts and great memories, and we cannot wait to visit again!',
    rating: 5,
  },
  {
    id: 'review-ajay-kumar-mc',
    reviewerName: 'Ajay Kumar MC, KSA',
    text: 'A serene and calming retreat tucked away in the lush greenery of Wayanad. The surroundings are peaceful and restorative, with fresh mountain air and a quiet that instantly slows you down. What truly stood out was the exceptional care shown by the hosts. When I arrived unwell with a cold and without adequate warm clothing, they immediately provided a jacket and made sure I was comfortable. Their support went far beyond hospitality — one of the staff personally drove me to a clinic, stayed with me throughout the consultation, and ensured I returned safely. That level of genuine concern made a difficult moment much easier. This is not just a place to stay, but a place where you feel looked after like family. A memorable experience of warmth, care, and calm in the heart of nature.',
    rating: 5,
  },
] as const;
