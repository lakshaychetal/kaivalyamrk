/**
 * Server-side admin authentication helper.
 * -----------------------------------------
 * Feature: kaivalyam-homestay-website (task 15.1)
 *
 * Provides a single `requireAdminSession` function that checks for a valid
 * admin session cookie. If the session is missing or ADMIN_PASSWORD is not
 * configured, it redirects to /admin/login.
 *
 * This is the auth guard used by the admin report page (SSR, server component).
 * It is intentionally minimal: a single HttpOnly cookie set by the login action.
 *
 * Security notes:
 *   - When ADMIN_PASSWORD is not set in the environment, access is always denied
 *     (fail-closed). This prevents accidental exposure in misconfigured deploys.
 *   - The cookie value is compared against the known SESSION_COOKIE_VALUE
 *     constant; it is not used as a secret itself.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME, SESSION_COOKIE_VALUE } from "./session";

/**
 * Assert that the current request carries a valid admin session.
 *
 * Call this at the top of any admin SSR page. If the session is invalid or
 * ADMIN_PASSWORD is not configured, it redirects to /admin/login and never
 * returns.
 */
export async function requireAdminSession(): Promise<void> {
  // Fail-closed: if ADMIN_PASSWORD is not configured, deny access.
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();
  if (!adminPassword) {
    redirect("/admin/login");
  }

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (sessionCookie?.value !== SESSION_COOKIE_VALUE) {
    redirect("/admin/login");
  }
}
