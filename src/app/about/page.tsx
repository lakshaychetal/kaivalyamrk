/**
 * About page (`/about`) — the Kaivalyam philosophy and the Wayanad story.
 * ---------------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 11.2)
 *
 * Presents the brand narrative so a Visitor can connect with the experience
 * before booking. It renders, in order, the authored prose from the typed
 * `aboutContent` collection (task 4.2) plus illustrative property photos drawn
 * from the generated `photoCatalog` (task 5.1):
 *
 *   • Req 3.1 — the meaning of "Kaivalyam" as liberation and solitude of the
 *               soul (`aboutContent.meaning`).
 *   • Req 3.2 — the pet-friendly, tranquil hill-village positioning suited to
 *               long-staying guests (`aboutContent.positioning`).
 *   • Req 3.3 — the Wayanad region story describing the natural and cultural
 *               setting (`aboutContent.wayanadStory`).
 *   • Req 3.4 — the signature offerings: guided tours, nature walks, local
 *               community interaction, and 24-hour guest assistance
 *               (`aboutContent.signatureOfferings`).
 *   • Req 3.5 — property photos that illustrate the described setting, rendered
 *               through `ResponsiveImage` with descriptive alt text.
 *
 * Design / UX contract:
 *   • Earthy-calm aesthetic via SEMANTIC tokens only (`text-secondary`,
 *     `text-on-surface`, `bg-surface-alt`, …) — never raw hex.
 *   • Lucide is the single icon family (Req 19.4); offering icons are mapped
 *     from their content icon-name to a Lucide component here and rendered
 *     decoratively (their accessible name comes from the adjacent card title).
 *   • A single `h1`, then a sequential `h2`/`h3` outline with no skipped levels
 *     (Req 21.2). Offering cards use the DS `CardTitle` (an `h3`).
 *   • Comfortable reading measure (`max-w-prose`, ~65ch) for all narrative
 *     prose.
 *   • Photos lazy-load by default and declare intrinsic dimensions via
 *     `ResponsiveImage` (Req 20.2, 20.3); none is marked `priority` because the
 *     About page has no hero image.
 *
 * Server component — pure presentation of static content, no client state.
 *
 * Per-page metadata/OpenGraph/JSON-LD are wired centrally via `buildPageMeta`
 * in task 15.3; this file declares only a minimal, self-describing local title
 * and description in the meantime (Req 21.1).
 */
import type { Metadata } from "next";
import {
  Clock,
  Compass,
  Footprints,
  Leaf,
  Map as MapIcon,
  MapPin,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Icon } from "@/components/ui/Icon";
import { Card, CardTitle, CardBody } from "@/components/ui/Card";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import {
  aboutContent,
  type AboutSection,
  type SignatureOffering,
} from "@/content/about";
import { filterByCategory } from "@/domain/gallery";
import { photoCatalog } from "@/content/generated";
import type { Photo, PhotoCategoryId } from "@/content/types";
import { buildPageMeta } from "@/domain/seo/seo";

export const metadata: Metadata = buildPageMeta('about');

/**
 * Map each signature offering's content icon-name (Req 19.4) to its Lucide
 * component. Keeping the mapping in the presentation layer lets the content
 * stay a plain, serializable string while the site uses one icon family.
 */
const OFFERING_ICONS: Record<string, LucideIcon> = {
  map: MapIcon,
  footprints: Footprints,
  users: Users,
  clock: Clock,
};

/**
 * Illustrative property photos (Req 3.5): the first photo from a handful of
 * categories that best evoke the described setting — garden pathways and
 * exteriors (the natural setting), outdoor living, and the night ambiance
 * (solitude/mood). Derived from the generated catalog so the page never ships a
 * fabricated or missing asset; `filterByCategory` is the pure gallery helper
 * (task 7.1), and the `undefined` guard keeps the page robust if a category is
 * empty.
 */
const ILLUSTRATIVE_CATEGORIES: readonly PhotoCategoryId[] = [
  "garden_pathways",
  "exteriors",
  "outdoor_living",
  "night_ambiance",
];

const illustrativePhotos: Photo[] = ILLUSTRATIVE_CATEGORIES.map(
  (id) => filterByCategory(photoCatalog, id)[0],
).filter((photo): photo is Photo => photo !== undefined);

/**
 * A single featured image for the About header band. Prefer an evocative
 * night-ambiance or exterior shot; fall back to the first illustrative photo so
 * the header always has imagery (and never ships a missing asset).
 */
const headerPhoto: Photo | undefined =
  filterByCategory(photoCatalog, "night_ambiance")[0] ??
  filterByCategory(photoCatalog, "exteriors")[0] ??
  illustrativePhotos[0];

