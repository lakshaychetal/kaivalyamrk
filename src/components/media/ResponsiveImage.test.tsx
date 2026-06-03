/**
 * Property + unit tests for the responsive-image rendering pipeline.
 * ------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 3.3)
 *
 * Exercises the `ResponsiveImage` primitive (the wrapper every image on the
 * site renders through) plus the generated responsive-variant data, proving the
 * project's image invariants hold for ALL rendered images:
 *   • declares intrinsic width+height (intrinsic mode) OR an explicit
 *     aspect-ratio box (fill mode) → reserved layout space, CLS < 0.1 (Req 20.3);
 *   • emits a responsive `srcset` plus a `sizes` attribute (Req 20.4);
 *   • is served as modern formats (AVIF/WebP) — via `next.config` `images.formats`
 *     and the AVIF/WebP `<source>`s the build pipeline emits per image (Req 20.1);
 *   • renders `loading="lazy"` unless it is a hero/priority image (Req 20.2).
 *
 * **Validates: Requirements 20.1, 20.2, 20.3, 20.4**
 */
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import fc from "fast-check";

import { assertProperty } from "@/lib/pbt";
import nextConfig from "../../../next.config";
import { imageVariants } from "@/content/generated/image-variants";
import { ResponsiveImage, type ResponsiveImageAsset } from "./ResponsiveImage";

/** A URL-safe alphanumeric slug (1–16 chars). */
const slugArb = fc
  .array(fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789".split("")), {
    minLength: 1,
    maxLength: 16,
  })
  .map((chars) => chars.join(""));

/** Smart generator for a renderable image asset (valid src + positive dims). */
const assetArb: fc.Arbitrary<ResponsiveImageAsset> = fc.record({
  id: slugArb,
  src: slugArb.map((slug) => `/generated/${slug}.jpg`),
  alt: fc.string({ minLength: 1, maxLength: 40 }),
  width: fc.integer({ min: 1, max: 4608 }),
  height: fc.integer({ min: 1, max: 4608 }),
});

describe("Property 11 — image rendering pipeline invariants", () => {
  // Feature: kaivalyam-homestay-website, Property 11: Image rendering pipeline invariants
  it("every rendered image reserves space, ships srcset+sizes, and is lazy unless priority", () => {
    assertProperty(
      fc.property(
        assetArb,
        fc.boolean(), // priority (hero) or not
        fc.boolean(), // fill (aspect-ratio box) or intrinsic
        (image, priority, fill) => {
          const { container, unmount } = render(
            <ResponsiveImage image={image} priority={priority} fill={fill} />,
          );

          try {
            const img = container.querySelector("img");
            expect(img).not.toBeNull();
            if (!img) return;

            // Responsive srcset + sizes are always present and non-empty (Req 20.4).
            const srcset = img.getAttribute("srcset") ?? img.getAttribute("srcSet");
            expect(srcset).toBeTruthy();
            expect((srcset ?? "").length).toBeGreaterThan(0);
            expect(srcset).toContain("w"); // width-descriptor candidates
            const sizes = img.getAttribute("sizes");
            expect(sizes).toBeTruthy();
            expect((sizes ?? "").length).toBeGreaterThan(0);

            // Reserved layout space (Req 20.3): intrinsic mode declares
            // width+height on the <img>; fill mode reserves an aspect-ratio box
            // on the wrapper. One of the two MUST hold.
            const hasIntrinsicDims =
              img.getAttribute("width") !== null &&
              img.getAttribute("height") !== null;
            const wrapper = container.firstElementChild as HTMLElement | null;
            const reservesAspectRatio = Boolean(
              wrapper && wrapper.style.aspectRatio.trim().length > 0,
            );
            expect(hasIntrinsicDims || reservesAspectRatio).toBe(true);

            // Lazy unless designated hero/priority (Req 20.2).
            if (priority) {
              expect(img.getAttribute("loading")).not.toBe("lazy");
            } else {
              expect(img.getAttribute("loading")).toBe("lazy");
            }
          } finally {
            unmount();
          }
        },
      ),
    );
  });

  // Feature: kaivalyam-homestay-website, Property 11: Image rendering pipeline invariants
  it("modern formats (AVIF/WebP) are provided for every pipeline image", () => {
    // The optimizer is configured to emit AVIF then WebP (Req 20.1).
    expect(nextConfig.images?.formats).toEqual(["image/avif", "image/webp"]);

    const variants = Object.values(imageVariants);
    expect(variants.length).toBeGreaterThan(0);

    assertProperty(
      fc.property(fc.constantFrom(...variants), (variant) => {
        const types = variant.sources.map((s) => s.type);
        // Modern-format sources are present (AVIF and/or WebP) (Req 20.1).
        expect(types).toContain("image/avif");
        expect(types).toContain("image/webp");

        // Each source carries a width-descriptor srcset (Req 20.4) and the
        // variant declares intrinsic dimensions (Req 20.3) + a sizes value.
        for (const source of variant.sources) {
          expect(source.srcSet.length).toBeGreaterThan(0);
          expect(source.srcSet).toContain("w");
        }
        expect(variant.width).toBeGreaterThan(0);
        expect(variant.height).toBeGreaterThan(0);
        expect(variant.sizes.length).toBeGreaterThan(0);
      }),
    );
  });
});

describe("ResponsiveImage — example checks", () => {
  it("intrinsic mode declares width/height and lazy-loads by default", () => {
    const { container } = render(
      <ResponsiveImage
        image={{ id: "a", src: "/a.jpg", alt: "A garden path", width: 800, height: 600 }}
      />,
    );
    const img = container.querySelector("img")!;
    expect(img.getAttribute("width")).toBe("800");
    expect(img.getAttribute("height")).toBe("600");
    expect(img.getAttribute("loading")).toBe("lazy");
  });

  it("priority hero image is eager (not lazy) and reserves an aspect-ratio box in fill mode", () => {
    const { container } = render(
      <ResponsiveImage
        priority
        fill
        image={{ id: "h", src: "/hero.jpg", alt: "Night hero", width: 1600, height: 900 }}
      />,
    );
    const img = container.querySelector("img")!;
    expect(img.getAttribute("loading")).not.toBe("lazy");
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.aspectRatio.replace(/\s/g, "")).toBe("1600/900");
  });
});
