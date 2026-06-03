/**
 * `ContactMap` — the embedded Wayanad map with a resilient directions fallback.
 * ----------------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 13.1)
 *
 * Renders the property location on an embedded Google Maps `<iframe>` (Req 9.4)
 * and, per the design's resilient-embed rule, degrades gracefully: if the map
 * iframe fails to load, the inline frame is replaced by a panel that surfaces
 * the external "Get Directions" link as the FUNCTIONAL fallback (Req 9.2, 9.5).
 *
 *   Design — Error Handling: "Map embed fails (9.4) → Provide the 'Get
 *   Directions' external link as a functional fallback even if the inline map
 *   iframe fails."
 *
 * This is the single CLIENT island on the Contact page: it owns the tiny bit of
 * state needed to detect the iframe `error` event and swap to the fallback. The
 * rest of the page (phone/email/WhatsApp/directions actions) stays a server
 * component.
 *
 * Accessibility & resilience:
 *   • The `<iframe>` carries a descriptive `title` (Req 22.x — named frame) so
 *     assistive tech announces the embedded map meaningfully.
 *   • `loading="lazy"` defers the off-screen embed (Req 20.2 spirit), and the
 *     frame declares an explicit aspect ratio so it reserves layout space and
 *     does not shift content (Req 20.3).
 *   • A persistent "Get Directions" link sits beneath the map at all times, so
 *     the functional fallback is reachable EVEN WHILE the iframe is still
 *     loading — not only after an error.
 *   • The directions link is EXTERNAL, so it opens in a new, isolated browser
 *     context (`target="_blank"` + `rel="noopener noreferrer"`, Req 9.5).
 *
 * The embed URL is built from the typed `siteInfo.mapLocation` (coordinates
 * preferred, human-readable query as the resolver fallback). No API key is
 * required for the classic `?output=embed` map.
 */
"use client";

import { useState } from "react";
import { MapPinned, Navigation, TriangleAlert } from "lucide-react";

import { Icon } from "@/components/ui";
import { cn } from "@/components/ui/cn";
import { focusRing } from "@/components/ui/buttonStyles";
import { siteInfo } from "@/content/site";
import { KAIVALYAM_DIRECTIONS_URL } from "@/domain/integration-urls/directions-url";

/** The location fields {@link buildMapEmbedUrl} needs to resolve a destination. */
export interface MapEmbedLocation {
  /** Latitude in decimal degrees. Paired with {@link lng} for an exact pin. */
  lat?: number;
  /** Longitude in decimal degrees. Paired with {@link lat} for an exact pin. */
  lng?: number;
  /** Human-readable place/address query, used when coordinates are absent. */
  embedQuery?: string;
}

/** Base for the classic, key-less Google Maps embed (`output=embed`). */
const GOOGLE_MAPS_EMBED_BASE = "https://www.google.com/maps";

/** True iff `n` is a finite number usable as a coordinate component. */
function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

/**
 * Build the `src` for the embedded map iframe.
 *
 * Resolution mirrors {@link buildDirectionsUrl}: exact coordinates win (drop a
 * pin on the precise spot), otherwise the free-text query is geocoded. The
 * `q` value is URL-encoded and the result is an absolute `https://` URL of the
 * form `https://www.google.com/maps?q=<encoded>&z=14&output=embed`.
 *
 * Exported (pure, deterministic) so it can be unit-tested without the DOM.
 */
export function buildMapEmbedUrl(location: MapEmbedLocation): string {
  let q: string;
  if (isFiniteNumber(location.lat) && isFiniteNumber(location.lng)) {
    q = `${location.lat},${location.lng}`;
  } else if (
    typeof location.embedQuery === "string" &&
    location.embedQuery.trim() !== ""
  ) {
    q = location.embedQuery.trim();
  } else {
    throw new Error(
      "buildMapEmbedUrl requires finite lat & lng coordinates or a non-empty embedQuery.",
    );
  }

  const params = new URLSearchParams({ q, z: "14", output: "embed" });
  return `${GOOGLE_MAPS_EMBED_BASE}?${params.toString()}`;
}

/** Shared treatment for the external "Get Directions" link (safe + accessible). */
const directionsLink = cn(
  "inline-flex min-h-11 items-center gap-2 rounded-lg px-1 font-medium text-primary",
  "underline underline-offset-4 hover:text-secondary motion-safe:transition-colors",
  focusRing,
);

export interface ContactMapProps {
  /** Accessible title for the embedded map frame. */
  title?: string;
  /** Override the location pinned by the embed. Defaults to `siteInfo.mapLocation`. */
  location?: MapEmbedLocation;
}

/**
 * Embedded Wayanad map (Req 9.4) with a graceful "Get Directions" fallback
 * (Req 9.2, 9.5) when the iframe fails to load.
 */
export function ContactMap({
  title = "Map showing the location of Kaivalyam Homestay in Padichira, Wayanad",
  location = siteInfo.mapLocation,
}: ContactMapProps) {
  const [failed, setFailed] = useState(false);
  const embedSrc = buildMapEmbedUrl(location);

  return (
    <div className="flex flex-col gap-3">
      {failed ? (
        // Functional fallback: the map could not load, so lead with directions.
        <div
          role="alert"
          className="flex flex-col items-start gap-3 rounded-xl border border-border bg-surface-alt p-6 text-on-surface"
          style={{ aspectRatio: "16 / 9" }}
        >
          <p className="flex items-center gap-2 font-medium text-secondary">
            <Icon icon={TriangleAlert} aria-hidden className="text-accent" />
            The interactive map couldn&rsquo;t load.
          </p>
          <p className="max-w-prose text-base text-on-surface-muted">
            You can still get turn-by-turn directions to Kaivalyam Homestay in
            your map app.
          </p>
          <a
            href={KAIVALYAM_DIRECTIONS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={directionsLink}
          >
            <Icon icon={Navigation} size="sm" aria-hidden />
            Get Directions
          </a>
        </div>
      ) : (
        <div
          className="overflow-hidden rounded-xl border border-border bg-surface-alt"
          style={{ aspectRatio: "16 / 9" }}
        >
          <iframe
            title={title}
            src={embedSrc}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            onError={() => setFailed(true)}
            className="h-full w-full border-0"
          />
        </div>
      )}

      {/*
       * Persistent functional fallback (Req 9.2/9.5): the external directions
       * link stays reachable even while the iframe loads, not only on error.
       */}
      <p className="flex items-center gap-1 text-sm text-on-surface-muted">
        <Icon icon={MapPinned} size="sm" aria-hidden className="text-primary" />
        <span>
          Trouble viewing the map?{" "}
          <a
            href={KAIVALYAM_DIRECTIONS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={directionsLink}
          >
            Get Directions
          </a>
        </span>
      </p>
    </div>
  );
}

export default ContactMap;
