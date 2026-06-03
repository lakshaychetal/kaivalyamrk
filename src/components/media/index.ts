/**
 * Media components barrel.
 * ------------------------
 * Feature: kaivalyam-homestay-website (task 3.2)
 *
 * Public surface for the design-system image primitive. Consumers
 * (gallery, attraction cards, hero, content sections) import from
 * `@/components/media` rather than the file directly.
 */
export {
  ResponsiveImage,
  default,
  type ResponsiveImageProps,
  type ResponsiveImageAsset,
} from "./ResponsiveImage";
