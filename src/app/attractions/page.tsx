/**
 * Attractions page (`/attractions`) — categorized local attractions directory.
 * ---------------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 12.2)
 *
 * Renders the full `AttractionsDirectory` with the generated attractions
 * catalog. Satisfies:
 *   • Req 7.1 — 11 categories in canonical order.
 *   • Req 7.2 — each attraction shows its name and image.
 *   • Req 7.3 — external hyperlinks where `externalUrl` is present.
 *   • Req 7.4 — external links open in a new browser context.
 *   • Req 7.5 — Religious Sites split into Hindu/Jain/Christian/Muslim.
 *   • Req 7.6 — descriptive alt text on every image.
 *   • Req 7.7 — branded placeholder fallback on image error.
 *   • Req 21.1 — unique page title and meta description.
 *   • Req 21.2 — sequential heading hierarchy (h1 → h2 → h3).
 *
 * Server component — statically generated (SSG/ISR).
 */

import type { Metadata } from "next";
import { MapPin } from "lucide-react";

import { Icon } from "@/components/ui/Icon";
import { AttractionsDirectory } from "@/components/sections/AttractionsDirectory";
import { attractions } from "@/content/generated/attractions";
import { buildPageMeta } from "@/domain/seo/seo";

export const metadata: Metadata = buildPageMeta('attractions');

export default function AttractionsPage() {
  return (
    <article className="mx-auto w-full max-w-6xl px-4 py-12 md:px-6 md:py-16">
      {/* Page header */}
      <header className="mb-12">
        <p className="flex items-center gap-1.5 text-sm font-medium uppercase tracking-wide text-on-surface-muted">
          <Icon icon={MapPin} size="sm" aria-hidden />
          Padichira, Wayanad, Kerala
        </p>
        <h1 className="mt-3 font-serif text-3xl font-semibold text-secondary sm:text-4xl">
          Local Attractions
        </h1>
        <p className="mt-4 max-w-prose text-lg leading-relaxed text-on-surface-muted">
          Wayanad is rich with natural wonders, ancient heritage, and sacred
          sites. Here is a curated guide to the best attractions near Kaivalyam
          Homestay — from mist-covered peaks and thundering waterfalls to
          centuries-old temples and wildlife sanctuaries.
        </p>
      </header>

      {/* Directory */}
      <AttractionsDirectory attractions={attractions} />
    </article>
  );
}
