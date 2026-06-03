/**
 * Build-time robots directives — Next.js App Router convention.
 * ---------------------------------------------------------------------------
 * Exports a default function that returns a `MetadataRoute.Robots` object.
 * Next.js calls this at build time and serves the result as `/robots.txt`.
 *
 * Policy:
 *   • All crawlers are allowed on all public pages.
 *   • /admin/ is disallowed for all crawlers (belt-and-suspenders protection
 *     in addition to the `noindex` metadata already set on the admin report).
 *   • The sitemap URL is declared so crawlers can discover it automatically.
 *
 * Requirements: 21.3 — robots directives file.
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
 * Generate the robots directives for the Kaivalyam Homestay website.
 *
 * Called by Next.js at build time to produce `/robots.txt`.
 * All public pages are crawlable; /admin/ is disallowed for every user-agent.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/admin/',
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
