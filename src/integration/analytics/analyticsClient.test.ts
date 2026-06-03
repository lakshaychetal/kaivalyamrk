/**
 * Unit tests for the browser analytics client (task 14.3).
 *
 * Focus: the privacy/consent gate (Req 17.7), session id generation/reuse, and
 * best-effort emission that NEVER throws even when sinks fail. Runs in jsdom.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  ANALYTICS_ENDPOINT,
  disableAnalytics,
  enableAnalytics,
  ensureSession,
  isAnalyticsEnabled,
  startSession,
  trackPageView,
} from "./analyticsClient";

/**
 * Minimal in-memory `Storage` so the tests are independent of the host's
 * web-storage quirks (Node's experimental webstorage can shadow jsdom's
 * implementation). Reinstalled fresh before each test.
 */
function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key: string) => (map.has(key) ? map.get(key)! : null),
    key: (index: number) => Array.from(map.keys())[index] ?? null,
    removeItem: (key: string) => {
      map.delete(key);
    },
    setItem: (key: string, value: string) => {
      map.set(key, String(value));
    },
  } as Storage;
}

beforeEach(() => {
  Object.defineProperty(window, "localStorage", {
    value: createMemoryStorage(),
    configurable: true,
  });
  Object.defineProperty(window, "sessionStorage", {
    value: createMemoryStorage(),
    configurable: true,
  });
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("consent gate (Req 17.7)", () => {
  it("defaults to enabled when no explicit decision is stored", () => {
    expect(isAnalyticsEnabled()).toBe(true);
  });

  it("returns false after disableAnalytics()", () => {
    disableAnalytics();
    expect(isAnalyticsEnabled()).toBe(false);
  });

  it("returns true after enableAnalytics()", () => {
    disableAnalytics();
    enableAnalytics();
    expect(isAnalyticsEnabled()).toBe(true);
  });

  it("suppresses all network emission when disabled", () => {
    disableAnalytics();
    const beacon = vi.fn().mockReturnValue(true);
    Object.defineProperty(window.navigator, "sendBeacon", {
      value: beacon,
      configurable: true,
    });

    trackPageView("/rooms");

    expect(beacon).not.toHaveBeenCalled();
  });
});

describe("session management (Req 17.1)", () => {
  it("ensureSession creates and reuses a single id", () => {
    const first = ensureSession();
    const second = ensureSession();
    expect(first).toBeTruthy();
    expect(second).toBe(first);
  });

  it("startSession generates a fresh id", () => {
    const a = startSession();
    const b = startSession();
    expect(a).toBeTruthy();
    expect(b).toBeTruthy();
    expect(b).not.toBe(a);
  });
});

describe("best-effort emission", () => {
  it("posts a page_view to the first-party endpoint via sendBeacon", () => {
    const beacon = vi.fn().mockReturnValue(true);
    Object.defineProperty(window.navigator, "sendBeacon", {
      value: beacon,
      configurable: true,
    });

    trackPageView("/gallery");

    // session_start (from ensureSession) + page_view → at least one beacon to
    // the analytics endpoint.
    expect(beacon).toHaveBeenCalled();
    expect(beacon.mock.calls.every((call) => call[0] === ANALYTICS_ENDPOINT)).toBe(
      true,
    );
  });

  it("never throws when the beacon sink throws", () => {
    Object.defineProperty(window.navigator, "sendBeacon", {
      value: () => {
        throw new Error("beacon blocked");
      },
      configurable: true,
    });

    expect(() => trackPageView("/about")).not.toThrow();
  });
});
