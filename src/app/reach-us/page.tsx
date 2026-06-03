/**
 * Reach Us page (`/reach-us`) — road connectivity and transport hubs.
 * --------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 11.6)
 *
 * Presents the full journey-planning information a Guest needs to reach
 * Kaivalyam Homestay (Req 10.1–10.4):
 *
 *   • Req 10.1 — road-connectivity directions from Kozhikode, Kannur,
 *                Nilambur, Ooty, Gudalur, Bengaluru, and Mysuru.
 *   • Req 10.2 — nearest airport and railway station distances.
 *   • Req 10.3 — the property is in Padichira, ~10 km from Pulpally.
 *   • Req 10.4 — a "Get Directions" action that opens the property location
 *                in an external map service (separate browser context).
 *
 * Design contract:
 *   • Semantic tokens only — never raw hex.
 *   • Lucide icons only (Car, Train, Plane, MapPin, Navigation).
 *   • Sequential heading hierarchy: h1 → h2 → (no h3 skips).
 *   • Visible focus rings via `focusRing` from buttonStyles.
 *   • Reduced-motion safe: all transitions gated behind `motion-safe`.
 *   • Mobile-first, no horizontal scroll at 375px+.
 *   • External links: target="_blank" rel="noopener noreferrer".
 *
 * Server component — pure presentation of static content, no client state.
 *
 * _Requirements: 10.1, 10.2, 10.3, 10.4_
 */
import type { Metadata } from "next";
import { Car, MapPin, Navigation, Plane, Train } from "lucide-react";

import { Icon } from "@/components/ui/Icon";
import { cn } from "@/components/ui/cn";
import { buttonClassNames, focusRing } from "@/components/ui/buttonStyles";
import {
  buildDirectionsUrl,
  KAIVALYAM_DIRECTIONS_CONFIG,
} from "@/domain/integration-urls/directions-url";
import {
  roadRoutes,
  transportHubs,
  propertyLocation,
} from "@/content/reach-us";
import type { RoadRoute, TransportHub } from "@/content/types";
import { buildPageMeta } from "@/domain/seo/seo";

export const metadata: Metadata = buildPageMeta('reach-us');

/** The canonical "Get Directions" URL for this page (Req 10.4). */
const directionsUrl = buildDirectionsUrl(KAIVALYAM_DIRECTIONS_CONFIG);

/** Shared treatment for the external "Get Directions" link. */
const directionsLinkClass = cn(
  "inline-flex min-h-11 items-center gap-2 rounded-lg px-1 font-medium text-primary",
  "underline underline-offset-4 hover:text-secondary motion-safe:transition-colors",
  focusRing,
);

/** A single road-route card (Req 10.1). */
function RouteCard({ route }: { route: RoadRoute }) {
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-alt text-primary"
          aria-hidden="true"
        >
          <Icon icon={Car} size="md" />
        </span>
        <h2 className="font-serif text-lg font-semibold text-secondary">
          {route.origin}
        </h2>
      </div>
      <p className="text-base leading-relaxed text-on-surface">
        {route.description}
      </p>
      {route.distanceKm !== undefined && (
        <p className="text-sm font-medium text-on-surface-muted">
          Approx.{" "}
          <span className="text-primary">{route.distanceKm}&nbsp;km</span> by
          road
        </p>
      )}
    </li>
  );
}

/** Icon for a transport hub type. */
function HubIcon({ type }: { type: TransportHub["type"] }) {
  return type === "airport" ? (
    <Icon icon={Plane} size="md" />
  ) : (
    <Icon icon={Train} size="md" />
  );
}

/** A single transport hub card (Req 10.2). */
function HubCard({ hub }: { hub: TransportHub }) {
  const label = hub.type === "airport" ? "Airport" : "Railway Station";
  return (
    <li className="flex items-start gap-4 rounded-xl border border-border bg-surface p-5 shadow-sm">
      <span
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-alt text-primary"
        aria-hidden="true"
      >
        <HubIcon type={hub.type} />
      </span>
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-on-surface-muted">
          {label}
        </p>
        <p className="mt-1 font-serif text-base font-semibold text-secondary">
          {hub.name}
        </p>
        <p className="mt-1 text-sm text-on-surface-muted">
          Approx.{" "}
          <span className="font-medium text-primary">{hub.distanceKm}&nbsp;km</span>{" "}
          from the property
        </p>
      </div>
    </li>
  );
}

export default function ReachUsPage() {
  return (
    <article className="mx-auto w-full max-w-5xl px-4 py-12 md:px-6 md:py-16">
      {/* ---- Page header ---- */}
      <header className="mb-10">
        <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-on-surface-muted">
          <Icon icon={MapPin} size="sm" aria-hidden />
          <span>Padichira, Wayanad, Kerala</span>
        </div>
        <h1 className="mt-3 font-serif text-3xl font-semibold text-secondary sm:text-4xl">
          How to Reach Us
        </h1>
        {/* Req 10.3 — Padichira / ~10 km from Pulpally fact */}
        <p className="mt-4 max-w-prose text-base leading-relaxed text-on-surface-muted">
          {propertyLocation.statement}
        </p>
      </header>

      {/* ---- Get Directions CTA (Req 10.4) ---- */}
      <div className="mb-12 flex flex-col gap-3 sm:flex-row sm:items-center">
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClassNames({ variant: "secondary" })}
        >
          <Icon icon={Navigation} aria-hidden />
          Get Directions
        </a>
        <p className="text-sm text-on-surface-muted">
          Opens route directions to the property in your map app.
        </p>
      </div>

      <div className="flex flex-col gap-14">
        {/* ---- Road routes from 7 origin cities (Req 10.1) ---- */}
        <section aria-labelledby="road-routes-heading">
          <h2
            id="road-routes-heading"
            className="font-serif text-2xl font-semibold text-secondary md:text-3xl"
          >
            By Road
          </h2>
          <p className="mt-3 max-w-prose text-base text-on-surface-muted">
            Kaivalyam is well connected by road from major cities in Kerala,
            Tamil Nadu, and Karnataka. All distances are approximate.
          </p>
          <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {roadRoutes.map((route) => (
              <RouteCard key={route.origin} route={route} />
            ))}
          </ul>
        </section>

        {/* ---- Nearest airport and railway (Req 10.2) ---- */}
        <section aria-labelledby="transport-hubs-heading">
          <h2
            id="transport-hubs-heading"
            className="font-serif text-2xl font-semibold text-secondary md:text-3xl"
          >
            Nearest Airports &amp; Railway Stations
          </h2>
          <p className="mt-3 max-w-prose text-base text-on-surface-muted">
            The nearest air and rail links are roughly 130–150&nbsp;km from the
            property. Taxis and private transfers are available from all hubs.
          </p>
          <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {transportHubs.map((hub) => (
              <HubCard key={hub.name} hub={hub} />
            ))}
          </ul>
        </section>

        {/* ---- Directions reminder footer ---- */}
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-alt px-5 py-4">
          <Icon icon={MapPin} size="sm" aria-hidden className="shrink-0 text-primary" />
          <p className="text-sm text-on-surface-muted">
            Need turn-by-turn directions?{" "}
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={directionsLinkClass}
            >
              Get Directions
            </a>{" "}
            opens Google Maps in a new tab.
          </p>
        </div>
      </div>
    </article>
  );
}
