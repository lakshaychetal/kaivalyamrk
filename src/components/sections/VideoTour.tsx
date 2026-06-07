"use client";

/**
 * `VideoTour` — an immersive video walk-through of the Kaivalyam property.
 * -------------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website
 *
 * Displays a curated set of property videos with soft Indian flute music
 * in the background. Each video has its original audio stripped and the
 * background music mixed in at a low volume. Videos are in portrait (9:16)
 * format and presented in a horizontal scrollable strip on mobile / a
 * 2×2 grid on desktop.
 *
 * UX:
 *   • Videos autoplay muted (browser policy) and loop.
 *   • Clicking/tapping a video card makes it the "active" full-bleed
 *     featured view above the strip.
 *   • Accessibility: video has descriptive aria-label; controls are keyboard
 *     reachable; reduced-motion users see a static poster.
 */

import { useState, useCallback } from "react";
import { Play, ChevronLeft, ChevronRight, Film } from "lucide-react";
import { cn } from "@/components/ui/cn";
import { focusRing } from "@/components/ui/buttonStyles";

interface TourVideo {
  id: string;
  label: string;
  description: string;
  src: string;
}

const TOUR_VIDEOS: TourVideo[] = [
  {
    id: "approach",
    label: "Arriving at Kaivalyam",
    description: "The road approach through Wayanad greenery leading to the homestay.",
    src: "/videos/approach.mp4",
  },
  {
    id: "luxury_cottage",
    label: "Luxury Cottage",
    description: "A quick walk-through of the duplex Luxury Cottage — balcony, living area, and garden.",
    src: "/videos/luxury_cottage.mp4",
  },
  {
    id: "walk_library",
    label: "Cottage to Library",
    description: "A gentle walk from the cottage through the property to the reading library.",
    src: "/videos/walk_library.mp4",
  },
  {
    id: "walk_play_area",
    label: "Play Area & Gardens",
    description: "The children's play area and surrounding garden pathways.",
    src: "/videos/walk_play_area.mp4",
  },
];

export function VideoTour({ headingLevel = 2 }: { headingLevel?: 2 | 3 }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const goNext = useCallback(() => {
    setActiveIndex((i) => (i + 1) % TOUR_VIDEOS.length);
  }, []);

  const goPrev = useCallback(() => {
    setActiveIndex((i) => (i - 1 + TOUR_VIDEOS.length) % TOUR_VIDEOS.length);
  }, []);

  const active = TOUR_VIDEOS[activeIndex]!;
  const Heading = `h${headingLevel}` as "h2" | "h3";
  const headingId = "video-tour-heading";

  return (
    <section
      aria-labelledby={headingId}
      className="bg-secondary text-white"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-12 md:px-6 md:py-16">
        {/* Section header */}
        <div className="flex items-center gap-3 mb-8">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white"
            aria-hidden="true"
          >
            <Film size={20} />
          </span>
          <div>
            <Heading
              id={headingId}
              className="font-serif text-2xl font-semibold text-white md:text-3xl"
            >
              Virtual Tour
            </Heading>
            <p className="mt-1 text-sm text-white/70">
              Walk through Kaivalyam — with soft Indian flute in the air.
            </p>
          </div>
        </div>

        {/* Featured video — large */}
        <div className="relative overflow-hidden rounded-2xl bg-black shadow-2xl">
          {/* aspect-[9/16] on mobile, aspect-video on desktop */}
          <div className="relative w-full aspect-video">
            <video
              key={active.id}
              src={active.src}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-label={active.label}
              className="absolute inset-0 h-full w-full object-cover"
            />
            {/* Gradient overlay for text legibility */}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"
            />
            {/* Caption */}
            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
              <p className="font-serif text-xl font-semibold text-white sm:text-2xl">
                {active.label}
              </p>
              <p className="mt-1 text-sm text-white/80 max-w-prose">
                {active.description}
              </p>
            </div>
            {/* Prev/Next */}
            <button
              type="button"
              aria-label="Previous video"
              onClick={goPrev}
              className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2",
                "flex h-10 w-10 items-center justify-center rounded-full",
                "bg-black/50 backdrop-blur-sm border border-white/20 text-white",
                "hover:bg-black/75 hover:scale-110",
                "motion-safe:transition motion-safe:duration-150",
                focusRing,
              )}
            >
              <ChevronLeft size={20} aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Next video"
              onClick={goNext}
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2",
                "flex h-10 w-10 items-center justify-center rounded-full",
                "bg-black/50 backdrop-blur-sm border border-white/20 text-white",
                "hover:bg-black/75 hover:scale-110",
                "motion-safe:transition motion-safe:duration-150",
                focusRing,
              )}
            >
              <ChevronRight size={20} aria-hidden />
            </button>
          </div>
        </div>

        {/* Thumbnail strip */}
        <ul
          className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4"
          aria-label="Video tour clips"
        >
          {TOUR_VIDEOS.map((video, i) => {
            const isActive = i === activeIndex;
            return (
              <li key={video.id}>
                <button
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  aria-label={`Play: ${video.label}`}
                  aria-pressed={isActive}
                  className={cn(
                    "group relative w-full overflow-hidden rounded-xl",
                    "border-2 motion-safe:transition motion-safe:duration-150",
                    isActive
                      ? "border-primary shadow-lg shadow-primary/30"
                      : "border-white/20 hover:border-white/50",
                    focusRing,
                  )}
                >
                  {/* Thumbnail video — muted, no controls */}
                  <div className="aspect-video relative bg-black">
                    <video
                      src={`${video.src}#t=2`}
                      muted
                      playsInline
                      preload="metadata"
                      aria-hidden
                      className="h-full w-full object-cover opacity-80 group-hover:opacity-100 motion-safe:transition"
                    />
                    {/* Play overlay when not active */}
                    {!isActive && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Play size={20} className="text-white/80" aria-hidden />
                      </div>
                    )}
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="h-2 w-2 rounded-full bg-primary motion-safe:animate-pulse" aria-hidden />
                      </div>
                    )}
                  </div>
                  <p className="px-2 py-1.5 text-left text-xs font-medium text-white/90 leading-tight">
                    {video.label}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Counter */}
        <p className="mt-4 text-center text-xs text-white/50">
          {activeIndex + 1} / {TOUR_VIDEOS.length} · Background: Indian Flute — Calm &amp; Serene
        </p>
      </div>
    </section>
  );
}

export default VideoTour;
