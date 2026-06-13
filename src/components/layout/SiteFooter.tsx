/**
 * `SiteFooter` — the persistent site footer (Req 1.7, 23.2).
 * ----------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 10.2)
 *
 * Rendered on EVERY page (mounted in the root layout by task 10.3). A single
 * semantic <footer> landmark (`role="contentinfo"`) that carries, per Req 1.7:
 *
 *   1. the homestay NAME + a short brand line (`siteInfo.name` / tagline);
 *   2. a CONTACT SUMMARY — phone (`tel:`), email (`mailto:`), WhatsApp
 *      (`wa.me`, built via the pure `buildWhatsAppUrl`), and a short address
 *      line, all from `siteInfo`;
 *   3. SECONDARY NAVIGATION — reuses the single navigation source of truth
 *      (`navigationModel.items` = the Req 1.2 primary links) plus
 *      `secondaryNavItems` (Reach Us), so the footer can never diverge from the
 *      header's link set; and
 *   4. a "Photo credits" LINK to the Photo Credits page (Req 23.2) — route
 *      `/photo-credits` (the page itself is built later by task 12.4).
 *
 * Presentation contract (matches the Design System):
 *   • SEMANTIC tokens only — `bg-surface-alt`, `text-on-surface`,
 *     `text-on-surface-muted`, `border-border`, … — never raw hex.
 *   • Lucide is the single icon family, rendered through the DS `Icon`; the
 *     contact icons are decorative (`aria-hidden`) because each sits beside a
 *     visible text label (Req 22.5).
 *   • Internal links use `next/link`; `tel:` / `mailto:` / `wa.me` use plain
 *     anchors. The WhatsApp link opens in a new context.
 *   • Every link is a ≥44×44px touch target with ≥8px spacing and the shared
 *     `focusRing` visible focus indicator (Req 18.5, 22.3); information is
 *     never conveyed by color alone (icon + text, Req 22.6).
 *   • Responsive: a single stacked column on mobile, multiple columns from the
 *     tablet/desktop breakpoints (mobile-first, Req 18.1/18.2).
 *   • No non-essential motion; any transition is `motion-safe` only (Req 22.7).
 *
 * Server component (no client interactivity) — self-contained and exported for
 * task 10.3 to mount in the root layout.
 */
import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone, Images, ShieldCheck } from "lucide-react";

import { Icon } from "@/components/ui";
import { cn } from "@/components/ui/cn";
import { focusRing } from "@/components/ui/buttonStyles";
import {
  navigationModel,
  secondaryNavItems,
  type NavItem,
} from "@/domain/navigation/navigation";
import { siteInfo } from "@/content/site";
import { buildWhatsAppUrl } from "@/domain/integration-urls/whatsapp-url";

/**
 * The Photo Credits route (Req 23.2). The page is built by task 12.4; the
 * footer only LINKS here. Kept as a local constant because it is not part of
 * the primary navigation `ROUTES` set.
 */
export const PHOTO_CREDITS_HREF = "/photo-credits" as const;

/**
 * The Privacy Notice route (Req 17.7). The published privacy notice the
 * first-party analytics collection abides by; the footer LINKS here so the
 * notice is reachable from every page.
 */
export const PRIVACY_HREF = "/privacy" as const;

/**
 * The complete secondary-navigation link set: the primary (header) links plus
 * the footer-eligible secondary items (Reach Us). Derived from the single
 * navigation model so the footer stays in lock-step with the header.
 */
const footerNavItems: readonly NavItem[] = [
  ...navigationModel.items,
  ...secondaryNavItems,
];

/** A WhatsApp click-to-chat deep link to the homestay account (Req 9.3/16.x). */
const whatsAppUrl = buildWhatsAppUrl({ phone: siteInfo.whatsappNumber });

/**
 * Shared link treatment: a ≥44px touch target, comfortable inline padding for
 * ≥8px neighbour spacing, the DS focus ring, and a `motion-safe` color
 * transition on hover (disabled under reduced motion).
 */
const footerLink = cn(
  "inline-flex min-h-11 items-center gap-2 rounded-md px-1 py-2",
  "text-on-surface-muted hover:text-on-surface",
  "motion-safe:transition-colors motion-safe:duration-200",
  focusRing,
);

