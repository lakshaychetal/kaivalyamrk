/**
 * SEO metadata builders — pure, deterministic, framework-free.
 * ---------------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 8.1)
 *
 * PURE logic only: no React, no Next.js `Metadata` import, no DOM, no I/O, no
 * side effects. Every function is a pure function of its inputs and returns
 * plain, JSON-serializable data that the App Router pages will spread into
 * Next's `Metadata`/JSON-LD during task 15.3.
 *
 * Layering note (`structure.md`): `domain/` may NOT import from `app/`,
 * `components/`, or `integration/`. Type-only imports from `content/types.ts`
 * are allowed (types are erased at compile time). This file currently needs no
 * runtime content, so it is fully self-contained.
 *
 * This module is the PROPERTY-TESTING target for:
 *   • Property 17 (page metadata complete + unique)        → task 8.2
 *   • Property 18 (heading hierarchy never skips levels)   → task 8.3
 *   • Property 19 (LodgingBusiness structured-data shape)  → task 8.4
 *
 * Requirements: 21.1 (unique title + meta description per page),
 *               21.2 (sequential heading hierarchy, no skipped levels),
 *               21.4 (LodgingBusiness structured data: name, location, contact),
 *               21.5 (social-sharing metadata: title, description, preview image).
 */

// ===========================================================================
// 0. Brand + site constants (single source of truth)
// ===========================================================================

/** The homestay brand name used across titles, OpenGraph, and JSON-LD. */
export const SITE_NAME = 'Kaivalyam Homestay' as const;

/** Brand tagline (Req: brand identity). */
export const SITE_TAGLINE = 'EXPERIENCE SERENE SOLITUDE #KAIVALYAM' as const;

/**
 * Canonical site origin. A PLACEHOLDER until the production domain is confirmed;
 * task 15.3 can wire this into Next's `metadataBase` so relative OG image paths
 * resolve to absolute URLs. Kept here as the single configurable origin.
 */
export const SITE_URL = 'https://www.kaivalyamhomestay.com' as const;

// ===========================================================================
// 1. Page registry — the SINGLE SOURCE OF TRUTH for per-page metadata
// ===========================================================================
//
// Title uniqueness (Property 17) is GUARANTEED structurally: titles live in one
// hand-authored table, and `assertUniquePageTitles()` runs once at module load
// to reject any accidental duplicate. Because every title is authored here and
// `buildPageMeta` only ever reads this table, the set of titles is closed and
// pairwise-unique by construction — which is exactly what task 8.2 verifies.

/**
 * Every page key on the site, in canonical order. Drives `buildPageMeta`,
 * the registry, and the page-set iteration in the Property 17 test (task 8.2).
 */
export const PAGE_KEYS = [
  'home',
  'about',
  'rooms',
  'facilities',
  'gallery',
  'attractions',
  'cuisine',
  'contact',
  'reach-us',
  'photo-credits',
  'book',
] as const;

/** A discriminated key identifying one site page. */
export type PageKey = (typeof PAGE_KEYS)[number];

/** An OpenGraph / social preview image (Req 21.5). */
export interface OpenGraphImage {
  /** Image URL or site-relative path (resolved to absolute via metadataBase). */
  url: string;
  /** Non-empty descriptive alt text for the preview image. */
  alt: string;
  /** Recommended OG image width in pixels. */
  width: number;
  /** Recommended OG image height in pixels. */
  height: number;
}

/**
 * The canonical default social-preview image: a warm night-ambiance hero of the
 * property (the brand's signature mood). Pages that do not declare their own
 * `ogImage` inherit this, so EVERY page still ships a preview image (Req 21.5).
 * Sized to the 1200×630 OpenGraph recommendation.
 */
export const DEFAULT_OG_IMAGE: OpenGraphImage = {
  url: '/og/kaivalyam-night-ambiance.jpg',
  alt: 'Kaivalyam Homestay aglow with warm lantern light against the Wayanad dusk',
  width: 1200,
  height: 630,
} as const;

/**
 * A raw registry entry: the authored source data for one page. `ogImage` is
 * optional — when omitted the page inherits {@link DEFAULT_OG_IMAGE}.
 */
