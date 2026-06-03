/**
 * Design-system component barrel — Kaivalyam (task 3.1).
 * ------------------------------------------------------
 * Presentational, reusable UI primitives consumed by the site shell and pages
 * in later tasks. All styling resolves to SEMANTIC design tokens (no raw hex);
 * Lucide is the single icon family (Req 19.4); the primary CTA style lives in
 * exactly one component, {@link BookNowButton} (Req 19.6).
 *
 * NOTE: the responsive image component lives under `src/components/media/`
 * (task 3.2) and is intentionally NOT re-exported here.
 */

// Class utility
export { cn } from "./cn";
export type { ClassValue } from "./cn";

// Icons (single Lucide family)
export { Icon, iconSizes } from "./Icon";
export type { IconProps, IconSize, LucideIcon } from "./Icon";

// Buttons + the canonical primary CTA
export { Button, IconButton } from "./Button";
export type { ButtonProps, IconButtonProps } from "./Button";
export { BookNowButton } from "./BookNowButton";
export type { BookNowButtonProps } from "./BookNowButton";
export {
  buttonClassNames,
  focusRing,
} from "./buttonStyles";
export type {
  ButtonVariant,
  ButtonSize,
  ButtonClassOptions,
} from "./buttonStyles";

// Cards
export { Card, CardTitle, CardBody } from "./Card";
export type { CardProps, CardVariant, CardElevation } from "./Card";

// Form controls
export * from "./form";
