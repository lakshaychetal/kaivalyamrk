/**
 * Home page (`/`) — the immersive landing experience for Kaivalyam Homestay.
 * ---------------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 11.1)
 *
 * Builds the full Home page in section order:
 *
 *   1. Hero (Req 2.1, 2.2, 2.8) — full-viewport night_ambiance photo with a
 *      dark scrim ensuring ≥4.5:1 text contrast, the brand tagline, and the
 *      primary Book Now CTA.
 *   2. Philosophy intro (Req 2.3) — "Kaivalyam means liberation…" with a link
 *      to /about.
 *   3. Room type summary (Req 2.4) — Luxury Cottage + Classic Room cards with
 *      a "View Rooms" link to /rooms.
 *   4. Facilities summary (Req 2.5) — 5 key facilities with icons and a "See
 *      All Facilities" link to /facilities.
 *   5. Reviews preview (Req 2.6) — <ReviewsSection viewAllHref="/reviews" />.
 *   6. WhatsApp entry point (Req 2.7, 16.2) — <WhatsAppEntryPoint />.
 *
 * Design / UX contract:
 *   • SEMANTIC tokens only — bg-surface, bg-surface-alt, text-secondary,
 *     text-on-surface, text-primary, etc. No raw hex.
 *   • Lucide is the single icon family (Req 19.4).
 *   • Sequential heading outline: h1 (hero tagline) → h2 (each section) → h3
 *     (room/facility card titles via CardTitle). No levels skipped (Req 21.2).
 *   • Mobile-first responsive layout; no horizontal scroll ≥375px (Req 18.2).
 *   • Hero: 100vh on desktop, min-60vh on mobile.
 *   • All motion gated behind motion-safe (Req 22.7).
 *   • Priority image on the hero (not lazy-loaded, Req 20.2).
 *   • Alt text on every image (Req 22.2).
 *
 * Server component — purely presentational, no client state.
 *
 * Per-page metadata/OpenGraph/JSON-LD are wired centrally via buildPageMeta in
 * task 15.3; this file declares a minimal local Metadata export in the meantime
 * (Req 21.1).
 *
 * _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 16.2_
 */
import type { Metadata } from "next";
import Link from "next/link";
import { buildPageMeta } from "@/domain/seo/seo";
import {
  ArrowRight,
  Baby,
  Flame,
  Footprints,
  LibraryBig,
  Utensils,
  type LucideIcon,
} from "lucide-react";

import { BookNowButton } from "@/components/ui/BookNowButton";
import { Card, CardTitle, CardBody } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/components/ui/cn";
import { focusRing } from "@/components/ui/buttonStyles";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { ReviewsSection } from "@/components/sections/ReviewsSection";
import { VideoTour } from "@/components/sections/VideoTour";
import { WhatsAppEntryPoint } from "@/integration/whatsapp/WhatsAppEntryPoint";
import { rooms } from "@/content/rooms";
import { facilities } from "@/content/facilities";
import { reviews } from "@/content/reviews";
import { TAGLINE } from "@/content/site";
import { photoCatalog } from "@/content/generated/photo-catalog";

// ---------------------------------------------------------------------------
// Metadata (Req 21.1, 21.5) — full wiring via buildPageMeta (task 15.3).
// ---------------------------------------------------------------------------

export const metadata: Metadata = buildPageMeta('home');

// ---------------------------------------------------------------------------
// Hero photo — strongest night_ambiance image (building_night_hero.jpg)
// ---------------------------------------------------------------------------

const nightAmbianceCategory = photoCatalog.categories.find(
  (c) => c.id === "night_ambiance",
);

/**
 * Pick the primary hero photo: building_night_hero is the strongest
 * architectural night shot. Fall back to the first night_ambiance photo if
 * the specific id is not found (defensive, catalog is generated).
 */
const heroPhoto =
  nightAmbianceCategory?.photos.find(
    (p) => p.id === "night_ambiance__building_night_hero",
  ) ??
  nightAmbianceCategory?.photos.find(
    (p) => p.id === "night_ambiance__full_property_night_overview",
  ) ??
  nightAmbianceCategory?.photos[0];

// ---------------------------------------------------------------------------
// Facilities summary — 5 key facilities shown on the Home page (Req 2.5)
// ---------------------------------------------------------------------------

const HOME_FACILITY_IDS = [
  "home-cooked-cuisine",
  "library",
  "campfire-barbecue",
  "walking-trek-area",
  "childrens-play-area",
] as const;

const homeFacilities = HOME_FACILITY_IDS.map((id) =>
  facilities.find((f) => f.id === id),
).filter((f): f is NonNullable<typeof f> => f !== undefined);

/**
 * Maps each facility's Lucide icon name to its Lucide component. Kept in the
 * presentation layer so content stays free of React/vendor imports.
 */
