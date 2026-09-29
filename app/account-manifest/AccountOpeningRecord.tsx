import styles from "./record.module.css";

export function AccountOpeningRecord() {
  return (
    <img
      className={styles.record}
      src="/dashboard/account-opening-record.png?v=2"
      alt="Account Opening Record for a Rewards Checking personal account, opened April 7, 2026."
      width={1880}
      height={2264}
    />
  );
}
