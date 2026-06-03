/**
 * Unit tests for `POST /api/analytics/event` (task 14.3).
 *
 * Covers the public ingestion contract: valid events persist and return 204,
 * malformed input returns 400, and a `session_start` advances the server-owned
 * cumulative counter exactly once (the body is never trusted for a counter
 * value).
 */
import { describe, it, expect } from "vitest";
import { POST } from "./route";
import { getAnalyticsStore } from "../../../../integration/analytics/store";

function postJson(body: unknown): Request {
  return new Request("http://localhost/api/analytics/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function postRaw(raw: string): Request {
  return new Request("http://localhost/api/analytics/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: raw,
  });
}

describe("POST /api/analytics/event — valid events", () => {
  it("accepts a page_view and returns 204", async () => {
    const res = await POST(
      postJson({ sessionId: "s1", type: "page_view", path: "/rooms", ts: 5 }),
    );
    expect(res.status).toBe(204);
  });

  it("persists the event to the first-party store", async () => {
    const before = (await getAnalyticsStore().readEvents()).length;
    await POST(postJson({ sessionId: "sX", type: "page_view", path: "/", ts: 1 }));
    const after = (await getAnalyticsStore().readEvents()).length;
    expect(after).toBe(before + 1);
  });

  it("accepts an event without a path (server stamps ts when missing)", async () => {
    const res = await POST(postJson({ sessionId: "s2", type: "session_start" }));
    expect(res.status).toBe(204);
  });
});

describe("POST /api/analytics/event — cumulative counter (Req 17.4)", () => {
  it("increments the counter once per session_start", async () => {
    const before = (await getAnalyticsStore().readCounter()).value;
    await POST(postJson({ sessionId: "sc1", type: "session_start", ts: 1 }));
    const after = (await getAnalyticsStore().readCounter()).value;
    expect(after).toBe(before + 1);
  });

  it("does NOT increment the counter on a page_view", async () => {
    const before = (await getAnalyticsStore().readCounter()).value;
    await POST(postJson({ sessionId: "sc2", type: "page_view", path: "/", ts: 1 }));
    const after = (await getAnalyticsStore().readCounter()).value;
    expect(after).toBe(before);
  });

  it("ignores any client-supplied counter value in the body", async () => {
    const before = (await getAnalyticsStore().readCounter()).value;
    await POST(
      postJson({
        sessionId: "sc3",
        type: "session_start",
        ts: 1,
        // Attacker-controlled fields must have no effect on the counter.
        cumulativeVisits: 999_999,
        value: -50,
      }),
    );
    const after = (await getAnalyticsStore().readCounter()).value;
    expect(after).toBe(before + 1);
  });
});

describe("POST /api/analytics/event — malformed input → 400", () => {
  it("rejects invalid JSON", async () => {
    expect((await POST(postRaw("{not json"))).status).toBe(400);
  });

  it("rejects a non-object body", async () => {
    expect((await POST(postJson("hello"))).status).toBe(400);
  });

  it("rejects a missing sessionId", async () => {
    expect((await POST(postJson({ type: "page_view", ts: 1 }))).status).toBe(400);
  });

  it("rejects an unknown event type", async () => {
    expect(
      (await POST(postJson({ sessionId: "s1", type: "drop_table", ts: 1 }))).status,
    ).toBe(400);
  });

  it("rejects an over-long sessionId", async () => {
    const huge = "x".repeat(5000);
    expect(
      (await POST(postJson({ sessionId: huge, type: "page_view", ts: 1 }))).status,
    ).toBe(400);
  });

  it("rejects an oversized body", async () => {
    const bigPath = "/".repeat(5000);
    expect(
      (await POST(postJson({ sessionId: "s1", type: "page_view", path: bigPath, ts: 1 })))
        .status,
    ).toBe(400);
  });

  it("does not advance the counter for malformed session_start input", async () => {
    const before = (await getAnalyticsStore().readCounter()).value;
    await POST(postRaw("{not json"));
    const after = (await getAnalyticsStore().readCounter()).value;
    expect(after).toBe(before);
  });
});