const FACILITY_ICONS: Record<string, LucideIcon> = {
  utensils: Utensils,
  "library-big": LibraryBig,
  flame: Flame,
  footprints: Footprints,
  baby: Baby,
};

// ---------------------------------------------------------------------------
// Section link helper — shared "See all" / "View" link style
// ---------------------------------------------------------------------------

function SectionLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-lg px-1 py-2",
        "font-medium text-primary underline-offset-4 hover:underline",
        "motion-safe:transition-colors motion-safe:duration-200",
        focusRing,
      )}
    >
      {children}
      <Icon icon={ArrowRight} size="sm" />
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Hero Section (Req 2.1, 2.2, 2.8)
// ---------------------------------------------------------------------------

function HeroSection() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative flex min-h-[60vh] w-full items-center justify-center overflow-hidden md:min-h-screen"
    >
      {/* Hero image — priority (not lazy-loaded), full-bleed cover (Req 2.1, 20.2) */}
      {heroPhoto ? (
        <div className="absolute inset-0">
          <ResponsiveImage
            image={heroPhoto}
            priority
            fill
            sizes="100vw"
            className="object-cover"
            wrapperClassName="absolute inset-0 h-full w-full"
          />
        </div>
      ) : (
        /* Fallback surface when the catalog is empty (defensive) */
        <div className="absolute inset-0 bg-secondary" aria-hidden="true" />
      )}

      {/*
       * Dark scrim overlay — ensures ≥4.5:1 contrast for text overlaid on the
       * hero image (Req 2.8). Uses a gradient from near-black at the bottom to
       * a semi-transparent dark at the top so the image remains visible while
       * the text area is fully legible.
       */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/20"
      />

      {/* Hero content — centered, above the scrim */}
      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-4 py-16 text-center md:py-24">
        {/* Eyebrow label */}
        <p className="text-sm font-medium uppercase tracking-widest text-white/80">
          Padichira · Wayanad · Kerala
        </p>

        {/*
         * h1 — the brand tagline (Req 2.2). White text on the dark scrim
         * achieves well above 4.5:1 contrast (Req 2.8).
         */}
        <h1
          id="hero-heading"
          className="font-serif text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl lg:text-6xl"
        >
          {TAGLINE}
        </h1>

        <p className="max-w-md text-base leading-relaxed text-white/90 sm:text-lg">
          A tranquil hill-village homestay where solitude, nature, and warm
          Malayali hospitality come together.
        </p>

        {/* Primary Book Now CTA (Req 2.2) — the single primary-CTA style */}
        <BookNowButton size="lg" />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Philosophy Intro Section (Req 2.3)
// ---------------------------------------------------------------------------

function PhilosophySection() {
  return (
    <section
      aria-labelledby="philosophy-heading"
      className="bg-surface-alt"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-12 md:px-6 md:py-16">
        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-12">
          {/* Illustrative image — fills the otherwise-empty left column on desktop. */}
          <div className="order-1">
            <ResponsiveImage
              image={{
                id: "what-is-kaivalyam",
                src: "/images/sections/what-is-kaivalyam.jpg",
                alt: "A serene corner of Kaivalyam Homestay in the Wayanad hills",
                width: 285,
                height: 187,
              }}
              fill
              sizes="(min-width: 768px) 45vw, 100vw"
              className="object-cover"
              wrapperClassName="aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border shadow-sm"
            />
          </div>

          {/* Philosophy copy. */}
          <div className="order-2">
            <h2
              id="philosophy-heading"
              className="font-serif text-2xl font-semibold text-secondary md:text-3xl"
            >
              What is Kaivalyam?
            </h2>
            <div className="mt-4 flex flex-col gap-4">
              <p className="max-w-prose text-base leading-relaxed text-on-surface">
                <strong className="font-semibold text-secondary">
                  Kaivalyam
                </strong>{" "}
                means liberation and solitude of the soul — a state of pure,
                undisturbed stillness. It is the name we chose because it is
                exactly what this place offers: a corner of the Wayanad hills
                where the noise of the world falls away and you are left with
                birdsong, pure unpolluted air, and time that is genuinely your
                own.
              </p>
              <p className="max-w-prose text-base leading-relaxed text-on-surface">
                Nestled in Padichira, about 10 km from Pulpally town, Kaivalyam
                is a homestay built for long, unhurried stays. Whether you come
                for a week or a month, you will find the same hospitable
                welcome, home-cooked Malayali meals, and the quiet that the name
                promises.
              </p>
            </div>
            <div className="mt-6">
              <SectionLink href="/about">Discover our story</SectionLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Room Type Summary (Req 2.4)
// ---------------------------------------------------------------------------

function RoomsSection() {
  return (
    <section
      aria-labelledby="rooms-heading"
      className="bg-surface"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-12 md:px-6 md:py-16">
        <h2
          id="rooms-heading"
          className="font-serif text-2xl font-semibold text-secondary md:text-3xl"
        >
          Where You Will Stay
        </h2>
        <p className="mt-3 max-w-prose text-base text-on-surface-muted">
          Two thoughtfully designed spaces — one for families who want room to
          breathe, one for guests who want simplicity done well.
        </p>

        <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {rooms.map((room) => (
            <li key={room.id} className="h-full">
              <Card variant="room" className="h-full" interactive>
                <CardTitle>{room.name}</CardTitle>
                <CardBody className="mt-2">{room.summary}</CardBody>
                {/* Key amenities preview */}
                <ul className="mt-3 flex flex-wrap gap-2" aria-label={`Key amenities for ${room.name}`}>
                  {room.amenities.slice(0, 3).map((amenity) => (
                    <li
                      key={amenity}
                      className="rounded-full bg-surface-alt px-3 py-1 text-xs font-medium text-on-surface-muted"
                    >
                      {amenity}
                    </li>
                  ))}
                </ul>
              </Card>
            </li>
          ))}
        </ul>

        <div className="mt-8">
          <SectionLink href="/rooms">View all rooms</SectionLink>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Facilities Summary (Req 2.5)
// ---------------------------------------------------------------------------

function FacilitiesSection() {
  return (
    <section
      aria-labelledby="facilities-heading"
      className="bg-surface-alt"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-12 md:px-6 md:py-16">
        <h2
          id="facilities-heading"
          className="font-serif text-2xl font-semibold text-secondary md:text-3xl"
        >
          On-Property Comforts
        </h2>
        <p className="mt-3 max-w-prose text-base text-on-surface-muted">
          Everything you need for an easy, unhurried stay — thoughtful comforts
          set against the quiet of the Wayanad hills.
        </p>

        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {homeFacilities.map((facility) => {
            const glyph = FACILITY_ICONS[facility.icon];
            return (
              <li key={facility.id}>
                <Card variant="facility" className="h-full text-center">
                  <span
                    className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface-alt text-primary"
                    aria-hidden="true"
                  >
                    {glyph ? (
                      <Icon icon={glyph} size="lg" />
                    ) : (
                      <span className="text-lg font-semibold">
                        {facility.name.charAt(0)}
                      </span>
                    )}
                  </span>
                  <CardTitle className="mt-3 text-base">
                    {facility.name}
                  </CardTitle>
                </Card>
              </li>
            );
          })}
        </ul>

        <div className="mt-8">
          <SectionLink href="/facilities">See all facilities</SectionLink>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// WhatsApp CTA Section (Req 2.7, 16.2)
// ---------------------------------------------------------------------------

function WhatsAppSection() {
  return (
    <section
      aria-labelledby="whatsapp-heading"
      className="bg-surface-alt"
    >
      <div className="mx-auto w-full max-w-4xl px-4 py-12 text-center md:px-6 md:py-16">
        <h2
          id="whatsapp-heading"
          className="font-serif text-2xl font-semibold text-secondary md:text-3xl"
        >
          Have Questions? Chat With Us
        </h2>
        <p className="mx-auto mt-3 max-w-prose text-base text-on-surface-muted">
          We are here to help you plan your stay. Reach us directly on WhatsApp
          for availability, directions, or anything else you need.
        </p>
        <div className="mt-6 flex justify-center">
          <WhatsAppEntryPoint
            size="lg"
            message="Hi Kaivalyam, I'd like to know more about your homestay."
          />
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Home page
// ---------------------------------------------------------------------------

export default function HomePage() {
  return (
    <>
      {/* 1. Hero — full-viewport night_ambiance photo + tagline + Book Now CTA */}
      <HeroSection />

      {/* 2. Philosophy intro — "Kaivalyam means liberation…" → /about */}
      <PhilosophySection />

      {/* 3. Room type summary → /rooms */}
      <RoomsSection />

      {/* 4. Facilities summary → /facilities */}
      <FacilitiesSection />

      {/*
       * 5. Video Tour — immersive property walk-through with Indian flute music.
       */}
      <VideoTour headingLevel={2} />

      {/*
       * 6. Reviews preview (Req 2.6) — reusable ReviewsSection showing ALL
       *    testimonials (mobile carousel slides through every one) plus a
       *    "Read all reviews" link to /reviews (Req 11.3).
       */}
      <ReviewsSection
        reviews={reviews}
        viewAllHref="/reviews"
        headingLevel={2}
        id="reviews-preview"
        className="bg-surface-alt"
      />

      {/* 7. WhatsApp entry point (Req 2.7, 16.2) */}
      <WhatsAppSection />
    </>
  );
}
