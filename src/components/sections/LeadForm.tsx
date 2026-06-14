"use client";

/**
 * `LeadForm` — booking enquiry / lead-generation form.
 * ----------------------------------------------------
 * Feature: kaivalyam-homestay-website
 *
 * Replaces the third-party booking engine with a simple enquiry form. On
 * submit the lead is emailed to the owner via FormSubmit.co (a free, no-signup
 * form-to-email relay — the first submission triggers a one-time activation
 * email to the owner address).
 *
 * Fields: Name, Contact (phone), Email, Check-in, Check-out, Note.
 *
 * Accessible: labelled inputs, required-field validation, visible focus rings,
 * a polite live region for the success / error result.
 */

import { useState, type FormEvent } from "react";
import { CalendarCheck, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/components/ui/cn";
import { focusRing } from "@/components/ui/buttonStyles";

/** Owner's email — lead submissions are delivered here. */
const LEAD_EMAIL = "Stay@kaivalyamhomestay.com";
/** FormSubmit.co AJAX endpoint (free relay, no API key). */
const FORM_ENDPOINT = `https://formsubmit.co/ajax/${LEAD_EMAIL}`;

type Status = "idle" | "submitting" | "success" | "error";

const fieldBase = cn(
  "mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5",
  "text-base text-on-surface placeholder:text-on-surface-muted",
  "outline-none focus-visible:[outline:2px_solid_var(--color-focus)] focus-visible:[outline-offset:2px]",
);

export function LeadForm() {
  const [status, setStatus] = useState<Status>("idle");
  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    setStatus("submitting");
    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: data,
      });
      if (res.ok) {
        setStatus("success");
        form.reset();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        role="status"
        className="rounded-2xl border border-border bg-surface p-8 text-center shadow-sm"
      >
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckCircle2 size={32} aria-hidden />
        </span>
        <h2 className="mt-4 font-serif text-2xl font-semibold text-secondary">
          Thank you for your enquiry!
        </h2>
        <p className="mx-auto mt-2 max-w-prose text-base text-on-surface-muted">
          We have received your details and will get back to you shortly to help
          plan your stay at Kaivalyam. For anything urgent, reach us on WhatsApp
          or call us directly.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className={cn(
            "mt-6 inline-flex min-h-11 items-center rounded-lg border-2 border-primary px-5 py-2",
            "font-medium text-primary hover:bg-surface-alt",
            "motion-safe:transition-colors motion-safe:duration-200",
            focusRing,
          )}
        >
          Send another enquiry
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8"
      noValidate
    >
      {/* FormSubmit.co configuration (hidden inputs) */}
      <input type="hidden" name="_subject" value="New booking enquiry — Kaivalyam Homestay" />
      <input type="hidden" name="_template" value="table" />
      {/* Branded source shown in the email body (so it references our domain,
          not the deploy URL). FormSubmit's "submitted on" line follows the
          page origin and becomes kaivalyamhomestay.com on the live domain. */}
      <input type="hidden" name="Website" value="https://kaivalyamhomestay.com" />
      {/* Honeypot anti-spam field */}
      <input type="text" name="_honey" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Name */}
        <div className="sm:col-span-2">
          <label htmlFor="lead-name" className="text-sm font-medium text-on-surface">
            Name <span className="text-primary">*</span>
          </label>
          <input
            id="lead-name"
            name="Name"
            type="text"
            required
            autoComplete="name"
            placeholder="Your full name"
            className={fieldBase}
          />
        </div>

        {/* Contact */}
        <div>
          <label htmlFor="lead-contact" className="text-sm font-medium text-on-surface">
            Contact Number <span className="text-primary">*</span>
          </label>
          <input
            id="lead-contact"
            name="Contact"
            type="tel"
            required
            autoComplete="tel"
            placeholder="+91 …"
            className={fieldBase}
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="lead-email" className="text-sm font-medium text-on-surface">
            Email <span className="text-primary">*</span>
          </label>
          <input
            id="lead-email"
            name="Email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className={fieldBase}
          />
        </div>

        {/* Check-in */}
        <div>
          <label htmlFor="lead-checkin" className="text-sm font-medium text-on-surface">
            Check-in date <span className="text-primary">*</span>
          </label>
          <input
            id="lead-checkin"
            name="Check-in"
            type="date"
            required
            min={today}
            className={fieldBase}
          />
        </div>

        {/* Check-out */}
        <div>
          <label htmlFor="lead-checkout" className="text-sm font-medium text-on-surface">
            Check-out date <span className="text-primary">*</span>
          </label>
          <input
            id="lead-checkout"
            name="Check-out"
            type="date"
            required
            min={today}
            className={fieldBase}
          />
        </div>

        {/* Note */}
        <div className="sm:col-span-2">
          <label htmlFor="lead-note" className="text-sm font-medium text-on-surface">
            Note
          </label>
          <textarea
            id="lead-note"
            name="Note"
            rows={4}
            placeholder="Number of guests, room preference, or any special requests…"
            className={cn(fieldBase, "resize-y")}
          />
          <p className="mt-1.5 text-xs text-on-surface-muted">
            A minimum stay of two days is recommended to fully enjoy the
            property and explore the surrounding area.
          </p>
        </div>
      </div>

      {status === "error" && (
        <p role="alert" className="mt-4 flex items-center gap-2 text-sm text-red-600">
          <AlertCircle size={16} aria-hidden />
          Something went wrong sending your enquiry. Please try again, or reach
          us on WhatsApp / phone.
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className={cn(
          "mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-6 text-lg",
          "bg-primary font-medium text-on-primary hover:bg-primary-hover",
          "disabled:opacity-60 disabled:cursor-not-allowed",
          "motion-safe:transition motion-safe:duration-200 motion-safe:active:scale-[0.99]",
          focusRing,
        )}
      >
        {status === "submitting" ? (
          <>
            <Loader2 size={20} aria-hidden className="motion-safe:animate-spin" />
            Sending…
          </>
        ) : (
          <>
            <CalendarCheck size={20} aria-hidden />
            Send Enquiry
          </>
        )}
      </button>
    </form>
  );
}

export default LeadForm;
