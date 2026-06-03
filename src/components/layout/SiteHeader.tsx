/**
 * `SiteHeader` — the shared, persistent site header.
 * --------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 10.1)
 *
 * The single header mounted in the root layout (task 10.3 wires it), so its
 * placement is identical on every page (Req 1.6 — consistent nav placement).
 * It composes:
 *   • {@link Logo}        — the brand mark in official proportions + clear
 *                           space, linked to Home (Req 1.8).
 *   • {@link PrimaryNav}  — the desktop horizontal nav (≥ tablet, Req 1.2).
 *   • {@link MobileNavMenu} — the collapsible menu below the tablet breakpoint
 *                           (Req 1.6), with focus management.
 *   • {@link BookNowButton} — the persistent primary CTA, shown in the header on
 *                           every page (desktop) and inside the mobile menu
 *                           (Req 1.3).
 *
 * SINGLE SOURCE OF TRUTH: both the desktop and mobile navigations are driven by
 * the one `navigationModel` (imported from the navigation domain). The active
 * route is derived by the pure `resolveActiveNav(currentPath, navigationModel)`
 * using the current path from `usePathname()` (Req 1.5). Because the resolver
 * runs once here and the same `activeId` is handed to both navs, the header and
 * mobile menu can never disagree about which item is active.
 *
 * Accessibility:
 *   • Renders as a `<header>` landmark with a `<nav aria-label="Primary">`.
 *   • Links/controls are keyboard accessible; the DS components enforce ≥44px
 *     touch targets and visible focus rings.
 *
 * This is a CLIENT component because active-state highlighting depends on the
 * current pathname (`usePathname`) and the mobile menu manages open/focus state.
 */
"use client";

import { usePathname } from "next/navigation";
import {
  navigationModel,
  resolveActiveNav,
} from "@/domain/navigation/navigation";
import { BookNowButton } from "@/components/ui";
import { Logo } from "./Logo";
import { PrimaryNav } from "./PrimaryNav";
import { MobileNavMenu } from "./MobileNavMenu";

export interface SiteHeaderProps {
  /** Extra classes for the `<header>` element. */
  className?: string;
}

export function SiteHeader({ className }: SiteHeaderProps) {
  const pathname = usePathname() ?? "/";
  const activeId = resolveActiveNav(pathname, navigationModel);

  return (
    <header
      className={[
        "sticky top-0 z-50 w-full border-b border-border bg-surface",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="relative mx-auto flex min-h-16 max-w-[1440px] items-center justify-between gap-4 px-4 md:px-6">
        <Logo />

        {/* Desktop primary navigation — visible at ≥ tablet (md = 768px). */}
        <nav
          aria-label="Primary"
          className="hidden md:flex md:flex-1 md:justify-center"
        >
          <PrimaryNav items={navigationModel.items} activeId={activeId} />
        </nav>

        {/* Persistent Book Now CTA — shown in the header on every page (desktop). */}
        <div className="hidden md:block">
          <BookNowButton
            label={navigationModel.bookNow.label}
            href={navigationModel.bookNow.href}
          />
        </div>

        {/* Below the tablet breakpoint: collapse nav + CTA into the menu. */}
        <MobileNavMenu
          className="md:hidden"
          items={navigationModel.items}
          bookNow={navigationModel.bookNow}
          activeId={activeId}
        />
      </div>
    </header>
  );
}

export default SiteHeader;
