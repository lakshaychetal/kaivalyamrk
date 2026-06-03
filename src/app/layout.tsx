import type { Metadata, Viewport } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { SiteShell } from "@/components/layout/SiteShell";
import { GoogleAnalytics } from "@/components/layout/GoogleAnalytics";
import { AnalyticsProvider } from "@/components/layout/AnalyticsProvider";
import { LodgingBusinessJsonLd } from "@/domain/seo/seo";

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
 * Placeholder root metadata. Per-page metadata (unique titles/descriptions,
 * OpenGraph, JSON-LD) is wired through `buildPageMeta` in task 15.3.
 * The template ensures pages that don't set their own title still get a
 * branded suffix.
 */
export const metadata: Metadata = {
  title: {
    default: "Kaivalyam Homestay — Experience Absolute Solitude",
    template: "%s · Kaivalyam Homestay",
  },
  description:
    "A pet-friendly, tranquil hill-village homestay in Padichira, Wayanad, Kerala. Experience absolute solitude. #KAIVALYAM",
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
      </body>
    </html>
  );
}
