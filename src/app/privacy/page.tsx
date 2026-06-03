/**
 * Privacy Notice page (`/privacy`) — the published privacy notice (Req 17.7).
 * ---------------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 10.3)
 *
 * Requirement 17.7 states the Analytics_Service collects visitor analytics
 * "in accordance with a published privacy notice". This page IS that published
 * notice, and it is linked from the site footer (mounted on every page via the
 * root layout / `SiteShell`), so the notice is reachable from anywhere.
 *
 * Scope is intentionally MINIMAL but real: it states what analytics data is
 * collected (page views, sessions, a cumulative visit count), why, that no
 * sensitive personal data is collected for analytics, that a visitor can opt
 * out, and points to the contact channel for questions. The exact legal copy /
 * data-controller details are confirmed by the owner before launch
 * (placeholders are clearly marked).
 *
 * Per-page metadata/OpenGraph/JSON-LD are wired centrally via `buildPageMeta`
 * in task 15.3; this file declares only a minimal local title/description so
 * the route is self-describing in the meantime.
 */
import type { Metadata } from "next";

import { siteInfo } from "@/content/site";
import { buildWhatsAppUrl } from "@/domain/integration-urls/whatsapp-url";

export const metadata: Metadata = {
  title: "Privacy Notice",
  description:
    "How Kaivalyam Homestay collects and uses website analytics data, and how visitors can opt out.",
};

const whatsAppUrl = buildWhatsAppUrl({ phone: siteInfo.whatsappNumber });

export default function PrivacyPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-12 md:px-6 md:py-16">
      <header className="mb-8">
        <h1 className="font-serif text-3xl font-semibold text-secondary sm:text-4xl">
          Privacy Notice
        </h1>
        <p className="mt-3 max-w-prose text-base text-on-surface-muted">
          This notice explains what data {siteInfo.name} collects when you visit
          this website, why we collect it, and the choices you have.
        </p>
      </header>

      <div className="flex flex-col gap-8 text-base leading-relaxed text-on-surface">
        <section aria-labelledby="privacy-analytics-heading">
          <h2
            id="privacy-analytics-heading"
            className="font-serif text-xl font-semibold text-secondary"
          >
            Analytics data we collect
          </h2>
          <p className="mt-3 max-w-prose">
            To understand how the site is used and to improve it, we collect
            limited, measurement-only analytics. This is gathered through Google
            Analytics 4 and a first-party counter on our own server, and
            includes:
          </p>
          <ul className="mt-3 flex max-w-prose list-disc flex-col gap-2 pl-6">
            <li>
              pages viewed and the order they were viewed in (page views);
            </li>
            <li>
              anonymous visit sessions, used to estimate pages per visit and
              visit duration;
            </li>
            <li>a cumulative count of total visits to the site;</li>
            <li>
              general technical information your browser sends, such as
              approximate region, device type, and referring page.
            </li>
          </ul>
          <p className="mt-3 max-w-prose">
            We do not use this analytics data to identify you personally, and we
            do not sell it. Booking and payment details are handled by our
            booking and payment providers under their own privacy terms, not by
            this analytics collection.
          </p>
        </section>

        <section aria-labelledby="privacy-choices-heading">
          <h2
            id="privacy-choices-heading"
            className="font-serif text-xl font-semibold text-secondary"
          >
            Your choices
          </h2>
          <p className="mt-3 max-w-prose">
            You can opt out of analytics at any time, and your choice is
            remembered on your device. When you opt out, no further analytics
            events are sent from your browser. You can also use your browser or
            device privacy controls to limit collection.
          </p>
        </section>

        <section aria-labelledby="privacy-contact-heading">
          <h2
            id="privacy-contact-heading"
            className="font-serif text-xl font-semibold text-secondary"
          >
            Questions
          </h2>
          <p className="mt-3 max-w-prose">
            If you have any questions about this notice or your data, contact us
            by email at{" "}
            <a
              href={`mailto:${siteInfo.email}`}
              className="text-primary underline underline-offset-4"
            >
              {siteInfo.email}
            </a>{" "}
            or{" "}
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-4"
            >
              message us on WhatsApp
            </a>
            .
          </p>
          <p className="mt-6 max-w-prose text-sm text-on-surface-muted">
            This notice may be updated from time to time; the latest version
            always lives on this page.
          </p>
        </section>
      </div>
    </article>
  );
}
