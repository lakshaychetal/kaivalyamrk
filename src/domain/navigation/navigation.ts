/**
 * Navigation domain module — the single source of truth for site navigation.
 * --------------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 6.1)
 *
 * Pure, deterministic, framework-free. No React, no side effects, no imports
 * from `app/`, `components/`, or `integration/` (per `structure.md` layer
 * rules). This module can therefore be reasoned about and PROPERTY-TESTED in
 * isolation (Property 2, task 6.2).
 *
 * Responsibilities (Req 1.2, 1.3, 1.4, 1.5):
 *   • `navigationModel`     — the ONE model the `SiteHeader` / `PrimaryNav` /
 *                             `MobileNavMenu` consume, so header and mobile menu
 *                             can never diverge. Holds the required primary
 *                             links (Req 1.2) + the persistent "Book Now" CTA
 *                             (Req 1.3).
 *   • `resolveActiveNav`    — pure resolver that, for a given path, marks AT
 *                             MOST ONE navigation item active and marks exactly
 *                             the item whose href corresponds to the path when
 *                             one exists (Req 1.5). Drives the active-state
 *                             highlight.
 *   • `BOOKING_HREF`        — the in-site booking destination (the page that
 *                             hosts the eeabsolute booking widget). The nav CTA
 *                             links here; the widget itself builds its external
 *                             eeabsolute deep-link via `buildBookingUrl`
 *                             (task 6.3).
 *
 * Note on Reach Us (Req 1.1): Reach Us is a real page but is NOT one of the 8
 * header links enumerated in Req 1.2. It is modeled cleanly here as a
 * footer-eligible secondary item (`reachUsNavItem` / `secondaryNavItems`) that
 * the `SiteFooter` (task 10.2) can render, while `navigationModel.items` stays
 * exactly the Req 1.2 header set. `resolveActiveNav` is generic over any model,
 * so a footer can resolve its own active state by passing a model built from
 * `secondaryNavItems` if desired.
 */

// ---------------------------------------------------------------------------
// Types (mirror design.md "Site Shell and Navigation")
// ---------------------------------------------------------------------------

/** A single navigation entry: a stable id, a human label, and a route href. */
export interface NavItem {
  /** Stable identifier returned by {@link resolveActiveNav}. */
  id: string;
  /** Human-readable link label. */
  label: string;
  /** In-site route path, e.g. `'/'`, `'/rooms'`. */
  href: string;
}

/**
 * The single navigation model. `items` are the primary (header) links; the
 * persistent primary CTA is `bookNow` (Req 1.3) — kept separate from `items`
 * because it is a call-to-action, not a navigable "tab", and is never marked
 * active by {@link resolveActiveNav}.
 */
export interface NavigationModel {
  items: NavItem[];
  bookNow: { label: 'Book Now'; href: string };
}

// ---------------------------------------------------------------------------
// Route + booking href constants
// ---------------------------------------------------------------------------

/**
 * The in-site booking destination — the page that hosts the eeabsolute booking
 * widget (design: "Booking page (widget host)"). The persistent "Book Now" CTA
 * (Req 1.3) links here; the widget builds the external eeabsolute deep-link via
 * `buildBookingUrl` (task 6.3). Kept as a constant so every CTA resolves to one
 * destination.
 */
export const BOOKING_HREF = '/book' as const;

/** Canonical route paths for the navigable marketing pages (Req 1.1). */
export const ROUTES = {
  home: '/',
  about: '/about',
  rooms: '/rooms',
  facilities: '/facilities',
  gallery: '/gallery',
  attractions: '/attractions',
  cuisine: '/cuisine',
  contact: '/contact',
  reachUs: '/reach-us',
} as const;

// ---------------------------------------------------------------------------
// The navigation model (single source of truth)
// ---------------------------------------------------------------------------

/**
 * The exact set of primary header links required on every page by Req 1.2,
 * in display order: Home, About, Rooms, Facilities, Gallery, Attractions,
 * Cuisine, Contact.
 */
export const primaryNavItems: readonly NavItem[] = [
  { id: 'home', label: 'Home', href: ROUTES.home },
  { id: 'about', label: 'About', href: ROUTES.about },
  { id: 'rooms', label: 'Rooms', href: ROUTES.rooms },
  { id: 'facilities', label: 'Facilities', href: ROUTES.facilities },
  { id: 'gallery', label: 'Gallery', href: ROUTES.gallery },
  { id: 'attractions', label: 'Attractions', href: ROUTES.attractions },
  { id: 'cuisine', label: 'Cuisine', href: ROUTES.cuisine },
  { id: 'contact', label: 'Contact', href: ROUTES.contact },
] as const;

