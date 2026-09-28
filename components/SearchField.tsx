import type { InputHTMLAttributes } from "react";
import styles from "./SearchField.module.css";

type SearchFieldProps = {
  label: string;
  containerClassName?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "aria-label">;

export function SearchField({
  label,
  containerClassName,
  className,
  placeholder = "Search...",
  ...props
}: SearchFieldProps) {
  return (
    <label className={[styles.search, containerClassName].filter(Boolean).join(" ")}>
      <img className={styles.icon} src="/dashboard/search.svg" alt="" />
      <input
        {...props}
        className={[styles.input, className].filter(Boolean).join(" ")}
        type="search"
        aria-label={label}
        placeholder={placeholder}
      />
    </label>
  );
}
