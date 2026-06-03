/**
 * Typed content model — the single contract for the Kaivalyam Homestay site.
 *
 * Feature: kaivalyam-homestay-website (task 4.1)
 *
 * This module holds ONLY type definitions and canonical id constants. It has no
 * React, no side effects, and no vendor imports, so it compiles cleanly under
 * `strict` + `noUncheckedIndexedAccess` and can be imported by both:
 *   - `content/`  — to author the static collections (task 4.2), and
 *   - `domain/`   — to property-test pure logic (gallery/attractions grouping,
 *                   analytics aggregation, etc.) in isolation.
 *
 * Layering note: `structure.md` forbids `domain/` importing from `app/`,
 * `components/`, or `integration/` — but NOT from `content/`. Type-only imports
 * from this file are erased at compile time, so they introduce no runtime
 * dependency and no illegal layer coupling.
 *
 * Two biconditionals from the design's Correctness Properties are encoded in the
 * type system via discriminated unions (see `ImageAsset` and `AttractionItem`).
 */

// ---------------------------------------------------------------------------
// Canonical ordered id constants (single source of truth)
// ---------------------------------------------------------------------------
// These `readonly` tuples define the canonical ordering reused by later tasks
// (gallery grouping, attractions grouping, virtual-tour cursor, property tests).
// The corresponding union types are DERIVED from the tuples below so the ordered
// list and the union can never drift apart.

/** Image provenance. Drives the attribution biconditional (Property 6, Req 23.3). */
export const IMAGE_SOURCES = ['owned', 'ai-generated', 'wikimedia'] as const;

/** The 9 public gallery categories, in display order (Req 6.1). */
export const PHOTO_CATEGORY_IDS = [
  'night_ambiance',
  'exteriors',
  'outdoor_living',
  'garden_pathways',
  'interiors',
  'art_sculptures',
  'architecture',
  'library_reading',
  'play_area',
] as const;

/** The 11 public attraction categories, in display order (Req 7.1). */
export const ATTRACTION_CATEGORY_IDS = [
  'historic_sites_gardens',
  'dams_caverns_caves',
  'mountain_sites',
  'waterfalls_lookouts',
  'religious_sites',
  'nature_wildlife_areas',
  'wildlife_zoos_aquariums',
  'bodies_of_water',
  'ayurveda_spas',
  'specialty_gift_shops',
  'art_galleries_theme_parks',
] as const;

/** The 4 religious-sites subgroups, in display order (Req 7.5). */
export const RELIGIOUS_SUBGROUPS = ['hindu', 'jain', 'christian', 'muslim'] as const;

/** The two room ids (Req 4.1). */
export const ROOM_IDS = ['luxury-cottage', 'classic-room'] as const;

// ---------------------------------------------------------------------------
// Derived union types
// ---------------------------------------------------------------------------

export type ImageSource = (typeof IMAGE_SOURCES)[number];
export type PhotoCategoryId = (typeof PHOTO_CATEGORY_IDS)[number];
export type AttractionCategoryId = (typeof ATTRACTION_CATEGORY_IDS)[number];
export type ReligiousSubgroup = (typeof RELIGIOUS_SUBGROUPS)[number];
export type RoomId = (typeof ROOM_IDS)[number];

// ---------------------------------------------------------------------------
// Images & Attribution
// ---------------------------------------------------------------------------

/**
 * Attribution required by a Wikimedia source license (Req 23.1, 23.4).
 * `author`, `licenseName`, `licenseUrl`, and `sourceUrl` are all required and
 * must be non-empty (the build-time validator in task 5.2 enforces non-empty).
 */
export interface Attribution {
  author: string;
  /** e.g. "CC BY-SA 4.0" */
  licenseName: string;
  licenseUrl: string;
  sourceUrl: string;
  title?: string;
}

