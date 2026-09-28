import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader } from "./Loader";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "outline" | "warning" | "danger" | "text";
export type ButtonSize = "base" | "small";

type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  fullWidth?: boolean;
  href?: string;
  loading?: boolean;
  loadingLabel?: string;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">;

export function buttonClassName({
  variant = "primary",
  size = "base",
  fullWidth = false,
  loading = false,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  className?: string;
} = {}) {
  return [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : "",
    loading ? styles.loading : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

export function Button({
  variant = "primary",
  size = "base",
  icon,
  fullWidth = false,
  href,
  loading = false,
  loadingLabel = "Loading",
  children,
  className,
  type = "button",
  disabled,
  ...props
}: ButtonProps) {
  const classNames = buttonClassName({ variant, size, fullWidth, loading, className });

  const content = loading ? (
    <Loader inline label={loadingLabel} />
  ) : (
    <>
      {icon ? <span className={styles.icon}>{icon}</span> : null}
      {children}
    </>
  );

  if (href) {
    return (
      <a className={classNames} href={href}>
        {content}
      </a>
    );
  }

  return (
    <button className={classNames} type={type} disabled={disabled || loading} aria-busy={loading} {...props}>
      {content}
    </button>
  );
}
