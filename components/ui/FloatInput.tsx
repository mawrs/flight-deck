"use client";

import { useState, type FocusEvent, type KeyboardEvent, type Ref } from "react";
import "./float-input.css";

export function FloatInput({
  label,
  value,
  onChange,
  readOnly,
  autoFocus,
  type = "text",
  step,
  multiline,
  onKeyDown,
  onFocus,
  onBlur,
  inputRef,
}: {
  label: string;
  value: string;
  onChange?: (value: string, caret: number) => void;
  readOnly?: boolean;
  autoFocus?: boolean;
  type?: string;
  step?: string;
  multiline?: boolean;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onFocus?: (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  inputRef?: Ref<HTMLInputElement | HTMLTextAreaElement>;
}) {
  const [focused, setFocused] = useState(Boolean(autoFocus));
  const floated = focused || value.trim().length > 0;
  const field = {
    "aria-label": label,
    value,
    readOnly,
    autoFocus,
    placeholder: " ",
    onChange: (event: { target: { value: string; selectionStart: number | null } }) =>
      onChange?.(event.target.value, event.target.selectionStart ?? event.target.value.length),
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
      {multiline ? (
        <textarea {...field} ref={inputRef as Ref<HTMLTextAreaElement>} rows={4} />
      ) : (
        <input {...field} ref={inputRef as Ref<HTMLInputElement>} type={type} step={step} />
      )}
      <span className={`uw-float-label ${floated ? "uw-float-label-active" : ""}`}>{label}</span>
    </label>
  );
}