/**
 * Fields shared by every image regardless of source.
 *
 * Runtime invariant (documented; enforced by the asset-pipeline validator in
 * task 5.2 and by Property 4): `alt` MUST be a non-empty descriptive string
 * (Req 6.7, 7.6, 22.2). TypeScript can mark `alt` as required but cannot express
 * "non-empty" structurally, so the emptiness check is a build-time guard.
 *
 * `width`/`height` are REQUIRED to reserve layout space and keep CLS < 0.1
 * (Req 20.3).
 */
interface ImageAssetBase {
  id: string;
  /** Optimized asset path. */
  src: string;
  /** REQUIRED, non-empty descriptive text (runtime invariant — see above). */
  alt: string;
  /** REQUIRED intrinsic width in pixels (Req 20.3). */
  width: number;
  /** REQUIRED intrinsic height in pixels (Req 20.3). */
  height: number;
}

/**
 * Wikimedia-sourced image: attribution is REQUIRED.
 * One half of the attribution biconditional (Property 6).
 */
export interface WikimediaImageAsset extends ImageAssetBase {
  source: 'wikimedia';
  attribution: Attribution;
}

/**
 * Owned or AI-generated image: attribution is FORBIDDEN (Req 23.3).
 * The `attribution?: never` member makes it a type error to attach attribution
 * to a non-Wikimedia asset — the other half of the biconditional (Property 6).
 */
export interface UnattributedImageAsset extends ImageAssetBase {
  source: 'owned' | 'ai-generated';
  attribution?: never;
}

/**
 * An image asset. Modeled as a discriminated union on `source` so that
 * "attribution is present IF AND ONLY IF source === 'wikimedia'" (Property 6,
 * Req 23.1/23.3/23.4) is encoded in the type system: a `wikimedia` asset cannot
 * compile without `attribution`, and an `owned`/`ai-generated` asset cannot
 * compile WITH one.
 */
export type ImageAsset = WikimediaImageAsset | UnattributedImageAsset;

// ---------------------------------------------------------------------------
// Rooms (Req 4)
// ---------------------------------------------------------------------------

export interface Room {
  id: RoomId;
  name: string;
  summary: string;
  description: string;
  /** Req 4.4 */
  amenities: string[];
  /** Req 4.5 */
  photos: ImageAsset[];
  /** Resolves via `buildBookingUrl` (Req 4.6). */
  bookingHref: string;
}

// ---------------------------------------------------------------------------
// Facilities (Req 5)
// ---------------------------------------------------------------------------

export interface Facility {
  id: string;
  name: string;
  description: string;
  /** Lucide icon name (single icon family, Req 19.4). */
  icon: string;
  /** Optional photo shown instead of / alongside the icon (Req 5.2). */
  image?: ImageAsset;
}

// ---------------------------------------------------------------------------
// Photo Gallery Catalog (Req 6)
// ---------------------------------------------------------------------------

/**
 * A gallery photo: an {@link ImageAsset} tagged with its gallery category.
 *
 * Defined as an intersection (not `interface … extends ImageAsset`) because
 * `ImageAsset` is a discriminated union and an interface cannot extend a union.
 * The intersection distributes over the union, preserving the attribution
 * biconditional on each member.
 */
export type Photo = ImageAsset & { category: PhotoCategoryId };

/** A single gallery category and its ordered photos (Req 6.1). */
export interface PhotoCategory {
  id: PhotoCategoryId;
  label: string;
  photos: Photo[];
  /** Display/tour order. */
  order: number;
}

/** The full gallery catalog grouped into the 9 categories. */
export interface PhotoCatalog {
  categories: PhotoCategory[];
}

// ---------------------------------------------------------------------------
// Attractions (Req 7)
// ---------------------------------------------------------------------------

interface AttractionItemBase {
  id: string;
  /** Req 7.2 */
  name: string;
  /** Req 7.2, 7.6 */
  image: ImageAsset;
  /** Req 7.3 — optional external information website. */
  externalUrl?: string;
}

/**
 * An attraction in the Religious Sites category: a `subgroup` is REQUIRED
 * (Req 7.5). One half of the subgroup biconditional (Property 9).
 */
export interface ReligiousAttractionItem extends AttractionItemBase {
  category: 'religious_sites';
  subgroup: ReligiousSubgroup;
}

