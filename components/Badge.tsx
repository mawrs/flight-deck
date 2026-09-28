import type { HTMLAttributes, ReactNode } from "react";
import styles from "./Badge.module.css";

export type BadgeTone = "neutral" | "info" | "warning" | "success" | "error" | "orange" | "navy";

export function Badge({
  tone = "neutral",
  children,
  className,
  ...props
}: {
  tone?: BadgeTone;
  children: ReactNode;
} & HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={[styles.badge, styles[tone], className].filter(Boolean).join(" ")} {...props}>
      {children}
    </span>
  );
}
