/**
 * Booking page (`/book`) — the in-site host for the eeabsolute booking widget.
 * ---------------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 14.1)
 *
 * `BookNowButton` links here (`BOOKING_HREF = '/book'`); this page mounts the
 * `BookingWidget`, which embeds the eeabsolute.com Booking_Engine (booking +
 * PMS + Channel Manager, with Razorpay-in-flow) over HTTPS.
 *
 * Per-page metadata/OpenGraph/JSON-LD are wired centrally via `buildPageMeta`
 * in task 15.3.
 */
import type { Metadata } from "next";
import { BookingWidget } from "@/integration/booking";
import { buildPageMeta } from "@/domain/seo/seo";

export const metadata: Metadata = buildPageMeta('book');

export default function BookPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <header className="mb-8 text-center">
        <h1 className="font-serif text-3xl font-semibold text-secondary sm:text-4xl">
          Book your stay
        </h1>
        <p className="mx-auto mt-2 max-w-prose text-base text-on-surface-muted">
          Check availability and reserve directly. Payment is handled securely
          inside the booking flow.
        </p>
      </header>
      <BookingWidget />
    </div>
  );
}
