"use client";

import type { ReactNode } from "react";
import { useFileWorkspace } from "@/components/application/file-context";
import { LOAN_ROW_GRID, LoanCard } from "@/components/payoffs/LoanCard";
import { UnderwritingLiabilities } from "@/components/underwriting/UnderwritingLiabilities";
import { selectedPayoffTotal } from "@/lib/calculations";
import { money } from "@/lib/format";
import { isStudentLoan, normalizeLiability } from "@/lib/payoffs";
import { useApplication } from "@/lib/store";
import type { Liability } from "@/lib/types";

export function PayoffsPage({ mode = "all" }: { mode?: "all" | "payoff" }) {
  const { id, readOnly, basePath } = useFileWorkspace();
  const { application, updateApplication } = useApplication(id);
  if (!application) return null;
  const file = application;

  const studentLoans = file.liabilities
    .map(normalizeLiability)
    .filter(isStudentLoan)
    .filter((item) => item.lender || item.accountNumber || item.balance);
  const payoffLoans = (file.payoffs ?? []).map(normalizeLiability);
  const liabilities = mode === "all";
  const loans = liabilities ? studentLoans : payoffLoans;
  const selected = loans.filter((item) => item.selected);

  function setLoans(next: Liability[]) {
    if (liabilities) {
      const others = file.liabilities.filter((item) => !isStudentLoan(item));
      updateApplication(id, { liabilities: [...others, ...next.map(normalizeLiability)] });
      return;
    }
    updateApplication(id, { payoffs: next.map(normalizeLiability) });
  }

  function update(loanId: string, patch: Partial<Liability>) {
    setLoans(loans.map((item) => (item.id === loanId ? { ...item, ...patch } : item)));
  }

  return (
    <div className="flex flex-col bg-white">
      {liabilities ? (
        <div className="border-b border-gray-light">
          <UnderwritingLiabilities
            application={file}
            readOnly={readOnly}
            basePath={basePath}
            showHeader
            onChange={(patch) => updateApplication(id, patch)}
          />
        </div>
      ) : null}
      <div className="uw-card-header">
        <h1 className="text-lg text-black">
          {liabilities ? "Student Loan Liabilities" : "Loan Payoff"}
        </h1>
        {liabilities ? (
          <PromptLine prompt="Not seeing your loan?">
            <span className="uw-btn-link pointer-events-none cursor-default">
              Add another student loan
            </span>
          </PromptLine>
        ) : null}
      </div>

      <div className="flex flex-col">
        {loans.length === 0 ? (
          <p className="px-xl py-lg text-sm text-gray-medium">
            {liabilities ? "No student loans are on this file." : "No loans are on this payoff list."}
          </p>
        ) : liabilities ? (
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
                onChange={(patch) => update(item.id, patch)}
              />
            ))}
          </div>
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

      <div className="flex items-center justify-between gap-md border-t border-gray-light bg-gray-lightest px-xl py-lg">
        <div>
          <p className="text-sm text-gray-dark">Total amount to be paid off</p>
          <p className="text-xl font-semibold text-black">
            {money(liabilities ? selectedPayoffTotal(selected) : selected.reduce((sum, item) => sum + (item.adjBalance || item.balance), 0))}
          </p>
        </div>
        <p className="text-xs text-gray-dark">
          {selected.length === 1 ? "1 loan selected" : `${selected.length} loans selected`}
        </p>
      </div>
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
