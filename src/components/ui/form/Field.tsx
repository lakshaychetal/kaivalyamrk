/**
 * `Field` — the form-field scaffold of the design system.
 * -------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 3.1)
 *
 * Wraps a single form control with its label, helper text, required indicator,
 * and error message, and wires up the accessibility relationships so every
 * control built on it satisfies the forms guidelines:
 *
 *   • VISIBLE `<label htmlFor={id}>` — never placeholder-only (Req: input-labels).
 *   • Persistent HELPER TEXT below the label/control (Req: input-helper-text).
 *   • REQUIRED indicator (asterisk) with an accessible "(required)" hint.
 *   • ERROR rendered BELOW the field with `role="alert"` so screen readers are
 *     notified, and connected to the control via `aria-describedby`
 *     (Req: error-placement, aria-live-errors).
 *
 * The control itself is provided through a render prop that receives the wired
 * `id` + ARIA attributes, so {@link Input}, {@link Textarea}, and {@link Select}
 * all share identical labelling/validation semantics. Inline validation timing
 * (on blur, not per keystroke) lives in the control components, not here.
 *
 * Error/required state is conveyed by an icon + text in addition to color, so
 * meaning never depends on color alone (Req 22.6).
 */
import { type ReactNode, useId } from "react";
import { AlertCircle } from "lucide-react";
import { Icon } from "../Icon";
import { cn, type ClassValue } from "../cn";

/** ARIA props the control receives from {@link Field} via its render prop. */
export interface FieldControlProps {
  id: string;
  required?: boolean;
  "aria-invalid": boolean;
  "aria-describedby"?: string;
  "aria-required"?: boolean;
}

export interface FieldProps {
  /** Visible label text (rendered in a real `<label>`). */
  label: string;
  /** Persistent helper text shown below the label. */
  helperText?: string;
  /** Validation error message; when present the field is in an error state. */
  error?: string;
  /** Marks the field required (asterisk + `aria-required`). */
  required?: boolean;
  /** Optional explicit id; auto-generated when omitted. */
  id?: string;
  /** Extra classes on the field wrapper. */
  className?: ClassValue;
  /** Render the control, receiving the wired id + ARIA attributes. */
  children: (props: FieldControlProps) => ReactNode;
}

export function Field({
  label,
  helperText,
  error,
  required = false,
  id,
  className,
  children,
}: FieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const helperId = `${fieldId}-helper`;
  const errorId = `${fieldId}-error`;
  const hasError = Boolean(error);

  // Describe the control with helper text and (when present) the error.
  const describedBy =
    cn(helperText && helperId, hasError && errorId) || undefined;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label htmlFor={fieldId} className="text-base font-medium text-on-surface">
        {label}
        {required && (
          <span className="ml-1 text-error" aria-hidden="true">
            *
          </span>
        )}
        {required && <span className="sr-only">(required)</span>}
      </label>

      {helperText && (
        <p id={helperId} className="text-sm text-on-surface-muted">
          {helperText}
        </p>
      )}

      {children({
        id: fieldId,
        required,
        "aria-invalid": hasError,
        "aria-describedby": describedBy,
        "aria-required": required || undefined,
      })}

      {hasError && (
        <p
          id={errorId}
          role="alert"
          className="flex items-center gap-1 text-sm font-medium text-error"
        >
          {/* Icon + text → meaning is not conveyed by color alone (Req 22.6). */}
          <Icon icon={AlertCircle} size="sm" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

/**
 * Shared control classes for inputs/textareas/selects: ≥44px min height
 * (Req 18.5 touch target), semantic surface/border tokens, visible focus ring
 * in `--color-focus` (Req 22.3), and an error border that pairs with the
 * `role="alert"` text (Req 22.6). Motion is `motion-safe` only (Req 22.7).
 */
export function controlClassNames(hasError: boolean, extra?: ClassValue): string {
  return cn(
    "block w-full min-h-11 rounded-lg border bg-surface px-3 py-2",
    "text-base text-on-surface placeholder:text-on-surface-muted",
    "motion-safe:transition motion-safe:duration-150",
    "outline-none focus-visible:[outline:2px_solid_var(--color-focus)] focus-visible:[outline-offset:2px]",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    hasError ? "border-2 border-error" : "border border-border",
    extra,
  );
}
