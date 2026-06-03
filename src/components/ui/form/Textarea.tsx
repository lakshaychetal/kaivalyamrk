/**
 * `Textarea` — multi-line text input with on-blur inline validation.
 * ------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 3.1)
 *
 * Same labelling/validation contract as {@link Input} — composes {@link Field}
 * (visible label, helper text, required indicator, `role="alert"` error below
 * the field, `aria-describedby` wiring) with a native `<textarea>`, validating
 * ON BLUR via {@link useBlurValidation} (then live after first touch).
 *
 * ≥44px min height (Req 18.5), visible focus ring in `--color-focus` (Req 22.3).
 */
"use client";

import { forwardRef, type TextareaHTMLAttributes } from "react";
import { Field, controlClassNames } from "./Field";
import { useBlurValidation, type Validator } from "./useBlurValidation";
import { cn, type ClassValue } from "../cn";

export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> {
  label: string;
  helperText?: string;
  error?: string;
  validate?: Validator<string>;
  id?: string;
  wrapperClassName?: ClassValue;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    {
      label,
      helperText,
      error: controlledError,
      validate,
      required,
      rows = 4,
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
          <textarea
            ref={ref}
            rows={rows}
            className={cn(controlClassNames(Boolean(error)), "resize-y", className)}
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
  },
);
