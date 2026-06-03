/**
 * Cuisine content collection — the homestay's dining offering.
 * ------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 4.2)
 *
 * Authors the copy for the Cuisine page (task 11.5):
 *   • authentic Malayali cuisine, vegetarian + non-vegetarian (Req 8.1)
 *   • home-cooked and outdoor dining experiences (Req 8.2)
 *
 * `content/types.ts` does not define a Cuisine shape (it is prose, not a
 * catalog), so the typed structures are declared here. No React, no side
 * effects. Illustrative dining photos (Req 8.3) are wired in by the page from
 * the asset pipeline (task 5.1); none are fabricated here.
 *
 * _Requirements: 8.1, 8.2_
 */

/** A titled prose section of the Cuisine narrative. */
export interface CuisineSection {
  id: string;
  heading: string;
  paragraphs: string[];
}

/** A named dining experience (e.g. home-cooked, outdoor), Req 8.2. */
export interface DiningExperience {
  id: string;
  title: string;
  description: string;
  /** Lucide icon name (single icon family, Req 19.4). */
  icon: string;
}

/** The full typed Cuisine-page content model. */
export interface CuisineContent {
  /** Short lead-in line. */
  intro: string;
  /** Authentic Malayali cuisine, veg + non-veg (Req 8.1). */
  malayaliCuisine: CuisineSection;
  /** Home-cooked and outdoor dining experiences (Req 8.2). */
  diningExperiences: DiningExperience[];
}

/** Lead-in line for the Cuisine page. */
export const intro =
  'Food at Kaivalyam is home cooking in the truest sense — authentic Malayali flavours, local produce, and meals made to be lingered over.';

/**
 * Authentic Malayali cuisine, both vegetarian and non-vegetarian (Req 8.1).
 */
export const malayaliCuisine: CuisineSection = {
  id: 'malayali-cuisine',
  heading: 'Authentic Malayali Cuisine',
  paragraphs: [
    'Our kitchen cooks the food of Kerala the way it is meant to be eaten — fresh, fragrant, and rooted in the region. Think appam and stew, Wayanad-style rice, coconut-rich curries, fiery pickles, and the kind of breakfast that sets up a whole day of wandering.',
    'There is plenty for everyone at the table: a full spread of vegetarian dishes built around local vegetables and spices, and hearty non-vegetarian options for those who want them. Tell us your preferences and we will cook to them — simply, generously, and with a lot of care.',
  ],
};

/**
 * The dining experiences available on the property (Req 8.2): home-cooked
 * meals and open-air dining.
 */
export const diningExperiences: DiningExperience[] = [
  {
    id: 'home-cooked',
    title: 'Home-Cooked Meals',
    description:
      'Every meal is prepared in our own kitchen with local produce — honest, comforting food served warm, just as it would be in a Wayanad home.',
    icon: 'utensils',
  },
  {
    id: 'outdoor-dining',
    title: 'Outdoor Dining',
    description:
      'Eat in the open air, surrounded by garden and birdsong — a slow breakfast in the morning light or dinner under the hill-country stars.',
    icon: 'trees',
  },
];

/** The assembled Cuisine-page content, ready for the page to render. */
export const cuisineContent: CuisineContent = {
  intro,
  malayaliCuisine,
  diningExperiences,
};
