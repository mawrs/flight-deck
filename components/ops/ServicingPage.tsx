"use client";

import { useState } from "react";
import { useFileWorkspace } from "@/components/application/file-context";
import { CaseFeed } from "@/components/ops/CaseFeed";
import { CaseFile } from "@/components/ops/CaseFile";
import { DisbursementHistory, RatesHistory, SERVICING_SECTIONS, type ServicingSection } from "@/components/ops/ServicingHistory";
import { Select } from "@/components/ui/Dropdown";
import { CURRENT_USER } from "@/lib/mentions";
import { useOps } from "@/lib/ops-store";

function caseNumberLabel(id: string) {
  const match = id.match(/(\d+)$/);
  const suffix = (match?.[1] ?? "0").slice(-4).padStart(4, "0");
  return `0004${suffix}`;
}

export function ServicingPage() {
  const { id } = useFileWorkspace();
  const ops = useOps();
  const [section, setSection] = useState<ServicingSection>("feed");
  const [chosenId, setChosenId] = useState("");
  const loanIds = new Set(ops.loans.filter((loan) => loan.applicationId === id).map((loan) => loan.id));
  const cases = ops.cases
    .filter((item) => loanIds.has(item.loanId))
    .sort((a, b) => b.openedAt.localeCompare(a.openedAt));
  const selected = cases.find((item) => item.id === chosenId) ?? cases[0];

  return (
    <div className="flex flex-col bg-white">
      <div className="uw-card-header">
        <h1 className="text-lg text-black">Servicing</h1>
        {cases.length > 1 && selected ? (
          <div className="w-[320px]">
            <Select
              aria-label="Servicing case"
              variant="field"
              align="right"
              value={selected.id}
              options={cases.map((item) => {
                const loan = ops.loans.find((entry) => entry.id === item.loanId);
                const number = item.form?.caseNumber?.trim() || caseNumberLabel(item.id);
                return { id: item.id, label: `${number} · ${loan?.borrower ?? item.subject}` };
              })}
              onChange={setChosenId}
            />
          </div>
        ) : null}
      </div>
      <nav className="uw-section-tabs" aria-label="Servicing sections">
        {SERVICING_SECTIONS.map((item) => {
          const active = item.id === section;
          return (
            <button
              key={item.id}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => setSection(item.id)}
              className="uw-section-tab"
            >
              {item.label}
            </button>
          );
        })}
      </nav>
      {selected ? (
        <CaseFile key={selected.id} id={selected.id} embedded section={section} />
      ) : section === "feed" ? (
        <div className="flex h-[720px] overflow-hidden bg-white">
          <CaseFeed author={CURRENT_USER} applicationId={id} />
        </div>
      ) : section === "disbursement-history" ? (
        <DisbursementHistory applicationId={id} />
      ) : section === "rates-history" ? (
        <RatesHistory applicationId={id} />
      ) : (
        <p className="px-xl py-lg text-sm text-gray-medium">No servicing case is open for this application.</p>
      )}
    </div>
  );
}
