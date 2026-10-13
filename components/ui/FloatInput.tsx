"use client";

import { useState, type FocusEvent, type KeyboardEvent } from "react";
import "./float-input.css";

export function FloatInput({
  label,
  value,
  onChange,
  readOnly,
  autoFocus,
  type = "text",
  multiline,
  onKeyDown,
  onFocus,
  onBlur,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  autoFocus?: boolean;
  type?: string;
  multiline?: boolean;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onFocus?: (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}) {
  const [focused, setFocused] = useState(Boolean(autoFocus));
  const floated = focused || value.trim().length > 0;
  const field = {
    "aria-label": label,
    value,
    readOnly,
    autoFocus,
    placeholder: " ",
    onChange: (event: { target: { value: string } }) => onChange?.(event.target.value),
    onKeyDown,
    onClick: () => setFocused(true),
    onFocus: (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFocused(true);
      onFocus?.(event);
    },
    onBlur: (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFocused(false);
      onBlur?.(event);
    },
    className: multiline ? "uw-float-input uw-float-input-multiline" : "uw-float-input",
  };

  return (
    <label className="uw-float-field">
      {multiline ? <textarea {...field} rows={4} /> : <input {...field} type={type} />}
      <span className={`uw-float-label ${floated ? "uw-float-label-active" : ""}`}>{label}</span>
    </label>
  );
}
