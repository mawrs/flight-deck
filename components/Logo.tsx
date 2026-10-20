import styles from "./Logo.module.css";

export function Logo({ showBadge = true }: { showBadge?: boolean }) {
  return (
    <div className={styles.wrapper}>
      <img
        className={styles.logo}
        src="/brand/logo.png"
        alt="SouthEast Bank"
        width={265}
        height={71}
      />
      {showBadge ? <span className={styles.badge}>ADMIN</span> : null}
    </div>
  );
}
