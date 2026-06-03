/**
 * Facilities content collection — the on-property amenities.
 * ----------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 4.2)
 *
 * Authors the nine {@link Facility} entries required by Req 5.1, each with a
 * textual description (Req 5.3) and a Lucide icon NAME (Req 19.4 — a single
 * icon family). Consumed by the Facilities page (task 11.4) and the Home
 * facilities summary (task 11.1).
 *
 * Icons are Lucide icon names (kebab/Pascal-agnostic strings); the presentation
 * layer maps the name to the Lucide component. Only icons that exist in the
 * Lucide set are used, so a single icon family covers every facility.
 *
 * `image` is intentionally left `undefined` for every facility: optional
 * property photos come from the asset pipeline (task 5.1), and Req 5.2 is
 * satisfied by the icon alone. The Facilities page may attach a generated
 * photo later without changing this data shape.
 *
 * Strongly typed against `content/types.ts`; no React, no side effects.
 *
 * _Requirements: 5.1, 5.3_
 */

import type { Facility } from './types';

/**
 * The nine on-property facilities (Req 5.1), in display order. Each `icon` is a
 * Lucide icon name from the single Lucide family (Req 19.4).
 */
export const facilities: readonly Facility[] = [
  {
    id: 'home-cooked-cuisine',
    name: 'Home-Cooked Local Cuisine',
    description:
      'Authentic Malayali meals cooked in our kitchen with local produce — warm, unhurried food that tastes of Wayanad. Vegetarian and non-vegetarian on request.',
    icon: 'utensils',
  },
  {
    id: 'free-wifi',
    name: 'Free Wi-Fi',
    description:
      'Complimentary high-speed Wi-Fi throughout the property, so you can stay connected when you want to — and switch off when you don\u2019t.',
    icon: 'wifi',
  },
  {
    id: 'free-parking',
    name: 'Free Parking',
    description:
      'Safe, free on-site parking for your vehicle, right at the homestay — no hunting for a spot after a long drive up the hills.',
    icon: 'square-parking',
  },
  {
    id: 'childrens-play-area',
    name: "Children's Play Area",
    description:
      'A dedicated indoor play area keeps younger guests happily occupied, making Kaivalyam an easy, relaxed choice for families.',
    icon: 'baby',
  },
  {
    id: 'campfire-barbecue',
    name: 'Campfire & Barbecue',
    description:
      'Gather around a crackling campfire under the stars and share a barbecue evening — one of the simplest pleasures of a hill-village night.',
    icon: 'flame',
  },
  {
    id: 'library',
    name: 'Library with 1000+ Books',
    description:
      'A quiet library stocked with more than a thousand books — settle into a corner with a good read and let the afternoon drift by.',
    icon: 'library-big',
  },
  {
    id: 'walking-trek-area',
    name: 'Walking & Trek Area',
    description:
      'Walking trails and trek routes begin right around the property, leading into plantations and Western Ghats greenery at an easy, breathe-it-in pace.',
    icon: 'footprints',
  },
  {
    id: 'outdoor-dining',
    name: 'Outdoor Dining',
    description:
      'Dine in the open air, surrounded by garden and birdsong — meals taste better with the Wayanad breeze and an unhurried view.',
    icon: 'trees',
  },
  {
    id: 'music-system',
    name: 'Music System & Speakers',
    description:
      'A music system with speakers for your gatherings and quiet evenings alike — set the mood for a campfire singalong or a slow morning.',
    icon: 'music',
  },
] as const;