interface PageMetaSource {
  /** In-site route path, e.g. `'/'`, `'/rooms'`. */
  path: string;
  /** Unique, non-empty `<title>` (Req 21.1). */
  title: string;
  /** Non-empty meta description (Req 21.1). */
  description: string;
  /** Optional OpenGraph title override (defaults to {@link title}). */
  ogTitle?: string;
  /** Optional OpenGraph description override (defaults to {@link description}). */
  ogDescription?: string;
  /** Optional preview-image override (defaults to {@link DEFAULT_OG_IMAGE}). */
  ogImage?: OpenGraphImage;
}

/**
 * The page-metadata table. Titles are intentionally distinct per page so the
 * uniqueness guarantee of Property 17 holds by construction. Descriptions are
 * all non-empty and page-specific.
 */
export const PAGE_META_REGISTRY: Readonly<Record<PageKey, PageMetaSource>> = {
  home: {
    path: '/',
    title: 'Kaivalyam Homestay — Experience Serene Solitude in Wayanad',
    description:
      'A hill-village homestay in Padichira, Wayanad, Kerala. Wake to misted hills, birdsong, and the calm of true seclusion — Kaivalyam means liberation of the soul.',
  },
  about: {
    path: '/about',
    title: 'About Kaivalyam — Our Story & Philosophy | Kaivalyam Homestay',
    description:
      'Discover the story behind Kaivalyam Homestay: a tranquil retreat near Pulpally, Wayanad, built around nature immersion, slow living, and warm hill-village hospitality.',
  },
  rooms: {
    path: '/rooms',
    title: 'Rooms & Cottages — Luxury Cottage & Classic Room | Kaivalyam Homestay',
    description:
      'Choose between the duplex Luxury Cottage with roof balcony, gazebo, and indoor play area, or the cozy, affordable Classic Room — both wrapped in Wayanad calm.',
  },
  facilities: {
    path: '/facilities',
    title: 'Facilities & Amenities | Kaivalyam Homestay',
    description:
      'Explore the amenities at Kaivalyam Homestay — private sit-outs, garden pathways, a reading library, play areas, and more, all designed for a restful, unhurried stay.',
  },
  gallery: {
    path: '/gallery',
    title: 'Photo Gallery & Virtual Tour | Kaivalyam Homestay',
    description:
      'Browse night-ambiance, exteriors, interiors, gardens, and architecture, or take the virtual tour of Kaivalyam Homestay in Padichira, Wayanad.',
  },
  attractions: {
    path: '/attractions',
    title: 'Wayanad Attractions Near Kaivalyam Homestay',
    description:
      'Waterfalls, peaks, dams, caves, wildlife sanctuaries, and heritage temples — discover the best of Wayanad within easy reach of Kaivalyam Homestay.',
  },
  cuisine: {
    path: '/cuisine',
    title: 'Authentic Malayali Cuisine & Dining | Kaivalyam Homestay',
    description:
      'Savour home-cooked Malayali vegetarian and non-vegetarian fare and relaxed outdoor dining experiences, prepared with local Wayanad produce at Kaivalyam Homestay.',
  },
  contact: {
    path: '/contact',
    title: 'Contact Us & Get Directions | Kaivalyam Homestay',
    description:
      'Reach Kaivalyam Homestay by phone, email, or WhatsApp, find us on the map, and get directions to Padichira, Pulpally, Wayanad, Kerala.',
  },
  'reach-us': {
    path: '/reach-us',
    title: 'Reach Us — Travel Routes & Distances | Kaivalyam Homestay',
    description:
      'Plan your journey to Kaivalyam Homestay: road routes from major cities, nearest airports and railway stations, and the Padichira–Pulpally locale in Wayanad.',
  },
  'photo-credits': {
    path: '/photo-credits',
    title: 'Photo Credits & Image Attribution | Kaivalyam Homestay',
    description:
      'Attribution and licensing for the Wikimedia-sourced attraction photography featured across the Kaivalyam Homestay website.',
  },
  book: {
    path: '/book',
    title: 'Book Your Stay | Kaivalyam Homestay',
    description:
      'Check availability and reserve the Luxury Cottage or Classic Room at Kaivalyam Homestay, Wayanad, with secure online booking and payment.',
  },
};

// ===========================================================================
// 2. buildPageMeta — per-page title / description / OpenGraph (Req 21.1, 21.5)
// ===========================================================================

