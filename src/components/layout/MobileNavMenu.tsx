/**
 * `MobileNavMenu` — the collapsible navigation for narrow viewports.
 * ------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 10.1)
 *
 * Below the tablet breakpoint the horizontal {@link PrimaryNav} collapses into
 * this toggleable disclosure (Req 1.6). It consumes the SAME `navigationModel`
 * items + `bookNow` CTA passed down by {@link SiteHeader} (single source of
 * truth — header and mobile menu can never diverge), so it renders exactly the
 * Req 1.2 links plus the persistent Book Now CTA (Req 1.3) inside the panel.
 *
 * Accessible disclosure pattern:
 *   • A hamburger {@link IconButton} toggles the panel. It exposes
 *     `aria-expanded` (open state) and `aria-controls` (the panel id), and its
 *     accessible name flips between "Open menu" / "Close menu" (Req 22.5).
 *   • FOCUS MANAGEMENT (Req 1.6): opening moves focus to the first focusable
 *     control inside the panel; closing returns focus to the toggle button.
 *   • `Escape` closes the menu; Tab is trapped within the open panel so keyboard
 *     focus cannot escape to the page behind it.
 *   • Activating any link closes the menu (and lets navigation proceed).
 *   • The open/close height+fade animation is `motion-safe` only, so it is
 *     disabled under `prefers-reduced-motion` (Req 22.7).
 *
 * The active item (from `resolveActiveNav`, passed as `activeId`) is highlighted
 * and carries `aria-current="page"` (Req 1.5), mirroring the desktop nav.
 *
 * Styling uses ONLY semantic design tokens — no raw hex.
 */
"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { IconButton } from "@/components/ui";
import { BookNowButton } from "@/components/ui";
import type { NavItem, NavigationModel } from "@/domain/navigation/navigation";

export interface MobileNavMenuProps {
  /** The primary nav links (the single `navigationModel.items`). */
  items: readonly NavItem[];
  /** The persistent Book Now CTA descriptor (`navigationModel.bookNow`). */
  bookNow: NavigationModel["bookNow"];
  /** The active item id from `resolveActiveNav`, or `null` when none matches. */
  activeId: string | null;
  /** Extra classes for the root wrapper. */
  className?: string;
}

/** Query for the focusable controls inside the panel (for the focus trap). */
const FOCUSABLE =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function MobileNavMenu({
  items,
  bookNow,
  activeId,
  className,
}: MobileNavMenuProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  // When the panel opens, move focus to its first focusable control; when it
  // closes (after having been open), return focus to the toggle button.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open) {
      const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      first?.focus();
      wasOpen.current = true;
    } else if (wasOpen.current) {
      toggleRef.current?.focus();
      wasOpen.current = false;
    }
  }, [open]);

  // Escape closes; Tab is trapped within the open panel.
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (focusable.length === 0) return;

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const active = document.activeElement;

      if (event.shiftKey) {
        // Shift+Tab from the first control (or the toggle) wraps to the last.
        if (active === first || active === toggleRef.current) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        // Tab from the last control wraps back to the first.
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  return (
    <div className={className}>
      <IconButton
        ref={toggleRef}
        icon={open ? X : Menu}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      />

      {/* Backdrop scrim — tapping it closes the menu. Click target, not a
          keyboard control (Escape + the toggle handle keyboard close). */}
      {open && (
        <div
          aria-hidden="true"
          onClick={close}
          className="fixed inset-0 top-[var(--header-height,4rem)] z-40 bg-on-surface/30"
        />
      )}

      <div
        id={panelId}
        ref={panelRef}
        hidden={!open}
        className={[
          "absolute inset-x-0 top-full z-50 origin-top",
          "border-b border-border bg-surface shadow-lg",
          "motion-safe:transition motion-safe:duration-200 motion-safe:ease-out",
        ].join(" ")}
      >
        <nav aria-label="Primary" className="px-4 py-4">
          <ul className="flex flex-col gap-1">
            {items.map((item) => {
              const isActive = item.id === activeId;
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    onClick={close}
                    className={[
                      "flex min-h-11 items-center rounded-md px-3 text-base",
                      "outline-none focus-visible:[outline:2px_solid_var(--color-focus)] focus-visible:[outline-offset:2px]",
                      "motion-safe:transition-colors motion-safe:duration-200",
                      isActive
                        ? "border-l-2 border-primary font-semibold text-primary"
                        : "font-medium text-on-surface hover:text-primary",
                    ].join(" ")}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Persistent Book Now CTA inside the mobile menu (Req 1.3). */}
          <div className="mt-4">
            <BookNowButton
              label={bookNow.label}
              href={bookNow.href}
              fullWidth
            />
          </div>
        </nav>
      </div>
    </div>
  );
}

export default MobileNavMenu;
