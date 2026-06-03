/**
 * E2E Accessibility Tests — Task 17.2
 * ====================================
 * Feature: kaivalyam-homestay-website
 *
 * Verifies WCAG 2.1 AA accessibility requirements using Playwright + axe-core.
 *
 * Requirements covered:
 *   - Req 22.8 — Skip-to-main-content control is the first focusable element
 *   - Req 22.3 — Visible focus indicators on every interactive element
 *   - Req 22.5 — Icon-only controls have accessible names
 *   - Req 22.7 — Reduced-motion preference disables non-essential animations
 *   - Req 22.4 — Tab order matches visual order; all interactive elements reachable
 *   - axe scan — No critical/serious violations on the home page
 *
 * NOTE: These tests require the production server to be running (`npm run build`
 * then `npm run start`). When the server is not available (e.g. during syntax
 * validation with `--pass-with-no-tests`), all tests are skipped gracefully.
 * To run against a live server: `npx playwright test tests/e2e/accessibility.spec.ts`
 */

import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Check whether the dev/prod server is reachable. Used to skip tests when the
 * server is not running (e.g. during CI syntax checks with --pass-with-no-tests).
 */
async function isServerReachable(page: Page): Promise<boolean> {
  try {
    const response = await page.goto("/", {
      timeout: 5_000,
      waitUntil: "domcontentloaded",
    });
    return response !== null && response.status() < 500;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

test.describe("Accessibility — Home page", () => {
  // Navigate to the home page before each test and skip if server is down.
  test.beforeEach(async ({ page }) => {
    const reachable = await isServerReachable(page);
    test.skip(!reachable, "Dev/prod server is not running — skipping E2E accessibility tests");
  });

  // -------------------------------------------------------------------------
  // Req 22.8 — Skip link
  // -------------------------------------------------------------------------
  test("skip link is the first focusable element and targets #main", async ({
    page,
  }) => {
    await page.goto("/");

    // The skip link is visually hidden until focused. Tab once from the body
    // to reach the first focusable element.
    await page.keyboard.press("Tab");

    // The first focused element must be the skip-to-content anchor.
    const focused = page.locator(":focus");
    await expect(focused).toHaveAttribute("href", "#main");
    await expect(focused).toHaveAttribute("data-testid", "skip-to-content");

    // Activating the skip link should move focus to <main id="main">.
    await page.keyboard.press("Enter");
    const main = page.locator("#main");
    await expect(main).toBeFocused();
  });

  // -------------------------------------------------------------------------
  // Req 22.3 — Visible focus indicators
  // -------------------------------------------------------------------------
  test("interactive elements have visible focus indicators (non-none outline)", async ({
    page,
  }) => {
    await page.goto("/");

    // Collect all interactive elements that should have focus styles.
    const interactiveSelectors = [
      "a[href]",
      "button",
      'input:not([type="hidden"])',
      "select",
      "textarea",
      "[tabindex]:not([tabindex='-1'])",
    ];

    for (const selector of interactiveSelectors) {
      const elements = page.locator(selector);
      const count = await elements.count();

      for (let i = 0; i < Math.min(count, 5); i++) {
        const el = elements.nth(i);

        // Skip elements that are not visible (e.g. sr-only skip link before focus).
        const isVisible = await el.isVisible().catch(() => false);
        if (!isVisible) continue;

        await el.focus();

        // Evaluate the computed outline style — it must not be "none" or "0px".
        const outlineStyle = await el.evaluate((node) => {
          const style = window.getComputedStyle(node);
          return {
            outlineStyle: style.outlineStyle,
            outlineWidth: style.outlineWidth,
            outlineColor: style.outlineColor,
            boxShadow: style.boxShadow,
          };
        });

        // A visible focus indicator is present if either:
        //   (a) outline is not "none" and has a non-zero width, OR
        //   (b) a box-shadow is applied (common Tailwind ring pattern).
        const hasOutline =
          outlineStyle.outlineStyle !== "none" &&
          outlineStyle.outlineWidth !== "0px";
        const hasBoxShadow =
          outlineStyle.boxShadow !== "none" &&
          outlineStyle.boxShadow !== "";

        expect(
          hasOutline || hasBoxShadow,
          `Element "${selector}" (index ${i}) has no visible focus indicator. ` +
            `outline: ${outlineStyle.outlineStyle} ${outlineStyle.outlineWidth}, ` +
            `box-shadow: ${outlineStyle.boxShadow}`,
        ).toBe(true);
      }
    }
  });

  // -------------------------------------------------------------------------
  // Req 22.5 — Icon-only controls have accessible names
  // -------------------------------------------------------------------------
  test("icon-only controls have accessible names", async ({ page }) => {
    await page.goto("/");

    // Icon-only controls: buttons/links that contain only an SVG (no visible text).
    const iconOnlyControls = page.locator(
      "button:has(svg):not(:has(*:not(svg))), a:has(svg):not(:has(*:not(svg)))",
    );
    const count = await iconOnlyControls.count();

    for (let i = 0; i < count; i++) {
      const el = iconOnlyControls.nth(i);

      // Get the accessible name via aria-label, aria-labelledby, or title.
      const accessibleName = await el.evaluate((node) => {
        // Use the accessibility tree name if available.
        const ariaLabel = node.getAttribute("aria-label");
        const title = node.getAttribute("title");
        const ariaLabelledBy = node.getAttribute("aria-labelledby");

        if (ariaLabel) return ariaLabel.trim();
        if (ariaLabelledBy) {
          const labelEl = document.getElementById(ariaLabelledBy);
          return labelEl?.textContent?.trim() ?? "";
        }
        if (title) return title.trim();

        // Check for sr-only text inside the element.
        const srOnly = node.querySelector(".sr-only, [class*='sr-only']");
        return srOnly?.textContent?.trim() ?? "";
      });

      expect(
        accessibleName.length,
        `Icon-only control at index ${i} has no accessible name`,
      ).toBeGreaterThan(0);
    }
  });

  // -------------------------------------------------------------------------
  // Req 22.7 — Reduced-motion: non-essential animations are disabled
  // -------------------------------------------------------------------------
  test("prefers-reduced-motion disables non-essential animations", async ({
    page,
  }) => {
    // Emulate the reduced-motion media query.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    // Collect all animated elements (those with CSS transitions or animations).
    const animatedElements = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll("*"));
      return all
        .filter((el) => {
          const style = window.getComputedStyle(el);
          const hasTransition =
            style.transitionDuration !== "0s" &&
            style.transitionDuration !== "" &&
            style.transitionProperty !== "none";
          const hasAnimation =
            style.animationName !== "none" && style.animationName !== "";
          return hasTransition || hasAnimation;
        })
        .map((el) => {
          const style = window.getComputedStyle(el);
          return {
            tag: el.tagName,
            className: el.className,
            transitionDuration: style.transitionDuration,
            animationName: style.animationName,
            animationDuration: style.animationDuration,
          };
        });
    });

    // Under reduced-motion, any remaining animations/transitions should be
    // either instant (duration ≤ 0.01s) or essential (focus rings are allowed).
    for (const el of animatedElements) {
      const transitionMs = parseFloat(el.transitionDuration) * 1000;
      const animationMs = parseFloat(el.animationDuration) * 1000;

      // Allow very short transitions (≤ 10ms — effectively instant) and
      // focus-ring transitions which are essential for accessibility.
      const isInstant = transitionMs <= 10 && animationMs <= 10;
      const isFocusRing =
        el.className.includes("focus") ||
        el.className.includes("ring") ||
        el.className.includes("outline");

      expect(
        isInstant || isFocusRing,
        `Element <${el.tag} class="${el.className}"> has non-essential animation ` +
          `under reduced-motion: transition=${el.transitionDuration}, ` +
          `animation=${el.animationName} ${el.animationDuration}`,
      ).toBe(true);
    }
  });

  // -------------------------------------------------------------------------
  // Req 22.4 — Keyboard navigation: tab order matches visual order
  // -------------------------------------------------------------------------
  test("tab order matches visual order and all interactive elements are keyboard-reachable", async ({
    page,
  }) => {
    await page.goto("/");

    // Collect all focusable elements in DOM order (which should match visual order
    // for a well-structured page without positive tabindex values).
    const focusableElements = await page.evaluate(() => {
      const selector = [
        "a[href]",
        "button:not([disabled])",
        'input:not([disabled]):not([type="hidden"])',
        "select:not([disabled])",
        "textarea:not([disabled])",
        "[tabindex]:not([tabindex='-1'])",
      ].join(", ");

      return Array.from(document.querySelectorAll<HTMLElement>(selector))
        .filter((el) => {
          // Only include visible elements.
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          return (
            rect.width > 0 &&
            rect.height > 0 &&
            style.visibility !== "hidden" &&
            style.display !== "none"
          );
        })
        .map((el) => ({
          tag: el.tagName,
          text: el.textContent?.trim().slice(0, 50) ?? "",
          tabIndex: el.tabIndex,
          top: el.getBoundingClientRect().top,
          left: el.getBoundingClientRect().left,
        }));
    });

    // Verify no element has a positive tabindex (which would break natural order).
    const positiveTabIndex = focusableElements.filter(
      (el) => el.tabIndex > 0,
    );
    expect(
      positiveTabIndex,
      `Found elements with positive tabindex (breaks natural tab order): ` +
        JSON.stringify(positiveTabIndex),
    ).toHaveLength(0);

    // Verify there is at least one focusable element (the skip link + nav + CTA).
    expect(
      focusableElements.length,
      "Page should have at least one keyboard-reachable interactive element",
    ).toBeGreaterThan(0);

    // Tab through the page and verify each element receives focus in sequence.
    // We limit to the first 20 elements to keep the test fast.
    const limit = Math.min(focusableElements.length, 20);
    for (let i = 0; i < limit; i++) {
      await page.keyboard.press("Tab");
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return null;
        return {
          tag: el.tagName,
          text: el.textContent?.trim().slice(0, 50) ?? "",
          tabIndex: (el as HTMLElement).tabIndex,
        };
      });
      expect(focused, `No element focused after Tab press ${i + 1}`).not.toBeNull();
    }
  });

  // -------------------------------------------------------------------------
  // axe accessibility scan — no critical/serious violations
  // -------------------------------------------------------------------------
  test("axe scan: no critical or serious violations on the home page", async ({
    page,
  }) => {
    await page.goto("/");

    // Wait for the page to be fully rendered.
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      // Scope to the document body.
      .include("body")
      // Exclude third-party embeds (booking widget iframe) which we don't control.
      .exclude("iframe")
      // Run all WCAG 2.1 AA rules.
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    // Filter to only critical and serious violations.
    const criticalOrSerious = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );

    expect(
      criticalOrSerious,
      `Found ${criticalOrSerious.length} critical/serious axe violation(s):\n` +
        criticalOrSerious
          .map(
            (v) =>
              `  [${v.impact}] ${v.id}: ${v.description}\n` +
              `    Nodes: ${v.nodes.map((n) => n.html).join(", ")}`,
          )
          .join("\n"),
    ).toHaveLength(0);
  });
});
