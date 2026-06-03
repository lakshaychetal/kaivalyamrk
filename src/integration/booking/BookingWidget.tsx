/**
 * `BookingWidget` — host for the eeabsolute.com booking embed.
 * ---------------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 14.1)
 *
 * This is the SINGLE place the website embeds the eeabsolute.com Booking_Engine
 * (Req 12.1). eeabsolute provides booking + PMS + Channel Manager through this
 * one embed (Req 13.1/13.2, 14.1), and Razorpay runs INSIDE that flow (Req
 * 15.1) — all of it is OPAQUE to this site. We build no booking, inventory,
 * channel, or payment logic; our responsibility is the *embed contract*:
 *   • a correctly-configured, HTTPS embed URL (built by `buildBookingUrl`),
 *   • good loading UX while the widget initializes (Req 12.7),
 *   • a graceful, actionable fallback if it never loads (Req 12.6).
 *
 * State machine: `loading → ready → failed`
 * ──────────────────────────────────────────
 *   loading  The iframe is mounted (so it can begin fetching) and a loading
 *            skeleton/indicator is shown over it (Req 12.7). A load TIMEOUT is
 *            armed; if the iframe never loads within `loadTimeoutMs`, we move
 *            to `failed` rather than leaving a blank area.
 *   ready    The iframe fired `onLoad`; the skeleton is removed and the
 *            embedded eeabsolute widget is shown.
 *   failed   The iframe errored (`onError`) or timed out. We render a fallback
 *            message with ALTERNATE booking contacts — phone (`tel:`), WhatsApp
 *            (`buildWhatsAppUrl`), and email (`mailto:`) — plus a Retry action
 *            that re-arms loading (Req 12.6).
 *
 * HTTPS (Req 15.5): the embed `src` is produced by `buildBookingUrl`, which
 * always returns an absolute `https://` URL (it upgrades any non-https base).
 * Serving the host over HTTPS keeps the Razorpay-in-flow on an encrypted
 * connection that we never see into.
 *
 * Layering (structure.md): lives in `integration/` (the only layer that touches
 * third-party vendors). It depends on `domain/` for pure URL building and on
 * `content/` for the contact fallback — never the other way around. No secrets
 * or API keys are used: the embed is a public URL.
 *
 * Accessibility:
 *   • the `<iframe>` carries a descriptive `title`,
 *   • the loading indicator is a polite live region (`role="status"` +
 *     `aria-live="polite"`) so screen readers announce it without interrupting,
 *   • the fallback is readable text with clearly-labeled, actionable contacts,
 *   • the skeleton shimmer is `motion-safe` only (disabled under
 *     `prefers-reduced-motion`, Req 22.7).
 */
"use client";

import { useEffect, useState } from "react";
import { CalendarCheck, Mail, MessageCircle, Phone, RefreshCw } from "lucide-react";
import {
  buildBookingUrl,
  kaivalyamBookingConfig,
  type BookingConfig,
} from "@/domain/integration-urls/booking-url";
import { buildWhatsAppUrl } from "@/domain/integration-urls/whatsapp-url";
import { siteInfo } from "@/content/site";
import { Button } from "@/components/ui/Button";
import { Icon, type LucideIcon } from "@/components/ui/Icon";
import { buttonClassNames } from "@/components/ui/buttonStyles";
import { cn } from "@/components/ui/cn";

/** The three states of the embed lifecycle. */
export type WidgetState = "loading" | "ready" | "failed";

/** Default time to wait for the embed to load before declaring failure (ms). */
export const DEFAULT_LOAD_TIMEOUT_MS = 12_000;

export interface BookingWidgetProps {
  /**
   * The eeabsolute booking configuration. Defaults to the canonical Kaivalyam
   * config (India / Kerala / Wayanad), so every booking surface resolves to one
   * place. Pass a narrower config (e.g. a per-room `propertyId`) to override.
   */
  config?: BookingConfig;
  /**
   * Accessible title for the embedded widget's `<iframe>`. Defaults to a
   * descriptive booking title.
   */
  title?: string;
  /**
   * How long to wait (ms) for the iframe to load before moving to `failed`.
   * Defaults to {@link DEFAULT_LOAD_TIMEOUT_MS}.
   */
  loadTimeoutMs?: number;
  /** Extra classes appended to the widget container. */
  className?: string;
}

/** Strip a phone string to a `tel:`-safe value: a leading `+` then digits. */
function toTelHref(phone: string): string {
  const trimmed = phone.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  return `tel:${hasPlus ? "+" : ""}${digits}`;
}

/**
 * One alternate-contact link rendered inside the failure fallback. Anchors
 * (navigation, not actions) styled with the shared DS button system so they
 * match the rest of the site without re-using the reserved primary CTA style.
 */
function ContactLink({
  href,
  icon,
  children,
  external = false,
}: {
  href: string;
  icon: LucideIcon;
  children: React.ReactNode;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      className={buttonClassNames({ variant: "secondary", size: "md" })}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      <Icon icon={icon} size="md" />
      {children}
    </a>
  );
}

