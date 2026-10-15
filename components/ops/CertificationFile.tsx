"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Button, buttonClassName } from "@/components/Button";
import { FactList, FieldGrid, OpsCard, OpsFile, OpsMissing } from "@/components/ops/OpsFile";
import { OpsBadge } from "@/components/ops/OpsBadge";
import { FloatInput } from "@/components/ui/FloatInput";
import { accountHasRole } from "@/lib/account";
import { BORROWER_STATUSES } from "@/lib/borrower-status";
import { dateOnly, money } from "@/lib/format";
import { applicationBase, certificationHome, servicingLoanHref } from "@/lib/loan-routes";
import { daysSince, loanForCertification, opsLabel } from "@/lib/ops-logic";
import { useOps } from "@/lib/ops-store";

const WITHDRAWAL_REASONS = BORROWER_STATUSES.filter((status) => status.startsWith("Withdrawn"));

export function CertificationFile({ id }: { id: string }) {
  const ops = useOps();
  const cert = ops.certifications.find((item) => item.id === id);
  const loan = cert ? loanForCertification(ops.loans, cert.id) : null;
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [responseOpen, setResponseOpen] = useState(false);
  const closeWithdraw = useCallback(() => setWithdrawOpen(false), []);
  const closeResponse = useCallback(() => setResponseOpen(false), []);

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
          {cert.status === "in-review" ? (
            <Button size="small" variant="primary" onClick={() => setResponseOpen(true)}>
              Record School Response
            </Button>
          ) : null}
          <Button size="small" variant="outline" onClick={() => ops.resendCertification(cert.id)}>
            Resend certification
          </Button>
          <Button
            size="small"
            variant="danger"
            disabled={cert.status === "withdrawn" || cert.status === "rejected"}
            onClick={() => setWithdrawOpen(true)}
          >
            Withdraw Certification
          </Button>
          <WithdrawCertificationModal
            open={withdrawOpen}
            onClose={closeWithdraw}
            onConfirm={(reason, note) => {
              ops.withdrawCertification(cert.id, reason, note);
              setWithdrawOpen(false);
            }}
          />
          <SchoolResponseModal
            open={responseOpen}
            onClose={closeResponse}
            certification={cert}
            onConfirm={(response) => {
              ops.recordSchoolResponse(cert.id, response);
              setResponseOpen(false);
            }}
          />
        </>
      }
    >
      {outreach ? (
        <p className="border-b border-warning bg-warning-bg px-xl py-md text-sm text-black">
          Requested {waiting} days ago. Outreach to the school is due if this file is still uncertified.
        </p>
      ) : null}
      {cert.status === "in-review" ? (
        <p className="border-b border-warning bg-warning-bg px-xl py-md text-sm text-black">
          The school asked for a change. Update this file before sending it back.
        </p>
      ) : null}
      <OpsCard
        title="School certification"
        action={
          <div className="flex flex-wrap items-center justify-end gap-sm">
            {loan ? (
              <Link href={servicingLoanHref(loan.id)} className={buttonClassName({ variant: "link", size: "small" })}>
                Open loan account
              </Link>
            ) : null}
            {cert.applicationId ? (
              <Link
                href={`${applicationBase(cert.applicationId)}/opportunity`}
                className={buttonClassName({ variant: "link", size: "small" })}
              >
                Open application
              </Link>
            ) : null}
          </div>
        }
      >
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
            ...(cert.withdrawalReason ? [{ label: "Withdrawal reason", value: cert.withdrawalReason }] : []),
            ...(cert.withdrawalNote ? [{ label: "Withdrawal note", value: cert.withdrawalNote }] : []),
          ]}
        />
      </OpsCard>
      {accountHasRole("Admin") ? <SchoolCodeCard certificationId={cert.id} schoolCode={cert.schoolCode} /> : null}
    </OpsFile>
  );
}

function SchoolCodeCard({ certificationId, schoolCode }: { certificationId: string; schoolCode: string }) {
  const { editSchoolCode } = useOps();
  const [code, setCode] = useState(schoolCode);
  const [saved, setSaved] = useState(false);
  const next = code.trim();
  const changed = next.length > 0 && next !== schoolCode.trim();

  return (
    <OpsCard title="School code">
      <form
        className="flex w-full flex-col gap-md"
        onSubmit={(event) => {
          event.preventDefault();
          if (!changed) return;
          editSchoolCode(certificationId, next);
          setCode(next);
          setSaved(true);
        }}
      >
        <FieldGrid>
          <FloatInput
            label="School code"
            value={code}
            onChange={(value) => {
              setCode(value);
              setSaved(false);
            }}
          />
        </FieldGrid>
        <div className="flex items-center gap-md">
          <Button size="small" type="submit" className="whitespace-nowrap" disabled={!changed}>
            Save school code
          </Button>
          {saved ? <span className="text-sm text-gray-medium">Saved on this certification and the loan account.</span> : null}
        </div>
      </form>
    </OpsCard>
  );
}

function WithdrawCertificationModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string, note: string) => void;
}) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    setReason("");
    setNote("");
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-xl">
      <button type="button" className="absolute inset-0 bg-charcoal/40" aria-label="Close withdrawal" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="uw-dialog uw-dialog-withdraw">
        <div className="flex items-center justify-between gap-md border-b border-gray-light px-xl py-md">
          <h2 id={titleId} className="text-lg font-semibold text-charcoal">
            Withdraw Certification
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-xs text-gray-dark hover:bg-gray-lightest"
          >
            <CloseIcon />
          </button>
        </div>
        <form
          className="flex min-h-0 flex-col gap-lg overflow-y-auto px-xl py-lg"
          onSubmit={(event) => {
            event.preventDefault();
            if (!reason) return;
            onConfirm(reason, note);
          }}
        >
          <fieldset className="flex flex-col gap-md">
            <legend className="mb-sm text-sm text-gray-medium">Reason</legend>
            {WITHDRAWAL_REASONS.map((item) => (
              <label key={item} className="flex cursor-pointer items-start gap-md">
                <input
                  type="radio"
                  name="withdrawal-reason"
                  value={item}
                  checked={reason === item}
                  onChange={() => setReason(item)}
                  className="mt-[3px] size-4 accent-primary"
                />
                <span className="text-sm text-charcoal">{item}</span>
              </label>
            ))}
          </fieldset>
          <FloatInput label="Note (optional)" value={note} multiline onChange={setNote} />
          <div className="flex justify-end gap-sm">
            <Button type="button" size="small" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="small" variant="danger" disabled={!reason}>
              Confirm withdrawal
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

function SchoolResponseModal({
  open,
  onClose,
  certification,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  certification: ReturnType<typeof useOps>["certifications"][number];
  onConfirm: (response: { enrollment: "full-time" | "half-time" | "less-than-half-time"; certifiedAmount: number; costOfAttendance: number; disbursements: { id?: string; date: string; amount: number }[] }) => void;
}) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [enrollment, setEnrollment] = useState<"full-time" | "half-time" | "less-than-half-time">("full-time");
  const [certifiedAmount, setCertifiedAmount] = useState("");
  const [costOfAttendance, setCostOfAttendance] = useState("");
  const [disbursements, setDisbursements] = useState<{ id: string; date: string; amount: string }[]>([]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    setEnrollment(certification.enrollment || "full-time");
    setCertifiedAmount(certification.certifiedAmount?.toString() ?? certification.approvedAmount.toString());
    setCostOfAttendance(certification.costOfAttendance?.toString() ?? "");
    setDisbursements(
      certification.disbursements.length > 0
        ? certification.disbursements.map((d) => ({ id: d.id, date: d.date.split("T")[0], amount: d.amount.toString() }))
        : [{ id: "", date: "", amount: "" }]
    );
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, certification]);

  if (!mounted || !open) return null;

  const certAmount = parseFloat(certifiedAmount);
  const coaAmount = parseFloat(costOfAttendance);
  const validAmounts = !isNaN(certAmount) && certAmount > 0 && !isNaN(coaAmount) && coaAmount > 0;
  const validDisbursements = disbursements.every((d) => d.date && !isNaN(parseFloat(d.amount)) && parseFloat(d.amount) > 0);

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-xl">
      <button type="button" className="absolute inset-0 bg-charcoal/40" aria-label="Close response" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="uw-dialog uw-dialog-response max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-md bg-white shadow-xl">
        <div className="flex items-center justify-between gap-md border-b border-gray-light px-xl py-md">
          <h2 id={titleId} className="text-lg font-semibold text-charcoal">
            Record School Response
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-xs text-gray-dark hover:bg-gray-lightest"
          >
            <CloseIcon />
          </button>
        </div>
        <form
          className="flex min-h-0 flex-col gap-lg overflow-y-auto px-xl py-lg"
          onSubmit={(event) => {
            event.preventDefault();
            if (!validAmounts || !validDisbursements) return;
            onConfirm({
              enrollment,
              certifiedAmount: certAmount,
              costOfAttendance: coaAmount,
              disbursements: disbursements.map((d) => ({
                id: d.id || undefined,
                date: d.date,
                amount: parseFloat(d.amount),
              })),
            });
          }}
        >
          <fieldset className="flex flex-col gap-md">
            <legend className="mb-sm text-sm text-gray-medium">Enrollment Status</legend>
            {(["full-time", "half-time", "less-than-half-time"] as const).map((item) => (
              <label key={item} className="flex cursor-pointer items-start gap-md">
                <input
                  type="radio"
                  name="enrollment-status"
                  value={item}
                  checked={enrollment === item}
                  onChange={() => setEnrollment(item)}
                  className="mt-[3px] size-4 accent-primary"
                />
                <span className="text-sm text-charcoal">{opsLabel(item)}</span>
              </label>
            ))}
          </fieldset>
          <FloatInput
            label="Certified Amount"
            value={certifiedAmount}
            onChange={setCertifiedAmount}
            type="number"
            step="0.01"
          />
          <FloatInput
            label="Cost of Attendance"
            value={costOfAttendance}
            onChange={setCostOfAttendance}
            type="number"
            step="0.01"
          />
          <fieldset className="flex flex-col gap-md">
            <legend className="mb-sm text-sm text-gray-medium">Disbursement Schedule</legend>
            {disbursements.map((disb, index) => (
              <div key={index} className="flex gap-md">
                <FloatInput
                  label="Date"
                  value={disb.date}
                  onChange={(value) => {
                    const next = [...disbursements];
                    next[index].date = value;
                    setDisbursements(next);
                  }}
                  type="date"
                />
                <FloatInput
                  label="Amount"
                  value={disb.amount}
                  onChange={(value) => {
                    const next = [...disbursements];
                    next[index].amount = value;
                    setDisbursements(next);
                  }}
                  type="number"
                  step="0.01"
                />
                {disbursements.length > 1 ? (
                  <Button
                    type="button"
                    size="small"
                    variant="outline"
                    onClick={() => setDisbursements(disbursements.filter((_, i) => i !== index))}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
            ))}
            <Button
              type="button"
              size="small"
              variant="outline"
              onClick={() => setDisbursements([...disbursements, { id: "", date: "", amount: "" }])}
            >
              Add Disbursement
            </Button>
          </fieldset>
          <div className="flex justify-end gap-sm">
            <Button type="button" size="small" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="small" disabled={!validAmounts || !validDisbursements}>
              Save Response
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
