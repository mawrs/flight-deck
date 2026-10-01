"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { FactList, FieldGrid, OpsCard, OpsFile, OpsMissing } from "@/components/ops/OpsFile";
import { OpsBadge } from "@/components/ops/OpsBadge";
import { FloatInput } from "@/components/ui/FloatInput";
import { Select } from "@/components/ui/Dropdown";
import { dateOnly, money } from "@/lib/format";
import { applicationBase, certificationHome, servicingLoanHref } from "@/lib/loan-routes";
import { daysSince, loanForCertification, opsLabel } from "@/lib/ops-logic";
import { useOps } from "@/lib/ops-store";
import type { DisbursementStatus, EnrollmentStatus } from "@/lib/ops-types";

const ENROLLMENT = [
  { id: "full-time", label: "Full time" },
  { id: "half-time", label: "Half time" },
  { id: "less-than-half-time", label: "Less than half time" },
];

type DraftLine = {
  key: string;
  id?: string;
  date: string;
  amount: string;
  status: DisbursementStatus | "new";
};

function dateInput(value: string) {
  return value.slice(0, 10);
}

function parseAmount(value: string) {
  const amount = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(amount) ? amount : 0;
}

export function CertificationFile({ id }: { id: string }) {
  const ops = useOps();
  const cert = ops.certifications.find((item) => item.id === id);
  const loan = cert ? loanForCertification(ops.loans, cert.id) : null;

  if (!cert) {
    return (
      <OpsMissing
        message="This certification file is not in the prototype data."
        href={certificationHome()}
        label="Back to certifications"
      />
    );
  }

  const waiting = daysSince(cert.requestedAt);
  const outreach = cert.status === "requested" && waiting != null && waiting >= 14;

  return (
    <OpsFile
      backHref={certificationHome()}
      backLabel="Back to certifications"
      eyebrow="Certification"
      title={`${cert.borrower} - ${cert.id}`}
      actions={
        <>
          <Button size="small" variant="outline" onClick={() => ops.resendCertification(cert.id)}>
            Resend certification
          </Button>
          <Button
            size="small"
            variant="danger"
            disabled={cert.status === "rejected"}
            onClick={() => ops.rejectCertification(cert.id)}
          >
            Reject certification
          </Button>
        </>
      }
    >
      {outreach ? (
        <p className="rounded-xs border border-warning bg-warning-bg px-md py-sm text-sm text-black">
          Requested {waiting} days ago. Outreach to the school is due if this file is still uncertified.
        </p>
      ) : null}
      <OpsCard title="School certification">
        <FactList
          items={[
            { label: "Borrower", value: cert.borrower },
            { label: "Loan type", value: cert.product },
            { label: "School", value: cert.school },
            { label: "School code", value: cert.schoolCode },
            { label: "Status", value: <OpsBadge value={cert.status} /> },
            { label: "Requested", value: dateOnly(cert.requestedAt) },
            { label: "Certified", value: dateOnly(cert.certifiedAt) },
            { label: "Approved amount", value: money(cert.approvedAmount) },
            { label: "Certified amount", value: money(cert.certifiedAmount) },
            { label: "Cost of attendance", value: money(cert.costOfAttendance) },
            { label: "Enrollment", value: cert.enrollment ? opsLabel(cert.enrollment) : "—" },
          ]}
        />
        <div className="flex flex-wrap gap-md text-sm">
          {loan ? (
            <Link href={servicingLoanHref(loan.id)} className="text-primary">
              Open loan account
            </Link>
          ) : null}
          {cert.applicationId ? (
            <Link href={`${applicationBase(cert.applicationId)}/opportunity`} className="text-primary">
              Open application
            </Link>
          ) : null}
        </div>
      </OpsCard>
      <SchoolCodeCard certificationId={cert.id} schoolCode={cert.schoolCode} />
      <ResponseCard id={cert.id} />
    </OpsFile>
  );
}

function SchoolCodeCard({ certificationId, schoolCode }: { certificationId: string; schoolCode: string }) {
  const { editSchoolCode } = useOps();
  const [code, setCode] = useState(schoolCode);
  const [saved, setSaved] = useState(false);

  return (
    <OpsCard title="School code">
      <form
        className="flex w-full flex-col gap-md"
        onSubmit={(event) => {
          event.preventDefault();
          editSchoolCode(certificationId, code);
          setSaved(true);
        }}
      >
        <FieldGrid>
          <FloatInput label="School code" value={code} onChange={setCode} />
        </FieldGrid>
        <div className="flex items-center gap-md">
          <Button size="small" type="submit" className="whitespace-nowrap">
            Save school code
          </Button>
          {saved ? <span className="text-sm text-gray-medium">Saved on this certification and the loan account.</span> : null}
        </div>
      </form>
    </OpsCard>
  );
}

