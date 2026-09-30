"use client";

import { useState } from "react";
import { useFileWorkspace } from "@/components/application/file-context";
import { BorrowerInformation } from "@/components/underwriting/BorrowerInformation";
import { IncomeCalculatorPanel } from "@/components/underwriting/IncomeCalculator";
import { NursingCalculatorPanel } from "@/components/underwriting/NursingCalculator";
import { SelfEmployedCalculatorPanel } from "@/components/underwriting/SelfEmployedCalculator";
import { StudentLoans } from "@/components/payoffs/StudentLoans";
import { UnderwritingLiabilities } from "@/components/underwriting/UnderwritingLiabilities";
import { UnderwritingPayoff } from "@/components/underwriting/UnderwritingPayoff";
import { isStudentLoan, normalizeLiability } from "@/lib/payoffs";
import { useApplication } from "@/lib/store";
import type { Application, ApplicationPatch, Liability } from "@/lib/types";

const PANELS = [
  { id: "borrower", label: "Borrower Information" },
  { id: "payoff", label: "Pay Off" },
  { id: "calculators", label: "Calculators" },
  { id: "liabilities", label: "Liabilities" },
] as const;

const CALCULATORS = [
  { id: "income", label: "Income" },
  { id: "nursing", label: "Nursing" },
  { id: "self-employed", label: "Self-Employed" },
] as const;

const LIABILITY_SECTIONS = [
  { id: "credit", label: "Credit Report Liabilities" },
  { id: "student", label: "Student Loan Liabilities" },
] as const;

type PanelId = (typeof PANELS)[number]["id"];
type CalculatorId = (typeof CALCULATORS)[number]["id"];
type LiabilitySection = (typeof LIABILITY_SECTIONS)[number]["id"];

export function UnderwritingPage() {
  const { id, basePath, readOnly } = useFileWorkspace();
  const { application, updateApplication } = useApplication(id);
  const [panel, setPanel] = useState<PanelId>("borrower");
  const [calculator, setCalculator] = useState<CalculatorId>("income");
  const [liabilitySection, setLiabilitySection] = useState<LiabilitySection>("credit");
  if (!application) return null;

  return (
    <div className="flex flex-col bg-white">
      <div className="uw-card-header">
        <h1 className="text-lg text-black">Underwriting</h1>
      </div>
      <nav
        className="uw-section-tabs"
        aria-label="Underwriting sections"
      >
        {PANELS.map((item) => {
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

      {panel === "borrower" ? (
        <BorrowerInformation
          application={application}
          basePath={basePath}
          readOnly={readOnly}
          onChange={(patch) => updateApplication(id, patch)}
        />
      ) : null}

      {panel === "payoff" ? (
        <UnderwritingPayoff
          application={application}
          readOnly={readOnly}
          onChange={(patch) => updateApplication(id, patch)}
        />
      ) : null}

      {panel === "calculators" ? (
        <>
          <nav className="uw-section-tabs" aria-label="Calculators">
            {CALCULATORS.map((item) => {
              const active = item.id === calculator;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={active ? "page" : undefined}
                  onClick={() => setCalculator(item.id)}
                  className="uw-section-tab"
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
          {calculator === "income" ? (
            <IncomeCalculatorPanel
              application={application}
              onChange={(patch) => updateApplication(id, patch)}
            />
          ) : null}
          {calculator === "nursing" ? (
            <NursingCalculatorPanel
              application={application}
              onChange={(patch) => updateApplication(id, patch)}
            />
          ) : null}
          {calculator === "self-employed" ? (
            <SelfEmployedCalculatorPanel
              application={application}
              onChange={(patch) => updateApplication(id, patch)}
            />
          ) : null}
        </>
      ) : null}

      {panel === "liabilities" ? (
        <LiabilityPanel
          application={application}
          readOnly={readOnly}
          basePath={basePath}
          section={liabilitySection}
          onSection={setLiabilitySection}
          onChange={(patch) => updateApplication(id, patch)}
        />
      ) : null}
    </div>
  );
}

function LiabilityPanel({
  application,
  readOnly,
  basePath,
  section,
  onSection,
  onChange,
}: {
  application: Application;
  readOnly: boolean;
  basePath: string;
  section: LiabilitySection;
  onSection: (section: LiabilitySection) => void;
  onChange: (patch: ApplicationPatch) => void;
}) {
  const studentLoans = application.liabilities
    .map(normalizeLiability)
    .filter(isStudentLoan)
    .filter((item) => item.lender || item.accountNumber || item.balance);
  const selected = studentLoans.filter((item) => item.selected);

  function updateStudent(loanId: string, patch: Partial<Liability>) {
    const others = application.liabilities.filter((item) => !isStudentLoan(item));
    const next = studentLoans.map((item) => (item.id === loanId ? { ...item, ...patch } : item));
    onChange({ liabilities: [...others, ...next.map(normalizeLiability)] });
  }

  return (
    <>
      <nav className="uw-section-tabs" aria-label="Liabilities sections">
        {LIABILITY_SECTIONS.map((item) => {
          const active = item.id === section;
          return (
            <button
              key={item.id}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => onSection(item.id)}
              className="uw-section-tab"
            >
              {item.label}
            </button>
          );
        })}
      </nav>
      {section === "credit" ? (
        <UnderwritingLiabilities
          application={application}
          readOnly={readOnly}
          basePath={basePath}
          onChange={onChange}
        />
      ) : (
        <StudentLoans
          loans={studentLoans}
          selected={selected}
          readOnly={readOnly}
          onChange={updateStudent}
        />
      )}
    </>
  );
}
