/**
 * Unit tests for the Admin Report page (task 15.1).
 * --------------------------------------------------
 * Feature: kaivalyam-homestay-website
 *
 * Verifies the Req 17.6 contract:
 *   1. Unauthenticated access redirects to /admin/login.
 *   2. When authenticated, the report renders all required metric labels.
 *   3. The billing data table is present for the billing summary.
 *
 * Strategy:
 *   - Mock `next/headers` (cookies) and `next/navigation` (redirect) so the
 *     auth guard can be exercised without a real HTTP request.
 *   - Mock the analytics and bookings stores to supply controlled test data.
 *   - Render the async server component directly with React Testing Library.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Mock next/navigation (redirect)
// ---------------------------------------------------------------------------
const mockRedirect = vi.fn((url: string): never => {
  throw new Error(`REDIRECT:${url}`);
});

vi.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
}));

// ---------------------------------------------------------------------------
// Mock next/headers (cookies)
// ---------------------------------------------------------------------------
const mockGet = vi.fn();
const mockCookieStore = { get: mockGet };

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

// ---------------------------------------------------------------------------
// Mock the analytics store
// ---------------------------------------------------------------------------
const mockReadEvents = vi.fn();
const mockReadCounter = vi.fn();
const mockIncrementVisitCounter = vi.fn();
const mockAppendEvent = vi.fn();

vi.mock("@/integration/analytics/store", () => ({
  getAnalyticsStore: () => ({
    readEvents: mockReadEvents,
    readCounter: mockReadCounter,
    incrementVisitCounter: mockIncrementVisitCounter,
    appendEvent: mockAppendEvent,
  }),
}));

// ---------------------------------------------------------------------------
// Mock the bookings store
// ---------------------------------------------------------------------------
const mockReadBookings = vi.fn();
const mockPersistBooking = vi.fn();

vi.mock("@/integration/bookings/store", () => ({
  getBookingsStore: () => ({
    readBookings: mockReadBookings,
    persistBooking: mockPersistBooking,
  }),
}));

// ---------------------------------------------------------------------------
// Import the page AFTER mocks are set up
// ---------------------------------------------------------------------------
import AdminReportPage, { metadata } from "./page";
import type { AnalyticsEvent, BookingRecord } from "@/content/types";

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const SESSION_EVENTS: AnalyticsEvent[] = [
  { sessionId: "s1", type: "session_start", ts: 1_000 },
  { sessionId: "s1", type: "page_view", path: "/", ts: 1_500 },
  { sessionId: "s1", type: "page_view", path: "/about", ts: 2_000 },
  { sessionId: "s2", type: "session_start", ts: 3_000 },
  { sessionId: "s2", type: "page_view", path: "/rooms", ts: 3_500 },
];

const BOOKING_RECORDS: BookingRecord[] = [
  {
    bookingRef: "BK-001",
    billing: {
      amount: 5000,
      currency: "INR",
      lineItems: [{ description: "Luxury Cottage (2 nights)", amount: 5000 }],
    },
    whatsappConsent: true,
    createdAt: Date.now() - 86_400_000,
  },
  {
    bookingRef: "BK-002",
    billing: {
      amount: 2500,
      currency: "INR",
      lineItems: [{ description: "Classic Room (1 night)", amount: 2500 }],
    },
    whatsappConsent: false,
    createdAt: Date.now() - 43_200_000,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Set up mocks for an authenticated session with test data. */
function setupAuthenticated() {
  process.env.ADMIN_PASSWORD = "test-password-123";
  mockGet.mockReturnValue({ value: "authenticated" });
  mockReadEvents.mockResolvedValue(SESSION_EVENTS);
  mockReadBookings.mockResolvedValue(BOOKING_RECORDS);
}

/** Set up mocks for an unauthenticated request (no session cookie). */
function setupUnauthenticated() {
  process.env.ADMIN_PASSWORD = "test-password-123";
  mockGet.mockReturnValue(undefined);
  mockReadEvents.mockResolvedValue([]);
  mockReadBookings.mockResolvedValue([]);
}

/** Set up mocks when ADMIN_PASSWORD is not configured. */
function setupNoPassword() {
  delete process.env.ADMIN_PASSWORD;
  mockGet.mockReturnValue({ value: "authenticated" });
  mockReadEvents.mockResolvedValue([]);
  mockReadBookings.mockResolvedValue([]);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Admin Report page — metadata (Req 17.6)", () => {
  it("declares noindex robots metadata", () => {
    expect(metadata.robots).toMatchObject({ index: false, follow: false });
  });

  it("declares a self-describing page title", () => {
    expect(metadata.title).toBe("Admin Report");
  });
});

