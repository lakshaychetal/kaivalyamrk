/**
 * Content collections barrel.
 * ---------------------------
 * Feature: kaivalyam-homestay-website (task 4.2)
 *
 * Single import surface for the typed static content. Re-exports the shared
 * content TYPES (from `types.ts`, authored in task 4.1) plus the authored
 * COLLECTIONS (task 4.2).
 *
 * Re-exports are EXPLICIT (not blanket `export *`) so per-module names that
 * intentionally repeat across files — e.g. each prose module's local `TAGLINE`
 * — do not collide in the barrel. Import those module-local constants from
 * their own file when needed (`@/content/about`, `@/content/site`).
 */

// Shared content types + canonical id constants (task 4.1).
export * from './types';

// Rooms (Req 4.1–4.4)
export { rooms, luxuryCottage, classicRoom } from './rooms';

// Facilities (Req 5.1, 5.3)
export { facilities } from './facilities';

// About narrative (Req 3.1–3.4)
export {
  aboutContent,
  type AboutContent,
  type AboutSection,
  type SignatureOffering,
} from './about';

// Cuisine (Req 8.1, 8.2)
export {
  cuisineContent,
  type CuisineContent,
  type CuisineSection,
  type DiningExperience,
} from './cuisine';

// Reach Us (Req 10.1–10.3)
export { roadRoutes, transportHubs, propertyLocation } from './reach-us';

// Reviews (Req 11.1, 11.2; empty-state per 11.4)
export { reviews, EMPTY_REVIEWS } from './reviews';

// Site & contact info (Req 1.7, 9.1; map per 9.4)
export {
  siteInfo,
  type SiteInfo,
  type PostalAddress,
  type MapLocation,
} from './site';
