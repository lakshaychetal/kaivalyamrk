/**
 * Unit tests for the first-party analytics store (task 14.3).
 *
 * Focus: event persistence shape, defensive copies, and — most importantly —
 * the MONOTONIC cumulative visit counter (Req 17.4): it must never decrease,
 * even when handed a negative or zero delta.
 */
import { describe, it, expect } from "vitest";
import type { AnalyticsEvent } from "../../content/types";
import {
  CUMULATIVE_VISITS_COUNTER,
  InMemoryAnalyticsStore,
  getAnalyticsStore,
} from "./store";

function pageView(sessionId: string, path = "/", ts = 1_000): AnalyticsEvent {
  return { sessionId, type: "page_view", path, ts };
}

describe("InMemoryAnalyticsStore.appendEvent", () => {
  it("assigns a non-empty id and returns the stored row", async () => {
    const store = new InMemoryAnalyticsStore();
    const stored = await store.appendEvent(pageView("s1", "/rooms", 42));

    expect(stored.id).toBeTruthy();
    expect(stored.sessionId).toBe("s1");
    expect(stored.type).toBe("page_view");
    expect(stored.path).toBe("/rooms");
    expect(stored.ts).toBe(42);
  });

  it("omits path when the event has none", async () => {
    const store = new InMemoryAnalyticsStore();
    const stored = await store.appendEvent({
      sessionId: "s1",
      type: "session_start",
      ts: 7,
    });
    expect(stored.path).toBeUndefined();
  });

  it("assigns unique ids to successive events", async () => {
    const store = new InMemoryAnalyticsStore();
    const a = await store.appendEvent(pageView("s1"));
    const b = await store.appendEvent(pageView("s1"));
    expect(a.id).not.toBe(b.id);
  });

  it("readEvents returns a defensive copy that cannot mutate the store", async () => {
    const store = new InMemoryAnalyticsStore();
    await store.appendEvent(pageView("s1"));
    const events = await store.readEvents();
    events.push(pageView("intruder") as never);
    expect(await store.readEvents()).toHaveLength(1);
  });
});

describe("InMemoryAnalyticsStore cumulative counter (Req 17.4)", () => {
  it("starts at zero", async () => {
    const store = new InMemoryAnalyticsStore();
    const counter = await store.readCounter();
    expect(counter).toEqual({ name: CUMULATIVE_VISITS_COUNTER, value: 0 });
  });

  it("increments by one per default call", async () => {
    const store = new InMemoryAnalyticsStore();
    expect(await store.incrementVisitCounter()).toBe(1);
    expect(await store.incrementVisitCounter()).toBe(2);
    expect((await store.readCounter()).value).toBe(2);
  });

  it("never decreases on a negative delta (monotonic)", async () => {
    const store = new InMemoryAnalyticsStore();
    await store.incrementVisitCounter(5);
    expect(await store.incrementVisitCounter(-100)).toBe(5);
    expect((await store.readCounter()).value).toBe(5);
  });

  it("is unchanged by a zero delta", async () => {
    const store = new InMemoryAnalyticsStore();
    await store.incrementVisitCounter(3);
    expect(await store.incrementVisitCounter(0)).toBe(3);
  });
});

describe("getAnalyticsStore", () => {
  it("returns a stable singleton within the process", () => {
    expect(getAnalyticsStore()).toBe(getAnalyticsStore());
  });
});