/** A small heading shared by each footer column. */
function FooterHeading({ id, children }: { id: string; children: string }) {
  return (
    <h3
      id={id}
      className="font-serif text-base font-semibold text-secondary"
    >
      {children}
    </h3>
  );
}

/**
 * The persistent site footer. Mounted once in the root layout (task 10.3) so it
 * appears on every page (Req 1.7).
 */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      role="contentinfo"
      aria-labelledby="site-footer-heading"
      className="border-t border-border bg-surface-alt text-on-surface"
    >
      {/* Visually-hidden landmark label for assistive tech. */}
      <h2 id="site-footer-heading" className="sr-only">
        {siteInfo.name} — site footer
      </h2>

      <div className="mx-auto w-full max-w-6xl px-4 py-12 md:px-6 md:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {/* 1. Brand / homestay name + short description (Req 1.7). */}
          <section aria-labelledby="footer-brand-heading" className="md:col-span-1">
            <FooterHeading id="footer-brand-heading">
              {siteInfo.name}
            </FooterHeading>
            <p className="mt-3 text-sm font-medium uppercase tracking-wide text-on-surface-muted">
              {siteInfo.tagline}
            </p>
            <p className="mt-3 max-w-prose text-base text-on-surface-muted">
              {siteInfo.shortDescription}
            </p>
          </section>

          {/* 2. Contact summary — phone, email, WhatsApp, address (Req 1.7). */}
          <section aria-labelledby="footer-contact-heading" className="md:col-span-1">
            <FooterHeading id="footer-contact-heading">Contact</FooterHeading>
            <ul className="mt-3 flex flex-col gap-1">
              <li>
                <a
                  href={`tel:${siteInfo.phone.replace(/\s+/g, "")}`}
                  className={footerLink}
                >
                  <Icon icon={Phone} size="sm" />
                  <span>{siteInfo.phone}</span>
                </a>
              </li>
              <li>
                <a
                  href={`tel:${siteInfo.landline.replace(/\s+/g, "")}`}
                  className={footerLink}
                >
                  <Icon icon={Phone} size="sm" />
                  <span>{siteInfo.landline}</span>
                </a>
              </li>
              <li>
                <a href={`mailto:${siteInfo.email}`} className={footerLink}>
                  <Icon icon={Mail} size="sm" />
                  <span>{siteInfo.email}</span>
                </a>
              </li>
              <li>
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={footerLink}
                >
                  <Icon icon={MessageCircle} size="sm" />
                  <span>Chat on WhatsApp</span>
                </a>
              </li>
              <li>
                <p className="flex min-h-11 items-start gap-2 px-1 py-2 text-base text-on-surface-muted">
                  <span className="mt-1 shrink-0">
                    <Icon icon={MapPin} size="sm" />
                  </span>
                  <span>
                    <span>{siteInfo.address.line1}</span>
                    <br />
                    {siteInfo.address.village}, {siteInfo.address.town},{" "}
                    {siteInfo.address.district}, {siteInfo.address.state}{" "}
                    {siteInfo.address.postalCode}
                  </span>
                </p>
              </li>
            </ul>
          </section>

          {/* 3. Secondary navigation — the full nav link set incl. Reach Us. */}
          <nav
            aria-labelledby="footer-nav-heading"
            className="md:col-span-1"
          >
            <FooterHeading id="footer-nav-heading">Explore</FooterHeading>
            <ul className="mt-3 grid grid-cols-2 gap-x-4">
              {footerNavItems.map((item) => (
                <li key={item.id}>
                  <Link href={item.href} className={footerLink}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Bottom bar: copyright + the Photo Credits and Privacy Notice links. */}
        <div className="mt-10 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-on-surface-muted">
            © {year} {siteInfo.name}. All rights reserved.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <Link href={PHOTO_CREDITS_HREF} className={footerLink}>
              <Icon icon={Images} size="sm" />
              <span>Photo credits</span>
            </Link>
            <Link href="/privacy" className={footerLink}>
              <Icon icon={ShieldCheck} size="sm" />
              <span>Privacy notice</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
