/**
 * `GalleryGrid` — the filterable photo grid for the Gallery page (Req 6.1–6.4, 6.7).
 * -----------------------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 12.1)
 *
 * Renders the full property photo catalog organized into the 9 gallery categories.
 * A row of category tabs lets the visitor filter to a single category (Req 6.3).
 * Clicking any photo opens the {@link Lightbox} with that photo selected (Req 6.4).
 *
 * Design contract:
 *   • Category tabs: "All" + one per category. Active tab uses `bg-primary /
 *     text-on-primary`; inactive uses `bg-surface-alt / text-on-surface`.
 *   • Photo grid: responsive masonry-style grid (CSS columns) — 1 col on mobile,
 *     2 on sm, 3 on lg. Each photo is a `<button>` so it is keyboard-reachable
 *     (Req 22.4) with a visible focus ring (Req 22.3).
 *   • Every photo has descriptive alt text via `ResponsiveImage` (Req 6.7, 22.2).
 *   • All controls are ≥44px (Req 18.5, 22.5).
 *   • Motion is `motion-safe` only (Req 22.7).
 *   • Semantic tokens only — no raw hex.
 *
 * CLIENT component: owns the active-category state and the lightbox open/close state.
 *
 * _Requirements: 6.1, 6.2, 6.3, 6.4, 6.7, 22.2, 22.3, 22.4, 22.5, 22.7_
 */
"use client";

import { useState, useCallback, type ReactElement } from "react";

import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { Lightbox } from "@/components/gallery/Lightbox";
import { cn } from "@/components/ui/cn";
import { focusRing } from "@/components/ui/buttonStyles";
import {
  filterByCategory,
  allPhotos,
  VIRTUAL_TOUR_CATEGORY_ORDER,
} from "@/domain/gallery";
import { photoCatalog } from "@/content/generated/photo-catalog";
import type { Photo, PhotoCategoryId } from "@/content/types";
import { PHOTO_CATEGORY_IDS } from "@/content/types";

// ---------------------------------------------------------------------------
// Category label map — derived from the catalog so labels stay in sync
// ---------------------------------------------------------------------------

function buildLabelMap(
  catalog: typeof photoCatalog,
): Record<PhotoCategoryId, string> {
  const map = {} as Record<PhotoCategoryId, string>;
  for (const cat of catalog.categories) {
    map[cat.id] = cat.label;
  }
  // Fill any missing with a title-cased fallback
  for (const id of PHOTO_CATEGORY_IDS) {
    if (!map[id]) {
      map[id] = id
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    }
  }
  return map;
}

const CATEGORY_LABELS = buildLabelMap(photoCatalog);

// ---------------------------------------------------------------------------
// Category tab bar
// ---------------------------------------------------------------------------

interface CategoryTabsProps {
  active: PhotoCategoryId | "all";
  onChange: (id: PhotoCategoryId | "all") => void;
  /** Photo counts per category — used to show how many photos are in each. */
  counts: Record<PhotoCategoryId, number>;
  totalCount: number;
}

