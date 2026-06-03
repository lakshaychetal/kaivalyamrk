/**
 * Design tokens — typed, pure, framework-free single source of truth.
 * ------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website
 *
 * This module mirrors the CSS custom properties registered in
 * `src/styles/tokens/*.css` so the design system can be reasoned about and
 * PROPERTY-TESTED in isolation (no DOM, no Tailwind, no side effects).
 *
 * ⚠️ SINGLE SOURCE OF TRUTH: the hex strings, type scale, spacing scale and
 * breakpoints here MUST stay in lock-step with the CSS `@theme` tokens in
 * `src/styles/tokens/colors.css`, `typography.css` and `spacing.css`. When a
 * token changes, change it in BOTH places (a future task may codegen the CSS
 * from this module to enforce it automatically).
 *
 * Brand source — sampled from `Kaivalyam Logo apvd.png`:
 *   • brown wordmark : #a67c52 (warm taupe / bark)
 *   • leaf green     : #7ac943 (fresh leaf)
 *
 * Consumers:
 *   • Property 5 (contrast)  → `colorPairs` + `colors`           (task 2.2)
 *   • Property 21 (sizing)   → `interactiveSizeTokens`,
 *                              `bodyTextTokens`                   (task 2.3)
 */

// ---------------------------------------------------------------------------
// Colors — semantic tokens as hex strings (mirror of colors.css @theme)
// ---------------------------------------------------------------------------

/** Hex color string in the form `#rrggbb` (lowercase). */
export type HexColor = `#${string}`;

/** Stable semantic color-token names (the design-system contract). */
export type ColorTokenName =
  | "primary"
  | "primaryHover"
  | "secondary"
  | "accent"
  | "surface"
  | "surfaceAlt"
  | "onSurface"
  | "onSurfaceMuted"
  | "onPrimary"
  | "border"
  | "focus"
  | "success"
  | "error";

/** Semantic color values — logo-derived, WCAG-AA verified. */
export const colors: Readonly<Record<ColorTokenName, HexColor>> = {
  primary: "#356a23",
  primaryHover: "#28511a",
  secondary: "#5b3f25",
  accent: "#9a6212",
  surface: "#faf6ef",
  surfaceAlt: "#efe6d6",
  onSurface: "#241c14",
  onSurfaceMuted: "#5c5042",
  onPrimary: "#ffffff",
  border: "#8d7c63",
  focus: "#8a4b08",
  success: "#1f6b34",
  error: "#b3261e",
} as const;

// ---------------------------------------------------------------------------
// Foreground / background pairs that the UI actually uses
// ---------------------------------------------------------------------------

/**
 * How a pair is used, which sets its WCAG AA minimum contrast ratio:
 *   • normal-text → 4.5:1
 *   • large-text  → 3:1 (≥24px, or ≥18.66px bold)
 *   • non-text    → 3:1 (borders, focus ring, meaningful UI elements/icons)
 */
export type ContrastUsage = "normal-text" | "large-text" | "non-text";

/** Minimum WCAG 2.1 AA contrast ratio for each usage class. */
export const CONTRAST_MINIMUMS: Readonly<Record<ContrastUsage, number>> = {
  "normal-text": 4.5,
  "large-text": 3,
  "non-text": 3,
} as const;

export interface ColorPair {
  /** Stable id for the pair (handy in test output). */
  readonly id: string;
  /** Foreground token name. */
  readonly foreground: ColorTokenName;
  /** Background token name. */
  readonly background: ColorTokenName;
  /** Intended usage → drives the contrast threshold. */
  readonly usage: ContrastUsage;
  /** Human-readable description of where this pair appears. */
  readonly description: string;
}

/**
 * The exhaustive set of foreground/background pairs the UI relies on.
 * Property 5 iterates over EXACTLY these pairs and asserts each meets its
 * usage threshold from {@link CONTRAST_MINIMUMS}.
 *
 * NOTE — focus ring: the `--color-focus` amber is evaluated against the page
 * surface(s) because the focus indicator is rendered as an OFFSET outline
 * (`outline-offset`), so a surface-colored gap always separates the ring from
 * the focused control. We therefore do NOT assert focus-on-primary contrast
 * (amber on the dark-green button is ~1:1 and never actually drawn adjacent);
 * the binding constraint is focus-ring-on-surface (≥3:1), enforced below.
 */