/** Render a titled prose section (`h2` + ordered paragraphs) at a calm measure. */
function ProseSection({ section }: { section: AboutSection }) {
  return (
    <section aria-labelledby={`${section.id}-heading`}>
      <h2
        id={`${section.id}-heading`}
        className="font-serif text-2xl font-semibold text-secondary md:text-3xl"
      >
        {section.heading}
      </h2>
      <div className="mt-4 flex flex-col gap-4">
        {section.paragraphs.map((paragraph, index) => (
          <p
            key={index}
            className="max-w-prose text-base leading-relaxed text-on-surface"
          >
            {paragraph}
          </p>
        ))}
      </div>
    </section>
  );
}

/** A single signature-offering card (Req 3.4): icon + title (`h3`) + blurb. */
function OfferingCard({ offering }: { offering: SignatureOffering }) {
  const glyph = OFFERING_ICONS[offering.icon] ?? Compass;

  return (
    <li className="h-full">
      <Card variant="facility" className="h-full">
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-surface-alt text-primary"
          aria-hidden="true"
        >
          <Icon icon={glyph} size="lg" />
        </span>
        <CardTitle className="mt-3 text-lg">{offering.title}</CardTitle>
        <CardBody className="mt-1">{offering.description}</CardBody>
      </Card>
    </li>
  );
}

export default function AboutPage() {
  const { tagline, meaning, positioning, wayanadStory, signatureOfferings } =
    aboutContent;

  return (
    <article className="w-full">
      {/* ---- Designed header band ---------------------------------------- */}
      <header className="relative isolate overflow-hidden border-b border-border bg-secondary text-on-primary">
        {/* Background image + scrim for depth and legible text */}
        {headerPhoto && (
          <div className="absolute inset-0 -z-10">
            <ResponsiveImage
              image={headerPhoto}
              priority
              fill
              sizes="100vw"
              className="object-cover"
              wrapperClassName="absolute inset-0 h-full w-full"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/65 to-black/45"
            />
          </div>
        )}

        <div className="mx-auto w-full max-w-5xl px-4 py-20 md:px-6 md:py-28">
          <p className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.18em] text-white/80">
            <Icon icon={MapPin} size="sm" aria-hidden />
            Padichira · Wayanad · Kerala
          </p>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl font-bold leading-tight text-white sm:text-5xl md:text-6xl">
            About Kaivalyam
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/90 sm:text-xl">
            A pet-friendly, tranquil hill-village homestay in Padichira, Wayanad
            — and the philosophy, place, and people behind it.
          </p>
          <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-white/90 backdrop-blur-sm">
            <Icon icon={Leaf} size="sm" aria-hidden className="text-white" />
            {tagline}
          </p>
        </div>
      </header>

      {/* ---- Body -------------------------------------------------------- */}
      <div className="mx-auto w-full max-w-5xl px-4 py-12 md:px-6 md:py-16">
        <div className="flex flex-col gap-12">
        {/* Req 3.1 — the meaning of "Kaivalyam". */}
        <ProseSection section={meaning} />

        {/* Req 3.2 — pet-friendly, long-stay positioning. */}
        <ProseSection section={positioning} />

        {/* Req 3.3 — the Wayanad region story (natural + cultural setting). */}
        <ProseSection section={wayanadStory} />

        {/* Req 3.4 — signature offerings. */}
        <section aria-labelledby="offerings-heading">
          <h2
            id="offerings-heading"
            className="font-serif text-2xl font-semibold text-secondary md:text-3xl"
          >
            Signature Experiences
          </h2>
          <p className="mt-4 max-w-prose text-base leading-relaxed text-on-surface">
            However long you stay, these are the experiences we love to share.
          </p>
          <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {signatureOfferings.map((offering) => (
              <OfferingCard key={offering.id} offering={offering} />
            ))}
          </ul>
        </section>

        {/* Req 3.5 — illustrative property photos. */}
        {illustrativePhotos.length > 0 && (
          <section aria-labelledby="setting-heading">
            <h2
              id="setting-heading"
              className="font-serif text-2xl font-semibold text-secondary md:text-3xl"
            >
              A Glimpse of the Setting
            </h2>
            <p className="mt-4 max-w-prose text-base leading-relaxed text-on-surface">
              Garden pathways, open-air corners, and the warm hush of evening —
              a little of what surrounds you at Kaivalyam.
            </p>
            <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {illustrativePhotos.map((photo) => (
                <li key={photo.id}>
                  <ResponsiveImage
                    image={photo}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="rounded-xl object-cover"
                    wrapperClassName="aspect-[3/2] w-full overflow-hidden rounded-xl border border-border"
                  />
                </li>
              ))}
            </ul>
          </section>
        )}
        </div>
      </div>
    </article>
  );
}
