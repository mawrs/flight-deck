"use client";

import {
  useState,
  type ChangeEvent,
  type FocusEvent,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type SyntheticEvent,
} from "react";
import styles from "./PasscodeField.module.css";

const LENGTH = 6;
const SLOT = 28;
const GAP = 4;

type PasscodeFieldProps = {
  label: string;
} & InputHTMLAttributes<HTMLInputElement>;

function digitsOnly(value: string) {
  return value.replace(/\D/g, "").slice(0, LENGTH);
}

function caretOffset(index: number) {
  if (index >= LENGTH) return (LENGTH - 1) * (SLOT + GAP) + SLOT - 2;
  return index * (SLOT + GAP) + 2;
}

export function PasscodeField({
  label,
  id,
  name,
  value,
  onChange,
  onFocus,
  onBlur,
  onSelect,
  onKeyUp,
  onClick,
  ...props
}: PasscodeFieldProps) {
  const fieldId = id ?? name;
  const digits = digitsOnly(String(value ?? ""));
  const slots = Array.from({ length: LENGTH }, (_, index) => digits[index] ?? "*");
  const [caret, setCaret] = useState(digits.length);

  function syncCaret(input: HTMLInputElement) {
    setCaret(input.selectionStart ?? digits.length);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const next = digitsOnly(event.currentTarget.value);
    event.currentTarget.value = next;
    onChange?.(event);
    syncCaret(event.currentTarget);
  }

  function handleFocus(event: FocusEvent<HTMLInputElement>) {
    syncCaret(event.currentTarget);
    onFocus?.(event);
  }

  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    onBlur?.(event);
  }

  function handleSelect(event: SyntheticEvent<HTMLInputElement>) {
    syncCaret(event.currentTarget);
    onSelect?.(event);
  }

  function handleKeyUp(event: KeyboardEvent<HTMLInputElement>) {
    syncCaret(event.currentTarget);
    onKeyUp?.(event);
  }

  function handleClick(event: MouseEvent<HTMLInputElement>) {
    syncCaret(event.currentTarget);
    onClick?.(event);
  }

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={fieldId}>
        {label}
      </label>
      <input
        {...props}
        id={fieldId}
        name={name}
        className={styles.input}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={LENGTH}
        value={digits}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onSelect={handleSelect}
        onKeyUp={handleKeyUp}
        onClick={handleClick}
      />
      <div className={styles.slots} aria-hidden="true">
        {slots.map((slot, index) => (
          <span key={index} className={slot === "*" ? styles.placeholder : styles.digit}>
            {slot}
          </span>
        ))}
        <span className={styles.caret} style={{ left: caretOffset(caret) }} />
      </div>
    </div>
  );
}
