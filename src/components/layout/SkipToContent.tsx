/**
 * `SkipToContent` — the skip-to-main-content control (Req 22.8).
 * -------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 10.3)
 *
 * The standard accessible "skip link". Mounted by {@link SiteShell} as the
 * VERY FIRST element inside `<body>`, so it is the first thing a keyboard or
 * screen-reader user reaches when they start tabbing — letting them jump past
 * the repeated header/navigation straight to the page's main content
 * (Req 22.8).
 *
 * Behaviour (progressive-enhancement, works with NO JavaScript):
 *   • It is a real anchor whose `href` is the `#main` fragment, so activating
 *     it (Enter / click) moves the browser to `<main id="main">`. The shell
 *     gives that `<main>` `tabIndex={-1}` so modern browsers also move keyboard
 *     FOCUS into it — not just the scroll position.
 *   • Visually hidden until focused (`sr-only`), then revealed on focus
 *     (`focus:not-sr-only`) as a clearly visible, ≥44px-tall primary-colored
 *     pill pinned to the top-left, above the sticky header. This is the
 *     conventional, expected skip-link presentation.
 *
 * Accessibility / design contract:
 *   • SEMANTIC tokens only (`bg-primary`, `text-on-primary`) — never raw hex.
 *   • Carries the shared DS {@link focusRing} so the focus indicator is visible
 *     (Req 22.3); the ≥44px min height keeps the touch/click target compliant
 *     (Req 18.5).
 *   • No motion is attached, so there is nothing to disable under
 *     `prefers-reduced-motion` (Req 22.7).
 *
 * Server component — a plain anchor with no client-side state.
 */
import { cn } from "@/components/ui/cn";
import { focusRing } from "@/components/ui/buttonStyles";

/**
 * The id of the main-content landmark this control targets. Kept as an exported
 * constant so the shell's `<main>` and this link can never drift apart.
 */
export const MAIN_CONTENT_ID = "main" as const;

export interface SkipToContentProps {
  /**
   * The visible label shown when the control is focused.
   * @default "Skip to main content"
   */
  label?: string;
  /** Extra classes appended last. */
  className?: string;
}

export function SkipToContent({
  label = "Skip to main content",
  className,
}: SkipToContentProps) {
  return (
    <a
      href={`#${MAIN_CONTENT_ID}`}
      data-testid="skip-to-content"
      className={cn(
        // Hidden until focused — the canonical skip-link pattern.
        "sr-only",
        "focus:not-sr-only",
        // When focused: a visible primary pill pinned above the sticky header.
        "focus:fixed focus:left-4 focus:top-4 focus:z-[100]",
        "focus:inline-flex focus:min-h-11 focus:items-center",
        "focus:rounded-md focus:bg-primary focus:px-4 focus:py-2",
        "focus:font-medium focus:text-on-primary focus:no-underline",
        focusRing,
        className,
      )}
    >
      {label}
    </a>
  );
}

export default SkipToContent;