/**
 * Reach Us — a real page (Req 1.1) but not part of the Req 1.2 header set.
 * Exposed as a footer-eligible secondary item the `SiteFooter` (task 10.2) can
 * render.
 */
export const reachUsNavItem: NavItem = {
  id: 'reach-us',
  label: 'Reach Us',
  href: ROUTES.reachUs,
} as const;

/** Footer-eligible secondary navigation links. */
export const secondaryNavItems: readonly NavItem[] = [reachUsNavItem] as const;

/**
 * THE navigation model consumed by the header and mobile menu. `items` is
 * exactly the Req 1.2 header set; `bookNow` is the persistent primary CTA
 * (Req 1.3) pointing at the in-site booking host.
 */
export const navigationModel: NavigationModel = {
  items: [...primaryNavItems],
  bookNow: { label: 'Book Now', href: BOOKING_HREF },
};

// ---------------------------------------------------------------------------
// Active-route resolver (pure)
// ---------------------------------------------------------------------------

/**
 * Normalize a path/href into a canonical comparable form so matching is
 * deterministic and trailing-slash / query / hash insensitive:
 *
 *   1. Drop any query string (`?…`) and hash fragment (`#…`).
 *   2. Ensure a single leading slash.
 *   3. Collapse repeated slashes (`//` → `/`).
 *   4. Strip trailing slashes, except for the root which stays `'/'`.
 *
 * Examples: `'/rooms/'` → `'/rooms'`, `'//rooms//x/'` → `'/rooms/x'`,
 * `'/'` → `'/'`, `''` → `'/'`, `'/about?x=1#y'` → `'/about'`.
 */
function normalizePath(input: string): string {
  // 1. strip query + hash
  let path = input;
  const queryIndex = path.indexOf('?');
  if (queryIndex !== -1) path = path.slice(0, queryIndex);
  const hashIndex = path.indexOf('#');
  if (hashIndex !== -1) path = path.slice(0, hashIndex);

  // 2. ensure a single leading slash
  if (!path.startsWith('/')) path = '/' + path;

  // 3. collapse repeated slashes
  path = path.replace(/\/{2,}/g, '/');

  // 4. strip trailing slashes (but keep the root)
  while (path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1);
  }

  return path;
}

/**
 * Does a normalized request path correspond to a normalized item href?
 *
 * Matching rule:
 *   • The root href `'/'` matches ONLY an exact `'/'` request path. (Without
 *     this special case the root would prefix-match every path, since every
 *     path starts with `'/'`.)
 *   • Any other href `h` matches when the path equals `h` exactly, OR the path
 *     is nested beneath it — i.e. it starts with `h + '/'`. So `/rooms` matches
 *     both `/rooms` and `/rooms/luxury`, but not `/rooms-suite`.
 */
function pathMatchesHref(path: string, href: string): boolean {
  if (href === '/') return path === '/';
  return path === href || path.startsWith(href + '/');
}

/**
 * Resolve which navigation item is active for a given path.
 *
 * Returns the `id` of AT MOST ONE active item:
 *   • Among all items whose href corresponds to the (normalized) path under
 *     {@link pathMatchesHref}, the MOST SPECIFIC one wins — defined as the item
 *     with the longest normalized href. This guarantees a single winner even
 *     when both a parent (`/rooms`) and a (hypothetical) child (`/rooms/luxury`)
 *     href are present.
 *   • Ties on href length are only possible for duplicate hrefs; the first such
 *     item in `model.items` order wins, keeping the result deterministic.
 *   • Returns `null` when no item corresponds to the path.
 *
 * Pure and deterministic: depends only on its arguments, with no side effects.
 *
 * @param path  The current route path (may include trailing slash / query / hash).
 * @param model The navigation model whose `items` are considered.
 * @returns The active item's `id`, or `null` if none matches.
 */
export function resolveActiveNav(path: string, model: NavigationModel): string | null {
  const normalizedPath = normalizePath(path);

  let bestId: string | null = null;
  let bestHrefLength = -1;

  for (const item of model.items) {
    const normalizedHref = normalizePath(item.href);
    if (!pathMatchesHref(normalizedPath, normalizedHref)) continue;

    // Most specific (longest href) wins; on a tie keep the earlier item.
    if (normalizedHref.length > bestHrefLength) {
      bestHrefLength = normalizedHref.length;
      bestId = item.id;
    }
  }

  return bestId;
}
