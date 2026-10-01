"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { OpsBadge } from "@/components/ops/OpsBadge";
import { FactList, OpsCard, OpsFile, OpsMissing } from "@/components/ops/OpsFile";
import { FloatInput } from "@/components/ui/FloatInput";
import { dateOnly, money } from "@/lib/format";
import { applicationBase, certificationHref, servicingCaseHref, servicingHome } from "@/lib/loan-routes";
import { PRIORITY_RANK, certificationById, disbursementsForLoan } from "@/lib/ops-logic";
import { useOps } from "@/lib/ops-store";
import type { Disbursement } from "@/lib/ops-types";

export function LoanAccount({ id }: { id: string }) {
  const ops = useOps();
  const loan = ops.loans.find((item) => item.id === id);
  const cert = loan ? certificationById(ops, loan.certificationId) : null;
  const lines = loan ? disbursementsForLoan(ops, loan) : [];
  const cases = ops.cases
    .filter((item) => item.loanId === id)
    .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.openedAt.localeCompare(b.openedAt));

  if (!loan) {
    return (
      <OpsMissing message="This loan account is not in the prototype data." href={servicingHome("onboarded")} label="Back to onboarded loans" />
    );
  }

  const backHref = loan.readOnly ? servicingHome("onboarded") : servicingHome("roster");

  return (
    <OpsFile
      backHref={backHref}
      backLabel="Back to servicing"
      eyebrow="Loan account"
      title={`${loan.borrower} - ${loan.id}`}
    >
      {loan.readOnly ? (
        <p className="rounded-xs border border-gray-light bg-gray-lightest px-md py-sm text-sm text-black">
          ReFi loans on the onboarded report stay read-only. InSchool and EdMed loans can be updated here.
        </p>
      ) : null}
      <OpsCard title="Account">
        <div className="flex flex-wrap gap-xl">
          <FactList
            items={[
              { label: "Borrower", value: loan.borrower },
              { label: "Loan type", value: loan.product },
              { label: "School", value: loan.school || "—" },
              { label: "School code", value: loan.schoolCode || "—" },
              { label: "Servicer", value: loan.servicer },
            ]}
          />
          <FactList
            items={[
              { label: "Boarding", value: <OpsBadge value={loan.boardingStatus} /> },
              { label: "Boarded", value: dateOnly(loan.boardedAt) },
              { label: "Certified amount", value: money(cert?.certifiedAmount) },
              { label: "Principal", value: money(loan.principal) },
              { label: "Interest", value: money(loan.interest) },
              { label: "Balance", value: money(loan.principal + loan.interest) },
            ]}
          />
        </div>
        <div className="mt-lg flex flex-wrap gap-md text-sm">
          {cert ? (
            <Link href={certificationHref(cert.id)} className="text-primary">
              Open certification
            </Link>
          ) : null}
          {loan.applicationId ? (
            <Link href={`${applicationBase(loan.applicationId)}/opportunity`} className="text-primary">
              Open application
            </Link>
          ) : null}
        </div>
      </OpsCard>
      {!loan.readOnly && cert ? <SchoolCodeEditor certificationId={cert.id} schoolCode={loan.schoolCode} /> : null}
      <OpsCard title="Disbursements">
        <div className="flex flex-col gap-md">
          {lines.length === 0 ? <p className="text-sm text-gray-medium">No disbursements on this loan.</p> : null}
          {lines.map((line) => (
            <DisbursementLine key={line.id} loanId={loan.id} line={line} readOnly={loan.readOnly} />
          ))}
        </div>
      </OpsCard>
      <OpsCard title="Related cases">
        {cases.length === 0 ? (
          <p className="text-sm text-gray-medium">No servicing cases on this loan.</p>
        ) : (
          <ul className="flex flex-col gap-sm">
            {cases.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center gap-sm text-sm">
                <OpsBadge value={item.priority} />
                <Link href={servicingCaseHref(item.id)} className="text-primary">
                  {item.details}
                </Link>
                <OpsBadge value={item.status} />
              </li>
            ))}
          </ul>
        )}
      </OpsCard>
    </OpsFile>
  );
}

function SchoolCodeEditor({ certificationId, schoolCode }: { certificationId: string; schoolCode: string }) {
  const { editSchoolCode } = useOps();
  const [code, setCode] = useState(schoolCode);
  const [saved, setSaved] = useState(false);

  return (
    <OpsCard title="School code">
      <form
        className="flex max-w-md flex-col gap-md"
        onSubmit={(event) => {
          event.preventDefault();
          editSchoolCode(certificationId, code);
          setSaved(true);
        }}
      >
        <FloatInput
          label="School code"
          value={code}
          onChange={(value) => {
            setCode(value);
            setSaved(false);
          }}
        />
        <div className="flex items-center gap-md">
          <Button size="small" type="submit">
            Save school code
          </Button>
          {saved ? <span className="text-sm text-gray-medium">Saved on the loan and the certification.</span> : null}
        </div>
      </form>
    </OpsCard>
  );
}

function DisbursementLine({ loanId, line, readOnly }: { loanId: string; line: Disbursement; readOnly: boolean }) {
  const { updateDisbursement, markDisbursed } = useOps();
  const [amount, setAmount] = useState(String(line.amount));
  const scheduled = line.status === "scheduled" && !readOnly;

  return (
    <div className="flex flex-wrap items-end gap-sm border-b border-gray-light pb-md">
      <div className="flex min-w-40 flex-col gap-xs">
        <span className="text-xs text-gray-medium">Date</span>
        <span className="text-sm text-black">{dateOnly(line.date)}</span>
      </div>
      <label className="flex flex-col gap-xs text-xs text-gray-medium">
        Amount
        <input
          className="uw-input"
          inputMode="decimal"
          value={scheduled ? amount : money(line.amount)}
          readOnly={!scheduled}
          onChange={(event) => setAmount(event.target.value)}
        />
      </label>
      <span className="pb-sm">
        <OpsBadge value={line.status} />
      </span>
      {scheduled ? (
        <>
          <Button
            size="small"
            variant="outline"
            onClick={() => updateDisbursement(loanId, line.id, Number(amount.replace(/[^0-9.]/g, "")))}
          >
            Save amount
          </Button>
          <Button
            size="small"
            onClick={() => {
              const next = Number(amount.replace(/[^0-9.]/g, ""));
              if (next > 0) updateDisbursement(loanId, line.id, next);
              markDisbursed(loanId, line.id);
            }}
          >
            Mark disbursed
          </Button>
        </>
      ) : null}
    </div>
  );
}
