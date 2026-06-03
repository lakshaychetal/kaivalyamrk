/**
 * Admin login page (`/admin/login`).
 * ---------------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 15.1)
 *
 * A minimal, secure password form that grants access to the admin report.
 * On correct password the `loginAction` server action sets an HttpOnly session
 * cookie and redirects to `/admin/report`.
 *
 * Security:
 *   - Marked `noindex` / non-cacheable so it is not indexed or cached.
 *   - The form submission is handled server-side via a server action.
 *   - The login page itself is excluded from the sitemap (task 15.2).
 *
 * _Requirements: 17.6_
 */
import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { LoginForm } from "./LoginForm";

/** Force SSR — never statically cache the login page. */
export const dynamic = "force-dynamic";

/** Mark noindex so search engines do not index the admin login. */
export const metadata: Metadata = {
  title: "Admin Login",
  description: "Kaivalyam Homestay administrator login.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span
            className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface-alt text-primary"
            aria-hidden="true"
          >
            <ShieldCheck size={24} />
          </span>
          <h1 className="font-serif text-2xl font-semibold text-secondary">
            Admin access
          </h1>
          <p className="text-sm text-on-surface-muted">
            Enter the admin password to view the analytics report.
          </p>
        </div>

        {/* Password form (client island for useActionState) */}
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
