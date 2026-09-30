"use client";

import { LOAN_ROW_GRID, LoanCard } from "@/components/payoffs/LoanCard";
import { selectedPayoffTotal } from "@/lib/calculations";
import { money } from "@/lib/format";
import type { Liability } from "@/lib/types";

export function StudentLoans({
  loans,
  selected,
  readOnly,
  onChange,
}: {
  loans: Liability[];
  selected: Liability[];
  readOnly: boolean;
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
                readOnly={readOnly}
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

export function PayoffTotal({ amount, count }: { amount: number; count: number }) {
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
