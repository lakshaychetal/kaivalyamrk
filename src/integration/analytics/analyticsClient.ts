/**
 * First-party + GA4 analytics client (browser).
 * ---------------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 14.3)
 *
 * Emits page-view and session-start events to BOTH:
 *   1. Google Analytics 4 via `window.gtag` (Req 17.1–17.3), and
 *   2. the first-party ingestion endpoint `POST /api/analytics/event`
 *      (Req 17.1, 17.4 — feeds the cumulative counter + admin report).
 *
 * Design principles (all binding):
 *   • BEST-EFFORT / FIRE-AND-FORGET. Analytics is never allowed to block, slow,
 *     or break the UI. Every emit is wrapped in try/catch and uses
 *     `navigator.sendBeacon` when available (survives page unload), falling back
 *     to `fetch(..., { keepalive: true })`. Failures are swallowed silently.
 *   • GA4 IS OPTIONAL. The measurement id is read from `NEXT_PUBLIC_GA4_ID`; if
 *     unset, or if `window.gtag` has not loaded, GA4 emits are no-ops. The
 *     first-party endpoint still receives events.
 *   • PRIVACY-RESPECTING (Req 17.7). Collection is governed by the published
 *     privacy notice. This client only emits while analytics consent is in an
 *     enabled state (see {@link isAnalyticsEnabled}); a visitor (or the privacy
 *     UI) can disable it via {@link disableAnalytics}, after which nothing is
 *     sent. The default state is configurable and documented below.
 *   • CLIENT-ONLY. This module touches `window`/`navigator`/`sessionStorage`
 *     and must run in the browser. The server owns the cumulative counter; the
 *     client never sends or trusts a counter value.
 *
 * Layering (structure.md): lives in `integration/`. It depends only on the
 * `AnalyticsEvent` TYPE from `content/` (erased at compile time) and the public
 * HTTP contract of the ingestion route — never on server internals or secrets.
 */

import type { AnalyticsEvent } from "../../content/types";

/** First-party ingestion endpoint (server route handler, task 14.3). */
export const ANALYTICS_ENDPOINT = "/api/analytics/event";

/** `sessionStorage` key holding the current first-party session id. */
const SESSION_ID_KEY = "kaivalyam.analytics.sessionId";

/**
 * `localStorage` key holding the analytics consent decision (Req 17.7).
 * Value is the string `"granted"` or `"denied"`; absence means "undecided",
 * which is resolved by {@link DEFAULT_ANALYTICS_ENABLED}.
 */
const CONSENT_KEY = "kaivalyam.analytics.consent";

/**
 * Default analytics state when the visitor has not made an explicit choice.
 *
 * The first-party analytics described by Requirement 17.7 is collected "in
 * accordance with a published privacy notice" — the notice (linked from the
 * footer / root layout, task 10.3) covers this measurement-only collection, so
 * the default is enabled. Flip this to `false` to require explicit opt-in
 * before ANY event is emitted; the rest of the client honors either choice.
 */
export const DEFAULT_ANALYTICS_ENABLED = true;

/**
 * The GA4 Measurement ID, configurable per environment (Req 17.1). Read from
 * the public env var so it is available in the browser bundle. When unset (the
 * default in dev / preview), all GA4 emits are no-ops.
 */
const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID;

/** Minimal `gtag` signature we rely on — declared to keep `window` typed. */
type GtagFn = (...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: GtagFn;
    dataLayer?: unknown[];
  }
}

/** True only in a browser environment with a DOM. */
function isBrowser(): boolean {
  return typeof window !== "undefined";
}

// ---------------------------------------------------------------------------
// Consent / privacy gate (Req 17.7)
// ---------------------------------------------------------------------------

/**
 * Whether analytics collection is currently allowed.
 *
 * Resolves the persisted consent decision: an explicit `"granted"`/`"denied"`
 * wins; otherwise {@link DEFAULT_ANALYTICS_ENABLED} applies. Any storage error
 * (e.g. privacy mode blocking `localStorage`) falls back to the default rather
 * than throwing, so the gate never breaks the page.
 */
export function isAnalyticsEnabled(): boolean {
  if (!isBrowser()) return false;
  try {
    const decision = window.localStorage.getItem(CONSENT_KEY);
    if (decision === "granted") return true;
    if (decision === "denied") return false;
    return DEFAULT_ANALYTICS_ENABLED;
  } catch {
    return DEFAULT_ANALYTICS_ENABLED;
  }
}

/**
 * Record explicit analytics consent (e.g. from a privacy-notice acknowledgment
 * control). After this, {@link isAnalyticsEnabled} returns `true`.
 */
export function enableAnalytics(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(CONSENT_KEY, "granted");
  } catch {
    // Swallow — analytics consent is best-effort and must never throw.
  }
}

/**
 * Opt out of analytics (Req 17.7). After this, every emit is suppressed and
 * {@link isAnalyticsEnabled} returns `false`. Also disables GA4 collection for
 * the configured measurement id via the standard `window['ga-disable-<id>']`
 * flag, so even an already-loaded gtag stops sending.
 */
