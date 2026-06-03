/**
 * Booking integration barrel.
 * Feature: kaivalyam-homestay-website (task 14.1)
 *
 * Re-exports the `BookingWidget` host — the single place the website embeds the
 * eeabsolute.com Booking_Engine (booking + PMS + Channel Manager, with
 * Razorpay-in-flow). The pure embed-URL builder (`buildBookingUrl`) lives in
 * `src/domain/integration-urls/booking-url.ts` (task 6.3); the booking webhook
 * (task 14.4) lives under `src/app/api/booking/`.
 */
export { BookingWidget, DEFAULT_LOAD_TIMEOUT_MS } from "./BookingWidget";
export type { BookingWidgetProps, WidgetState } from "./BookingWidget";
