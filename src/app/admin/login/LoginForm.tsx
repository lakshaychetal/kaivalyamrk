/**
 * LoginForm — client component for the admin login page.
 * -------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 15.1)
 *
 * A minimal password form that submits to the `loginAction` server action.
 * Uses `useActionState` to display server-side error messages inline.
 * Kept as a thin client island so the login page itself can be a server
 * component while the form has the interactivity it needs.
 */
"use client";

import { useActionState } from "react";
import { Lock } from "lucide-react";
import { loginAction } from "./actions";
import { cn } from "@/components/ui/cn";
import { buttonClassNames } from "@/components/ui/buttonStyles";

export function LoginForm() {
  const [error, formAction, isPending] = useActionState(loginAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1">
        <label
          htmlFor="password"
          className="text-sm font-medium text-on-surface"
        >
          Admin password
        </label>
        <div className="relative">
          <span
            className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-on-surface-muted"
            aria-hidden="true"
          >
            <Lock size={16} />
          </span>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            disabled={isPending}
            aria-describedby={error ? "login-error" : undefined}
            className={cn(
              "w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3",
              "text-base text-on-surface placeholder:text-on-surface-muted",
              "focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]",
              "disabled:opacity-50",
            )}
            placeholder="Enter password"
          />
        </div>
        {error && (
          <p
            id="login-error"
            role="alert"
            className="mt-1 text-sm text-[var(--color-error)]"
          >
            {error}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className={cn(
          buttonClassNames({ variant: "primary" }),
          "w-full justify-center",
        )}
      >
        {isPending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
