/**
 * Server actions for the admin login page.
 * -----------------------------------------
 * Feature: kaivalyam-homestay-website (task 15.1)
 *
 * Handles the password form submission: validates the submitted password
 * against ADMIN_PASSWORD from process.env, sets a session cookie on success,
 * and redirects accordingly.
 *
 * Security notes:
 *   - The password is compared server-side only; it is never sent to the client.
 *   - The session cookie is HttpOnly, SameSite=Strict, and Secure in production.
 *   - A constant-time comparison is used to avoid timing attacks.
 *   - When ADMIN_PASSWORD is not set, login always fails (fail-closed).
 */
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_VALUE,
  SESSION_MAX_AGE,
} from "../session";

/**
 * Constant-time string comparison to avoid timing-based secret leakage.
 * Returns true only when both strings are identical in length and content.
 */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Validate the submitted password and set a session cookie on success.
 *
 * On success: sets the session cookie and redirects to /admin/report.
 * On failure: returns an error message string.
 * When ADMIN_PASSWORD is not configured: always fails (fail-closed).
 */
export async function loginAction(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();

  // Fail-closed: if ADMIN_PASSWORD is not configured, login is impossible.
  if (!adminPassword) {
    return "Admin access is not configured. Please contact the site administrator.";
  }

  const submitted = (formData.get("password") as string | null) ?? "";

  if (!safeEqual(submitted, adminPassword)) {
    return "Incorrect password. Please try again.";
  }

  // Set the session cookie (HttpOnly, SameSite=Strict, Secure in production).
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, SESSION_COOKIE_VALUE, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE,
    path: "/admin",
  });

  redirect("/admin/report");
}
