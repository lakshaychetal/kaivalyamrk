/**
 * Smoke / config tests — one-time setup verification (task 17.5).
 * ---------------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website
 *
 * These tests verify that critical configuration and structural setup is
 * correct. They are FAST and FOCUSED — no rendering, no network, no DOM.
 * Each test maps to a specific requirement clause.
 *
 * Checks:
 *   1. HTTPS for the booking host (Req 15.5)
 *   2. Viewport meta — width + initialScale, no zoom lock (Req 18.3)
 *   3. Breakpoint tokens — mobile/tablet/desktop/large-desktop (Req 18.1)
 *   4. Semantic color tokens defined (Req 19.2)
 *   5. Single icon family, no emoji used as icons (Req 19.4)
 *   6. Privacy notice present and linked from footer (Req 17.7)
 *   7. Design-system documentation present (Req 19.7)
 *   8. Sitemap excludes /admin/*; robots disallows /admin/ (Req 21.3)
 */

import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

// ---------------------------------------------------------------------------
// 1. HTTPS for the booking host (Req 15.5)
// ---------------------------------------------------------------------------
describe("Req 15.5 — booking URL uses HTTPS", () => {
  it("buildBookingUrl produces a URL with the https: protocol", async () => {
    const { buildBookingUrl, kaivalyamBookingConfig } = await import(
      "@/domain/integration-urls/booking-url"
    );
    const url = buildBookingUrl(kaivalyamBookingConfig);
    const parsed = new URL(url);
    expect(parsed.protocol).toBe("https:");
  });

  it("buildBookingUrl upgrades an http:// base to https:", async () => {
    const { buildBookingUrl } = await import(
      "@/domain/integration-urls/booking-url"
    );
    const url = buildBookingUrl({
      baseUrl: "http://eeabsolute.com",
      country: "India",
      state: "Kerala",
      city: "Wayanad",
    });
    const parsed = new URL(url);
    expect(parsed.protocol).toBe("https:");
  });
});

// ---------------------------------------------------------------------------
// 2. Viewport meta — width + initialScale, no zoom lock (Req 18.3)
// ---------------------------------------------------------------------------
// We read the layout source file directly rather than importing the module,
// because next/font/google is not available in the jsdom test environment.
describe("Req 18.3 — viewport configuration", () => {
  const layoutSource = fs.readFileSync(
    path.resolve(__dirname, "../app/layout.tsx"),
    "utf-8",
  );

  it("exports a viewport object with width: 'device-width'", () => {
    // The viewport export must set width to "device-width"
    expect(layoutSource).toMatch(/width\s*:\s*["']device-width["']/);
  });

  it("exports a viewport object with initialScale: 1", () => {
    // The viewport export must set initialScale to 1
    expect(layoutSource).toMatch(/initialScale\s*:\s*1\b/);
  });

  it("does NOT set maximumScale in the viewport export", () => {
    // maximumScale must not appear in the viewport export block
    // Extract the viewport export block to check it in isolation
    const viewportMatch = layoutSource.match(
      /export\s+const\s+viewport\s*:\s*Viewport\s*=\s*\{([^}]+)\}/,
    );
    expect(viewportMatch).not.toBeNull();
    const viewportBlock = viewportMatch![1];
    expect(viewportBlock).not.toMatch(/maximumScale/);
  });

  it("does NOT set userScalable: false in the viewport export", () => {
    // userScalable: false must not appear in the viewport export block
    const viewportMatch = layoutSource.match(
      /export\s+const\s+viewport\s*:\s*Viewport\s*=\s*\{([^}]+)\}/,
    );
    expect(viewportMatch).not.toBeNull();
    const viewportBlock = viewportMatch![1];
    // Either userScalable is absent, or it is not set to false
    expect(viewportBlock).not.toMatch(/userScalable\s*:\s*false/);
  });
});

// ---------------------------------------------------------------------------
// 3. Breakpoint tokens (Req 18.1)
// ---------------------------------------------------------------------------
describe("Req 18.1 — breakpoint tokens", () => {
  it("defines a mobile breakpoint at 375px", async () => {
    const { breakpoints } = await import("@/domain/design/tokens");
    expect(breakpoints.mobile).toBe(375);
  });

  it("defines a tablet breakpoint at 768px", async () => {
    const { breakpoints } = await import("@/domain/design/tokens");
    expect(breakpoints.tablet).toBe(768);
  });

  it("defines a desktop breakpoint at 1024px", async () => {
    const { breakpoints } = await import("@/domain/design/tokens");
    expect(breakpoints.desktop).toBe(1024);
  });

  it("defines a large-desktop breakpoint at 1440px", async () => {
    const { breakpoints } = await import("@/domain/design/tokens");
    expect(breakpoints.large).toBe(1440);
  });
});

