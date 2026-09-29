"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useFileWorkspace } from "@/components/application/file-context";
import { LOAN_ROW_GRID, LoanCard } from "@/components/payoffs/LoanCard";
import { Button, buttonClass } from "@/components/ui/Button";
import { UnderwritingLiabilities } from "@/components/underwriting/UnderwritingLiabilities";
import { selectedPayoffTotal } from "@/lib/calculations";
import { sampleDocumentHref } from "@/lib/documents";
import { exportLiabilities } from "@/lib/export/xlsx";
import { money } from "@/lib/format";
import { isStudentLoan, loansForPayoff, normalizeLiability, patchPayoffLoan } from "@/lib/payoffs";
import { useApplication } from "@/lib/store";
import type { Application, Liability } from "@/lib/types";

const LIABILITY_PANELS = [
  { id: "credit", label: "Credit Report Liabilities" },
  { id: "student", label: "Student Loan Liabilities" },
] as const;

type LiabilityPanel = (typeof LIABILITY_PANELS)[number]["id"];

export function PayoffsPage({ mode = "all" }: { mode?: "all" | "payoff" }) {
  const { id, readOnly, basePath } = useFileWorkspace();
  const { application, updateApplication } = useApplication(id);
  const [panel, setPanel] = useState<LiabilityPanel>("credit");
  if (!application) return null;
  const file = application;

  const studentLoans = file.liabilities
    .map(normalizeLiability)
    .filter(isStudentLoan)
    .filter((item) => item.lender || item.accountNumber || item.balance);
  const liabilities = mode === "all";
  const loans = liabilities ? studentLoans : loansForPayoff(file);
  const selected = loans.filter((item) => item.selected);

  function update(loanId: string, patch: Partial<Liability>) {
    if (liabilities) {
      const others = file.liabilities.filter((item) => !isStudentLoan(item));
      const next = loans.map((item) => (item.id === loanId ? { ...item, ...patch } : item));
      updateApplication(id, { liabilities: [...others, ...next.map(normalizeLiability)] });
      return;
    }
    updateApplication(id, patchPayoffLoan(file, loanId, patch));
  }

  if (liabilities) {
    return (
      <div className="flex flex-col bg-white">
        <div className="uw-card-header">
          <h1 className="text-lg text-black">Liabilities</h1>
          {panel === "credit" ? (
            <CreditReportActions application={file} basePath={basePath} />
          ) : (
            <PromptLine prompt="Not seeing your loan?">
              <span className="uw-btn-link pointer-events-none cursor-default">
                Add another student loan
              </span>
            </PromptLine>
          )}
        </div>
        <nav className="uw-section-tabs" aria-label="Liabilities sections">
          {LIABILITY_PANELS.map((item) => {
            const active = item.id === panel;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => setPanel(item.id)}
                className="uw-section-tab"
              >
                {item.label}
              </button>
            );
          })}
        </nav>
        {panel === "credit" ? (
          <UnderwritingLiabilities
            application={file}
            readOnly={readOnly}
            basePath={basePath}
            onChange={(patch) => updateApplication(id, patch)}
          />
        ) : (
          <StudentLoans
            loans={loans}
            selected={selected}
            onChange={(loanId, patch) => update(loanId, patch)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white">
      <div className="uw-card-header">
        <h1 className="text-lg text-black">Loan Payoff</h1>
      </div>

      <div className="flex flex-col">
        {loans.length === 0 ? (
          <p className="px-xl py-lg text-sm text-gray-medium">No loans are on this payoff list.</p>
        ) : (
          <div className="flex flex-col gap-lg bg-white px-xl py-lg">
            {loans.map((item, index) => (
              <LoanCard
                key={item.id}
                item={item}
                variant="payoff"
                index={index + 1}
                readOnly={readOnly}
                onChange={(patch) => update(item.id, patch)}
              />
            ))}
          </div>
        )}
      </div>

      <PayoffTotal
        amount={selected.reduce((sum, item) => sum + (item.adjBalance || item.balance), 0)}
        count={selected.length}
      />
    </div>
  );
}

function StudentLoans({
  loans,
  selected,
  onChange,
}: {
  loans: Liability[];
  selected: Liability[];
  onChange: (loanId: string, patch: Partial<Liability>) => void;
}) {
  return (
    <>
      <div className="flex flex-col">
        {loans.length === 0 ? (
          <p className="px-xl py-lg text-sm text-gray-medium">No student loans are on this file.</p>
        ) : (
          <div>
            <div
              className={`${LOAN_ROW_GRID} h-11 border-b border-gray-light bg-gray-lightest px-xl text-sm font-semibold whitespace-nowrap text-black`}
            >
              <div className="flex items-center gap-lg">
                <span className="size-[21px] shrink-0" aria-hidden />
                <span>Loan Amount</span>
              </div>
              <span>Account Number</span>
              <span>Monthly Payment</span>
            </div>
            {loans.map((item, index) => (
              <LoanCard
                key={item.id}
                item={item}
                variant="all"
                last={index === loans.length - 1}
                readOnly={false}
                onChange={(patch) => onChange(item.id, patch)}
              />
            ))}
          </div>
        )}
      </div>
      <PayoffTotal amount={selectedPayoffTotal(selected)} count={selected.length} />
    </>
  );
}

function PayoffTotal({ amount, count }: { amount: number; count: number }) {
  return (
    <div className="flex items-center justify-between gap-md border-t border-gray-light bg-gray-lightest px-xl py-lg">
      <div>
        <p className="text-sm text-gray-dark">Total amount to be paid off</p>
        <p className="text-xl font-semibold text-black">{money(amount)}</p>
      </div>
      <p className="text-xs text-gray-dark">{count === 1 ? "1 loan selected" : `${count} loans selected`}</p>
    </div>
  );
}

function CreditReportActions({
  application,
  basePath,
}: {
  application: Application;
  basePath: string;
}) {
  const creditDoc = application.documents.find((item) => item.kind === "credit-report");
  const reportHref = creditDoc ? sampleDocumentHref(creditDoc.fileName) : `${basePath}/documents`;

  return (
    <div className="flex shrink-0 items-center gap-sm">
      <Button variant="secondary" className="h-[31px]" onClick={() => exportLiabilities(application)}>
        Export to Excel
      </Button>
      <Link href={reportHref} className={buttonClass("primary")}>
        View Credit Report
      </Link>
    </div>
  );
}

function PromptLine({
  prompt,
  className = "",
  children,
}: {
  prompt: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`flex items-center justify-end gap-sm text-sm ${className}`.trim()}>
      <span className="text-gray-dark">{prompt}</span>
      {children}
    </div>
  );
}
