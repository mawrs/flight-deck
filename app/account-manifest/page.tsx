import type { Metadata } from "next";
import { AccountOpeningRecord } from "./AccountOpeningRecord";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Account Opening Record",
};

export default function AccountManifestPage() {
  return (
    <main className={styles.page}>
      <AccountOpeningRecord />
    </main>
  );
}