/** OpenGraph metadata block produced by {@link buildPageMeta} (Req 21.5). */
export interface OpenGraphMeta {
  title: string;
  description: string;
  /** Site-relative page path (resolved to absolute via metadataBase later). */
  url: string;
  /** OpenGraph object type — a marketing site page. */
  type: 'website';
  /** The brand site name for `og:site_name`. */
  siteName: string;
  /** At least one preview image (Req 21.5). */
  images: OpenGraphImage[];
}

/**
 * The page metadata object returned by {@link buildPageMeta}. Shaped so an App
 * Router page can spread it straight into Next's `Metadata` (task 15.3):
 *   `export const metadata = buildPageMeta('rooms');`
 */
export interface PageMeta {
  /** Unique, non-empty `<title>` (Req 21.1). */
  title: string;
  /** Non-empty meta description (Req 21.1). */
  description: string;
  /** Social-sharing metadata: title, description, preview image (Req 21.5). */
  openGraph: OpenGraphMeta;
}

/**
 * Build the complete metadata for one page (Req 21.1, 21.5).
 *
 * Pure and deterministic: same `page` → identical object every call. Reads only
 * the {@link PAGE_META_REGISTRY}, so:
 *   • `title` and `description` are always non-empty (authored that way), and
 *   • `title` is unique across the page set (guaranteed by the registry +
 *     {@link assertUniquePageTitles}).
 *
 * OpenGraph `title`/`description` default to the page title/description but may
 * be overridden per page; `images` always contains at least one preview image,
 * defaulting to {@link DEFAULT_OG_IMAGE}.
 *
 * @param page A {@link PageKey} identifying the page.
 * @returns A {@link PageMeta} ready to spread into Next `Metadata`.
 */
export function buildPageMeta(page: PageKey): PageMeta {
  const source = PAGE_META_REGISTRY[page];
  const ogImage = source.ogImage ?? DEFAULT_OG_IMAGE;

  return {
    title: source.title,
    description: source.description,
    openGraph: {
      title: source.ogTitle ?? source.title,
      description: source.ogDescription ?? source.description,
      url: source.path,
      type: 'website',
      siteName: SITE_NAME,
      // Return a fresh array + image object so callers can't mutate the registry.
      images: [{ ...ogImage }],
    },
  };
}

/**
 * Build metadata for every page, keyed by {@link PageKey}, in {@link PAGE_KEYS}
 * order. Convenience for the Property 17 test (task 8.2) and for any build step
 * that needs the full set (e.g. sitemap generation in task 15.x).
 */
export function buildAllPageMeta(): Record<PageKey, PageMeta> {
  return Object.fromEntries(
    PAGE_KEYS.map((key) => [key, buildPageMeta(key)]),
  ) as Record<PageKey, PageMeta>;
}

/**
 * Assert that every page title in the registry is pairwise-unique (Req 21.1,
 * Property 17). Runs once at module load so a duplicate title is a hard,
 * fail-fast error rather than a silent SEO regression.
 *
 * @throws {Error} listing the offending title if any two pages share a title.
 */
export function assertUniquePageTitles(): void {
  const seen = new Map<string, PageKey>();
  for (const key of PAGE_KEYS) {
    const { title } = PAGE_META_REGISTRY[key];
    const prior = seen.get(title);
    if (prior !== undefined) {
      throw new Error(
        `Duplicate page title "${title}" used by both "${prior}" and "${key}". ` +
          'Every page MUST have a unique <title> (Req 21.1).',
      );
    }
    seen.set(title, key);
  }
}

// Fail fast at import time if the registry ever drifts into a duplicate title.
assertUniquePageTitles();

// ===========================================================================
// 3. Heading-outline helper (Req 21.2 — Property 18)
// ===========================================================================

/** Lowest and highest valid HTML heading levels (`h1`..`h6`). */
const MIN_HEADING_LEVEL = 1;
const MAX_HEADING_LEVEL = 6;

/** The detailed result of {@link validateHeadingOutline}. */
export interface HeadingOutlineResult {
  /** `true` iff the level sequence is a valid, non-skipping outline. */
  valid: boolean;
  /** Index of the first violating heading, or `-1` when {@link valid}. */
  violationIndex: number;
  /** Human-readable explanation of the first violation, when invalid. */
  reason?: string;
}

