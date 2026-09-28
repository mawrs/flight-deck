"use client";

import { LoanCard } from "@/components/payoffs/LoanCard";
import { money } from "@/lib/format";
import { normalizeLiability } from "@/lib/payoffs";
import type { Application, ApplicationPatch, Liability } from "@/lib/types";

export function UnderwritingPayoff({
  application,
  readOnly,
  onChange,
}: {
  application: Application;
  readOnly: boolean;
  onChange: (patch: ApplicationPatch) => void;
}) {
  const loans = (application.payoffs ?? []).map(normalizeLiability);
  const selected = loans.filter((item) => item.selected);

  function setPayoffs(next: Liability[]) {
    onChange({ payoffs: next.map(normalizeLiability) });
  }

  function update(loanId: string, patch: Partial<Liability>) {
    setPayoffs(loans.map((item) => (item.id === loanId ? { ...item, ...patch } : item)));
  }

  return (
    <div className="flex flex-col bg-white">
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
      <div className="flex items-center justify-between gap-md border-t border-gray-light bg-gray-lightest px-xl py-lg">
        <div>
          <p className="text-sm text-gray-dark">Total amount to be paid off</p>
          <p className="text-xl font-semibold text-black">
            {money(selected.reduce((sum, item) => sum + (item.adjBalance || item.balance), 0))}
          </p>
        </div>
        <p className="text-xs text-gray-dark">
          {selected.length === 1 ? "1 loan selected" : `${selected.length} loans selected`}
        </p>
      </div>
    </div>
  );
}
