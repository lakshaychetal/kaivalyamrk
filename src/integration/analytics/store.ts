/**
 * First-party analytics store — server-side persistence abstraction.
 * ---------------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 14.3)
 *
 * This is the thin, swappable seam between the analytics ingestion endpoint
 * (`POST /api/analytics/event`, task 14.3) / booking webhook (task 14.4) and
 * the durable first-party datastore. The design calls for a "lightweight SQL
 * store (e.g. Postgres/SQLite-class managed DB)" in production; this module
 * defines the {@link AnalyticsStore} INTERFACE that the rest of the server
 * code depends on, plus an in-memory implementation used for development and
 * tests.
 *
 * ⚠️ PRODUCTION TODO: the {@link InMemoryAnalyticsStore} below is process-local
 * and NON-DURABLE — it resets on every cold start / redeploy and is not shared
 * across serverless instances. At deploy time, implement {@link AnalyticsStore}
 * against the managed SQL store and swap it in via {@link getAnalyticsStore}
 * (e.g. behind an env flag). Nothing else needs to change because all callers
 * depend only on the interface.
 *
 * Layering (structure.md): `integration/` may depend on `domain/` for pure
 * logic. The monotonic counter rule lives in the property-tested domain helper
 * {@link incrementCounter} (Req 17.4, Property 16); this store reuses it rather
 * than re-deriving "never decreases" here. Secrets and writes stay server-side
 * — this module is never imported by client code.
 */

import type {
  AnalyticsEvent,
  CounterRow,
  StoredEvent,
} from "../../content/types";
import { incrementCounter } from "../../domain/analytics/aggregate";

/** The single counter row name tracked by the first-party store (Req 17.4). */
export const CUMULATIVE_VISITS_COUNTER = "cumulative_visits" as const;

/**
 * The persistence contract every analytics store implementation must satisfy.
 *
 * All methods are async so the in-memory dev store and a future SQL-backed
 * store share one signature (the SQL implementation will do real I/O). The
 * server OWNS the cumulative counter: callers may only ask the store to
 * {@link incrementVisitCounter}; they can never set it to an arbitrary
 * (client-supplied) value, which is what keeps it trustworthy (Req 17.4).
 */
export interface AnalyticsStore {
  /**
   * Persist one analytics event, assigning it a stable id and returning the
   * stored row (Req 17.1). Implementations must not mutate the input.
   */
  appendEvent(event: AnalyticsEvent): Promise<StoredEvent>;

  /**
   * Increment the cumulative visit counter by `delta` (default `1`) and return
   * the new value (Req 17.4). The counter is MONOTONIC: it never decreases, so
   * a non-positive `delta` leaves it unchanged. This is the only way to advance
   * the counter — there is deliberately no setter.
   */
  incrementVisitCounter(delta?: number): Promise<number>;

  /** Read every persisted event (feeds `aggregateReport`, task 14.5). */
  readEvents(): Promise<StoredEvent[]>;

  /** Read the current cumulative-visits counter row (Req 17.4). */
  readCounter(): Promise<CounterRow>;
}

/**
 * Generate a stable unique id for a stored event row.
 *
 * Uses the platform `crypto.randomUUID` when available (Node 19+, Edge, modern
 * browsers) and falls back to a timestamp+random token otherwise so the store
 * works in any runtime without an extra dependency.
 */
function generateEventId(): string {
  const cryptoObj = globalThis.crypto as Crypto | undefined;
  if (cryptoObj && typeof cryptoObj.randomUUID === "function") {
    return cryptoObj.randomUUID();
  }
  return `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * In-memory, process-local {@link AnalyticsStore} for development and tests.
 *
 * Clearly NOT for production durability (see the file header TODO): it keeps
 * events in an array and the counter in a single number, both lost on restart.
 * It exists so the ingestion endpoint and admin report can be exercised
 * end-to-end locally and in unit tests without provisioning a database.
 *
 * The cumulative counter is kept monotonic by routing every change through the
 * domain {@link incrementCounter} helper, so even a buggy or malicious caller
 * passing a negative `delta` can never make the stored value go down.
 */
export class InMemoryAnalyticsStore implements AnalyticsStore {
  private readonly events: StoredEvent[] = [];
  private visitCounter = 0;

  async appendEvent(event: AnalyticsEvent): Promise<StoredEvent> {
    const stored: StoredEvent = {
      id: generateEventId(),
      sessionId: event.sessionId,
      type: event.type,
      // Only attach `path` when present, matching the optional field shape.
      ...(event.path !== undefined ? { path: event.path } : {}),
      ts: event.ts,
    };
    this.events.push(stored);
    return stored;
  }

  async incrementVisitCounter(delta = 1): Promise<number> {
    // Monotonic by construction: incrementCounter clamps delta to >= 0, so the
    // server-owned counter can only ever increase (Req 17.4, Property 16).
    this.visitCounter = incrementCounter(this.visitCounter, delta);
    return this.visitCounter;
  }

  async readEvents(): Promise<StoredEvent[]> {
    // Defensive copy so callers cannot mutate the backing array.
    return [...this.events];
  }

  async readCounter(): Promise<CounterRow> {
    return { name: CUMULATIVE_VISITS_COUNTER, value: this.visitCounter };
  }
}

/**
 * Process-wide singleton store instance.
 *
 * A module-level singleton means the ingestion endpoint and the (future) admin
 * report read/write the SAME in-memory store within a single server process
 * during development. Hung off `globalThis` so Next.js dev-mode module reloads
 * (and route-handler re-evaluation) don't silently spin up a fresh, empty store
 * on every request.
 */
const STORE_GLOBAL_KEY = "__kaivalyamAnalyticsStore__";

type StoreGlobal = typeof globalThis & {
  [STORE_GLOBAL_KEY]?: AnalyticsStore;
};

/**
 * Return the active {@link AnalyticsStore}.
 *
 * Today this always returns the in-memory dev store. ⚠️ PRODUCTION TODO: select
 * a SQL-backed implementation here (e.g. `if (process.env.DATABASE_URL) return
 * new SqlAnalyticsStore(...)`) so callers pick up durable storage with no other
 * code changes.
 */
export function getAnalyticsStore(): AnalyticsStore {
  const store = globalThis as StoreGlobal;
  if (!store[STORE_GLOBAL_KEY]) {
    store[STORE_GLOBAL_KEY] = new InMemoryAnalyticsStore();
  }
  return store[STORE_GLOBAL_KEY];
}
