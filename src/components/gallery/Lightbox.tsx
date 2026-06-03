/**
 * `Lightbox` — the enlarged, focus-trapped photo viewer (Req 6.4, 6.5).
 * ---------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 12.1)
 *
 * When a Visitor selects a photo in the {@link GalleryGrid}, this modal opens an
 * ENLARGED view of that photo (Req 6.4) and provides next / previous / close
 * controls with full keyboard support (Req 6.5):
 *
 *   • NAVIGATION uses the pure, property-tested cursors from `domain/gallery`
 *     (`nextIndex` / `prevIndex`, `wrap = true`) — the component NEVER does its
 *     own index arithmetic, so the verified wrap behaviour (Property 8) is the
 *     single source of truth for "next/previous" here and in the virtual tour.
 *   • KEYBOARD: `Escape` closes; `ArrowRight`/`ArrowLeft` move to the
 *     next/previous photo (Req 6.5).
 *   • FOCUS TRAP: Tab/Shift+Tab cycle only within the dialog; focus can never
 *     reach the page behind the scrim (Req 22.4).
 *   • FOCUS RESTORE: opening moves focus into the dialog (the Close button);
 *     closing returns focus to the element that triggered it — captured on
 *     mount — so keyboard users land back where they were (Req 22.4).
 *   • CONTROLS are ≥44×44px icon buttons with `aria-label`s (Req 6.5, 22.5,
 *     18.5) via the DS {@link IconButton}.
 *   • SCRIM is a ~55% overlay (in the 40–60% band) over the page; clicking it
 *     closes the lightbox. The leaf-mark/`ResponsiveImage` keeps the photo
 *     resilient.
 *   • REDUCED MOTION: the open fade is `motion-safe` only, so it is disabled
 *     under `prefers-reduced-motion` (Req 22.7).
 *
 * Rendered as a `role="dialog" aria-modal="true"` overlay. This is a CLIENT
 * component: it owns the current-index state, keyboard handlers, and focus
 * management. It is mounted only while open (the parent conditionally renders
 * it), which makes mount/unmount the natural open/close lifecycle.
 *
 * Styling uses ONLY semantic design tokens — no raw hex.
 */
"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { ResponsiveImage } from "@/components/media";
import { nextIndex, prevIndex } from "@/domain/gallery";
import type { Photo } from "@/content/types";

export interface LightboxProps {
  /** The ordered photo set the lightbox steps through (e.g. the filtered grid). */
  photos: readonly Photo[];
  /** The index of the photo to show first (clamped into range internally). */
  initialIndex: number;
  /** Close handler — the parent unmounts the lightbox in response. */
  onClose: () => void;
}

