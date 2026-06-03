/**
 * WATI WhatsApp notification adapter — SERVER-SIDE ONLY.
 * ---------------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 14.4)
 *
 * Sends a WhatsApp booking notification to a Guest via the WATI API after a
 * Guest completes a reservation (Req 16.4). This module is the ONLY place that
 * talks to WATI; the rest of the app depends on the {@link watiNotify}
 * interface, never on vendor specifics (structure.md, integration layer).
 *
 * ─── Security (non-negotiable) ───────────────────────────────────────────
 *   • Credentials (`WATI_API_ENDPOINT`, `WATI_API_TOKEN`, and the template name
 *     `WATI_TEMPLATE_NAME`) are read from `process.env` at call time and stay
 *     server-side. They are NEVER bundled into client code — do not import this
 *     module from a Client Component.
 *   • The consent decision is NOT made here. The caller (the booking webhook)
 *     gates every call behind the pure `mayNotify` consent gate (Req 16.5).
 *     This adapter assumes consent has already been verified and simply
 *     dispatches; keeping the gate in one verified place avoids divergent
 *     checks.
 *   • We never log the API token, and we log only a masked phone number, never
 *     the full PII.
 *
 * ─── Resilience ──────────────────────────────────────────────────────────
 *   • If env is not configured (dev / build without secrets), this is a graceful
 *     no-op with a single logged warning — so the app builds and runs locally
 *     without provisioning WATI.
 *   • Delivery is retried with exponential backoff (default 3 attempts). A final
 *     failure is swallowed and logged — it is NEVER thrown into the caller.
 *     Booking CONFIRMATION is owned by eeabsolute, not by notification
 *     delivery, so a WhatsApp hiccup must not fail the webhook.
 */

import type { BillingDetails } from "../../content/types";

/**
 * The minimal booking shape {@link watiNotify} needs to dispatch a message.
 *
 * Structurally compatible with the design's `BookingNotification`: it carries
 * the Guest `phone` (required to address the WhatsApp message), the booking
 * reference, and the billing total used in the message body. `consent` is
 * intentionally NOT part of this type — the gate is the caller's job (Req 16.5).
 */
export interface WatiBookingNotification {
  /** Guest WhatsApp number (E.164-ish). Required to address the message. */
  phone: string;
  /** Completed-reservation reference shown in the message. */
  bookingRef: string;
  /** Billing details; the total + currency appear in the message body. */
  billing: BillingDetails;
}

/** Tunable retry policy; defaults give 3 attempts with exponential backoff. */
export interface WatiRetryOptions {
  /** Total send attempts before giving up (>= 1). Default 3. */
  maxAttempts?: number;
  /** Base backoff in ms; delay = baseDelayMs * 2^(attempt-1). Default 300. */
  baseDelayMs?: number;
}

/** Resolved WATI credentials read from the environment (server-side only). */
interface WatiConfig {
  endpoint: string;
  token: string;
  templateName: string;
}

const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_BASE_DELAY_MS = 300;

/**
 * Read WATI credentials from `process.env`, returning `null` when any required
 * value is missing/blank so the caller can no-op gracefully (dev/build).
 */
function readWatiConfig(): WatiConfig | null {
  const endpoint = process.env.WATI_API_ENDPOINT?.trim();
  const token = process.env.WATI_API_TOKEN?.trim();
  // Template is optional to override; default to a conventional name.
  const templateName =
    process.env.WATI_TEMPLATE_NAME?.trim() || "booking_confirmation";

  if (!endpoint || !token) return null;
  return { endpoint, token, templateName };
}

/** Mask a phone number for logs: keep the last 4 digits only (no full PII). */
function maskPhone(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.length <= 4) return "****";
  return `${"*".repeat(Math.max(0, trimmed.length - 4))}${trimmed.slice(-4)}`;
}

/** Promise-based delay used between retry attempts. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Perform a single WATI send attempt. Throws on a network error or non-2xx
 * response so the retry loop can decide whether to back off and try again.
 */
async function sendOnce(
  config: WatiConfig,
  booking: WatiBookingNotification,
): Promise<void> {
  const url = `${config.endpoint.replace(/\/+$/, "")}/api/v1/sendTemplateMessage`;

  const body = {
    template_name: config.templateName,
    broadcast_name: `booking_${booking.bookingRef}`,
    receivers: [
      {
        whatsappNumber: booking.phone,
        customParams: [
          { name: "booking_ref", value: booking.bookingRef },
          {
            name: "amount",
            value: `${booking.billing.currency} ${booking.billing.amount}`,
          },
        ],
      },
    ],
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`WATI responded with HTTP ${response.status}`);
  }
}

/**
 * Send a WhatsApp booking notification via WATI (Req 16.4), with retry/backoff.
 *
 * Contract:
 *   • Consent MUST already be verified by the caller via `mayNotify` (Req 16.5).
 *   • No-ops with a logged warning when WATI env is not configured.
 *   • Retries up to `maxAttempts` times with exponential backoff; a final
 *     failure is logged and SWALLOWED — this function never throws into the
 *     caller, so notification delivery can never fail a booking.
 *
 * @param booking - the guest/booking details to notify about.
 * @param options - optional retry tuning (mainly for tests).
 * @returns `true` if a send succeeded, `false` if it no-op'd or ultimately failed.
 */
export async function watiNotify(
  booking: WatiBookingNotification,
  options: WatiRetryOptions = {},
): Promise<boolean> {
  const config = readWatiConfig();
  if (!config) {
    console.warn(
      "[wati] WATI_API_ENDPOINT / WATI_API_TOKEN not configured — skipping WhatsApp notification (no-op).",
    );
    return false;
  }

  const maxAttempts = Math.max(1, options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS);
  const baseDelayMs = Math.max(0, options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS);

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await sendOnce(config, booking);
      return true;
    } catch (error) {
      lastError = error;
      // Back off before the next attempt (exponential), but not after the last.
      if (attempt < maxAttempts) {
        await delay(baseDelayMs * 2 ** (attempt - 1));
      }
    }
  }

  // Final failure: swallow + log (booking confirmation is owned by eeabsolute).
  console.error(
    `[wati] failed to notify booking ${booking.bookingRef} (phone ${maskPhone(
      booking.phone,
    )}) after ${maxAttempts} attempt(s):`,
    lastError instanceof Error ? lastError.message : lastError,
  );
  return false;
}
