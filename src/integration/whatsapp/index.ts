/**
 * WhatsApp integration barrel.
 * Feature: kaivalyam-homestay-website (task 14.2)
 *
 * Re-exports the reusable `WhatsAppEntryPoint` click-to-chat control used by the
 * Home page (task 11.1) and the Contact page (task 13.1) — Req 16.1, 16.2, 16.3.
 *
 * The `wa.me` deep link itself is built by the pure `buildWhatsAppUrl` domain
 * function in `src/domain/integration-urls/whatsapp-url.ts`; the consent-gated
 * server-side booking notification (`watiNotify`) is a separate concern handled
 * by the booking webhook route handler, not this presentational entry point.
 */
export { WhatsAppEntryPoint } from "./WhatsAppEntryPoint";
export type {
  WhatsAppEntryPointProps,
  WhatsAppEntryPointVariant,
  WhatsAppEntryPointSize,
} from "./WhatsAppEntryPoint";
