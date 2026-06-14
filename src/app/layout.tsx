import type { Metadata, Viewport } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { SiteShell } from "@/components/layout/SiteShell";
import { GoogleAnalytics } from "@/components/layout/GoogleAnalytics";
import { AnalyticsProvider } from "@/components/layout/AnalyticsProvider";
import { AmbientPlayer } from "@/components/layout/AmbientPlayer";
import { LodgingBusinessJsonLd, SITE_URL, SITE_NAME } from "@/domain/seo/seo";

/**
 * Brand typography (task 2.1):
 *   • Headings — Fraunces: an elegant humanist old-style serif with a calm,
 *     natural, premium feel that echoes the homestay's character.
 *   • Body — Source Sans 3: a highly legible humanist sans for comfortable
 *     reading at the 16px mobile base.
 * Both load with `display: "swap"` (Req: font-display swap) and expose CSS
 * variables consumed by the token layer (`--font-serif` / `--font-sans`).
 */
const fontSerif = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
  weight: ["400", "500", "600", "700"],
});

const fontSans = Source_Sans_3({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-source-sans",
  weight: ["400", "500", "600", "700"],
});

/**
 * Root metadata. `metadataBase` makes every relative OG/canonical URL resolve
 * to the production domain. Per-page metadata (unique titles/descriptions,
 * canonical, OpenGraph) comes from `buildPageMeta`; this provides the site-wide
 * defaults, default social-share card, and the canonical for the home page.
 *
 * `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` (optional): paste the token from Google
 * Search Console ("HTML tag" verification) into this env var to verify the site.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Kaivalyam Homestay — Experience Serene Solitude",
    template: "%s · Kaivalyam Homestay",
  },
  description:
    "A tranquil hill-village homestay in Padichira, Wayanad, Kerala. Experience serene solitude. #KAIVALYAM",
  applicationName: SITE_NAME,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_IN",
    url: "/",
    title: "Kaivalyam Homestay — Experience Serene Solitude",
    description:
      "A tranquil hill-village homestay in Padichira, Wayanad, Kerala. Experience serene solitude. #KAIVALYAM",
    images: [
      {
        url: "/og/kaivalyam-night-ambiance.jpg",
        width: 1200,
        height: 630,
        alt: "Kaivalyam Homestay aglow with warm lantern light against the Wayanad dusk",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kaivalyam Homestay — Experience Serene Solitude",
    description:
      "A tranquil hill-village homestay in Padichira, Wayanad, Kerala. Experience serene solitude.",
    images: ["/og/kaivalyam-night-ambiance.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
};

/**
 * LodgingBusiness JSON-LD structured data (Req 21.4).
 * Built once at module load — pure, deterministic, no side effects.
 */
const lodgingBusinessJsonLd = LodgingBusinessJsonLd();

/**
 * Viewport configuration (Req 18.3).
 *
 * Sets the layout viewport to the device width at an initial scale of 1 and
 * EXPLICITLY ALLOWS user zoom for accessibility: we deliberately do NOT set
 * `maximumScale` or `userScalable: false`, because pinning/locking zoom would
 * prevent low-vision users from enlarging the page. (Next.js applies sensible
 * defaults — `userScalable` and `maximumScale` are left unset so the browser
 * permits zoom.)
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fontSans.variable} ${fontSerif.variable}`}>
      <body>
        {/*
         * LodgingBusiness JSON-LD structured data (Req 21.4).
         * Injected on every page via the root layout so search engines can
         * identify the business name, location (PostalAddress), and contact
         * details (telephone) from any entry point.
         */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(lodgingBusinessJsonLd),
          }}
        />

        {/*
         * The shared shell mounts the skip link (first focusable element),
         * the persistent header, the <main id="main"> landmark, and the footer
         * (which links the Photo Credits + Privacy Notice pages).
         */}
        <SiteShell>{children}</SiteShell>

        {/*
         * GA4 (gtag) script SLOT. Renders nothing unless NEXT_PUBLIC_GA4_ID is
         * configured. No measurement id is ever hardcoded.
         */}
        <GoogleAnalytics />

        {/*
         * Analytics page-view tracker (Req 17.1). Client island that calls
         * `trackPageView` on every route change (initial load + soft navigations).
         * Emits to GA4 (when NEXT_PUBLIC_GA4_ID is set) and the first-party
         * ingestion endpoint. Renders nothing — pure side-effect island.
         */}
        <AnalyticsProvider />

        {/*
         * Ambient music player — a small floating mute/unmute button that lets
         * visitors play soft instrumental background music across all pages.
         * Starts muted (browser autoplay policy); user unmutes on first click.
         */}
        <AmbientPlayer />
      </body>
    </html>
  );
}
