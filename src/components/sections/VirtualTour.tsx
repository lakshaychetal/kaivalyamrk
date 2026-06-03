/**
 * `VirtualTour` — step through the 9 property categories in sequence (Req 6.6).
 * ------------------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 12.1)
 *
 * Presents a guided virtual tour of the Kaivalyam property by stepping through
 * the 9 gallery categories in the canonical order defined by
 * `VIRTUAL_TOUR_CATEGORY_ORDER`. For each category it shows:
 *   • The category name (as a heading).
 *   • A representative photo (the first photo in that category).
 *   • Previous / Next controls to advance through categories (Req 6.6).
 *
 * Accessibility:
 *   • An `aria-live="polite"` region announces the current category name when
 *     it changes, so screen-reader users hear the transition (Req 22.4).
 *   • Previous/Next buttons are ≥44px with `aria-label`s (Req 22.5, 18.5).
 *   • All motion is `motion-safe` only (Req 22.7).
 *
 * Navigation uses the pure, property-tested `nextTourStep` / `prevTourStep`
 * cursors from `domain/gallery` (Property 8) — no index arithmetic in the view.
 *
 * CLIENT component: owns the current-category state.
 *
 * _Requirements: 6.6, 22.4, 22.5, 18.5, 22.7_
 */
"use client";

import { useState, useCallback, type ReactElement } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";

import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { IconButton } from "@/components/ui/Button";
import { cn } from "@/components/ui/cn";
import { focusRing } from "@/components/ui/buttonStyles";
import {
  nextTourStep,
  prevTourStep,
  VIRTUAL_TOUR_CATEGORY_ORDER,
  filterByCategory,
} from "@/domain/gallery";
import { photoCatalog } from "@/content/generated/photo-catalog";
import type { PhotoCategoryId } from "@/content/types";

// ---------------------------------------------------------------------------
// Category label map — derived from the catalog
// ---------------------------------------------------------------------------

function getCategoryLabel(id: PhotoCategoryId): string {
  const cat = photoCatalog.categories.find((c) => c.id === id);
  if (cat) return cat.label;
  return id
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ---------------------------------------------------------------------------
// Step indicator dots
// ---------------------------------------------------------------------------

interface StepDotsProps {
  order: readonly PhotoCategoryId[];
  current: PhotoCategoryId;
  onSelect: (id: PhotoCategoryId) => void;
}

function StepDots({ order, current, onSelect }: StepDotsProps): ReactElement {
  return (
    <div
      role="tablist"
      aria-label="Virtual tour steps"
      className="flex flex-wrap justify-center gap-2"
    >
      {order.map((id, i) => {
        const isActive = id === current;
        return (
          <button
            key={id}
            role="tab"
            aria-selected={isActive}
            aria-label={`Go to ${getCategoryLabel(id)}`}
            onClick={() => onSelect(id)}
            className={cn(
              "h-2.5 w-2.5 rounded-full",
              "min-h-[44px] min-w-[44px]",
              "flex items-center justify-center",
              "motion-safe:transition-colors motion-safe:duration-150",
              focusRing,
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "block h-2.5 w-2.5 rounded-full",
                isActive ? "bg-primary" : "bg-border",
              )}
            />
            <span className="sr-only">
              Step {i + 1}: {getCategoryLabel(id)}
              {isActive ? " (current)" : ""}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// VirtualTour
// ---------------------------------------------------------------------------

export interface VirtualTourProps {
  /** Heading level for the section title. */
  headingLevel?: 2 | 3;
}

export function VirtualTour({
  headingLevel = 2,
}: VirtualTourProps): ReactElement {
  const order = VIRTUAL_TOUR_CATEGORY_ORDER;
  const [currentCategory, setCurrentCategory] = useState<PhotoCategoryId>(
    order[0]!,
  );

  const goNext = useCallback(() => {
    setCurrentCategory((current) => nextTourStep(order, current));
  }, [order]);

  const goPrev = useCallback(() => {
    setCurrentCategory((current) => prevTourStep(order, current));
  }, [order]);

  const currentIndex = order.indexOf(currentCategory);
  const label = getCategoryLabel(currentCategory);

  // Representative photo: first photo in the current category
  const categoryPhotos = filterByCategory(photoCatalog, currentCategory);
  const representativePhoto = categoryPhotos[0] ?? null;

  const Heading = `h${headingLevel}` as "h2" | "h3";
  const headingId = "virtual-tour-heading";
  const liveRegionId = "virtual-tour-live";

  return (
    <section
      aria-labelledby={headingId}
      className="bg-surface-alt"
    >
      <div className="mx-auto w-full max-w-5xl px-4 py-12 md:px-6 md:py-16">
        {/* Section header */}
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-on-primary"
            aria-hidden="true"
          >
            <Play size={20} />
          </span>
          <Heading
            id={headingId}
            className="font-serif text-2xl font-semibold text-secondary md:text-3xl"
          >
            Virtual Tour
          </Heading>
        </div>
        <p className="mt-2 max-w-prose text-base text-on-surface-muted">
          Step through each area of the property at your own pace.
        </p>

        {/* Tour card */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-surface shadow-md">
          {/* Photo area */}
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-alt">
            {representativePhoto ? (
              <ResponsiveImage
                key={currentCategory}
                image={representativePhoto}
                fill
                priority
                sizes="(min-width: 1024px) 80vw, 100vw"
                className="object-cover"
                wrapperClassName="absolute inset-0 h-full w-full"
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center bg-surface-alt"
                aria-hidden="true"
              />
            )}

            {/* Category name overlay */}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"
            />
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
              <p className="font-serif text-xl font-semibold text-white sm:text-2xl">
                {label}
              </p>
              <p className="mt-1 text-sm text-white/80">
                {categoryPhotos.length} photo
                {categoryPhotos.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between gap-4 p-4 sm:p-6">
            <IconButton
              icon={ChevronLeft}
              aria-label="Previous category"
              onClick={goPrev}
              variant="secondary"
              size="md"
            />

            {/* Step counter + dots */}
            <div className="flex flex-col items-center gap-3">
              {/* aria-live region announces the current category to screen readers */}
              <p
                id={liveRegionId}
                aria-live="polite"
                aria-atomic="true"
                className="text-sm font-medium text-on-surface"
              >
                <span className="sr-only">Now viewing: </span>
                {label}
                <span className="ml-2 text-xs text-on-surface-muted">
                  ({currentIndex + 1} / {order.length})
                </span>
              </p>

              <StepDots
                order={order}
                current={currentCategory}
                onSelect={setCurrentCategory}
              />
            </div>

            <IconButton
              icon={ChevronRight}
              aria-label="Next category"
              onClick={goNext}
              variant="secondary"
              size="md"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default VirtualTour;