/**
 * Host the eeabsolute.com booking embed with a `loading → ready → failed`
 * state machine, a load timeout, a retry, and an alternate-contact fallback.
 */
export function BookingWidget({
  config = kaivalyamBookingConfig,
  title = "Kaivalyam Homestay booking — check availability and reserve",
  loadTimeoutMs = DEFAULT_LOAD_TIMEOUT_MS,
  className,
}: BookingWidgetProps) {
  const [state, setState] = useState<WidgetState>("loading");
  // `attempt` forces the iframe to remount on retry so `onLoad`/`onError` fire
  // again for the fresh load.
  const [attempt, setAttempt] = useState(0);

  // Built by the pure domain builder, which GUARANTEES an absolute https URL
  // (Req 15.5). No secrets — the embed is a public URL.
  const bookingUrl = buildBookingUrl(config);

  // Arm the load timeout whenever we (re-)enter the loading state. If the
  // iframe never loads in time, fall back to `failed` instead of a blank area.
  useEffect(() => {
    if (state !== "loading") return;
    const timer = setTimeout(() => {
      // Only the still-loading widget times out; a load/error already moved on.
      setState((prev) => (prev === "loading" ? "failed" : prev));
    }, loadTimeoutMs);
    return () => clearTimeout(timer);
  }, [state, attempt, loadTimeoutMs]);

  function handleRetry() {
    setAttempt((n) => n + 1);
    setState("loading");
  }

  const isFailed = state === "failed";
  const isLoading = state === "loading";

  // Alternate-contact hrefs for the failure fallback, sourced from siteInfo.
  const telHref = toTelHref(siteInfo.phone);
  const mailHref = `mailto:${siteInfo.email}`;
  const whatsAppHref = buildWhatsAppUrl({ phone: siteInfo.whatsappNumber });

  return (
    <section
      aria-label="Booking"
      data-state={state}
      className={cn(
        "relative w-full overflow-hidden rounded-xl border border-border bg-surface",
        className,
      )}
    >
      {isFailed ? (
        // ── failed (Req 12.6): fallback message + alternate booking contacts ──
        <div
          role="alert"
          className="flex flex-col items-center gap-4 p-6 text-center sm:p-8"
        >
          <Icon
            icon={CalendarCheck}
            size="xl"
            className="text-secondary"
            label="Booking"
          />
          <div className="flex flex-col gap-1">
            <h2 className="font-serif text-2xl font-semibold text-secondary">
              We couldn&rsquo;t load online booking
            </h2>
            <p className="mx-auto max-w-prose text-base text-on-surface-muted">
              The booking widget didn&rsquo;t load. You can still reserve your
              stay — reach us directly and we&rsquo;ll take it from here, or try
              loading the widget again.
            </p>
          </div>

          <div className="flex flex-col flex-wrap items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <ContactLink href={telHref} icon={Phone}>
              Call {siteInfo.phone}
            </ContactLink>
            <ContactLink href={whatsAppHref} icon={MessageCircle} external>
              WhatsApp us
            </ContactLink>
            <ContactLink href={mailHref} icon={Mail}>
              Email us
            </ContactLink>
          </div>

          <Button variant="secondary" leadingIcon={RefreshCw} onClick={handleRetry}>
            Try again
          </Button>
        </div>
      ) : (
        // ── loading + ready: keep the iframe mounted so it can load ──
        <div className="relative min-h-[640px] w-full">
          <iframe
            // Remount on retry so onLoad/onError fire for the new attempt.
            key={attempt}
            src={bookingUrl}
            title={title}
            loading="lazy"
            // Razorpay-in-flow may use the Payment Request API inside the embed.
            allow="payment"
            referrerPolicy="strict-origin-when-cross-origin"
            onLoad={() => setState("ready")}
            onError={() => setState("failed")}
            className={cn(
              "absolute inset-0 h-full w-full border-0",
              // Reveal only once ready so the skeleton owns the space meanwhile.
              isLoading ? "opacity-0" : "opacity-100",
            )}
          />

          {isLoading && (
            // ── loading (Req 12.7): skeleton + polite live announcement ──
            <div
              role="status"
              aria-live="polite"
              className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-surface p-6 text-center"
            >
              <div
                aria-hidden
                className="h-12 w-12 rounded-full border-4 border-surface-alt border-t-primary motion-safe:animate-spin"
              />
              <div className="flex w-full max-w-md flex-col gap-3" aria-hidden>
                <div className="h-6 w-2/3 self-center rounded bg-surface-alt motion-safe:animate-pulse" />
                <div className="h-24 w-full rounded bg-surface-alt motion-safe:animate-pulse" />
                <div className="h-10 w-1/2 self-center rounded bg-surface-alt motion-safe:animate-pulse" />
              </div>
              <p className="text-base text-on-surface-muted">
                Loading the booking widget&hellip;
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
