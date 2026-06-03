import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

/**
 * Vitest configuration for the Kaivalyam Homestay Website.
 *
 * Runs unit, component, and property-based tests (see tech.md "Testing"):
 *   - `@vitejs/plugin-react`     → JSX/TSX + React Testing Library support
 *   - `resolve.tsconfigPaths`    → resolves the `@/*` → `src/*` aliases from tsconfig.json
 *   - `jsdom`                    → DOM environment for component tests
 *   - `vitest.setup.ts`          → registers @testing-library/jest-dom matchers
 *
 * Playwright E2E/accessibility specs live in `tests/e2e/` and are intentionally
 * excluded here so the two runners never collide.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Native tsconfig `paths` resolution (replaces the vite-tsconfig-paths plugin):
    // maps `@/*` and the per-layer aliases to `src/*` exactly as tsconfig.json declares.
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    // Vitest owns everything under src/; Playwright owns tests/e2e/.
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules/**", ".next/**", "tests/e2e/**"],
    // PBT tests render components 100+ times; allow up to 30 s per test.
    testTimeout: 30000,
  },
});
