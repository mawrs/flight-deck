import type { ReactNode } from "react";
import styles from "./Card.module.css";

export function Card({
  children,
  compact = false,
}: {
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <section className={[styles.card, compact ? styles.compact : ""].filter(Boolean).join(" ")}>
      {children}
    </section>
  );
}
