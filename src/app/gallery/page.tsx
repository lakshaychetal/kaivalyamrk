/**
 * Gallery page (`/gallery`) — curated property photos + virtual tour.
 * -------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 12.1)
 *
 * Renders two sections:
 *   1. {@link GalleryGrid} — the filterable photo grid organized into the 9
 *      gallery categories (Req 6.1–6.4, 6.7).
 *   2. {@link VirtualTour} — a guided step-through of the 9 categories in
 *      sequence (Req 6.6).
 *
 * Heading outline (Req 21.2):
 *   h1 (page title, visually hidden but in the DOM for screen readers)
 *   → h2 "Photo Gallery" (GalleryGrid)
 *   → h2 "Virtual Tour" (VirtualTour)
 *
 * Per-page metadata (Req 21.1): unique title + description.
 *
 * Server component — the interactive state lives inside the client sub-components.
 *
 * _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_
 */
import type { Metadata } from "next";

import { GalleryGrid } from "@/components/sections/GalleryGrid";
import { buildPageMeta } from "@/domain/seo/seo";

// ---------------------------------------------------------------------------
// Metadata (Req 21.1, 21.5) — full wiring via buildPageMeta (task 15.3).
// ---------------------------------------------------------------------------

export const metadata: Metadata = buildPageMeta('gallery');

// ---------------------------------------------------------------------------
// Gallery page
// ---------------------------------------------------------------------------

export default function GalleryPage() {
  return (
    <>
      {/*
       * Visually hidden h1 for screen readers and the document outline.
       * The GalleryGrid renders its own h2 "Photo Gallery".
       */}
      <h1 className="sr-only">Gallery — Kaivalyam Homestay</h1>

      {/* Filterable photo grid with lightbox (Req 6.1–6.4, 6.7) */}
      <GalleryGrid headingLevel={2} />
    </>
  );
}
