/**
 * `PrimaryNav` — the desktop horizontal navigation bar.
 * -----------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 10.1)
 *
 * Renders the primary nav links (Req 1.2) from the SINGLE `navigationModel`
 * (single source of truth shared with {@link MobileNavMenu}) as a horizontal
 * list. The currently-active item — resolved by the pure
 * `resolveActiveNav(path, model)` and passed in as `activeId` — is highlighted
 * (color + weight + an underline indicator) AND marked with `aria-current="page"`
 * (Req 1.5).
 *
 * This component renders only the link list; the surrounding `<nav>` landmark,
 * logo, and Book Now CTA are composed by {@link SiteHeader}. It is purely
 * presentational (no state) and is hidden below the tablet breakpoint by the
 * header layout, where {@link MobileNavMenu} takes over (Req 1.6).
 *
 * Styling uses ONLY semantic design tokens (`text-primary`, `text-secondary`,
 * `text-on-surface`, `--color-focus`) — no raw hex.
 */
import Link from "next/link";
import type { NavItem } from "@/domain/navigation/navigation";

export interface PrimaryNavProps {
  /** The primary nav links (the single `navigationModel.items`). */
  items: readonly NavItem[];
  /** The active item id from `resolveActiveNav`, or `null` when none matches. */
  activeId: string | null;
  /** Extra classes for the `<ul>`. */
  className?: string;
}

export function PrimaryNav({ items, activeId, className }: PrimaryNavProps) {
  return (
    <ul
      className={[
        "flex items-center gap-1",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <li key={item.id}>
            <Link
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={[
                // 44px min target height, comfortable horizontal padding.
                "relative inline-flex min-h-11 items-center px-3 text-base",
                "rounded-md outline-none",
                "focus-visible:[outline:2px_solid_var(--color-focus)] focus-visible:[outline-offset:2px]",
                "motion-safe:transition-colors motion-safe:duration-200",
                // Active vs idle: color + weight (Req 1.5).
                isActive
                  ? "font-semibold text-primary"
                  : "font-medium text-on-surface hover:text-primary",
                // Underline indicator for the active item (Req 1.5).
                "after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:rounded-full",
                isActive ? "after:bg-primary" : "after:bg-transparent",
              ].join(" ")}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default PrimaryNav;
