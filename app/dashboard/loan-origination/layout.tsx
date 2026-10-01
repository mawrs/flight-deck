import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { OpsProvider } from "@/lib/ops-store";
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
        <OpsProvider>
          <AppShell>{children}</AppShell>
        </OpsProvider>
      </StoreProvider>
    </div>
  );
}
