/**
 * `Input` — single-line text input with on-blur inline validation.
 * ----------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 3.1)
 *
 * Composes {@link Field} (visible label, helper text, required indicator, and a
 * `role="alert"` error below the field with `aria-describedby` wiring) with a
 * native `<input>`. Validation runs ON BLUR via {@link useBlurValidation}, then
 * live once the field is touched — never on every keystroke (Req: inline
 * validation).
 *
 * Semantic input `type` (email / tel / number / …) is passed through so mobile
 * keyboards and browser autofill behave correctly (Req: input-type-keyboard).
 * The control is ≥44px tall (Req 18.5), shows a visible focus ring in
 * `--color-focus` (Req 22.3), and a controlled `error` prop can be supplied by
 * a parent form to override the internal blur-validation state.
 */
"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { Field, controlClassNames } from "./Field";
import { useBlurValidation, type Validator } from "./useBlurValidation";
import type { ClassValue } from "../cn";

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  /** Visible label (required — no placeholder-only labels). */
  label: string;
  /** Persistent helper text below the label. */
  helperText?: string;
  /** Controlled error from a parent form; overrides internal blur validation. */
  error?: string;
  /** Per-field validator run on blur (and live after first blur). */
  validate?: Validator<string>;
  /** Optional explicit id. */
  id?: string;
  /** Extra classes on the wrapper. */
  wrapperClassName?: ClassValue;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    helperText,
    error: controlledError,
    validate,
    required,
    type = "text",
    id,
    className,
    wrapperClassName,
    onBlur,
    onChange,
    ...rest
  },
  ref,
) {
  const v = useBlurValidation<string>(validate);
  const error = controlledError ?? v.error;

  return (
    <Field
      label={label}
      helperText={helperText}
      error={error}
      required={required}
      id={id}
      className={wrapperClassName}
    >
      {(field) => (
        <input
          ref={ref}
          type={type}
          className={controlClassNames(Boolean(error), className)}
          {...field}
          onBlur={(e) => {
            v.onBlur(e.target.value);
            onBlur?.(e);
          }}
          onChange={(e) => {
            v.onChange(e.target.value);
            onChange?.(e);
          }}
          {...rest}
        />
      )}
    </Field>
  );
});