/**
 * An attraction in any non-religious category: `subgroup` is FORBIDDEN.
 * The `subgroup?: never` member is the other half of the biconditional
 * (Property 9).
 */
export interface NonReligiousAttractionItem extends AttractionItemBase {
  category: Exclude<AttractionCategoryId, 'religious_sites'>;
  subgroup?: never;
}

/**
 * A local attraction entry. Modeled as a discriminated union on `category` so
 * that "a religious subgroup is present IF AND ONLY IF category ===
 * 'religious_sites'" (Property 9, Req 7.5) is encoded in the type system.
 */
export type AttractionItem = ReligiousAttractionItem | NonReligiousAttractionItem;

// ---------------------------------------------------------------------------
// Reviews (Req 11)
// ---------------------------------------------------------------------------

export interface Review {
  id: string;
  /** Req 11.1 */
  reviewerName: string;
  /** Req 11.1 */
  text: string;
  /** Req 11.2 — displayed only when present. */
  rating?: number;
}

// ---------------------------------------------------------------------------
// Reach Us (Req 10)
// ---------------------------------------------------------------------------

/** Road-connectivity directions from an origin city (Req 10.1). */
export interface RoadRoute {
  origin: string;
  description: string;
  distanceKm?: number;
}

/** Nearest airport / railway distances (Req 10.2). */
export interface TransportHub {
  type: 'airport' | 'railway';
  name: string;
  distanceKm: number;
}

// ---------------------------------------------------------------------------
// First-Party Analytics & Booking records (Req 17)
// ---------------------------------------------------------------------------

/** A persisted analytics event row in the first-party store. */
export interface StoredEvent {
  id: string;
  sessionId: string;
  type: string;
  path?: string;
  /** Epoch milliseconds. */
  ts: number;
}

/** An analytics event emitted by the client and consumed by `aggregateReport`. */
export interface AnalyticsEvent {
  sessionId: string;
  type: 'page_view' | 'session_start';
  path?: string;
  /** Epoch milliseconds. */
  ts: number;
}

/** Per-session derived stats (Req 17.2, 17.3). */
export interface SessionStats {
  sessionId: string;
  pageCount: number;
  durationMs: number;
}

/** A single billed line item within a booking. */
export interface BillingLineItem {
  description: string;
  /** Minor-unit-agnostic numeric amount in `BillingDetails.currency`. */
  amount: number;
}

/** Billing details captured for a completed reservation (Req 17.5). */
export interface BillingDetails {
  /** Total charged amount. */
  amount: number;
  /** ISO 4217 currency code, e.g. "INR". */
  currency: string;
  lineItems: BillingLineItem[];
}

/** A completed-reservation record persisted by the booking webhook. */
export interface BookingRecord {
  bookingRef: string;
  billing: BillingDetails;
  /** Req 16.5 — gates WhatsApp notifications. */
  whatsappConsent: boolean;
  /** Epoch milliseconds. */
  createdAt: number;
}

/**
 * Aggregated booking-billing summary surfaced in the admin report.
 * `total` equals the sum of every included booking's `billing.amount`
 * (Property 15).
 */
export interface BillingSummary {
  /** Sum of `bookings[i].billing.amount`. */
  total: number;
  /** Reporting currency (e.g. "INR"). */
  currency: string;
  bookingCount: number;
  /** Every booking included in the summary. */
  bookings: BookingRecord[];
}

/** The aggregated analytics report shown to an Administrator (Req 17.1–17.6). */
export interface Report {
  totalPageViews: number;
  totalSessions: number;
  /** `totalPageViews / totalSessions`, or 0 when there are no sessions. */
  avgPagesPerSession: number;
  avgSessionDurationMs: number;
  /** Monotonic, never decreases (Req 17.4). */
  cumulativeVisits: number;
  bookingBilling: BillingSummary;
}

/** The cumulative-visits counter row in the first-party store (Req 17.4). */
export interface CounterRow {
  name: 'cumulative_visits';
  value: number;
}