/**
 * Validate a sequence of heading levels against the no-skip rule (Req 21.2,
 * Property 18). A valid outline:
 *
 *   1. is NON-EMPTY (a page must have a heading to begin with),
 *   2. uses only integer levels in `[1, 6]` (`h1`..`h6`),
 *   3. BEGINS at `h1` (`levels[0] === 1`), and
 *   4. NEVER INCREASES by more than one level between consecutive headings
 *      (`levels[i + 1] - levels[i] <= 1`). Decreases of any size are allowed —
 *      closing several nested sections at once is fine.
 *
 * Pure and deterministic; reports the index + reason of the FIRST violation so
 * callers (and the task 8.3 property test) can pinpoint failures.
 *
 * @param levels Ordered heading levels as they appear in the document.
 * @returns A {@link HeadingOutlineResult}.
 */
export function validateHeadingOutline(
  levels: readonly number[],
): HeadingOutlineResult {
  if (levels.length === 0) {
    return {
      valid: false,
      violationIndex: -1,
      reason: 'Heading outline is empty; a page must begin with an h1.',
    };
  }

  const first = levels[0] as number;

  // Rule 2 (first heading) + Rule 3 (begins at h1).
  if (!Number.isInteger(first) || first < MIN_HEADING_LEVEL || first > MAX_HEADING_LEVEL) {
    return {
      valid: false,
      violationIndex: 0,
      reason: `Heading level ${first} is out of range; must be an integer in [${MIN_HEADING_LEVEL}, ${MAX_HEADING_LEVEL}].`,
    };
  }
  if (first !== MIN_HEADING_LEVEL) {
    return {
      valid: false,
      violationIndex: 0,
      reason: `Heading outline must begin at h1, but begins at h${first}.`,
    };
  }

  for (let i = 1; i < levels.length; i++) {
    const level = levels[i] as number;

    if (!Number.isInteger(level) || level < MIN_HEADING_LEVEL || level > MAX_HEADING_LEVEL) {
      return {
        valid: false,
        violationIndex: i,
        reason: `Heading level ${level} at index ${i} is out of range; must be an integer in [${MIN_HEADING_LEVEL}, ${MAX_HEADING_LEVEL}].`,
      };
    }

    const previous = levels[i - 1] as number;
    if (level - previous > 1) {
      return {
        valid: false,
        violationIndex: i,
        reason: `Heading level jumps from h${previous} to h${level} at index ${i}, skipping a level.`,
      };
    }
  }

  return { valid: true, violationIndex: -1 };
}

/**
 * Boolean convenience over {@link validateHeadingOutline} for call sites that
 * only need a yes/no answer (e.g. an assertion in a page component).
 */
export function isValidHeadingOutline(levels: readonly number[]): boolean {
  return validateHeadingOutline(levels).valid;
}

// ===========================================================================
// 4. LodgingBusiness JSON-LD builder (Req 21.4 — Property 19)
// ===========================================================================

/** schema.org PostalAddress inputs for the JSON-LD address block. */
export interface PostalAddressConfig {
  streetAddress: string;
  /** City / locality, e.g. `Pulpally`. */
  addressLocality: string;
  /** State / region, e.g. `Kerala`. */
  addressRegion: string;
  postalCode?: string;
  /** Country (name or ISO code), e.g. `India` / `IN`. */
  addressCountry: string;
}

/** Optional geo-coordinates for the JSON-LD `geo` block. */
export interface GeoConfig {
  latitude: number;
  longitude: number;
}

/**
 * Configuration for {@link LodgingBusinessJsonLd}. `name`, `address`, and
 * `telephone` are REQUIRED — they are the name / location / contact details
 * mandated by Req 21.4.
 */
export interface LodgingBusinessConfig {
  /** Business name (Req 21.4). */
  name: string;
  /** Postal address — the location (Req 21.4). */
  address: PostalAddressConfig;
  /** Primary contact phone in international form (Req 21.4). */
  telephone: string;
  /** Optional contact email. */
  email?: string;
  /** Optional canonical website URL. */
  url?: string;
  /** Optional short description of the business. */
  description?: string;
  /** Optional image URL(s) representing the business. */
  image?: string | string[];
  /** Optional price-range hint, e.g. `$$`. */
  priceRange?: string;
  /** Optional precise coordinates. */
  geo?: GeoConfig;
  /** Optional social / external profile URLs. */
  sameAs?: string[];
}

