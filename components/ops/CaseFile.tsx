"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { OpsBadge } from "@/components/ops/OpsBadge";
import { FactList, FieldGrid, OpsCard, OpsFile, OpsMissing } from "@/components/ops/OpsFile";
import { Select } from "@/components/ui/Dropdown";
import { dateOnly } from "@/lib/format";
import { applicationBase, certificationHref, servicingHome, servicingLoanHref } from "@/lib/loan-routes";
import { certificationById, opsLabel } from "@/lib/ops-logic";
import { ADVISORS } from "@/lib/ops-data";
import { useOps } from "@/lib/ops-store";

export function CaseFile({ id }: { id: string }) {
  const ops = useOps();
  const item = ops.cases.find((entry) => entry.id === id);
  const loan = item ? ops.loans.find((entry) => entry.id === item.loanId) : null;
  const cert = loan ? certificationById(ops, loan.certificationId) : null;
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [saved, setSaved] = useState(false);

  if (!item || !loan) {
    return (
      <OpsMissing
        message="This servicing case is not in the prototype data."
        href={servicingHome()}
        label="Back to servicing"
      />
    );
  }

  const resolved = item.status === "resolved";

  return (
    <OpsFile
      backHref={servicingHome()}
      backLabel="Back to servicing cases"
      eyebrow="Servicing case"
      title={`${loan.borrower} - ${opsLabel(item.type)}`}
      actions={
        <Button size="small" disabled={resolved} onClick={() => ops.resolveCase(item.id)}>
          {resolved ? "Resolved" : "Resolve case"}
        </Button>
      }
    >
      <OpsCard title="Case">
        <FactList
          items={[
            { label: "Borrower", value: loan.borrower },
            { label: "Loan type", value: loan.product },
            { label: "Case type", value: opsLabel(item.type) },
            { label: "Priority", value: <OpsBadge value={item.priority} /> },
            { label: "Status", value: <OpsBadge value={item.status} /> },
            { label: "Opened by", value: item.openedBy },
            { label: "Assignee", value: item.assignee },
            { label: "Opened", value: dateOnly(item.openedAt) },
            { label: "School", value: loan.school || "—" },
            { label: "Details", value: item.details },
          ]}
        />
        <div className="flex flex-wrap gap-md text-sm">
          <Link href={servicingLoanHref(loan.id)} className="text-primary">
            Open loan account
          </Link>
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
      <OpsCard title="Reassign">
        <FieldGrid>
          <Select
            label="Assignee"
            aria-label="Assignee"
            variant="float"
            value={item.assignee}
            disabled={resolved}
            options={ADVISORS.map((name) => ({ id: name, label: name }))}
            onChange={(value) => ops.reassignCase(item.id, value)}
          />
        </FieldGrid>
        <p className="text-sm text-gray-medium">
          Reassigning an open case hands it to that advisor to follow up with the borrower.
        </p>
      </OpsCard>
      <OpsCard title="Servicing notes">
        <form
          className="flex flex-col gap-md"
          onSubmit={(event) => {
            event.preventDefault();
            ops.saveCaseNotes(item.id, notes);
            setSaved(true);
          }}
        >
          <label className="flex w-full flex-col gap-xs text-xs text-gray-medium">
            Notes
            <textarea
              className="uw-input w-full"
              rows={4}
              value={notes}
              onChange={(event) => {
                setNotes(event.target.value);
                setSaved(false);
              }}
              placeholder="Notes for this case stay separate from the underwriting file."
            />
          </label>
          <div className="flex items-center gap-md">
            <Button size="small" type="submit">
              Save notes
            </Button>
            {saved ? <span className="text-sm text-gray-medium">Notes saved.</span> : null}
          </div>
        </form>
      </OpsCard>
    </OpsFile>
  );
}
