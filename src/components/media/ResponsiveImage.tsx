"use client";

/**
 * ResponsiveImage — the design-system image primitive.
 * -----------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 3.2)
 *
 * A thin, reusable wrapper over `next/image` that bakes the project's
 * performance + resilience guarantees into every rendered image so individual
 * callers (gallery, cards, hero, about/cuisine sections, …) cannot forget them:
 *
 *   • Modern formats (AVIF/WebP) — emitted by `next/image` using the
 *     `images.formats` config in `next.config.ts` (Req 20.1).
 *   • Responsive `srcset` + `sizes` — `next/image` generates `srcset` from the
 *     configured device/image sizes; this component requires a `sizes`
 *     attribute (with a sensible default) so the browser fetches a source sized
 *     to the viewport (Req 20.4).
 *   • Reserved layout space → CLS < 0.1 — every render reserves the image's box
 *     up-front. Intrinsic mode passes the asset's `width`/`height` to
 *     `next/image` (the element declares both); `fill` mode reserves an explicit
 *     `aspect-ratio` box on the wrapper. Either way the box never collapses or
 *     resizes after load (Req 20.3).
 *   • Lazy by default, eager for heroes — non-priority images render with
 *     `loading="lazy"`; passing `priority` opts an above-the-fold/hero image
 *     into eager, high-priority loading (Req 20.2).
 *   • Branded `onError` fallback — if the image fails to load, the component
 *     swaps in a branded placeholder (a warm-sand surface with the Kaivalyam
 *     leaf mark) that occupies the SAME reserved box, so a broken image never
 *     causes a layout shift (Req 7.7).
 *
 * Accessibility:
 *   • `alt` is always forwarded (Req 22.2). An empty `alt` still renders
 *     accessibly (treated as decorative); non-empty alt text is the data
 *     contract enforced by the asset-pipeline validator (task 5.2).
 *   • The fade-in is purely decorative and is disabled under
 *     `prefers-reduced-motion` (Req 22.7); the image is always fully visible
 *     when reduced motion is requested.
 *
 * Styling uses ONLY semantic design tokens (`bg-surface-alt`, `border-border`,
 * `text-on-surface-muted`) — no raw hex.
 *
 * This is a CLIENT component because it tracks load/error state for the
 * fade-in and the `onError` placeholder swap.
 */

import Image from "next/image";
import {
  useCallback,
  useState,
  type CSSProperties,
  type ReactElement,
} from "react";

import type { ImageAsset } from "@/content/types";

/**
 * The subset of {@link ImageAsset} fields this component needs. A full
 * `ImageAsset` (or `Photo`) is structurally assignable, so callers may pass the
 * content object directly.
 */
export type ResponsiveImageAsset = Pick<
  ImageAsset,
  "src" | "alt" | "width" | "height"
> & {
  /** Optional stable id (useful for keys / test selectors). */
  id?: string;
};

export interface ResponsiveImageProps {
  /** The image to render. Supplies `src`, `alt`, and intrinsic `width`/`height`. */
  image: ResponsiveImageAsset;
  /**
   * The responsive `sizes` attribute (Req 20.4). Controls which `srcset`
   * candidate the browser downloads. Defaults to a layout-aware value:
   *   • `priority` (hero/full-bleed): `"100vw"`.
   *   • otherwise (grid/column usage): `"(min-width: 1024px) 33vw,
   *     (min-width: 640px) 50vw, 100vw"`.
   * Callers SHOULD override with the value that matches their layout.
   */
  sizes?: string;
  /**
   * Mark this as an above-the-fold / hero image: loads eagerly with high
   * priority instead of `loading="lazy"` (Req 20.2). Use for the Home
   * `night_ambiance` hero and similar. Defaults to `false`.
   */
  priority?: boolean;
  /**
   * Use `next/image` `fill` layout (the image covers a positioned wrapper whose
   * box is reserved by an explicit `aspect-ratio` derived from the asset's
   * intrinsic dimensions). Use for cover/banner imagery. When `false` (default)
   * the image declares its intrinsic `width`/`height` directly.
   */
  fill?: boolean;
  /** `object-fit` for `fill` mode. Defaults to `"cover"`. */
  objectFit?: CSSProperties["objectFit"];
  /** Classes forwarded to the `<img>` element. */
  className?: string;
  /** Classes forwarded to the wrapper element (sizing, rounding, etc.). */
  wrapperClassName?: string;
  /**
   * Accessible description used by the fallback placeholder when the image
   * fails to load. Defaults to the image's `alt`. When neither is non-empty the
   * placeholder is treated as decorative.
   */
  fallbackAlt?: string;
}

/** Join class fragments, dropping falsy values. */
function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/**
 * Branded inline placeholder shown when the image fails to load (Req 7.7).
 * Rendered as a warm-sand surface bearing the Kaivalyam leaf mark, using only
 * semantic tokens. It fills whatever box the parent reserved, so swapping it in
 * for a broken image causes no layout shift.
 *
 * An inline SVG (not an icon-library import) is used deliberately: it keeps the
 * primitive dependency-free and renders the brand leaf mark consistent with the
 * project's single (Lucide) icon visual language.
 */
