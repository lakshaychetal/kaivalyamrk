/**
 * Facilities page (`/facilities`) — on-property amenities (Req 5.1–5.3).
 * ----------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 11.4)
 *
 * Presents every on-property facility so a Visitor can evaluate the comfort and
 * amenities of a stay. The data is the typed `facilities` content collection
 * (authored in task 4.2), so the page can never drift from the source of truth:
 *
 *   • Req 5.1 — presents the nine facilities: home-cooked local cuisine, free
 *     Wi-Fi, free parking, children's play area, campfire & barbecue, a library
 *     with 1000+ books, a walking & trek area, outdoor dining, and a music
 *     system with speakers. The page renders EVERY entry in the collection, so
 *     the set is exactly what the content authors ship.
 *   • Req 5.2 — each facility shows a visual: its optional Property_Photo when
 *     present, otherwise its Lucide icon. Lucide is the single icon family
 *     (Req 19.4); the icon is decorative (paired with the visible facility
 *     name) so it is hidden from assistive tech (Req 22.5).
 *   • Req 5.3 — each facility shows its textual description.
 *
 * Presentation contract (Design System):
 *   • SEMANTIC tokens only (`bg-surface`, `text-on-surface`, `text-primary`, …)
 *     — never raw hex (Req 19.1–19.3).
 *   • Sequential heading outline: h1 (page) → h2 (section) → h3 (each facility
 *     via `CardTitle`); no level is skipped (Req 21.2).
 *   • Mobile-first responsive grid (1 → 2 → 3 columns), no horizontal scroll
 *     ≥375px (Req 18.2).
 *   • Any image is rendered through `ResponsiveImage` (declared dimensions,
 *     AVIF/WebP, lazy by default, branded error fallback — Req 20.1–20.4, 7.7).
 *
 * Server component — purely presentational, no client interactivity.
 *
 * Per-page metadata/OpenGraph/JSON-LD are wired centrally via `buildPageMeta`
 * in task 15.3; this file declares only a minimal, self-describing local title
 * and description in the meantime (Req 21.1).
 *
 * _Requirements: 5.1, 5.2, 5.3_
 */
import type { Metadata } from "next";
import {
  Baby,
  Flame,
  Footprints,
  LibraryBig,
  Music,
  SquareParking,
  Trees,
  Utensils,
  Wifi,
  type LucideIcon,
} from "lucide-react";

import { Card, CardTitle, CardBody } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/components/ui/cn";
import { ResponsiveImage } from "@/components/media";
import { facilities } from "@/content/facilities";
import type { Facility } from "@/content/types";
import { buildPageMeta } from "@/domain/seo/seo";

export const metadata: Metadata = buildPageMeta('facilities');

/**
 * Maps each facility's Lucide icon NAME (stored in the content collection as a
 * single-icon-family string, Req 19.4) to its Lucide React component. Keeping
 * the mapping here — rather than in the content — preserves the layering rule
 * that content stays free of React/vendor imports.
 */
const FACILITY_ICONS: Record<string, LucideIcon> = {
  utensils: Utensils,
  wifi: Wifi,
  "square-parking": SquareParking,
  baby: Baby,
  flame: Flame,
  "library-big": LibraryBig,
  footprints: Footprints,
  trees: Trees,
  music: Music,
};

/**
 * The visual for a facility (Req 5.2): its Property_Photo when one is attached,
 * otherwise its Lucide icon in a branded badge. The icon is decorative because
 * the facility NAME is shown alongside it as a visible label, so it is hidden
 * from assistive tech (Req 22.5); the photo carries its own non-empty `alt`.
 */
function FacilityVisual({ facility }: { facility: Facility }) {
  if (facility.image) {
    return (
      <ResponsiveImage
        image={facility.image}
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        className="aspect-[4/3] object-cover"
        wrapperClassName="w-full"
      />
    );
  }

  const glyph = FACILITY_ICONS[facility.icon];

  return (
    <span
      data-testid="facility-icon"
      className={cn(
        "inline-flex h-12 w-12 items-center justify-center rounded-full",
        "bg-surface-alt text-primary",
      )}
    >
      {glyph ? (
        <Icon icon={glyph} size="lg" />
      ) : (
        // Defensive fallback: an unmapped icon name still yields a visible mark
        // rather than nothing, keeping Req 5.2 satisfied for every facility.
        <span aria-hidden className="text-lg font-semibold">
          {facility.name.charAt(0)}
        </span>
      )}
    </span>
  );
}

/** A single facility entry: visual (Req 5.2), name, and description (Req 5.3). */
function FacilityCard({ facility }: { facility: Facility }) {
  const hasImage = Boolean(facility.image);

  return (
    <li className="h-full" data-testid={`facility-card-${facility.id}`}>
      <Card
        variant="facility"
        className="h-full"
        media={hasImage ? <FacilityVisual facility={facility} /> : undefined}
      >
        {!hasImage && (
          <div className="mb-1" data-testid="facility-visual">
            <FacilityVisual facility={facility} />
          </div>
        )}
        <CardTitle>{facility.name}</CardTitle>
        <CardBody>{facility.description}</CardBody>
      </Card>
    </li>
  );
}

export default function FacilitiesPage() {
  return (
    <article className="mx-auto w-full max-w-6xl px-4 py-12 md:px-6 md:py-16">
      <header className="mb-8 max-w-prose">
        <h1 className="font-serif text-3xl font-semibold text-secondary sm:text-4xl">
          Facilities
        </h1>
        <p className="mt-3 text-base text-on-surface-muted">
          Everything you need for an easy, unhurried stay — thoughtful comforts
          set against the quiet of the Wayanad hills, so you can settle in and
          slow right down.
        </p>
      </header>

      <section aria-labelledby="facilities-heading">
        <h2
          id="facilities-heading"
          className="font-serif text-2xl font-semibold text-secondary md:text-3xl"
        >
          On-property comforts
        </h2>

        <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {facilities.map((facility) => (
            <FacilityCard key={facility.id} facility={facility} />
          ))}
        </ul>
      </section>
    </article>
  );
}
