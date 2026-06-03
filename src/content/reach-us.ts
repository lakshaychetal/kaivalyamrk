/**
 * Reach Us content collection — road connectivity and transport hubs.
 * -------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 4.2)
 *
 * Authors the typed data for the Reach Us page (task 11.6):
 *   • {@link RoadRoute}[] from the seven origin cities (Req 10.1):
 *     Kozhikode, Kannur, Nilambur, Ooty, Gudalur, Bengaluru, Mysuru
 *   • {@link TransportHub} for the nearest airport and railway (Req 10.2)
 *   • the Padichira / ~10 km-from-Pulpally locator fact (Req 10.3)
 *
 * Strongly typed against `content/types.ts`; no React, no side effects.
 *
 * ⚠️ Distances and drive descriptions are APPROXIMATE, based on typical road
 * routes into the Pulpally / Padichira area of eastern Wayanad. They are marked
 * approximate in the copy and should be confirmed by the client before launch.
 *
 * _Requirements: 10.1, 10.2, 10.3_
 */

import type { RoadRoute, TransportHub } from './types';

/**
 * The property locator fact (Req 10.3): Kaivalyam is in Padichira, roughly
 * 10 km from Pulpally. Exposed as structured data so the page can render the
 * sentence and reuse the values.
 */
export const propertyLocation = {
  village: 'Padichira',
  nearestTown: 'Pulpally',
  /** Approximate distance from Pulpally, in km (Req 10.3). */
  distanceFromPulpallyKm: 10,
  district: 'Wayanad',
  state: 'Kerala',
  country: 'India',
  /** Ready-to-render sentence for Req 10.3. */
  statement:
    'Kaivalyam Homestay is located in Padichira, approximately 10 kilometres from Pulpally, in the Wayanad district of Kerala.',
} as const;

/**
 * Road-connectivity directions from the seven required origin cities (Req 10.1),
 * in order. `distanceKm` is APPROXIMATE road distance to Padichira/Pulpally.
 */
export const roadRoutes: readonly RoadRoute[] = [
  {
    origin: 'Kozhikode (Calicut)',
    description:
      'Drive east via Thamarassery and the ghat road into Wayanad, continuing through Sulthan Bathery toward Pulpally and on to Padichira. A scenic hill climb of roughly four hours.',
    distanceKm: 140,
  },
  {
    origin: 'Kannur',
    description:
      'Head south-east through Mananthavady and Pulpally to reach Padichira — a green run through plantation country of around three to four hours.',
    distanceKm: 130,
  },
  {
    origin: 'Nilambur',
    description:
      'Travel north through Nadavayal and Sulthan Bathery, then on toward Pulpally and Padichira — about three hours by road.',
    distanceKm: 110,
  },
  {
    origin: 'Ooty',
    description:
      'Descend from the Nilgiris via Gudalur and Sulthan Bathery, then continue to Pulpally and Padichira — a memorable mountain drive of roughly three to four hours.',
    distanceKm: 120,
  },
  {
    origin: 'Gudalur',
    description:
      'A short, pretty hop across the Kerala border through Sulthan Bathery toward Pulpally and Padichira — around two hours.',
    distanceKm: 70,
  },
  {
    origin: 'Bengaluru',
    description:
      'Take the Mysuru road, then via Gundlupet and the Muthanga/Sulthan Bathery route into Wayanad, continuing to Pulpally and Padichira — a full-day drive of roughly six to seven hours.',
    distanceKm: 290,
  },
  {
    origin: 'Mysuru',
    description:
      'Drive via Gundlupet and the Muthanga forest route into Sulthan Bathery, then on to Pulpally and Padichira — about three to four hours.',
    distanceKm: 140,
  },
] as const;

/**
 * Nearest airport and railway station distances (Req 10.2). The brief notes the
 * nearest air/rail links are roughly 150 km away; the values below use
 * reasonable Wayanad references and are marked approximate.
 *
 * ⚠️ APPROXIMATE — confirm with the client before launch.
 */
export const transportHubs: readonly TransportHub[] = [
  {
    type: 'airport',
    name: 'Kannur International Airport (CNN)',
    distanceKm: 130,
  },
  {
    type: 'airport',
    name: 'Calicut International Airport (CCJ), Kozhikode',
    distanceKm: 150,
  },
  {
    type: 'railway',
    name: 'Kozhikode (Calicut) Railway Station',
    distanceKm: 150,
  },
] as const;
