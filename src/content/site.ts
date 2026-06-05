/**
 * Site & contact info content collection.
 * ---------------------------------------
 * Feature: kaivalyam-homestay-website (task 4.2)
 *
 * The single source of truth for the homestay's identity and contact details,
 * consumed by the Site header/footer (Req 1.7, tasks 10.1/10.2), the Contact
 * page (Req 9.1, task 13.1), and SEO/structured data (Req 21.4, task 8.1).
 *
 *   • homestay name, tagline (Req 1.7, brand)
 *   • phone + email (Req 9.1)
 *   • postal address — Padichira, Pulpally, Wayanad, Kerala
 *   • WhatsApp number (Req 9.3 / 16.x)
 *   • map location: coordinates + an embed query for the Wayanad map (Req 9.4)
 *
 * `content/types.ts` does not define a site-info shape (it is configuration, not
 * a catalog), so the typed structures are declared here. No React, no side
 * effects.
 *
 * ⚠️ PLACEHOLDER CONTACT VALUES: the phone, email, and WhatsApp number below are
 * NOT real — they are clearly-marked placeholders so the UI and links render and
 * type-check. The client provides the final phone, email, WhatsApp/WATI number,
 * exact postal address, and map pin before launch. The WhatsApp placeholder is
 * kept consistent with `KAIVALYAM_WHATSAPP_NUMBER` in the WhatsApp URL builder.
 *
 * _Requirements: 1.7, 9.1_ (location/map per 9.4; WhatsApp per 9.3/16.x)
 */

import { KAIVALYAM_WHATSAPP_NUMBER } from '@/domain/integration-urls/whatsapp-url';

/** A structured postal address. */
export interface PostalAddress {
  /** Building / homestay line. */
  line1: string;
  village: string;
  town: string;
  district: string;
  state: string;
  postalCode: string;
  country: string;
  /** Ready-to-render single-line form. */
  formatted: string;
}

/** Map location for the embedded Wayanad map + directions (Req 9.4). */
export interface MapLocation {
  /** Latitude in decimal degrees (APPROXIMATE — confirm pin). */
  lat: number;
  /** Longitude in decimal degrees (APPROXIMATE — confirm pin). */
  lng: number;
  /** Human-readable query for a map embed / search. */
  embedQuery: string;
}

/** The full typed site/contact configuration. */
export interface SiteInfo {
  /** Homestay display name (Req 1.7). */
  name: string;
  /** Brand tagline. */
  tagline: string;
  /** Short one-line description for footer / meta. */
  shortDescription: string;
  /** Contact phone in human-readable international form (Req 9.1). PLACEHOLDER. */
  phone: string;
  /** Contact email (Req 9.1). PLACEHOLDER. */
  email: string;
  /** WhatsApp business number (Req 9.3 / 16.x). PLACEHOLDER. */
  whatsappNumber: string;
  /** Postal address — Padichira, Pulpally, Wayanad, Kerala. */
  address: PostalAddress;
  /** Map location for the embedded Wayanad map (Req 9.4). APPROXIMATE pin. */
  mapLocation: MapLocation;
}

/** Brand tagline, reused across the site. */
export const TAGLINE = 'EXPERIENCE SERENE SOLITUDE #KAIVALYAM' as const;

/**
 * The homestay postal address (Padichira, Pulpally, Wayanad, Kerala).
 *
 * ⚠️ The postal code is a PLACEHOLDER for the Pulpally area — confirm the exact
 * code and building line with the client.
 */
export const address: PostalAddress = {
  line1: 'Kaivalyam Homestay',
  village: 'Padichira',
  town: 'Pulpally',
  district: 'Wayanad',
  state: 'Kerala',
  postalCode: '673579', // PLACEHOLDER — confirm Pulpally-area PIN code.
  country: 'India',
  formatted:
    'Kaivalyam Homestay, Padichira, Pulpally, Wayanad, Kerala 673579, India',
};

/**
 * Map location for the embedded Wayanad map (Req 9.4).
 *
 * ⚠️ APPROXIMATE pin near Padichira/Pulpally — kept consistent with
 * `KAIVALYAM_DIRECTIONS_CONFIG` in the directions URL builder. Confirm the exact
 * property pin with the client before launch.
 */
export const mapLocation: MapLocation = {
  lat: 11.8126,
  lng: 76.1059,
  embedQuery: 'Kaivalyam Homestay, Padichira, Pulpally, Wayanad, Kerala, India',
};

/**
 * The site/contact info object. Contact values marked PLACEHOLDER are supplied
 * by the client before launch (see file header).
 */
export const siteInfo: SiteInfo = {
  name: 'Kaivalyam Homestay',
  tagline: TAGLINE,
  shortDescription:
    'A tranquil hill-village homestay in Padichira, Wayanad, Kerala — made for solitude, nature, and slow, long stays.',
  // Real reservations phone number.
  phone: '+91 80753 91908',
  // Real reservations email.
  email: 'Stay@kaivalyamhomestay.com',
  // PLACEHOLDER — kept in sync with the WhatsApp URL builder's placeholder.
  whatsappNumber: KAIVALYAM_WHATSAPP_NUMBER,
  address,
  mapLocation,
};