/** A schema.org PostalAddress node. */
export interface PostalAddressJsonLd {
  '@type': 'PostalAddress';
  streetAddress: string;
  addressLocality: string;
  addressRegion: string;
  postalCode?: string;
  addressCountry: string;
}

/** A schema.org GeoCoordinates node. */
export interface GeoCoordinatesJsonLd {
  '@type': 'GeoCoordinates';
  latitude: number;
  longitude: number;
}

/**
 * A well-formed, JSON-serializable schema.org `LodgingBusiness` node. Carries
 * `@context`/`@type` and the required name / location / contact fields
 * (Req 21.4).
 */
export interface LodgingBusinessJsonLdObject {
  '@context': 'https://schema.org';
  '@type': 'LodgingBusiness';
  name: string;
  address: PostalAddressJsonLd;
  telephone: string;
  description?: string;
  url?: string;
  email?: string;
  image?: string | string[];
  priceRange?: string;
  geo?: GeoCoordinatesJsonLd;
  sameAs?: string[];
}

/**
 * Build a schema.org `LodgingBusiness` JSON-LD object (Req 21.4, Property 19).
 *
 * Pure and deterministic. The result is a plain object literal with no
 * `undefined` members (optional fields are OMITTED, not set to `undefined`) so
 * `JSON.stringify` produces clean, valid JSON-LD for a `<script type=
 * "application/ld+json">` tag in task 15.3. Always includes `@context`,
 * `@type: 'LodgingBusiness'`, the business `name`, a structured `address`
 * (location), and `telephone` (contact).
 *
 * @param config Business details; defaults to {@link KAIVALYAM_BUSINESS} when omitted.
 * @returns A {@link LodgingBusinessJsonLdObject}.
 */
export function LodgingBusinessJsonLd(
  config: LodgingBusinessConfig = KAIVALYAM_BUSINESS,
): LodgingBusinessJsonLdObject {
  const address: PostalAddressJsonLd = {
    '@type': 'PostalAddress',
    streetAddress: config.address.streetAddress,
    addressLocality: config.address.addressLocality,
    addressRegion: config.address.addressRegion,
    addressCountry: config.address.addressCountry,
  };
  if (config.address.postalCode !== undefined) {
    address.postalCode = config.address.postalCode;
  }

  const jsonLd: LodgingBusinessJsonLdObject = {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name: config.name,
    address,
    telephone: config.telephone,
  };

  // Attach optional fields only when present, so the JSON stays clean.
  if (config.description !== undefined) jsonLd.description = config.description;
  if (config.url !== undefined) jsonLd.url = config.url;
  if (config.email !== undefined) jsonLd.email = config.email;
  if (config.image !== undefined) jsonLd.image = config.image;
  if (config.priceRange !== undefined) jsonLd.priceRange = config.priceRange;
  if (config.geo !== undefined) {
    jsonLd.geo = {
      '@type': 'GeoCoordinates',
      latitude: config.geo.latitude,
      longitude: config.geo.longitude,
    };
  }
  if (config.sameAs !== undefined) jsonLd.sameAs = [...config.sameAs];

  return jsonLd;
}

/**
 * The default Kaivalyam Homestay business configuration used by
 * {@link LodgingBusinessJsonLd}. Location and contact details mirror the
 * Padichira / Pulpally / Wayanad locale used by the directions and WhatsApp
 * builders. The phone number and postal code are PLACEHOLDERS to confirm before
 * launch (the WhatsApp number lives in `domain/integration-urls/whatsapp-url.ts`).
 */
export const KAIVALYAM_BUSINESS: LodgingBusinessConfig = {
  name: SITE_NAME,
  description:
    'A hill-village homestay in Padichira, Wayanad, Kerala — a tranquil retreat for nature immersion and serene solitude.',
  url: SITE_URL,
  telephone: '+91 80753 91908',
  email: 'stay@kaivalyamhomestay.com',
  image: [DEFAULT_OG_IMAGE.url],
  priceRange: '$$',
  address: {
    streetAddress: 'Padichira',
    addressLocality: 'Pulpally',
    addressRegion: 'Kerala',
    postalCode: '673579',
    addressCountry: 'India',
  },
  geo: {
    latitude: 11.8482072,
    longitude: 76.1847414,
  },
};