// ---------------------------------------------------------------------------
// 4. Semantic color tokens defined (Req 19.2)
// ---------------------------------------------------------------------------
describe("Req 19.2 — semantic color tokens", () => {
  const REQUIRED_TOKENS = [
    "primary",
    "secondary",
    "surface",
    "onSurface",
    "onPrimary",
    "accent",
    "surfaceAlt",
    "onSurfaceMuted",
    "border",
    "focus",
    "success",
    "error",
  ] as const;

  it.each(REQUIRED_TOKENS)(
    "exports the '%s' semantic color token as a non-empty hex string",
    async (tokenName) => {
      const { colors } = await import("@/domain/design/tokens");
      const value = (colors as Record<string, string>)[tokenName];
      expect(value).toBeDefined();
      expect(typeof value).toBe("string");
      // Must be a hex color: # followed by 3 or 6 hex digits
      expect(value).toMatch(/^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/);
    },
  );
});

// ---------------------------------------------------------------------------
// 5. Single icon family, no emoji used as icons (Req 19.4)
// ---------------------------------------------------------------------------
describe("Req 19.4 — Lucide icons only, no emoji as icons", () => {
  /**
   * Emoji detection regex: matches common emoji ranges.
   * We look for emoji in JSX/TSX component source files to catch patterns like
   * <span>🏠</span> or <button>📅 Book</button> used as icon substitutes.
   *
   * The regex covers the main Unicode emoji blocks:
   *   U+1F300–U+1FFFF  (Misc Symbols, Emoticons, Transport, etc.)
   *   U+2600–U+27BF    (Misc Symbols, Dingbats)
   *   U+FE00–U+FE0F    (Variation Selectors — emoji presentation)
   *
   * SCOPE: only .tsx/.jsx component files (not .ts content/data files).
   * EXCLUSION: lines that are pure comments (// or * ) are skipped — the
   * requirement is about emoji used as ICONS in rendered UI, not in doc
   * comments or warning annotations (e.g. ⚠️ in JSDoc).
   */
  const EMOJI_REGEX =
    /[\u{1F300}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}]/u;

  /** A line that is purely a comment (single-line // or block * comment). */
  function isCommentLine(line: string): boolean {
    const trimmed = line.trim();
    return (
      trimmed.startsWith("//") ||
      trimmed.startsWith("*") ||
      trimmed.startsWith("/*")
    );
  }

  function collectComponentFiles(dir: string, results: string[] = []): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (
          entry.name === "node_modules" ||
          entry.name === ".next" ||
          entry.name === ".git"
        ) {
          continue;
        }
        collectComponentFiles(fullPath, results);
      } else if (
        entry.isFile() &&
        // Only check component/page files (JSX-capable), not pure .ts data files
        /\.(tsx|jsx)$/.test(entry.name) &&
        !entry.name.endsWith(".test.tsx") &&
        !entry.name.endsWith(".spec.tsx")
      ) {
        results.push(fullPath);
      }
    }
    return results;
  }

  it("no emoji characters appear in JSX component source files (outside comments)", () => {
    const srcDir = path.resolve(__dirname, "..");
    const files = collectComponentFiles(srcDir);

    const violations: string[] = [];
    for (const file of files) {
      const content = fs.readFileSync(file, "utf-8");
      const lines = content.split("\n");
      lines.forEach((line, idx) => {
        // Skip pure comment lines — emoji in doc comments (e.g. ⚠️) are fine
        if (isCommentLine(line)) return;
        if (EMOJI_REGEX.test(line)) {
          violations.push(`${file}:${idx + 1}: ${line.trim()}`);
        }
      });
    }

    if (violations.length > 0) {
      throw new Error(
        `Emoji found in component JSX (use Lucide icons instead):\n${violations.join("\n")}`,
      );
    }
    expect(violations).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 6. Privacy notice present and linked from footer (Req 17.7)
// ---------------------------------------------------------------------------
describe("Req 17.7 — privacy notice present and linked", () => {
  it("the privacy page file exists at src/app/privacy/page.tsx", () => {
    const privacyPage = path.resolve(
      __dirname,
      "../app/privacy/page.tsx",
    );
    expect(fs.existsSync(privacyPage)).toBe(true);
  });

  it("the footer component links to /privacy", async () => {
    const footerModule = await import(
      "@/components/layout/SiteFooter"
    );
    // The PRIVACY_HREF constant is exported from SiteFooter
    const { PRIVACY_HREF } = footerModule as { PRIVACY_HREF?: string };
    expect(PRIVACY_HREF).toBe("/privacy");
  });

  it("the footer source file contains a Link to /privacy", () => {
    const footerFile = path.resolve(
      __dirname,
      "../components/layout/SiteFooter.tsx",
    );
    const content = fs.readFileSync(footerFile, "utf-8");
    // The footer uses PRIVACY_HREF constant ("/privacy") in a <Link href={PRIVACY_HREF}>
    // Check either a literal "/privacy" href or the PRIVACY_HREF constant is used in a Link
    const hasPrivacyLink =
      content.includes('"/privacy"') ||
      content.includes("'/privacy'") ||
      (content.includes("PRIVACY_HREF") && content.includes("<Link"));
    expect(hasPrivacyLink).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 7. Design-system documentation present (Req 19.7)
// ---------------------------------------------------------------------------
describe("Req 19.7 — design-system documentation present", () => {
  it("the spec design.md file exists", () => {
    const designMd = path.resolve(
      __dirname,
      "../../.kiro/specs/kaivalyam-homestay-website/design.md",
    );
    expect(fs.existsSync(designMd)).toBe(true);
  });

  it("design.md contains a Design System section", () => {
    const designMd = path.resolve(
      __dirname,
      "../../.kiro/specs/kaivalyam-homestay-website/design.md",
    );
    const content = fs.readFileSync(designMd, "utf-8");
    // The design.md has a "### Design System" section (line 345)
    expect(content).toMatch(/#+\s*Design System/i);
  });

  it("design.md documents semantic color tokens", () => {
    const designMd = path.resolve(
      __dirname,
      "../../.kiro/specs/kaivalyam-homestay-website/design.md",
    );
    const content = fs.readFileSync(designMd, "utf-8");
    // Should mention semantic tokens / color tokens
    expect(content).toMatch(/semantic.*token|token.*semantic|color.*token|token.*color/i);
  });
});

// ---------------------------------------------------------------------------
// 8. Sitemap excludes /admin/*; robots disallows /admin/ (Req 21.3)
// ---------------------------------------------------------------------------
describe("Req 21.3 — sitemap and robots admin exclusion", () => {
  it("sitemap() does not include any /admin/* URLs", async () => {
    const sitemapModule = await import("@/app/sitemap");
    const sitemapFn = sitemapModule.default;
    // The default export is the sitemap function; call it to get the entries
    const sitemap = typeof sitemapFn === "function" ? sitemapFn() : sitemapFn;

    type SitemapEntry = { url: string };
    const entries = Array.isArray(sitemap) ? (sitemap as SitemapEntry[]) : [];
    const adminEntries = entries.filter((entry) =>
      entry.url.includes("/admin"),
    );
    expect(adminEntries).toHaveLength(0);
  });

  it("robots() disallows /admin/ for all user-agents", async () => {
    const robotsModule = await import("@/app/robots");
    const robotsFn = robotsModule.default;
    // The default export is the robots function; call it to get the config
    const robots = typeof robotsFn === "function" ? robotsFn() : robotsFn;
    type RobotsRule = { disallow?: string | string[] };
    type RobotsResult = { rules?: RobotsRule | RobotsRule[]; sitemap?: string };
    const result = robots as RobotsResult;

    // robots.rules can be a single rule object or an array of rule objects
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];

    // At least one rule must disallow /admin/
    const hasAdminDisallow = rules.some(
      (rule) => {
        if (!rule) return false;
        const disallow = rule.disallow;
        if (Array.isArray(disallow)) {
          return disallow.some((d) => d === "/admin/" || d.startsWith("/admin"));
        }
        return (
          disallow === "/admin/" ||
          (typeof disallow === "string" && disallow.startsWith("/admin"))
        );
      },
    );

    expect(hasAdminDisallow).toBe(true);
  });

  it("robots() includes a sitemap URL", async () => {
    const robotsModule = await import("@/app/robots");
    const robotsFn = robotsModule.default;
    const robots = typeof robotsFn === "function" ? robotsFn() : robotsFn;
    type RobotsResult = { rules?: unknown; sitemap?: string };
    const result = robots as RobotsResult;

    expect(result.sitemap).toBeDefined();
    expect(typeof result.sitemap === "string" ? result.sitemap : "").toMatch(
      /sitemap\.xml/,
    );
  });
});