describe("Admin Report page — auth guard (Req 17.6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRedirect.mockImplementation((url: string): never => {
      throw new Error(`REDIRECT:${url}`);
    });
  });

  it("redirects to /admin/login when no session cookie is present", async () => {
    setupUnauthenticated();
    await expect(AdminReportPage()).rejects.toThrow("REDIRECT:/admin/login");
    expect(mockRedirect).toHaveBeenCalledWith("/admin/login");
  });

  it("redirects to /admin/login when ADMIN_PASSWORD is not configured", async () => {
    setupNoPassword();
    await expect(AdminReportPage()).rejects.toThrow("REDIRECT:/admin/login");
    expect(mockRedirect).toHaveBeenCalledWith("/admin/login");
  });

  it("does NOT redirect when a valid session cookie is present", async () => {
    setupAuthenticated();
    // Should not throw a redirect error.
    const element = await AdminReportPage();
    expect(element).toBeTruthy();
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});

describe("Admin Report page — metric labels (Req 17.6, 17.1–17.4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRedirect.mockImplementation((url: string): never => {
      throw new Error(`REDIRECT:${url}`);
    });
    setupAuthenticated();
  });

  it("renders the page heading", async () => {
    const element = await AdminReportPage();
    render(element);
    expect(
      screen.getByRole("heading", { level: 1, name: /analytics report/i }),
    ).toBeInTheDocument();
  });

  it("renders the 'Total page views' metric label (Req 17.1)", async () => {
    const element = await AdminReportPage();
    render(element);
    // Multiple elements may match (sr-only dl + visible card); at least one must be present.
    expect(screen.getAllByText(/total page views/i).length).toBeGreaterThan(0);
  });

  it("renders the 'Total sessions' metric label (Req 17.2)", async () => {
    const element = await AdminReportPage();
    render(element);
    expect(screen.getAllByText(/total sessions/i).length).toBeGreaterThan(0);
  });

  it("renders the 'Avg pages / session' metric label (Req 17.2)", async () => {
    const element = await AdminReportPage();
    render(element);
    expect(screen.getByText(/avg pages \/ session/i)).toBeInTheDocument();
  });

  it("renders the 'Avg session duration' metric label (Req 17.3)", async () => {
    const element = await AdminReportPage();
    render(element);
    expect(screen.getByText(/avg session duration/i)).toBeInTheDocument();
  });

  it("renders the 'Cumulative visits' metric label (Req 17.4)", async () => {
    const element = await AdminReportPage();
    render(element);
    expect(screen.getAllByText(/cumulative visits/i).length).toBeGreaterThan(0);
  });

  it("renders the traffic overview section heading", async () => {
    const element = await AdminReportPage();
    render(element);
    expect(
      screen.getByRole("heading", { name: /traffic overview/i }),
    ).toBeInTheDocument();
  });

  it("renders the booking billing summary section heading (Req 17.5)", async () => {
    const element = await AdminReportPage();
    render(element);
    expect(
      screen.getByRole("heading", { name: /booking billing summary/i }),
    ).toBeInTheDocument();
  });

  it("renders the 'Total revenue' metric label (Req 17.5)", async () => {
    const element = await AdminReportPage();
    render(element);
    expect(screen.getByText(/total revenue/i)).toBeInTheDocument();
  });

  it("renders the 'Booking count' metric label (Req 17.5)", async () => {
    const element = await AdminReportPage();
    render(element);
    expect(screen.getByText(/booking count/i)).toBeInTheDocument();
  });

  it("renders correct computed values from the test data", async () => {
    const element = await AdminReportPage();
    render(element);
    // 3 page_view events across 2 sessions → totalPageViews = 3
    // The sr-only dl contains the raw values
    const dl = document.querySelector("dl.sr-only");
    expect(dl).not.toBeNull();
    const dlText = dl!.textContent ?? "";
    expect(dlText).toContain("3"); // total page views
    expect(dlText).toContain("2"); // total sessions
  });
});

describe("Admin Report page — billing data table (Req 17.5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRedirect.mockImplementation((url: string): never => {
      throw new Error(`REDIRECT:${url}`);
    });
    setupAuthenticated();
  });

  it("renders a table for individual bookings", async () => {
    const element = await AdminReportPage();
    render(element);
    const table = screen.getByRole("table");
    expect(table).toBeInTheDocument();
  });

  it("renders column headers in the billing table", async () => {
    const element = await AdminReportPage();
    render(element);
    expect(
      screen.getByRole("columnheader", { name: /booking ref/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /amount/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /date/i }),
    ).toBeInTheDocument();
  });

  it("renders a row for each booking record", async () => {
    const element = await AdminReportPage();
    render(element);
    const table = screen.getByRole("table");
    const rows = within(table).getAllByRole("row");
    // 1 header row + 2 data rows
    expect(rows).toHaveLength(3);
  });

  it("renders the booking reference for each booking", async () => {
    const element = await AdminReportPage();
    render(element);
    expect(screen.getByText("BK-001")).toBeInTheDocument();
    expect(screen.getByText("BK-002")).toBeInTheDocument();
  });

  it("renders 'No bookings recorded yet' when there are no bookings", async () => {
    mockReadBookings.mockResolvedValue([]);
    const element = await AdminReportPage();
    render(element);
    expect(screen.getByText(/no bookings recorded yet/i)).toBeInTheDocument();
  });
});
