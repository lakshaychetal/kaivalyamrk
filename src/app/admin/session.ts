/**
 * Admin session constants — plain module (no "use server").
 * ---------------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 15.1)
 *
 * These constants are shared by the login server action (`login/actions.ts`)
 * and the server-side auth guard (`auth.ts`). They live in a PLAIN module
 * (deliberately NOT marked `"use server"`) because a `"use server"` module may
 * only export async functions — any non-function export from such a module is
 * stripped at build time, which would break these imports. Keeping the
 * constants here lets both the action and the guard share a single source of
 * truth for the cookie name/value.
 */

/** The name of the session cookie set on successful admin login. */
export const SESSION_COOKIE_NAME = "admin_session";

/** The value stored in the session cookie to mark a valid session. */
export const SESSION_COOKIE_VALUE = "authenticated";

/** Cookie max-age: 8 hours in seconds. */
export const SESSION_MAX_AGE = 8 * 60 * 60;
