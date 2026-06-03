/**
 * Unit tests for the Photo Credits page (task 12.4).
 * --------------------------------------------------
 * Feature: kaivalyam-homestay-website
 *
 * Verifies the Req 23.1 / 23.3 / 23.4 attribution contract:
 *   • Req 23.1 — the page lists EVERY Wikimedia-sourced image's attribution.
 *   • Req 23.4 — each entry presents the attribution text and license reference:
 *                author, a license name linked to its `licenseUrl`, and a link
 *                to the `sourceUrl` (each external link is safe + accessible).
 *   • Req 23.3 — NO attribution entry is rendered for owned / AI-generated
 *                images (they are structurally excluded from the credit list).
 *
 * The expected credit set is computed independently from the SAME typed catalog
 * the page derives from, so the assertions stay in lock-step with the assets the
 * site ships (no hard-coded list on either side).
 */
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";

import PhotoCreditsPage, {
  metadata,
  collectWikimediaCredits,
} from "./page";
import { allPhotos } from "@/domain/gallery";
import { photoCatalog, attractions } from "@/content/generated";
import type { ImageAsset } from "@/content/types";

/** Every image the site ships, across both catalogs (any source). */
const everyImage: ImageAsset[] = [
  ...allPhotos(photoCatalog).map((p) => p as ImageAsset),
  ...attractions.map((a) => a.image),
];

const wikimediaImages = everyImage.filter((img) => img.source === "wikimedia");
const nonWikimediaImages = everyImage.filter(
  (img) => img.source !== "wikimedia",
);

describe("Photo Credits page (Req 23.1, 23.3, 23.4)", () => {
  it("renders a top-level Photo Credits heading", () => {
    render(<PhotoCreditsPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /photo credits/i }),
    ).toBeInTheDocument();
  });

  it("declares a self-describing page title in its metadata (Req 21.1)", () => {
    expect(typeof metadata.title).toBe("string");
    expect((metadata.title as string).length).toBeGreaterThan(0);
    expect(typeof metadata.description).toBe("string");
  });

  it("the catalog actually contains both Wikimedia and non-Wikimedia images", () => {
    // Guards the test's own assumptions: the omission assertion below is only
    // meaningful if owned/AI-generated assets actually exist in the catalog.
    expect(wikimediaImages.length).toBeGreaterThan(0);
    expect(nonWikimediaImages.length).toBeGreaterThan(0);
  });

  it("derives exactly one credit per Wikimedia image and none for others (Req 23.1, 23.3)", () => {
    const credits = collectWikimediaCredits();
    expect(credits).toHaveLength(wikimediaImages.length);

    const creditIds = new Set(credits.map((c) => c.id));
    for (const img of wikimediaImages) {
      expect(creditIds.has(img.id)).toBe(true);
    }
    for (const img of nonWikimediaImages) {
      expect(creditIds.has(img.id)).toBe(false);
    }
  });

  it("lists every Wikimedia image with author, license link, and source link (Req 23.1, 23.4)", () => {
    render(<PhotoCreditsPage />);
    const list = screen.getByRole("list");

    // One <li> entry per Wikimedia image — exhaustive, nothing dropped.
    const entries = within(list).getAllByRole("listitem");
    expect(entries).toHaveLength(wikimediaImages.length);

    for (const img of wikimediaImages) {
      if (img.source !== "wikimedia") continue; // narrows the union for TS
      const { author, licenseName, licenseUrl, sourceUrl } = img.attribution;

      // Author credit text is present (Req 23.4). Multiple images may share an
      // author, so assert at least one matching credit line exists.
      expect(
        screen.getAllByText(new RegExp(`Photo by ${escapeRegExp(author)}`))
          .length,
      ).toBeGreaterThan(0);

      // The license name links to its canonical license URL (Req 23.4).
      const licenseLinks = screen
        .getAllByRole("link", { name: new RegExp(escapeRegExp(licenseName)) })
        .filter((a) => a.getAttribute("href") === licenseUrl);
      expect(licenseLinks.length).toBeGreaterThan(0);
      for (const link of licenseLinks) {
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
      }

      // A link back to the original source file is present (Req 23.4).
      const sourceLinks = screen
        .getAllByRole("link")
        .filter((a) => a.getAttribute("href") === sourceUrl);
      expect(sourceLinks.length).toBeGreaterThan(0);
      for (const link of sourceLinks) {
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
      }
    }
  });

  it("renders NO attribution entry for owned or AI-generated images (Req 23.3)", () => {
    render(<PhotoCreditsPage />);

    // None of the non-Wikimedia assets' source URLs would exist, but more
    // strongly: the rendered entry count equals the Wikimedia count exactly,
    // so owned/AI-generated images contribute zero entries.
    const list = screen.getByRole("list");
    expect(within(list).getAllByRole("listitem")).toHaveLength(
      wikimediaImages.length,
    );

    // And the owned/AI-generated images never reach the credit list at all.
    const creditIds = new Set(collectWikimediaCredits().map((c) => c.id));
    for (const img of nonWikimediaImages) {
      expect(creditIds.has(img.id)).toBe(false);
    }
  });
});

/** Escape a string for safe embedding inside a `RegExp`. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
