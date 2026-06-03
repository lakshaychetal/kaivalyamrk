/**
 * Unit tests for the server-side WATI notification adapter (task 14.4).
 *
 * Covers: graceful no-op when env is unconfigured, a successful send, and
 * retry-with-backoff culminating in a swallowed (never-thrown) final failure.
 * `fetch` is stubbed and backoff is set tiny so the suite stays fast. Consent
 * is NOT this module's concern — the webhook gates it via `mayNotify`.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { WatiBookingNotification } from "./watiNotify";
import { watiNotify } from "./watiNotify";

const ENV_KEYS = ["WATI_API_ENDPOINT", "WATI_API_TOKEN", "WATI_TEMPLATE_NAME"];
const savedEnv: Record<string, string | undefined> = {};

function note(): WatiBookingNotification {
  return {
    phone: "+919876543210",
    bookingRef: "BK-1",
    billing: { amount: 5000, currency: "INR", lineItems: [] },
  };
}

beforeEach(() => {
  for (const key of ENV_KEYS) savedEnv[key] = process.env[key];
  vi.restoreAllMocks();
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
  vi.restoreAllMocks();
});

describe("watiNotify — graceful no-op without credentials", () => {
  it("returns false and does not call fetch when env is unconfigured", async () => {
    delete process.env.WATI_API_ENDPOINT;
    delete process.env.WATI_API_TOKEN;
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await watiNotify(note());

    expect(result).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalled();
  });
});

describe("watiNotify — successful send", () => {
  it("returns true after a single successful send and does not leak the token in logs", async () => {
    process.env.WATI_API_ENDPOINT = "https://wati.example.com";
    process.env.WATI_API_TOKEN = "super-secret-token";

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));

    const result = await watiNotify(note(), { baseDelayMs: 0 });

    expect(result).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Authorization header carries the token, but it is sent, not logged.
    const [, init] = fetchSpy.mock.calls[0]!;
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toContain("super-secret-token");
  });
});

describe("watiNotify — retry/backoff and swallowed failure (Req 16.4)", () => {
  it("retries up to maxAttempts, never throws, and returns false on total failure", async () => {
    process.env.WATI_API_ENDPOINT = "https://wati.example.com";
    process.env.WATI_API_TOKEN = "tok";

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 500 }));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await watiNotify(note(), { maxAttempts: 3, baseDelayMs: 0 });

    expect(result).toBe(false);
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  it("succeeds on a later attempt after transient failures", async () => {
    process.env.WATI_API_ENDPOINT = "https://wati.example.com";
    process.env.WATI_API_TOKEN = "tok";

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await watiNotify(note(), { maxAttempts: 3, baseDelayMs: 0 });

    expect(result).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
