/**
 * `useBlurValidation` — inline validation that fires ON BLUR, not per keystroke.
 * -----------------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website (task 3.1)
 *
 * Forms guideline `inline-validation`: validate when the user finishes a field
 * (blur), NOT on every keystroke, and surface the error only after that first
 * blur. This shared hook implements exactly that policy for {@link Input},
 * {@link Textarea}, and {@link Select}:
 *
 *   • The validator runs on `blur` and, once a field has been "touched", again
 *     on subsequent `change` so a corrected value can clear its error live.
 *   • Before the first blur no error is shown (no premature nagging).
 *
 * The hook is presentation-only state management; the `validate` function is
 * supplied by the consumer (e.g. "email looks invalid", "this field is
 * required") and returns an error string or `null`.
 */
"use client";

import { useCallback, useState } from "react";

export type Validator<V> = (value: V) => string | null;

export interface BlurValidationResult<V> {
  /** The current error message, or `undefined` when valid / not yet touched. */
  error: string | undefined;
  /** Whether the field has been blurred at least once. */
  touched: boolean;
  /** Call from the control's `onBlur` — validates and marks touched. */
  onBlur: (value: V) => void;
  /** Call from the control's `onChange` — re-validates only after first blur. */
  onChange: (value: V) => void;
  /** Imperatively validate (e.g. on submit); marks touched and returns validity. */
  validateNow: (value: V) => boolean;
}

export function useBlurValidation<V>(
  validate?: Validator<V>,
): BlurValidationResult<V> {
  const [error, setError] = useState<string | undefined>(undefined);
  const [touched, setTouched] = useState(false);

  const run = useCallback(
    (value: V): boolean => {
      if (!validate) return true;
      const result = validate(value);
      setError(result ?? undefined);
      return result == null;
    },
    [validate],
  );

  const onBlur = useCallback(
    (value: V) => {
      setTouched(true);
      run(value);
    },
    [run],
  );

  const onChange = useCallback(
    (value: V) => {
      // Only re-validate live AFTER the first blur, so we never nag mid-typing.
      if (touched) run(value);
    },
    [touched, run],
  );

  const validateNow = useCallback(
    (value: V) => {
      setTouched(true);
      return run(value);
    },
    [run],
  );

  return { error, touched, onBlur, onChange, validateNow };
}
