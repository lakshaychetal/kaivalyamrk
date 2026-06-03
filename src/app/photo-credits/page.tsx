/**
 * Photo Credits page (`/photo-credits`) — image attribution (Req 23.1, 23.3, 23.4).
 * ---------------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 12.4)
 *
 * The Site_Footer links here (`PHOTO_CREDITS_HREF = '/photo-credits'`). This page
 * lists attribution for EXACTLY the Wikimedia-sourced images and OMITS owned /
 * AI-generated assets:
 *
 *   • Req 23.1 — list attribution for every Attributed_Image sourced from Wikimedia.
 *   • Req 23.3 — display attribution ONLY for Attributed_Image assets; omit
 *                owned-by-homestay and AI-generated Property_Photo assets.
 *   • Req 23.4 — for each Attributed_Image present the attribution text AND the
 *                license reference required by its source (author + license name
 *                linked to the license, a link to the source, and the title).
 *
 * The credit list is DERIVED at build time from the typed, generated catalog
 * (`photoCatalog` property photos + the `attractions` directory) by filtering on
 * `source === 'wikimedia'`. Nothing is hard-coded, so the page can never drift
 * from the assets the site actually ships: re-running the asset pipeline (which
 * itself fails the build if any Wikimedia asset lacks complete attribution,
 * task 5.2) keeps this page exhaustive and correct.
 *
 * Because `ImageAsset` is a discriminated union on `source`, narrowing to
 * `source === 'wikimedia'` gives the compiler a `WikimediaImageAsset` whose
 * `attribution` (author / licenseName / licenseUrl / sourceUrl) is guaranteed
 * present — owned / AI-generated assets cannot carry attribution, so they are
 * structurally excluded from the credit list.
 *
 * Per-page metadata/OpenGraph/JSON-LD are wired centrally via `buildPageMeta`
 * in task 15.3; this file declares only a minimal, self-describing local title
 * and description in the meantime (Req 21.1).
 */
import type { Metadata } from "next";
import { ExternalLink, Images } from "lucide-react";

import { Icon } from "@/components/ui";
import { cn } from "@/components/ui/cn";
import { focusRing } from "@/components/ui/buttonStyles";
import { allPhotos } from "@/domain/gallery";
import { photoCatalog, attractions } from "@/content/generated";
import type { ImageAsset, WikimediaImageAsset } from "@/content/types";
import { buildPageMeta } from "@/domain/seo/seo";

export const metadata: Metadata = buildPageMeta('photo-credits');

/**
 * A single rendered credit line. A flattened, presentation-ready view of one
 * {@link WikimediaImageAsset}'s {@link Attribution} (Req 23.4).
 */
export interface PhotoCredit {
  /** The asset id — a stable, unique React key. */
  id: string;
  /** Human label for the image (its attribution title, else its alt text). */
  title: string;
  /** Author / creator credit required by the license (Req 23.4). */
  author: string;
  /** Human-readable license name, e.g. "CC BY-SA 4.0" (Req 23.4). */
  licenseName: string;
  /** Canonical license deed/legalcode URL the name links to (Req 23.4). */
  licenseUrl: string;
  /** Link back to the original file on the source (Wikimedia) (Req 23.4). */
  sourceUrl: string;
}

/**
 * Every image the site ships, paired with a human label, across BOTH catalogs:
 *   • property photos — flattened from the gallery `photoCatalog`; labelled by
 *     their `alt` text (they have no separate display name); and
 *   • attraction images — labelled by the attraction's `name`.
 *
 * Returned as the raw {@link ImageAsset} union (any `source`) so the Wikimedia
 * filter below is the single place provenance is decided.
 */
function allAttributableImages(): ReadonlyArray<{
  asset: ImageAsset;
  label: string;
}> {
  const propertyPhotos = allPhotos(photoCatalog).map((photo) => ({
    asset: photo as ImageAsset,
    label: photo.alt,
  }));
  const attractionImages = attractions.map((attraction) => ({
    asset: attraction.image,
    label: attraction.name,
  }));
  return [...propertyPhotos, ...attractionImages];
}

/**
 * The credit list: EXACTLY the Wikimedia-sourced images, each flattened to a
 * {@link PhotoCredit} (Req 23.1, 23.4). Owned / AI-generated assets fail the
 * `source === 'wikimedia'` guard and are omitted entirely (Req 23.3).
 *
 * Pure and deterministic — exported so the page's tests can assert the derived
 * set matches the catalog without going through the DOM.
 */
export function collectWikimediaCredits(): PhotoCredit[] {
  return allAttributableImages()
    .filter(
      (entry): entry is { asset: WikimediaImageAsset; label: string } =>
        entry.asset.source === "wikimedia",
    )
    .map(({ asset, label }) => ({
      id: asset.id,
      title: asset.attribution.title ?? label,
      author: asset.attribution.author,
      licenseName: asset.attribution.licenseName,
      licenseUrl: asset.attribution.licenseUrl,
      sourceUrl: asset.attribution.sourceUrl,
    }));
}

/** Shared treatment for the external attribution links (accessible + safe). */
const creditLink = cn(
  "inline-flex items-center gap-1 rounded-sm text-primary underline underline-offset-4",
  "hover:text-secondary motion-safe:transition-colors",
  focusRing,
);

export default function PhotoCreditsPage() {
  const credits = collectWikimediaCredits();

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-12 md:px-6 md:py-16">
      <header className="mb-8">
        <h1 className="flex items-center gap-3 font-serif text-3xl font-semibold text-secondary sm:text-4xl">
          <Icon icon={Images} aria-hidden className="text-primary" />
          Photo Credits
        </h1>
        <p className="mt-3 max-w-prose text-base text-on-surface-muted">
          Some of the local-attraction photography on this website comes from
          Wikimedia Commons and is reused under its respective license. We
          gratefully credit each contributor below. Photographs of the Kaivalyam
          Homestay property itself are our own or AI-generated and need no
          attribution.
        </p>
      </header>

      <section aria-labelledby="wikimedia-credits-heading">
        <h2
          id="wikimedia-credits-heading"
          className="font-serif text-xl font-semibold text-secondary"
        >
          Wikimedia Commons image credits
        </h2>
        <p className="mt-2 text-sm text-on-surface-muted">
          {credits.length}{" "}
          {credits.length === 1 ? "image" : "images"} attributed.
        </p>

        <ul className="mt-6 flex flex-col divide-y divide-border border-y border-border">
          {credits.map((credit) => (
            <li key={credit.id} className="py-4">
              <p className="font-medium text-on-surface">{credit.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-on-surface-muted">
                <span>Photo by {credit.author}</span>
                <span aria-hidden className="mx-2">
                  ·
                </span>
                <span>
                  Licensed under{" "}
                  <a
                    href={credit.licenseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={creditLink}
                  >
                    {credit.licenseName}
                    <Icon icon={ExternalLink} size="sm" aria-hidden />
                  </a>
                </span>
                <span aria-hidden className="mx-2">
                  ·
                </span>
                <a
                  href={credit.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`View on Wikimedia Commons — ${credit.title}`}
                  className={creditLink}
                >
                  View on Wikimedia Commons
                  <Icon icon={ExternalLink} size="sm" aria-hidden />
                </a>
              </p>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
