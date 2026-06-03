/**
 * Build-time sitemap generation — Next.js App Router convention.
 * ---------------------------------------------------------------------------
 * Exports a default function that returns a `MetadataRoute.Sitemap` array.
 * Next.js calls this at build time and serves the result as `/sitemap.xml`.
 *
 * Included pages: all public marketing pages.
 * EXCLUDED pages: /admin/login, /admin/report (and any other /admin/* routes).
 *
 * Requirements: 21.3 — machine-readable sitemap.
 */

import type { MetadataRoute } from 'next';

/**
 * Canonical base URL for the site.
 * Reads NEXT_PUBLIC_SITE_URL at build time; falls back to the production domain.
 */
const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
  'https://www.kaivalyamhomestay.com';

/**
 * Public marketing pages to include in the sitemap.
 * Admin routes (/admin/*) are intentionally absent.
 */
const PUBLIC_PAGES: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  priority: number;
}> = [
  // Home — highest crawl priority, refreshed weekly
  { path: '/', changeFrequency: 'weekly', priority: 1.0 },

  // Core content pages — updated occasionally
  { path: '/about', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/rooms', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/facilities', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/gallery', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/attractions', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/cuisine', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/reach-us', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/reviews', changeFrequency: 'monthly', priority: 0.8 },

  // Utility / legal pages — rarely change
  { path: '/photo-credits', changeFrequency: 'yearly', priority: 0.5 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.5 },
];

/**
 * Generate the sitemap for the Kaivalyam Homestay website.
 *
 * Called by Next.js at build time to produce `/sitemap.xml`.
 * Admin routes are excluded; all public marketing pages are included with
 * appropriate `changeFrequency` and `priority` values.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PAGES.map(({ path, changeFrequency, priority }) => ({
    url: `${BASE_URL}${path}`,
    changeFrequency,
    priority,
  }));
}
