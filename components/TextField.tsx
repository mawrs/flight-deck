import type { InputHTMLAttributes } from "react";
import styles from "./TextField.module.css";

type TextFieldProps = {
  label: string;
  showLabel?: boolean;
} & InputHTMLAttributes<HTMLInputElement>;

export function TextField({ label, id, name, showLabel = false, placeholder, ...props }: TextFieldProps) {
  const fieldId = id ?? name;

  return (
    <div className={styles.field}>
      <label className={showLabel ? styles.labelVisible : styles.label} htmlFor={fieldId}>
        {label}
      </label>
      <input
        id={fieldId}
        name={name}
        className={styles.input}
        placeholder={placeholder ?? (showLabel ? undefined : label)}
        {...props}
      />
    </div>
  );
}
