import styles from "./Loader.module.css";

export function Loader({
  label = "Loading",
  inline = false,
}: {
  label?: string;
  inline?: boolean;
}) {
  return (
    <div className={inline ? styles.inline : styles.loader} role="status" aria-live="polite">
      <span className={styles.spinner} />
      <span className={styles.label}>{label}</span>
    </div>
  );
}