export function disableAnalytics(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(CONSENT_KEY, "denied");
    if (GA4_ID) {
      (window as unknown as Record<string, unknown>)[`ga-disable-${GA4_ID}`] =
        true;
    }
  } catch {
    // Swallow — opting out must never throw into the UI.
  }
}

// ---------------------------------------------------------------------------
// Session management (Req 17.1 — visitor sessions)
// ---------------------------------------------------------------------------

/** Generate a session id, preferring `crypto.randomUUID`. */
function generateSessionId(): string {
  const cryptoObj =
    isBrowser() ? (window.crypto as Crypto | undefined) : undefined;
  if (cryptoObj && typeof cryptoObj.randomUUID === "function") {
    return cryptoObj.randomUUID();
  }
  return `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Read the current session id from `sessionStorage`, or `null` if none exists
 * (or storage is unavailable).
 */
function readSessionId(): string | null {
  if (!isBrowser()) return null;
  try {
    return window.sessionStorage.getItem(SESSION_ID_KEY);
  } catch {
    return null;
  }
}

/**
 * Ensure a session exists, returning its id. If one is already stored it is
 * reused; otherwise a new session id is generated, persisted, and a
 * `session_start` event is emitted (which the server counts as one cumulative
 * visit, Req 17.4). Returns `null` only when not in a browser.
 *
 * This is the idempotent entry point: calling it on every page load starts a
 * session exactly once per browser tab (sessionStorage lifetime), then reuses
 * it for subsequent page views.
 */
export function ensureSession(): string | null {
  if (!isBrowser()) return null;

  const existing = readSessionId();
  if (existing) return existing;

  return startSession();
}

/**
 * Force-start a NEW session: generate and persist a fresh id and emit a
 * `session_start` event. Prefer {@link ensureSession} for normal page loads;
 * use this only when a new session must be started deliberately.
 *
 * Returns the new session id, or `null` when not in a browser.
 */
export function startSession(): string | null {
  if (!isBrowser()) return null;

  const sessionId = generateSessionId();
  try {
    window.sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  } catch {
    // If sessionStorage is unavailable we still emit using the in-memory id so
    // the visit is counted; it just won't be reused across reloads.
  }

  emitEvent({ sessionId, type: "session_start", ts: Date.now() });
  return sessionId;
}

// ---------------------------------------------------------------------------
// Event emission (best-effort, fire-and-forget)
// ---------------------------------------------------------------------------

/**
 * Send an event to the first-party ingestion endpoint without blocking.
 *
 * Prefers `navigator.sendBeacon` (queued by the browser and resilient to page
 * unload); falls back to `fetch` with `keepalive: true`. Both paths are wrapped
 * so a failure (offline, blocked, 4xx/5xx) is swallowed — analytics must never
 * surface an error into the UI.
 */
function sendToFirstParty(event: AnalyticsEvent): void {
  if (!isBrowser()) return;

  try {
    const payload = JSON.stringify(event);

    const nav = window.navigator;
    if (nav && typeof nav.sendBeacon === "function") {
      const blob = new Blob([payload], { type: "application/json" });
      nav.sendBeacon(ANALYTICS_ENDPOINT, blob);
      return;
    }

    if (typeof fetch === "function") {
      // Fire-and-forget: ignore the promise and swallow any rejection.
      void fetch(ANALYTICS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {
        /* swallow — best-effort */
      });
    }
  } catch {
    // Swallow — never let analytics emission throw into the UI.
  }
}

/**
 * Forward an event to GA4 via `window.gtag`, guarded on every side.
 *
 * No-op when: the GA4 id is unset, `gtag` has not loaded, analytics is not in a
 * browser, or any call throws. Maps our event types to GA4 events
 * (`page_view` → `page_view` with `page_path`; `session_start` →
 * `session_start`).
 */
function sendToGa4(event: AnalyticsEvent): void {
  if (!isBrowser() || !GA4_ID) return;

  try {
    const gtag = window.gtag;
    if (typeof gtag !== "function") return;

    if (event.type === "page_view") {
      gtag("event", "page_view", {
        page_path: event.path,
        send_to: GA4_ID,
      });
    } else {
      gtag("event", "session_start", { send_to: GA4_ID });
    }
  } catch {
    // Swallow — GA4 is optional and must never break the page.
  }
}

/**
 * Emit one analytics event to BOTH sinks, honoring the consent gate.
 *
 * Suppressed entirely when {@link isAnalyticsEnabled} is `false` (Req 17.7).
 * Otherwise dispatched best-effort to GA4 and the first-party endpoint; each
 * sink fails independently and silently.
 */
function emitEvent(event: AnalyticsEvent): void {
  if (!isAnalyticsEnabled()) return;
  sendToGa4(event);
  sendToFirstParty(event);
}

/**
 * Track a page view for `path` (Req 17.1, 17.2). Ensures a session exists
 * first (so a `session_start` precedes the first page view of a tab), then
 * emits a `page_view` event to GA4 and the first-party store.
 *
 * Safe to call on every route change; no-ops outside the browser or when
 * analytics is disabled.
 */
export function trackPageView(path: string): void {
  if (!isBrowser()) return;

  const sessionId = ensureSession();
  if (!sessionId) return;

  emitEvent({ sessionId, type: "page_view", path, ts: Date.now() });
}
