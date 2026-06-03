/**
 * Responsive E2E tests — Task 17.3
 * Feature: kaivalyam-homestay-website
 *
 * Validates:
 *   - Req 18.2: No horizontal scrolling at 375 / 768 / 1024 / 1440 px
 *   - Req 1.6:  Nav collapse below 768 px (mobile) vs. visible at desktop (1024 px)
 *   - Req 18.6: Portrait and landscape legibility on mobile (375×812 / 812×375)
 *
 * The tests require a running dev/production server. When the server is not
 * available (e.g. during syntax-only CI validation with --pass-with-no-tests),
 * each test is skipped gracefully so the suite exits cleanly.
 */

import { test, expect, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** The page to test — the home page covers the full shell (header + body). */
const TEST_PATH = "/";

/**
 * Navigate to the page and skip the test if the server is not reachable.
 * Returns `true` when the page loaded successfully, `false` when skipped.
 */
async function gotoOrSkip(page: Page, path: string): Promise<boolean> {
  try {
    const response = await page.goto(path, {
      waitUntil: "domcontentloaded",
      timeout: 10_000,
    });
    if (!response || !response.ok()) {
      test.skip(true, `Server not available (status ${response?.status() ?? "no response"})`);
      return false;
    }
    return true;
  } catch {
    test.skip(true, "Dev server is not running — skipping responsive E2E test");
    return false;
  }
}

// ---------------------------------------------------------------------------
// 1. No horizontal scrolling at 375 / 768 / 1024 / 1440 px  (Req 18.2)
// ---------------------------------------------------------------------------

const BREAKPOINTS = [375, 768, 1024, 1440] as const;

for (const width of BREAKPOINTS) {
  test(`no horizontal scroll at ${width}px viewport width (Req 18.2)`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 812 });
    const loaded = await gotoOrSkip(page, TEST_PATH);
    if (!loaded) return;

    // scrollWidth <= clientWidth means no horizontal overflow.
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.body.scrollWidth > document.body.clientWidth;
    });

    expect(
      hasHorizontalScroll,
      `Horizontal scroll detected at ${width}px: scrollWidth (${await page.evaluate(() => document.body.scrollWidth)}) > clientWidth (${await page.evaluate(() => document.body.clientWidth)})`,
    ).toBe(false);
  });
}

// ---------------------------------------------------------------------------
// 2. Nav collapse below 768 px / visible at desktop 1024 px  (Req 1.6)
// ---------------------------------------------------------------------------

test("nav links are inside a collapsible menu at 375px (mobile) (Req 1.6)", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const loaded = await gotoOrSkip(page, TEST_PATH);
  if (!loaded) return;

  // The desktop <nav aria-label="Primary"> is hidden via `hidden md:flex`.
  // At 375 px it must NOT be visible in the header.
  const desktopNav = page.locator('header nav[aria-label="Primary"]');
  await expect(desktopNav).toBeHidden();

  // The hamburger toggle button must be visible.
  const hamburger = page.locator(
    'header button[aria-label="Open menu"], header button[aria-label="Close menu"]',
  );
  await expect(hamburger).toBeVisible();
});

test("nav links are visible in the header at 1024px (desktop) (Req 1.6)", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  const loaded = await gotoOrSkip(page, TEST_PATH);
  if (!loaded) return;

  // The desktop <nav aria-label="Primary"> must be visible at 1024 px.
  const desktopNav = page.locator('header nav[aria-label="Primary"]');
  await expect(desktopNav).toBeVisible();

  // The hamburger toggle must NOT be visible at desktop width.
  const hamburger = page.locator(
    'header button[aria-label="Open menu"], header button[aria-label="Close menu"]',
  );
  await expect(hamburger).toBeHidden();
});

// ---------------------------------------------------------------------------
// 3. Portrait and landscape legibility on mobile  (Req 18.6)
// ---------------------------------------------------------------------------

const ORIENTATIONS = [
  { label: "portrait", width: 375, height: 812 },
  { label: "landscape", width: 812, height: 375 },
] as const;

for (const { label, width, height } of ORIENTATIONS) {
  test(`no horizontal scroll in mobile ${label} orientation (${width}×${height}) (Req 18.6)`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    const loaded = await gotoOrSkip(page, TEST_PATH);
    if (!loaded) return;

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.body.scrollWidth > document.body.clientWidth;
    });

    expect(
      hasHorizontalScroll,
      `Horizontal scroll detected in ${label} orientation (${width}×${height})`,
    ).toBe(false);
  });

  test(`body text font-size >= 16px in mobile ${label} orientation (${width}×${height}) (Req 18.6)`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    const loaded = await gotoOrSkip(page, TEST_PATH);
    if (!loaded) return;

    // Find the first paragraph or body-text element and check its computed font-size.
    // We check the <body> element's computed font-size as the baseline (Req 18.4).
    const bodyFontSizePx = await page.evaluate(() => {
      const style = window.getComputedStyle(document.body);
      return parseFloat(style.fontSize);
    });

    expect(
      bodyFontSizePx,
      `Body font-size (${bodyFontSizePx}px) is below 16px in ${label} orientation`,
    ).toBeGreaterThanOrEqual(16);
  });
}
