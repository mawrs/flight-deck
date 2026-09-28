import { FooterDisclaimer } from "@/components";
import { LoginFlow } from "./LoginFlow";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <LoginFlow />
      <FooterDisclaimer />
    </div>
  );
}
