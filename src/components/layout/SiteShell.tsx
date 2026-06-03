/**
 * `SiteShell` — the shared page shell composed by the root layout (task 10.3).
 * ---------------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website
 *
 * Wraps every page in the consistent, accessible chrome required across the
 * site. In document order it renders:
 *
 *   1. {@link SkipToContent} — the FIRST focusable element, so a keyboard user
 *      reaches it before the header and can jump straight to the main content
 *      (Req 22.8). Its target is the `<main id="main">` rendered below.
 *   2. {@link SiteHeader} — the persistent logo + navigation + Book Now CTA,
 *      identically placed on every page (Req 1.6).
 *   3. `<main id="main" tabIndex={-1}>` — the single main-content landmark and
 *      the skip-link target. `tabIndex={-1}` lets the browser move keyboard
 *      FOCUS here (not just scroll) when the skip link is activated, without
 *      adding `<main>` to the normal tab order. `flex-1` makes it grow so the
 *      footer is pushed to the bottom on short pages (sticky footer).
 *   4. {@link SiteFooter} — the persistent footer with the contact summary,
 *      secondary nav, Photo Credits link, and the Privacy Notice link (Req 1.7,
 *      23.2, 17.7).
 *
 * The outer wrapper is a min-height flex column so the footer sits at the
 * bottom of the viewport even when page content is short.
 *
 * Server component — pure composition, no client state of its own (the header
 * is the client island that needs the pathname).
 */
import { SkipToContent, MAIN_CONTENT_ID } from "./SkipToContent";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

export interface SiteShellProps {
  children: React.ReactNode;
}

export function SiteShell({ children }: SiteShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* First focusable element — skip straight to <main> (Req 22.8). */}
      <SkipToContent />

      <SiteHeader />

      {/* The single main-content landmark + skip-link target. */}
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>

      <SiteFooter />
    </div>
  );
}

export default SiteShell;