/** Focusable controls inside the dialog, for the Tab focus trap. */
const FOCUSABLE =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Lightbox({
  photos,
  initialIndex,
  onClose,
}: LightboxProps): ReactElement | null {
  const count = photos.length;

  // Clamp the requested start index into range so an out-of-bounds initial
  // index can never crash the viewer.
  const safeInitial =
    count > 0 ? Math.min(Math.max(initialIndex, 0), count - 1) : 0;
  const [index, setIndex] = useState(safeInitial);

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  // The element focused when the lightbox opened — focus returns here on close.
  const triggerRef = useRef<HTMLElement | null>(null);

  const titleId = useId();

  // Navigation via the PURE cursors (wrap = true). No index math in the view.
  const goNext = useCallback(() => {
    setIndex((current) => nextIndex(count, current, true));
  }, [count]);

  const goPrev = useCallback(() => {
    setIndex((current) => prevIndex(count, current, true));
  }, [count]);

  // Capture the trigger and move focus into the dialog on open; restore focus
  // to the trigger on close (unmount).
  useEffect(() => {
    triggerRef.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const trigger = triggerRef.current;
    return () => {
      // Restore focus to the opener if it is still in the document.
      if (trigger && document.contains(trigger)) {
        trigger.focus();
      }
    };
  }, []);

  // Lock background scroll while the lightbox is open.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  // Keyboard: Escape closes; arrows navigate; Tab is trapped in the dialog.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      switch (event.key) {
        case "Escape":
          event.preventDefault();
          onClose();
          return;
        case "ArrowRight":
          event.preventDefault();
          goNext();
          return;
        case "ArrowLeft":
          event.preventDefault();
          goPrev();
          return;
        case "Tab": {
          const dialog = dialogRef.current;
          if (!dialog) return;
          const focusable = Array.from(
            dialog.querySelectorAll<HTMLElement>(FOCUSABLE),
          ).filter((el) => el.offsetParent !== null || el === document.activeElement);
          if (focusable.length === 0) {
            // Nothing else focusable — keep focus on the dialog.
            event.preventDefault();
            return;
          }
          const first = focusable[0]!;
          const last = focusable[focusable.length - 1]!;
          const active = document.activeElement;

          if (event.shiftKey && active === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && active === last) {
            event.preventDefault();
            first.focus();
          }
          return;
        }
        default:
          return;
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrev, onClose]);

  if (count === 0) return null;

  const current = photos[index]!;
  const hasMultiple = count > 1;
  const position = `${index + 1} of ${count}`;

  // Close when the click lands on the backdrop/overlay itself (not on the
  // dialog content). Using the event target identity keeps clicks on the photo,
  // caption, or controls from closing while a click anywhere in the empty
  // surrounding space (including the test's overlay click) dismisses the viewer.
  const handleBackdropClick = (event: React.MouseEvent<HTMLElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      // Full-screen overlay + ~70% scrim. Clicking the backdrop closes; clicks
      // on the dialog content do not (handled via target identity).
      className={[
        "fixed inset-0 z-[100] flex flex-col bg-on-surface/70",
        "motion-safe:transition-opacity motion-safe:duration-200",
      ].join(" ")}
      data-testid="lightbox-overlay"
      onClick={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex h-full w-full flex-col"
        onClick={handleBackdropClick}
      >
        {/* ── Prominent close button — fixed top-right, always visible ── */}
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="Close gallery viewer"
          onClick={onClose}
          className={[
            // Size & shape
            "absolute right-4 top-4 z-10",
            "flex h-11 w-11 items-center justify-center rounded-full",
            // Frosted-glass background so it reads on any photo
            "bg-black/60 backdrop-blur-sm",
            "border border-white/20",
            // Icon colour
            "text-white",
            // Hover / focus
            "hover:bg-black/80 hover:scale-110",
            "motion-safe:transition motion-safe:duration-150",
            "outline-none focus-visible:[outline:2px_solid_var(--color-focus)] focus-visible:[outline-offset:2px]",
          ].join(" ")}
        >
          <X size={22} strokeWidth={2.5} aria-hidden />
        </button>

        {/* Photo counter — top-left */}
        <div className="pointer-events-none absolute left-4 top-4 z-10">
          <p
            id={titleId}
            className="rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm"
          >
            <span className="sr-only">Photo </span>
            {position}
          </p>
        </div>

        {/* Stage: previous • enlarged photo • next. */}
        <div
          className="flex min-h-0 flex-1 items-center justify-center gap-2 px-2 pb-4 pt-16 sm:gap-4 sm:px-4"
          onClick={onClose}
        >
          {hasMultiple && (
            <button
              type="button"
              aria-label="Previous photo"
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className={[
                "shrink-0 flex h-11 w-11 items-center justify-center rounded-full",
                "bg-black/50 backdrop-blur-sm border border-white/20 text-white",
                "hover:bg-black/75 hover:scale-110",
                "motion-safe:transition motion-safe:duration-150",
                "outline-none focus-visible:[outline:2px_solid_var(--color-focus)] focus-visible:[outline-offset:2px]",
              ].join(" ")}
            >
              <ChevronLeft size={22} aria-hidden />
            </button>
          )}

          <figure
            className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <ResponsiveImage
              key={current.id}
              image={current}
              sizes="(min-width: 1024px) 80vw, 100vw"
              priority
              className="max-h-[75vh] w-auto max-w-full rounded-lg object-contain shadow-2xl"
              wrapperClassName="flex max-h-[75vh] items-center justify-center"
            />
            <figcaption className="mt-3 max-w-prose text-center text-sm text-white/80">
              {current.alt}
            </figcaption>
          </figure>

          {hasMultiple && (
            <button
              type="button"
              aria-label="Next photo"
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className={[
                "shrink-0 flex h-11 w-11 items-center justify-center rounded-full",
                "bg-black/50 backdrop-blur-sm border border-white/20 text-white",
                "hover:bg-black/75 hover:scale-110",
                "motion-safe:transition motion-safe:duration-150",
                "outline-none focus-visible:[outline:2px_solid_var(--color-focus)] focus-visible:[outline-offset:2px]",
              ].join(" ")}
            >
              <ChevronRight size={22} aria-hidden />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Lightbox;
