/**
 * `Select` — dropdown control with on-blur inline validation.
 * -----------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 3.1)
 *
 * Composes {@link Field} (visible label, helper text, required indicator,
 * `role="alert"` error below the field, `aria-describedby` wiring) with a
 * native `<select>` for full keyboard + assistive-tech support. Validation runs
 * ON BLUR via {@link useBlurValidation} (then live after first touch).
 *
 * Options are passed as data so the control owns markup consistency. A
 * `placeholder` renders a disabled, empty-valued first option. ≥44px min height
 * (Req 18.5), visible focus ring in `--color-focus` (Req 22.3).
 */
"use client";

import { forwardRef, type SelectHTMLAttributes } from "react";
import { Field, controlClassNames } from "./Field";
import { useBlurValidation, type Validator } from "./useBlurValidation";
import type { ClassValue } from "../cn";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "id" | "children"> {
  label: string;
  helperText?: string;
  error?: string;
  validate?: Validator<string>;
  /** The selectable options. */
  options: SelectOption[];
  /** Optional disabled placeholder shown as the first, empty-valued option. */
  placeholder?: string;
  id?: string;
  wrapperClassName?: ClassValue;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    label,
    helperText,
    error: controlledError,
    validate,
    options,
    placeholder,
    required,
    id,
    className,
    wrapperClassName,
    defaultValue,
    value,
    onBlur,
    onChange,
    ...rest
  },
  ref,
) {
  const v = useBlurValidation<string>(validate);
  const error = controlledError ?? v.error;
  // Default to the placeholder (empty value) when uncontrolled with a placeholder.
  const resolvedDefault =
    value === undefined && defaultValue === undefined && placeholder
      ? ""
      : defaultValue;

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
        <select
          ref={ref}
          className={controlClassNames(Boolean(error), className)}
          value={value}
          defaultValue={resolvedDefault}
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
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
});
