/**
 * Unit tests for `POST /api/booking/webhook` (task 14.4).
 *
 * Covers the webhook contract:
 *   • valid payload → 204, billing persisted (Req 17.5)
 *   • consent gating: watiNotify called IFF whatsappConsent === true (Req 16.4/16.5)
 *   • malformed input → 400
 *   • optional shared-secret authenticity (WEBHOOK_SECRET) → 401 when wrong
 *
 * `watiNotify` is mocked so we assert the gating decision without real WATI I/O.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the WATI adapter so we can assert whether/with-what it was called.
vi.mock("../../../../integration/whatsapp/watiNotify", () => ({
  watiNotify: vi.fn().mockResolvedValue(true),
}));

import { POST } from "./route";
import { watiNotify } from "../../../../integration/whatsapp/watiNotify";
import { getBookingsStore } from "../../../../integration/bookings/store";

const notifyMock = vi.mocked(watiNotify);

function validPayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    bookingRef: "BK-100",
    phone: "+919876543210",
    whatsappConsent: true,
    billing: {
      amount: 5000,
      currency: "INR",
      lineItems: [{ description: "Luxury Cottage x2", amount: 5000 }],
    },
    createdAt: 1_700_000_000_000,
    ...overrides,
  };
}

function postJson(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/booking/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

function postRaw(raw: string): Request {
  return new Request("http://localhost/api/booking/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: raw,
  });
}

beforeEach(() => {
  notifyMock.mockClear();
  delete process.env.WEBHOOK_SECRET;
});

afterEach(() => {
  delete process.env.WEBHOOK_SECRET;
});

describe("POST /api/booking/webhook — valid payload", () => {
  it("returns 204 and persists the booking billing (Req 17.5)", async () => {
    const before = (await getBookingsStore().readBookings()).length;
    const res = await POST(postJson(validPayload({ bookingRef: "BK-persist" })));
    expect(res.status).toBe(204);

    const bookings = await getBookingsStore().readBookings();
    expect(bookings.length).toBe(before + 1);
    const persisted = bookings.find((b) => b.bookingRef === "BK-persist");
    expect(persisted?.billing.amount).toBe(5000);
    expect(persisted?.billing.currency).toBe("INR");
  });
});

describe("POST /api/booking/webhook — consent gating (Req 16.4, 16.5)", () => {
  it("dispatches watiNotify when consent is true", async () => {
    await POST(postJson(validPayload({ whatsappConsent: true })));
    expect(notifyMock).toHaveBeenCalledTimes(1);
    expect(notifyMock.mock.calls[0]![0]).toMatchObject({
      phone: "+919876543210",
      bookingRef: "BK-100",
    });
  });

  it("does NOT dispatch watiNotify when consent is false", async () => {
    await POST(postJson(validPayload({ whatsappConsent: false })));
    expect(notifyMock).not.toHaveBeenCalled();
  });

  it("does NOT dispatch watiNotify when consent is absent (fails closed)", async () => {
    const payload = validPayload();
    delete payload.whatsappConsent;
    await POST(postJson(payload));
    expect(notifyMock).not.toHaveBeenCalled();
  });

  it("still persists billing even when consent is false", async () => {
    const before = (await getBookingsStore().readBookings()).length;
    await POST(postJson(validPayload({ bookingRef: "BK-noconsent", whatsappConsent: false })));
    const after = (await getBookingsStore().readBookings()).length;
    expect(after).toBe(before + 1);
    expect(notifyMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/booking/webhook — malformed input → 400", () => {
  it("rejects invalid JSON", async () => {
    expect((await POST(postRaw("{not json"))).status).toBe(400);
  });

  it("rejects a non-object body", async () => {
    expect((await POST(postJson("hello"))).status).toBe(400);
  });

  it("rejects a missing bookingRef", async () => {
    const payload = validPayload();
    delete payload.bookingRef;
    expect((await POST(postJson(payload))).status).toBe(400);
  });

  it("rejects a missing phone", async () => {
    const payload = validPayload();
    delete payload.phone;
    expect((await POST(postJson(payload))).status).toBe(400);
  });

  it("rejects a non-boolean consent value", async () => {
    expect(
      (await POST(postJson(validPayload({ whatsappConsent: "yes" })))).status,
    ).toBe(400);
  });

  it("rejects missing/invalid billing", async () => {
    expect((await POST(postJson(validPayload({ billing: null })))).status).toBe(400);
    expect(
      (await POST(postJson(validPayload({ billing: { amount: 1, currency: "INR" } }))))
        .status,
    ).toBe(400);
  });

  it("rejects a non-finite billing amount", async () => {
    expect(
      (
        await POST(
          postJson(
            validPayload({
              billing: { amount: Number.POSITIVE_INFINITY, currency: "INR", lineItems: [] },
            }),
          ),
        )
      ).status,
    ).toBe(400);
  });

  it("does not dispatch notify for malformed input", async () => {
    await POST(postRaw("{not json"));
    expect(notifyMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/booking/webhook — shared-secret authenticity", () => {
  it("allows the request when WEBHOOK_SECRET is unset (dev no-op-allow)", async () => {
    delete process.env.WEBHOOK_SECRET;
    expect((await POST(postJson(validPayload()))).status).toBe(204);
  });

  it("returns 401 when the secret is configured but the header is missing", async () => {
    process.env.WEBHOOK_SECRET = "s3cret";
    expect((await POST(postJson(validPayload()))).status).toBe(401);
  });

  it("returns 401 when the header does not match", async () => {
    process.env.WEBHOOK_SECRET = "s3cret";
    const res = await POST(
      postJson(validPayload(), { "x-webhook-secret": "wrong" }),
    );
    expect(res.status).toBe(401);
  });

  it("accepts the request when the header matches", async () => {
    process.env.WEBHOOK_SECRET = "s3cret";
    const res = await POST(
      postJson(validPayload(), { "x-webhook-secret": "s3cret" }),
    );
    expect(res.status).toBe(204);
  });
});
