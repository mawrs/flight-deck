import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { StoreProvider } from "@/lib/store";
import "./loan.css";
import styles from "./loan.module.css";

export const metadata: Metadata = {
  title: "Loan Origination",
};

export default function LoanOriginationLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${styles.loan} loan-root`}>
      <StoreProvider>
        <AppShell>{children}</AppShell>
      </StoreProvider>
    </div>
  );
}