function ResponseCard({ id }: { id: string }) {
  const ops = useOps();
  const cert = ops.certifications.find((item) => item.id === id);
  const [enrollment, setEnrollment] = useState<EnrollmentStatus>(cert?.enrollment || "full-time");
  const [certifiedAmount, setCertifiedAmount] = useState(
    cert?.certifiedAmount != null ? String(cert.certifiedAmount) : cert ? String(cert.approvedAmount) : "",
  );
  const [cost, setCost] = useState(cert?.costOfAttendance != null ? String(cert.costOfAttendance) : "");
  const [lines, setLines] = useState<DraftLine[]>(() => draftLines(cert?.disbursements ?? []));
  const [error, setError] = useState("");

  if (!cert) return null;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!enrollment) {
      setError("Choose an enrollment status.");
      return;
    }
    const amount = parseAmount(certifiedAmount);
    const attendance = parseAmount(cost);
    const disbursements = lines
      .filter((line) => line.status !== "disbursed")
      .map((line) => ({
        id: line.id,
        date: line.date,
        amount: parseAmount(line.amount),
        status: "scheduled" as const,
      }))
      .filter((line) => line.date && line.amount > 0);
    const kept = lines.filter((line) => line.status === "disbursed" && line.id);
    if (amount <= 0 || attendance <= 0) {
      setError("Enter a certified amount and cost of attendance.");
      return;
    }
    if (disbursements.length + kept.length === 0) {
      setError("Add at least one disbursement date.");
      return;
    }
    setError("");
    ops.recordSchoolResponse(cert!.id, {
      enrollment,
      certifiedAmount: amount,
      costOfAttendance: attendance,
      disbursements: [
        ...kept.map((line) => ({
          id: line.id,
          date: line.date,
          amount: parseAmount(line.amount),
          status: "disbursed" as const,
        })),
        ...disbursements,
      ],
    });
  }

  return (
    <OpsCard title="Record school response">
      <form className="flex w-full flex-col gap-lg" onSubmit={submit}>
        <FieldGrid>
          <Select
            label="Enrollment"
            aria-label="Enrollment"
            variant="float"
            value={enrollment}
            options={ENROLLMENT}
            onChange={(value) => setEnrollment(value as EnrollmentStatus)}
          />
          <FloatInput label="Certified amount" value={certifiedAmount} onChange={setCertifiedAmount} />
          <FloatInput label="Cost of attendance" value={cost} onChange={setCost} />
        </FieldGrid>
        <div className="flex w-full flex-col gap-sm">
          <h3 className="text-sm font-semibold text-black">Disbursement schedule</h3>
          {lines.map((line) => (
            <FieldGrid key={line.key}>
              <label className="flex min-w-0 flex-col gap-xs text-xs text-gray-medium">
                Date
                <input
                  className="uw-input h-[60px] w-full px-md"
                  type="date"
                  value={line.date}
                  disabled={line.status === "disbursed"}
                  onChange={(event) => updateLine(line.key, { date: event.target.value })}
                />
              </label>
              <label className="flex min-w-0 flex-col gap-xs text-xs text-gray-medium">
                Amount
                <input
                  className="uw-input h-[60px] w-full px-md"
                  inputMode="decimal"
                  value={line.amount}
                  disabled={line.status === "disbursed"}
                  onChange={(event) => updateLine(line.key, { amount: event.target.value })}
                />
              </label>
              <span className="flex h-[60px] items-center self-end">
                <OpsBadge value={line.status === "new" ? "scheduled" : line.status} />
              </span>
              {line.status !== "disbursed" ? (
                <button
                  type="button"
                  className="h-[60px] justify-self-start self-end text-sm text-primary"
                  onClick={() => setLines((current) => current.filter((item) => item.key !== line.key))}
                >
                  Remove
                </button>
              ) : (
                <span />
              )}
            </FieldGrid>
          ))}
          <button
            type="button"
            className="self-start text-sm text-primary"
            onClick={() =>
              setLines((current) => [
                ...current,
                { key: `new-${current.length}-${Date.now()}`, date: "", amount: "", status: "new" },
              ])
            }
          >
            Add disbursement
          </button>
        </div>
        {error ? <p className="text-sm text-error">{error}</p> : null}
        <div>
          <Button size="small" type="submit">
            Record school response
          </Button>
        </div>
      </form>
    </OpsCard>
  );

  function updateLine(key: string, patch: Partial<DraftLine>) {
    setLines((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }
}

function draftLines(disbursements: { id: string; date: string; amount: number; status: DisbursementStatus }[]): DraftLine[] {
  if (disbursements.length === 0) {
    return [{ key: "new-0", date: "", amount: "", status: "new" }];
  }
  return disbursements.map((item) => ({
    key: item.id,
    id: item.id,
    date: dateInput(item.date),
    amount: String(item.amount),
    status: item.status,
  }));
}
