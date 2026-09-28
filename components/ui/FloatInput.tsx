"use client";

import { useState, type FocusEvent, type KeyboardEvent } from "react";

export function FloatInput({
  label,
  value,
  onChange,
  readOnly,
  autoFocus,
  onKeyDown,
  onFocus,
  onBlur,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  autoFocus?: boolean;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  onFocus?: (event: FocusEvent<HTMLInputElement>) => void;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
}) {
  const [focused, setFocused] = useState(Boolean(autoFocus));
  const floated = focused || value.trim().length > 0;

  return (
    <label className="uw-float-field">
      <input
        aria-label={label}
        value={value}
        readOnly={readOnly}
        autoFocus={autoFocus}
        placeholder=" "
        onChange={(event) => onChange?.(event.target.value)}
        onKeyDown={onKeyDown}
        onClick={() => setFocused(true)}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        className="uw-float-input"
      />
      <span className={`uw-float-label ${floated ? "uw-float-label-active" : ""}`}>
        {label}
      </span>
    </label>
  );
}