function CategoryTabs({
  active,
  onChange,
  counts,
  totalCount,
}: CategoryTabsProps): ReactElement {
  return (
    <div
      role="tablist"
      aria-label="Filter gallery by category"
      className="flex flex-wrap gap-2"
    >
      {/* "All" tab */}
      <button
        role="tab"
        aria-selected={active === "all"}
        onClick={() => onChange("all")}
        className={cn(
          "min-h-11 rounded-full px-4 py-2 text-sm font-medium",
          "motion-safe:transition-colors motion-safe:duration-150",
          focusRing,
          active === "all"
            ? "bg-primary text-on-primary"
            : "bg-surface-alt text-on-surface hover:bg-primary/10",
        )}
      >
        All
        <span className="ml-1.5 text-xs opacity-70">({totalCount})</span>
      </button>

      {/* One tab per category, in canonical order */}
      {VIRTUAL_TOUR_CATEGORY_ORDER.map((id) => {
        const count = counts[id] ?? 0;
        if (count === 0) return null;
        const isActive = active === id;
        return (
          <button
            key={id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(id)}
            className={cn(
              "min-h-11 rounded-full px-4 py-2 text-sm font-medium",
              "motion-safe:transition-colors motion-safe:duration-150",
              focusRing,
              isActive
                ? "bg-primary text-on-primary"
                : "bg-surface-alt text-on-surface hover:bg-primary/10",
            )}
          >
            {CATEGORY_LABELS[id]}
            <span className="ml-1.5 text-xs opacity-70">({count})</span>
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Photo grid
// ---------------------------------------------------------------------------

interface PhotoGridProps {
  photos: readonly Photo[];
  onPhotoClick: (index: number) => void;
}

function PhotoGrid({ photos, onPhotoClick }: PhotoGridProps): ReactElement {
  if (photos.length === 0) {
    return (
      <p className="py-12 text-center text-base text-on-surface-muted">
        No photos in this category yet.
      </p>
    );
  }

  return (
    <ul
      className="columns-1 gap-4 sm:columns-2 lg:columns-3"
      aria-label="Gallery photos"
    >
      {photos.map((photo, idx) => (
        <li key={photo.id} className="mb-4 break-inside-avoid">
          <button
            type="button"
            onClick={() => onPhotoClick(idx)}
            aria-label={`View enlarged: ${photo.alt}`}
            className={cn(
              "group relative block w-full overflow-hidden rounded-lg",
              "min-h-11",
              "motion-safe:transition-transform motion-safe:duration-200",
              "motion-safe:hover:scale-[1.01]",
              focusRing,
            )}
          >
            <ResponsiveImage
              image={photo}
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="w-full rounded-lg object-cover"
              wrapperClassName="block w-full"
            />
            {/* Hover overlay with alt text */}
            <span
              aria-hidden="true"
              className={cn(
                "absolute inset-0 flex items-end rounded-lg p-3",
                "bg-gradient-to-t from-black/60 to-transparent",
                "opacity-0 motion-safe:transition-opacity motion-safe:duration-200",
                "group-hover:opacity-100 group-focus-visible:opacity-100",
              )}
            >
              <span className="line-clamp-2 text-left text-xs text-white/90">
                {photo.alt}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// GalleryGrid
// ---------------------------------------------------------------------------

export interface GalleryGridProps {
  /** Heading level for the section title (to keep a valid outline). */
  headingLevel?: 2 | 3;
}

export function GalleryGrid({
  headingLevel = 2,
}: GalleryGridProps): ReactElement {
  const [activeCategory, setActiveCategory] = useState<
    PhotoCategoryId | "all"
  >("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Food images (food_*) are for the Inhouse Dining page only — exclude from gallery
  const excludeFood = (photos: readonly Photo[]) =>
    photos.filter((p) => !p.id.includes("food_"));

  // Derive the displayed photos from the active filter
  const displayedPhotos: readonly Photo[] = excludeFood(
    activeCategory === "all"
      ? allPhotos(photoCatalog)
      : filterByCategory(photoCatalog, activeCategory),
  );

  // Photo counts per category for the tab badges (also exclude food)
  const counts = Object.fromEntries(
    PHOTO_CATEGORY_IDS.map((id) => [
      id,
      excludeFood(filterByCategory(photoCatalog, id)).length,
    ]),
  ) as Record<PhotoCategoryId, number>;

  const totalCount = excludeFood(allPhotos(photoCatalog)).length;

  const handlePhotoClick = useCallback((index: number) => {
    setLightboxIndex(index);
  }, []);

  const handleLightboxClose = useCallback(() => {
    setLightboxIndex(null);
  }, []);

  const Heading = `h${headingLevel}` as "h2" | "h3";
  const headingId = "gallery-grid-heading";

  return (
    <section
      aria-labelledby={headingId}
      className="bg-surface"
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-6 md:py-16">
        <Heading
          id={headingId}
          className="font-serif text-2xl font-semibold text-secondary md:text-3xl"
        >
          Photo Gallery
        </Heading>
        <p className="mt-2 max-w-prose text-base text-on-surface-muted">
          Browse our curated collection of property photographs. Select a
          category to filter, or click any photo to view it enlarged.
        </p>

        {/* Category filter tabs */}
        <div className="mt-6">
          <CategoryTabs
            active={activeCategory}
            onChange={setActiveCategory}
            counts={counts}
            totalCount={totalCount}
          />
        </div>

        {/* Active category label */}
        {activeCategory !== "all" && (
          <p
            aria-live="polite"
            aria-atomic="true"
            className="mt-4 text-sm font-medium text-on-surface-muted"
          >
            Showing{" "}
            <span className="font-semibold text-secondary">
              {CATEGORY_LABELS[activeCategory]}
            </span>{" "}
            — {displayedPhotos.length} photo
            {displayedPhotos.length !== 1 ? "s" : ""}
          </p>
        )}

        {/* Photo grid */}
        <div className="mt-8">
          <PhotoGrid
            photos={displayedPhotos}
            onPhotoClick={handlePhotoClick}
          />
        </div>
      </div>

      {/* Lightbox — mounted only when a photo is selected */}
      {lightboxIndex !== null && (
        <Lightbox
          photos={displayedPhotos}
          initialIndex={lightboxIndex}
          onClose={handleLightboxClose}
        />
      )}
    </section>
  );
}

export default GalleryGrid;
