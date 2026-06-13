/**
 * Booking page (`/book`) — booking enquiry / lead-generation form.
 * ----------------------------------------------------------------
 * Feature: kaivalyam-homestay-website
 *
 * `BookNowButton` links here. Instead of a third-party booking engine, the
 * page presents a simple enquiry form; submissions are emailed to the owner.
 * Guests can also reach out directly via WhatsApp or phone.
 */
import type { Metadata } from "next";
import { Phone } from "lucide-react";

import { LeadForm } from "@/components/sections/LeadForm";
import { WhatsAppEntryPoint } from "@/integration/whatsapp";
import { siteInfo } from "@/content/site";
import { cn } from "@/components/ui/cn";
import { focusRing } from "@/components/ui/buttonStyles";
import { buildPageMeta } from "@/domain/seo/seo";

export const metadata: Metadata = buildPageMeta('book');

function telHref(phone: string): string {
  const plus = phone.trim().startsWith("+") ? "+" : "";
  return `tel:${plus}${phone.replace(/[^\d]/g, "")}`;
}

export default function BookPage() {
  const { phone } = siteInfo;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 md:py-16">
      <header className="mb-8 text-center">
        <h1 className="font-serif text-3xl font-semibold text-secondary sm:text-4xl">
          Book Your Stay
        </h1>
        <p className="mx-auto mt-3 max-w-prose text-base text-on-surface-muted">
          Share a few details and our team will get back to you to confirm
          availability and plan your perfect Kaivalyam getaway.
        </p>
      </header>

      <LeadForm />

      {/* Direct contact alternatives */}
      <div className="mt-8 flex flex-col items-center gap-4 text-center">
        <p className="text-sm text-on-surface-muted">
          Prefer to reach us directly?
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <WhatsAppEntryPoint message="Hi Kaivalyam, I'd like to book a stay." />
          <a
            href={telHref(phone)}
            className={cn(
              "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border-2 border-primary px-5 py-2",
              "font-medium text-primary hover:bg-surface-alt",
              "motion-safe:transition-colors motion-safe:duration-200",
              focusRing,
            )}
          >
            <Phone size={18} aria-hidden />
            Call {phone}
          </a>
        </div>
      </div>
    </div>
  );
}
