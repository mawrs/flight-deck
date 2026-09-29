import type { Metadata } from "next";
import styles from "./qualifile.module.css";

export const metadata: Metadata = {
  title: "QualiFile",
};

const REASONS = [
  ["AB", "DEPOSIT CLOSURE HISTORY"],
  ["AL", "DEPTH OF PUBLIC FILE"],
  ["AO", "NON-DEROGATORY PUBLIC RECORD HISTORY"],
  ["AE", "TIME SINCE DEPOSIT CLOSURE(S)"],
] as const;

export default function QualiFilePage() {
  return (
    <main className={styles.page}>
      <article className={styles.sheet}>
        <h1>Consumer Information (As Entered)</h1>
        <section className={styles.band}>
          <div className={styles.consumer}>
            <p>
              MICHEAL SAM
              <br />
              022 SOUTH 4TH STREET
              <br />
              SAINT LOUIS, MO 63102
            </p>
            <p>
              SSN/ITIN: 666-99-0424
              <br />
              DOB: 09/04/1956
              <br />
              <br />
              DL#: 610000042
              <br />
              DL State: MO
            </p>
          </div>
          <p className={styles.spaced}>Home Phone: (314)231-0023</p>
          <p className={styles.country}>
            <span>Country:</span>
            United States
          </p>
        </section>

        <h1>Account Actions</h1>
        <section className={styles.band}>
          <p>
            <span className={styles.actionLabel}>Action:</span>
            DECLINE
          </p>
        </section>
        <section className={`${styles.band} ${styles.actions}`}>
          <span className={styles.actionLabel}>Recommended Actions:</span>
          <p>
            PROVIDE ADVERSE ACTION FORM
            <br />
            CHECK BOX FOR CHEXSYSTEMS
          </p>
        </section>

        <h1>QualiFile® Detail</h1>
        <section className={styles.band}>
          <div className={styles.score}>
            <span>QualiFile Score:</span>
            <strong>0626</strong>
            <span>Reasons:</span>
            <div className={styles.reasons}>
              <div className={styles.reasonHead}>
                <span>Code</span>
                <span>Text</span>
              </div>
              {REASONS.map(([code, text]) => (
                <div className={styles.reason} key={code}>
                  <span>{code}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.box}>
          <h2>Non FCRA</h2>
          <div className={styles.inner}>
            <h3>Identification Information</h3>
            <p>
              <span>SSN Validation:</span>
              SSN AVAILABLE FOR RANDOMIZED ISSUANCE SSN:Y
            </p>
            <p>
              <span>DL Format:</span>
              VALID DRIVERS LICENSE FORMAT
            </p>
          </div>
        </section>

        <h1>ChexSystems® History</h1>
        <section className={styles.band}>
          <div className={styles.history}>
            <p>
              <span>Total Closures:</span> 1
            </p>
            <p>
              <span>Total Purchased Debt:</span> 0
            </p>
            <p>
              <span>Disputed:</span> 0
            </p>
            <p>
              <span>Disputed:</span> 0
            </p>
            <p>
              <span>Paid:</span> 0
            </p>
            <p>
              <span>Paid:</span> 0
            </p>
          </div>
        </section>
      </article>
    </main>
  );
}
