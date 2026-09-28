import styles from "./Logo.module.css";

export function Logo() {
  return (
    <img
      className={styles.logo}
      src="/brand/logo.png"
      alt="SouthEast Bank"
      width={265}
      height={71}
    />
  );
}
