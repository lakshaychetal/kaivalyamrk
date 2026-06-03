/**
 * Responsive-image pipeline contract — committed, hand-authored types.
 * ---------------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 5.1)
 *
 * The build-time `sharp` asset pipeline (`scripts/build-assets.mjs`) encodes
 * each source image into responsive AVIF/WebP (+ JPEG fallback) variants at
 * 400 / 800 / 1200 / 1600 widths (never upscaling past the intrinsic width) and
 * emits, per image, the `srcset`/`sizes` data described here.
 *
 * These TYPES are committed and stable so that:
 *   • the GENERATED catalog modules (`content/generated/*`, gitignored) can
 *     import them, and
 *   • the future `ResponsiveImage` wrapper over `next/image` (task 3.2) can
 *     consume the same shape without depending on generated output.
 *
 * The pipeline keeps the canonical {@link ImageAsset} (`content/types.ts`)
 * untouched — `ImageAsset` carries the intrinsic `width`/`height` (for CLS,
 * Req 20.3) and `src`/`alt`/`source`, while the responsive `srcset`/`sizes`
 * payload lives alongside it in an {@link ImageVariantMap} keyed by the asset
 * `id`. This keeps the discriminated-union attribution contract in `types.ts`
 * intact while still satisfying Req 20.1/20.4 (modern formats + responsive
 * `srcset`/`sizes`).
 */

/** The encoded output formats, in `<picture>` preference order. */
export type ResponsiveFormat = "image/avif" | "image/webp" | "image/jpeg";

/**
 * One `<source>` for a `<picture>` element: a MIME `type` and its `srcSet`
 * value (`"<url> <w>w, …"`), already assembled at build time (Req 20.1, 20.4).
 */
export interface ResponsiveSource {
  type: ResponsiveFormat;
  /** A ready-to-use `srcset` attribute value, e.g. `"/a-400.avif 400w, …"`. */
  srcSet: string;
}

/**
 * The full responsive payload for a single image, keyed elsewhere by the asset
 * `id`. `src`/`width`/`height` mirror the matching {@link ImageAsset} so a
 * consumer can render from this record alone.
 */
export interface ResponsiveVariants {
  /** Matches the {@link ImageAsset.id} this payload belongs to. */
  id: string;
  /** JPEG fallback at the largest generated width — the `<img>` `src`. */
  src: string;
  /** Intrinsic width in px (Req 20.3). */
  width: number;
  /** Intrinsic height in px (Req 20.3). */
  height: number;
  /** The generated variant widths (subset of 400/800/1200/1600, no upscaling). */
  widths: number[];
  /** AVIF, WebP, then JPEG sources — modern formats first (Req 20.1). */
  sources: ResponsiveSource[];
  /** The responsive `sizes` attribute (Req 20.4). */
  sizes: string;
}

/** Maps an {@link ImageAsset.id} to its {@link ResponsiveVariants}. */
export type ImageVariantMap = Record<string, ResponsiveVariants>;

/**
 * Named `sizes` presets the pipeline assigns by usage. Full-bleed hero imagery
 * (the `night_ambiance` candidates, Req 2.1) spans the viewport; gallery tiles
 * and attraction cards lay out in a responsive 1→2→3 column grid.
 */
export const SIZES = {
  /** Full-viewport hero / priority imagery. */
  hero: "100vw",
  /** Gallery grid tile: 1 col mobile, 2 col tablet, 3 col desktop. */
  galleryTile: "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw",
  /** Attraction card: 1 col mobile, 2 col tablet, 3 col desktop. */
  attractionCard: "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw",
} as const;
