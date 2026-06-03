/**
 * `POST /api/analytics/event` — first-party analytics ingestion endpoint.
 * ---------------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 14.3)
 *
 * Receives best-effort page-view / session-start events from the browser
 * analytics client (`src/integration/analytics/analyticsClient.ts`), validates
 * them, and persists them to the first-party store (Req 17.1). On a
 * `session_start` it ALSO increments the server-owned, monotonic cumulative
 * visit counter (Req 17.4).
 *
 * Security & trust boundary (this endpoint is PUBLIC — anyone can POST to it):
 *   • The server OWNS the cumulative counter. The request body is never trusted
 *     to carry a counter value; the counter is advanced server-side by exactly
 *     one on each valid `session_start`. Clients cannot set, reset, or decrement
 *     it (Req 17.4).
 *   • Payload is strictly validated and SIZE-LIMITED to reject malformed or
 *     abusive input with `400` (never a `5xx` for bad input). String fields are
 *     length-capped before they ever reach the store.
 *   • No secrets are read or returned here; secrets stay in the webhook/notify
 *     handlers. The response body is empty (`204`) so nothing leaks.
 *
 * Runtime: Node.js (the in-memory dev store is process-local; see store.ts).
 * Responds quickly with `204 No Content` on success so the client's
 * fire-and-forget beacon resolves immediately.
 */

import { NextResponse } from "next/server";
import type { AnalyticsEvent } from "../../../../content/types";
import { getAnalyticsStore } from "../../../../integration/analytics/store";

/** Run on the Node.js runtime (matches the store's process-local singleton). */
export const runtime = "nodejs";

/** Never cache or statically optimize an ingestion endpoint. */
export const dynamic = "force-dynamic";

/** Reject oversized bodies outright (defense against abusive payloads). */
const MAX_BODY_BYTES = 4 * 1024;

/** Cap individual string fields so a valid-shaped but huge value can't pass. */
const MAX_SESSION_ID_LEN = 128;
const MAX_PATH_LEN = 2048;

/** The accepted event types, mirroring `AnalyticsEvent['type']`. */
const VALID_EVENT_TYPES = new Set<AnalyticsEvent["type"]>([
  "page_view",
  "session_start",
]);

/**
 * Validate and normalize an unknown parsed body into a trusted
 * {@link AnalyticsEvent}, or return `null` when the shape is invalid.
 *
 * Enforces: object shape, a non-empty bounded `sessionId`, a known `type`, a
 * finite `ts`, and an optional bounded string `path`. The server stamps its own
 * receipt time when `ts` is absent so a missing/forged timestamp can't break
 * downstream aggregation. Any field outside these bounds → `null` → `400`.
 */
function parseEvent(body: unknown): AnalyticsEvent | null {
  if (typeof body !== "object" || body === null) return null;

  const record = body as Record<string, unknown>;

  const { sessionId, type, path, ts } = record;

  if (
    typeof sessionId !== "string" ||
    sessionId.length === 0 ||
    sessionId.length > MAX_SESSION_ID_LEN
  ) {
    return null;
  }

  if (typeof type !== "string" || !VALID_EVENT_TYPES.has(type as AnalyticsEvent["type"])) {
    return null;
  }

  if (
    path !== undefined &&
    (typeof path !== "string" || path.length > MAX_PATH_LEN)
  ) {
    return null;
  }

  // Trust the client timestamp only when it is a finite number; otherwise the
  // server stamps receipt time. This keeps `ts` always valid for aggregation.
  const timestamp =
    typeof ts === "number" && Number.isFinite(ts) ? ts : Date.now();

  const event: AnalyticsEvent = {
    sessionId,
    type: type as AnalyticsEvent["type"],
    ts: timestamp,
    ...(typeof path === "string" ? { path } : {}),
  };

  return event;
}

/**
 * Handle a single analytics event POST.
 *
 * Returns:
 *   • `204 No Content` — event accepted and persisted.
 *   • `400 Bad Request` — malformed JSON, oversized, or invalid shape.
 *
 * Persistence/counter failures are logged server-side and reported as `204`
 * anyway: ingestion is best-effort and the client neither waits for nor reacts
 * to the result, so a transient store error must not surface as a client error.
 */
export async function POST(request: Request): Promise<NextResponse> {
  // Cheap pre-check on the declared body size before reading it.
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
    return new NextResponse(null, { status: 400 });
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  // Enforce the size limit even when Content-Length was absent/incorrect.
  if (raw.length > MAX_BODY_BYTES) {
    return new NextResponse(null, { status: 400 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const event = parseEvent(parsed);
  if (event === null) {
    return new NextResponse(null, { status: 400 });
  }

  try {
    const store = getAnalyticsStore();
    await store.appendEvent(event);

    // The server owns the counter: one visit per session_start, monotonic.
    if (event.type === "session_start") {
      await store.incrementVisitCounter(1);
    }
  } catch (error) {
    // Best-effort: log and still acknowledge so the client beacon resolves.
    console.error("[analytics] failed to persist event", error);
  }

  return new NextResponse(null, { status: 204 });
}