function BrandedPlaceholder({
  className,
  style,
  label,
}: {
  className?: string;
  style?: CSSProperties;
  /** Accessible label; when empty the placeholder is decorative. */
  label: string;
}): ReactElement {
  const hasLabel = label.trim().length > 0;
  const a11y = hasLabel
    ? { role: "img" as const, "aria-label": label }
    : { "aria-hidden": true as const };

  return (
    <span
      {...a11y}
      data-testid="responsive-image-fallback"
      className={cx(
        "flex items-center justify-center bg-surface-alt text-on-surface-muted",
        className,
      )}
      style={style}
    >
      {/* Kaivalyam leaf mark — decorative within the labeled container. */}
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-1/4 max-h-12 min-h-6 w-auto opacity-70"
      >
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6" />
      </svg>
    </span>
  );
}

/**
 * Render a responsive, resilient image. See the module doc for the guarantees
 * this primitive enforces on every render.
 */
export function ResponsiveImage({
  image,
  sizes,
  priority = false,
  fill = false,
  objectFit = "cover",
  className,
  wrapperClassName,
  fallbackAlt,
}: ResponsiveImageProps): ReactElement {
  const { src, alt, width, height } = image;

  // loading → loaded drives the decorative fade; error swaps in the placeholder.
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    "loading",
  );

  // Cached images can finish before React attaches load handlers; detect that
  // synchronously via the ref so the image never stays stuck at opacity 0.
  const handleImgRef = useCallback((node: HTMLImageElement | null) => {
    if (node?.complete && node.naturalWidth > 0) {
      setStatus((prev) => (prev === "error" ? prev : "loaded"));
    }
  }, []);

  // Sensible, layout-aware default for the responsive `sizes` attribute.
  const resolvedSizes =
    sizes ??
    (priority
      ? "100vw"
      : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw");

  const effectiveFallbackAlt = fallbackAlt ?? alt;

  // Decorative fade-in: fully disabled (and image kept visible) under
  // prefers-reduced-motion (Req 22.7).
  const fadeClasses = cx(
    "transition-opacity duration-500 ease-out",
    "motion-reduce:transition-none motion-reduce:opacity-100",
    status === "loaded" ? "opacity-100" : "opacity-0",
  );

  // `alt` is passed explicitly on each <Image> (not via this spread) so the
  // jsx-a11y/alt-text rule can statically verify it is present.
  const commonImageProps = {
    src,
    sizes: resolvedSizes,
    ref: handleImgRef,
    onLoad: () => setStatus((prev) => (prev === "error" ? prev : "loaded")),
    onError: () => setStatus("error"),
    // Never pass both `priority` and `loading`: `priority` implies eager.
    ...(priority ? { priority: true } : { loading: "lazy" as const }),
  };

  // ---- fill mode: explicit aspect-ratio wrapper reserves the box ----------
  if (fill) {
    // The caller may already define the box on the wrapper — either an explicit
    // `aspect-[…]` ratio (e.g. a uniform 4/3 card grid) or a fully-sized,
    // positioned box (`inset-0`, `h-full`). In those cases we must NOT also set
    // an inline `aspectRatio` from the image's intrinsic dimensions, because an
    // inline style overrides the class and would force every image back to its
    // own (often mismatched) ratio — leaving wide/short images half-filling a
    // full-height bordered card. Only when the caller defines no box do we
    // reserve the intrinsic ratio so the layout space is still guaranteed
    // (Req 20.3 — no CLS).
    const wrapperDefinesBox =
      typeof wrapperClassName === "string" &&
      /\baspect-|\binset-0\b|\bh-full\b|\bh-\[/.test(wrapperClassName);

    const reservedBox: CSSProperties | undefined = wrapperDefinesBox
      ? undefined
      : { aspectRatio: `${width} / ${height}` };

    return (
      <span
        className={cx("relative block w-full overflow-hidden", wrapperClassName)}
        style={reservedBox}
      >
        {status === "error" ? (
          <BrandedPlaceholder
            label={effectiveFallbackAlt}
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <Image
            {...commonImageProps}
            alt={alt}
            fill
            className={cx("object-cover", fadeClasses, className)}
            style={{ objectFit }}
          />
        )}
      </span>
    );
  }

  // ---- intrinsic mode (default): the <img> declares width + height --------
  // Both the image (via width/height attrs + h-auto) and the placeholder (via
  // aspect-ratio) reserve the same box at the same rendered width, so swapping
  // to the placeholder on error is layout-shift free.
  return (
    <span className={cx("block", wrapperClassName)}>
      {status === "error" ? (
        <BrandedPlaceholder
          label={effectiveFallbackAlt}
          className={cx("w-full", className)}
          style={{ aspectRatio: `${width} / ${height}`, maxWidth: width }}
        />
      ) : (
        <Image
          {...commonImageProps}
          alt={alt}
          width={width}
          height={height}
          className={cx("h-auto w-full", fadeClasses, className)}
        />
      )}
    </span>
  );
}

export default ResponsiveImage;
