/**
 * Contact page (`/contact`) — contact details, directions, WhatsApp, and map.
 * ---------------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 13.1)
 *
 * The Navigation's "Contact" link points here. This page satisfies the full
 * Contact_Page contract (Req 9.1–9.5, 16.2):
 *
 *   • Req 9.1  — displays the homestay's contact details, incl. phone & email.
 *   • Req 9.2  — a "Get Directions" action opening the property location in an
 *                external map service (destination from `buildDirectionsUrl`).
 *   • Req 9.5  — selecting "Get Directions" opens route directions in a SEPARATE
 *                browser context (`target="_blank"` + `rel="noopener noreferrer"`).
 *   • Req 9.3  — a WhatsApp chat link opening the WhatsApp_Service, built by the
 *                pure `buildWhatsAppUrl` via the reusable `WhatsAppEntryPoint`.
 *   • Req 16.2 — the WhatsApp entry point appears on Home AND Contact.
 *   • Req 9.4  — the property location on an embedded Wayanad map (`<iframe>`),
 *                with a graceful "Get Directions" fallback if the iframe fails
 *                (handled by the `ContactMap` client island).
 *
 * The page itself is a SERVER component (SSG marketing surface). Only the map,
 * which needs an `error` handler to detect a failed embed, is a thin client
 * island (`ContactMap`). Contact values come from the single typed source
 * `siteInfo`; the directions destination from the pure `buildDirectionsUrl`;
 * and the WhatsApp deep link from the shared `WhatsAppEntryPoint`.
 *
 * Per-page metadata/OpenGraph/JSON-LD are wired centrally via `buildPageMeta`
 * in task 15.3; this file declares a minimal, self-describing local title +
 * description in the meantime (Req 21.1).
 *
 * _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 16.2_
 */
import type { Metadata } from "next";
import { Mail, MapPin, Navigation, Phone } from "lucide-react";

import { Icon } from "@/components/ui";
import { cn } from "@/components/ui/cn";
import { buttonClassNames, focusRing } from "@/components/ui/buttonStyles";
import { WhatsAppEntryPoint } from "@/integration/whatsapp";
import { siteInfo } from "@/content/site";
import { KAIVALYAM_DIRECTIONS_URL } from "@/domain/integration-urls/directions-url";
import { ContactMap } from "./ContactMap";
import { buildPageMeta } from "@/domain/seo/seo";

export const metadata: Metadata = buildPageMeta('contact');

/** Digits-only phone for the `tel:` URI (preserves leading +). */
function telHref(phone: string): string {
  const trimmed = phone.trim();
  const plus = trimmed.startsWith("+") ? "+" : "";
  return `tel:${plus}${trimmed.replace(/[^\d]/g, "")}`;
}

/** Shared treatment for a plain inline contact link (phone/email). */
const contactLink = cn(
  "inline-flex min-h-11 items-center gap-1 rounded-sm font-medium text-primary",
  "underline underline-offset-4 hover:text-secondary motion-safe:transition-colors",
  focusRing,
);

export default function ContactPage() {
  const { name, phone, email, address } = siteInfo;

  return (
    <article className="mx-auto w-full max-w-5xl px-4 py-12 md:px-6 md:py-16">
      <header className="mb-10">
        <h1 className="font-serif text-3xl font-semibold text-secondary sm:text-4xl">
          Contact us
        </h1>
        <p className="mt-3 max-w-prose text-base text-on-surface-muted">
          We&rsquo;d love to help you plan a calm, unhurried stay at {name}.
          Reach us by phone, email, or WhatsApp, and find your way to us in
          Padichira, Wayanad.
        </p>
      </header>

      <div className="grid gap-10 md:grid-cols-2">
        {/* ---- Contact details: phone + email + address (Req 9.1) ---- */}
        <section aria-labelledby="contact-details-heading">
          <h2
            id="contact-details-heading"
            className="font-serif text-2xl font-semibold text-secondary"
          >
            Get in touch
          </h2>

          <dl className="mt-6 flex flex-col gap-6">
            <div className="flex items-start gap-3">
              <Icon icon={Phone} aria-hidden className="mt-1 text-primary" />
              <div>
                <dt className="text-sm font-medium text-on-surface-muted">
                  Phone
                </dt>
                <dd className="mt-1 text-base text-on-surface">
                  <a href={telHref(phone)} className={contactLink}>
                    {phone}
                  </a>
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Icon icon={Mail} aria-hidden className="mt-1 text-primary" />
              <div>
                <dt className="text-sm font-medium text-on-surface-muted">
                  Email
                </dt>
                <dd className="mt-1 text-base text-on-surface">
                  <a href={`mailto:${email}`} className={contactLink}>
                    {email}
                  </a>
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Icon icon={MapPin} aria-hidden className="mt-1 text-primary" />
              <div>
                <dt className="text-sm font-medium text-on-surface-muted">
                  Address
                </dt>
                <dd className="mt-1 max-w-prose text-base not-italic text-on-surface">
                  <address className="not-italic">{address.formatted}</address>
                </dd>
              </div>
            </div>
          </dl>

          {/* ---- Primary actions: WhatsApp (9.3/16.2) + Directions (9.2/9.5) ---- */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <WhatsAppEntryPoint message="Hi Kaivalyam, I have a question about staying with you." />

            <a
              href={KAIVALYAM_DIRECTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClassNames({ variant: "secondary" })}
            >
              <Icon icon={Navigation} aria-hidden />
              Get Directions
            </a>
          </div>
          <p className="mt-2 text-sm text-on-surface-muted">
            &ldquo;Get Directions&rdquo; opens route directions in your map app
            in a new tab.
          </p>
        </section>

        {/* ---- Embedded Wayanad map with directions fallback (Req 9.4) ---- */}
        <section aria-labelledby="contact-map-heading">
          <h2
            id="contact-map-heading"
            className="font-serif text-2xl font-semibold text-secondary"
          >
            Find us on the map
          </h2>
          <p className="mt-3 max-w-prose text-base text-on-surface-muted">
            Kaivalyam Homestay sits in the hill village of Padichira, about
            10&nbsp;km from Pulpally in Wayanad, Kerala.
          </p>
          <div className="mt-6">
            <ContactMap />
          </div>
        </section>
      </div>
    </article>
  );
}
