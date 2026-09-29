import styles from "./Logo.module.css";

export function Logo() {
  return (
    <div className={styles.wrapper}>
      <img
        className={styles.logo}
        src="/brand/logo.png"
        alt="SouthEast Bank"
        width={265}
        height={71}
      />
      <span className={styles.badge}>ADMIN</span>
    </div>
  );
}
