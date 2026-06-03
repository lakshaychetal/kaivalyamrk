/**
 * Global test setup for Vitest.
 *
 * Registers the @testing-library/jest-dom custom matchers (e.g. `toBeInTheDocument`,
 * `toHaveAttribute`) and ensures the DOM is cleaned up between component tests.
 */
import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});

// ---------------------------------------------------------------------------
// Mock next/font/google — the font loader functions are not available in the
// jsdom test environment (they require the Next.js build pipeline). Return a
// minimal stub that satisfies the variable/className shape used in layout.tsx.
// ---------------------------------------------------------------------------
vi.mock("next/font/google", () => ({
  Fraunces: () => ({ variable: "--font-fraunces", className: "font-fraunces" }),
  Source_Sans_3: () => ({
    variable: "--font-source-sans",
    className: "font-source-sans",
  }),
}));