export const colorPairs: readonly ColorPair[] = [
  {
    id: "body-on-surface",
    foreground: "onSurface",
    background: "surface",
    usage: "normal-text",
    description: "Body text on the page/card surface",
  },
  {
    id: "muted-on-surface",
    foreground: "onSurfaceMuted",
    background: "surface",
    usage: "normal-text",
    description: "Secondary/muted text on surface",
  },
  {
    id: "body-on-surface-alt",
    foreground: "onSurface",
    background: "surfaceAlt",
    usage: "normal-text",
    description: "Body text on banded (alt) surface",
  },
  {
    id: "muted-on-surface-alt",
    foreground: "onSurfaceMuted",
    background: "surfaceAlt",
    usage: "normal-text",
    description: "Secondary/muted text on banded (alt) surface",
  },
  {
    id: "on-primary-on-primary",
    foreground: "onPrimary",
    background: "primary",
    usage: "normal-text",
    description: "Label text on the primary 'Book Now' CTA",
  },
  {
    id: "on-primary-on-primary-hover",
    foreground: "onPrimary",
    background: "primaryHover",
    usage: "normal-text",
    description: "Label text on the primary CTA hover/active state",
  },
  {
    id: "secondary-heading-on-surface",
    foreground: "secondary",
    background: "surface",
    usage: "normal-text",
    description: "Brown heading text on surface",
  },
  {
    id: "secondary-heading-on-surface-alt",
    foreground: "secondary",
    background: "surfaceAlt",
    usage: "normal-text",
    description: "Brown heading text on banded (alt) surface",
  },
  {
    id: "primary-large-on-surface",
    foreground: "primary",
    background: "surface",
    usage: "large-text",
    description: "Primary green used as large text / icon on surface",
  },
  {
    id: "primary-large-on-surface-alt",
    foreground: "primary",
    background: "surfaceAlt",
    usage: "large-text",
    description: "Primary green as large text / icon on alt surface",
  },
  {
    id: "accent-large-on-surface",
    foreground: "accent",
    background: "surface",
    usage: "large-text",
    description: "Accent gold as large text / icon highlight on surface",
  },
  {
    id: "focus-ring-on-surface",
    foreground: "focus",
    background: "surface",
    usage: "non-text",
    description: "Focus indicator ring against surface",
  },
  {
    id: "focus-ring-on-surface-alt",
    foreground: "focus",
    background: "surfaceAlt",
    usage: "non-text",
    description: "Focus indicator ring against alt surface",
  },
  {
    id: "border-on-surface",
    foreground: "border",
    background: "surface",
    usage: "non-text",
    description: "Meaningful divider/border against surface",
  },
  {
    id: "success-on-surface",
    foreground: "success",
    background: "surface",
    usage: "normal-text",
    description: "Success feedback text on surface (always with icon/text)",
  },
  {
    id: "error-on-surface",
    foreground: "error",
    background: "surface",
    usage: "normal-text",
    description: "Error feedback text on surface (always with icon/text)",
  },
] as const;

// ---------------------------------------------------------------------------
// Typography — type scale + family/weight tokens (mirror of typography.css)
// ---------------------------------------------------------------------------

/** Type scale step name → font-size in px. Scale: 12·14·16·18·24·32·48. */
export type TypeScaleName =
  | "xs"
  | "sm"
  | "base"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl";

export interface TypeScaleStep {
  readonly name: TypeScaleName;
  /** Font size in CSS pixels. */
  readonly sizePx: number;
  /** Unitless line-height (1.5–1.75 for body, tighter for headings). */
  readonly lineHeight: number;
}

export const typeScale: readonly TypeScaleStep[] = [
  { name: "xs", sizePx: 12, lineHeight: 1.5 },
  { name: "sm", sizePx: 14, lineHeight: 1.5 },
  { name: "base", sizePx: 16, lineHeight: 1.6 },
  { name: "lg", sizePx: 18, lineHeight: 1.6 },
  { name: "xl", sizePx: 24, lineHeight: 1.4 },
  { name: "2xl", sizePx: 32, lineHeight: 1.25 },
  { name: "3xl", sizePx: 48, lineHeight: 1.15 },
] as const;

/** Semantic font-weight tokens (400 body · 500 labels · 600–700 headings). */
export const fontWeights = {
  body: 400,
  label: 500,
  heading: 600,
  headingStrong: 700,
} as const;

/** Font families. Headings use the serif; body uses the sans. */
export const fontFamilies = {
  /** Body — highly legible humanist sans (Source Sans 3). */
  sans: "Source Sans 3",
  /** Headings — elegant humanist serif (Fraunces). */
  serif: "Fraunces",
  /** Webfonts load with font-display: swap. */
  display: "swap",
} as const;

// ---------------------------------------------------------------------------
// Body-text style tokens — consumed by Property 21 (task 2.3)
// ---------------------------------------------------------------------------

export interface BodyTextTokens {
  /** Minimum body font size on mobile viewports, in px (Req 18.4). */
  readonly mobileBaseFontSizePx: number;
  /** Default body font size, in px. */
  readonly baseFontSizePx: number;
  /** Lower bound of the comfortable body line-height range. */
  readonly minBodyLineHeight: number;
  /** Upper bound of the comfortable body line-height range. */
  readonly maxBodyLineHeight: number;
}

export const bodyTextTokens: BodyTextTokens = {
  mobileBaseFontSizePx: 16,
  baseFontSizePx: 16,
  minBodyLineHeight: 1.5,
  maxBodyLineHeight: 1.75,
} as const;

// ---------------------------------------------------------------------------
// Spacing scale — 4/8px system (mirror of spacing.css)
// ---------------------------------------------------------------------------

/** Spacing step name → value in px. Scale: 4·8·12·16·24·32·48·64. */
export type SpacingStepName =
  | "2xs"
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl";

export const spacingScale: Readonly<Record<SpacingStepName, number>> = {
  "2xs": 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
  "3xl": 64,
} as const;

/** The base unit that all spacing derives from (4px). */
export const SPACING_BASE_PX = 4;

// ---------------------------------------------------------------------------
// Breakpoints — mobile/tablet/desktop/large (mirror of spacing.css, Req 18.1)
// ---------------------------------------------------------------------------

export type BreakpointName = "mobile" | "tablet" | "desktop" | "large";

export const breakpoints: Readonly<Record<BreakpointName, number>> = {
  mobile: 375,
  tablet: 768,
  desktop: 1024,
  large: 1440,
} as const;

// ---------------------------------------------------------------------------
// Interactive size tokens — consumed by Property 21 (task 2.3)
// ---------------------------------------------------------------------------

export interface InteractiveSizeTokens {
  /** Minimum touch-target width in px (Req 18.5). */
  readonly minTargetWidthPx: number;
  /** Minimum touch-target height in px (Req 18.5). */
  readonly minTargetHeightPx: number;
  /** Minimum spacing between adjacent interactive targets in px (Req 18.5). */
  readonly minTargetSpacingPx: number;
}

export const interactiveSizeTokens: InteractiveSizeTokens = {
  minTargetWidthPx: 44,
  minTargetHeightPx: 44,
  minTargetSpacingPx: 8,
} as const;
