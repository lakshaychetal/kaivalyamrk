/**
 * Cuisine page (`/cuisine`) — the homestay's dining offering (Req 8.1–8.3).
 * ---------------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 11.5)
 *
 * Presents what guests can expect to eat at Kaivalyam, driven entirely by the
 * typed content collection (`@/content/cuisine`) and the generated photo
 * catalog (`@/content/generated`) — no copy or imagery is fabricated here:
 *
 *   • Req 8.1 — the authentic Malayali cuisine offering, including BOTH
 *               vegetarian and non-vegetarian options (the `malayaliCuisine`
 *               prose section).
 *   • Req 8.2 — the home-cooked and outdoor dining experiences available on the
 *               property (the `diningExperiences` cards).
 *   • Req 8.3 — Property_Photo assets that illustrate the dining experience,
 *               rendered through `ResponsiveImage` with their descriptive alt
 *               text. These are the `outdoor_living` gallery photos (the
 *               property's open-air dining areas, garden tables, and gazebo).
 *
 * Presentation contract (Design System):
 *   • SEMANTIC tokens only (`bg-surface`, `text-on-surface`, `text-secondary`,
 *     …) — never raw hex.
 *   • Lucide is the single icon family, rendered through the DS `Icon`
 *     (Req 19.4). The content's string icon names are mapped to Lucide glyphs.
 *   • Sequential heading hierarchy (one H1, then H2 per section) — no skipped
 *     levels (Req 21.2).
 *   • Comfortable reading measure (`max-w-prose`) on body copy.
 *   • Below-the-fold imagery lazy-loads with declared dimensions via
 *     `ResponsiveImage` (Req 20.2, 20.3); a layout-aware `sizes` keeps the
 *     fetched source matched to the grid (Req 20.4).
 *   • Visible focus + reduced-motion safety are inherited from the shared DS
 *     primitives; this page adds no bespoke motion.
 *
 * Server component — static, no client interactivity.
 *
 * Per-page metadata/OpenGraph/JSON-LD are wired centrally via `buildPageMeta`
 * in task 15.3; this file declares only a minimal, self-describing local title
 * and description in the meantime (Req 21.1).
 */
import type { Metadata } from "next";
import {
  Utensils,
  UtensilsCrossed,
  Trees,
  Leaf,
  type LucideIcon,
} from "lucide-react";

import { Icon } from "@/components/ui/Icon";
import { Card, CardTitle, CardBody } from "@/components/ui/Card";
import { ResponsiveImage } from "@/components/media";
import { cuisineContent } from "@/content/cuisine";
import { photoCatalog } from "@/content/generated";
import { filterByCategory } from "@/domain/gallery";
import type { Photo } from "@/content/types";
import { buildPageMeta } from "@/domain/seo/seo";

export const metadata: Metadata = buildPageMeta('cuisine');

/**
 * Map the content's string icon names (single icon family, Req 19.4) to their
 * Lucide glyphs. A safe default keeps the page resilient if a new experience is
 * authored with an unmapped icon name.
 */
const DINING_ICONS: Record<string, LucideIcon> = {
  utensils: Utensils,
  trees: Trees,
};

/**
 * The photos that illustrate the dining experience (Req 8.3).
 *
 * Derived at build time from the `outdoor_living` gallery category — the
 * property's open-air dining areas, garden tables, covered seating, and gazebo
 * — so the imagery stays in lock-step with the asset pipeline (alt text and
 * intrinsic dimensions come straight from the catalog; nothing is hard-coded).
 * Dining-named photos are surfaced first so the most on-topic images lead.
 */
export function selectDiningPhotos(): Photo[] {
  const outdoorLiving = filterByCategory(photoCatalog, "outdoor_living");
  return [...outdoorLiving].sort((a, b) => {
    const score = (photo: Photo) => (/dining/.test(photo.id) ? 0 : 1);
    return score(a) - score(b);
  });
}

const diningPhotos = selectDiningPhotos();

export default function CuisinePage() {
  const { intro, malayaliCuisine, diningExperiences } = cuisineContent;

  return (
    <article className="bg-surface text-on-surface">
      {/* ---- Page header + lead-in ------------------------------------- */}
      <header className="mx-auto w-full max-w-3xl px-4 pt-12 md:px-6 md:pt-16">
        <h1 className="flex items-center gap-3 font-serif text-3xl font-semibold text-secondary sm:text-4xl">
          <Icon icon={UtensilsCrossed} size="lg" aria-hidden className="text-primary" />
          Inhouse Dining
        </h1>
        <p className="mt-4 max-w-prose text-lg leading-relaxed text-on-surface-muted">
          {intro}
        </p>
      </header>

      {/* ---- Authentic Malayali cuisine, veg + non-veg (Req 8.1) -------- */}
      <section
        aria-labelledby={`${malayaliCuisine.id}-heading`}
        className="mx-auto w-full max-w-3xl px-4 py-10 md:px-6 md:py-12"
      >
        <h2
          id={`${malayaliCuisine.id}-heading`}
          className="flex items-center gap-2 font-serif text-2xl font-semibold text-secondary md:text-3xl"
        >
          <Icon icon={Leaf} aria-hidden className="text-primary" />
          {malayaliCuisine.heading}
        </h2>
        <div className="mt-4 flex flex-col gap-4 text-base leading-relaxed text-on-surface">
          {malayaliCuisine.paragraphs.map((paragraph, index) => (
            <p key={index}>
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      {/* ---- Dining experiences: home-cooked + outdoor (Req 8.2) -------- */}
      <section
        aria-labelledby="dining-experiences-heading"
        className="bg-surface-alt"
      >
        <div className="mx-auto w-full max-w-6xl px-4 py-12 md:px-6 md:py-16">
          <h2
            id="dining-experiences-heading"
            className="font-serif text-2xl font-semibold text-secondary md:text-3xl"
          >
            Ways to Dine at Kaivalyam
          </h2>
          <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {diningExperiences.map((experience) => {
              const glyph = DINING_ICONS[experience.icon] ?? Utensils;
              return (
                <li key={experience.id} className="h-full">
                  <Card variant="facility" className="h-full">
                    <span
                      aria-hidden
                      className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface text-primary"
                    >
                      <Icon icon={glyph} size="lg" />
                    </span>
                    <CardTitle className="mt-3">{experience.title}</CardTitle>
                    <CardBody className="mt-1">
                      {experience.description}
                    </CardBody>
                  </Card>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ---- Photos illustrating the dining experience (Req 8.3) -------- */}
      <section
        aria-labelledby="dining-gallery-heading"
        className="mx-auto w-full max-w-6xl px-4 py-12 md:px-6 md:py-16"
      >
        <h2
          id="dining-gallery-heading"
          className="font-serif text-2xl font-semibold text-secondary md:text-3xl"
        >
          The Table, Out in the Open
        </h2>
        <p className="mt-3 max-w-prose text-base text-on-surface-muted">
          Garden tables, covered seating, and the gazebo — the spots around the
          property where meals are served and lingered over.
        </p>
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {diningPhotos.map((photo) => (
            <li key={photo.id}>
              <ResponsiveImage
                image={photo}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                wrapperClassName="aspect-[4/3] w-full overflow-hidden rounded-xl border border-border"
                className="rounded-xl object-cover"
              />
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
