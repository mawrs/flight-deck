"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ComboSearch, Select } from "@/components/ui/Dropdown";
import { FloatInput } from "@/components/ui/FloatInput";
import type { SearchChoice } from "@/lib/search";
import { BORROWER_STATUSES } from "@/lib/borrower-status";
import { money } from "@/lib/format";
import { CURRENT_USER } from "@/lib/mentions";
import { useOps } from "@/lib/ops-store";
import { useStore } from "@/lib/store";
import type { DisbursementHistoryLine } from "@/lib/types";

const LINE_STATUSES = ["SCHEDULED", "CANCELLED"] as const;

type LineStatus = (typeof LINE_STATUSES)[number];

type Line = {
  id: string;
  date: string;
  amount: string;
  status: LineStatus;
};

const LOAN_FIELDS: SearchChoice<"loan-number">[] = [
  { id: "loan-number", label: "Loan Number", prompt: "Search for a loan number", aria: "Search loan number" },
];

const savedLines = new Map<string, Line[]>();

function linesFor(id: string): Line[] {
  return (savedLines.get(id) ?? [
    { id: `${id}-1`, date: "", amount: "", status: "SCHEDULED" },
  ]).map((line) => ({ ...line }));
}

function amountText(value: string) {
  const numeric = Number(value.replace(/[$,]/g, ""));
  if (!value.trim() || !Number.isFinite(numeric)) return value.trim();
  return money(numeric);
}

function nextDisbursementHistory(previous: DisbursementHistoryLine[], lines: Line[]): DisbursementHistoryLine[] {
  const now = new Date().toISOString();
  return lines.map((line) => {
    const prior = previous.find((item) => item.id === line.id);
    const unchanged = prior && prior.date === line.date && prior.amount === line.amount && prior.status === line.status;
    return {
      id: line.id,
      date: line.date,
      amount: line.amount,
      status: line.status,
      statusUpdatedAt: unchanged ? prior.statusUpdatedAt : now,
    };
  });
}

function disbursementNote(lines: Line[]) {
  const amounts = lines.map((line) => amountText(line.amount)).filter(Boolean);
  const list =
    amounts.length === 0
      ? "—"
      : amounts.length === 1
        ? amounts[0]
        : amounts.length === 2
          ? `${amounts[0]} and ${amounts[1]}`
          : `${amounts.slice(0, -1).join(", ")}, and ${amounts.at(-1)}`;
  return `The disbursement amounts were updated to ${list}.`;
}

export function DisbursementModification() {
  const { applications, updateApplication } = useStore();
  const ops = useOps();
  const [loanNumber, setLoanNumber] = useState("");
  const [loanId, setLoanId] = useState<string | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [miss, setMiss] = useState(false);
  const [notice, setNotice] = useState("");
  const loanOptions = useMemo(
    () => applications.map((item) => ({ id: item.id, label: item.id })).sort((a, b) => a.label.localeCompare(b.label)),
    [applications],
  );
  const application = applications.find((item) => item.id === loanId) ?? null;
  const borrowerStatus = application?.underwriting.borrowerStatus ?? "";
  const statusOptions = BORROWER_STATUSES.includes(borrowerStatus)
    ? BORROWER_STATUSES
    : [borrowerStatus, ...BORROWER_STATUSES];

  function onLoanQuery(next: string) {
    const needle = next.trim();
    const match = applications.find((item) => item.id === needle);
    setLoanNumber(next);
    setNotice("");
    setMiss(Boolean(needle) && !match && !applications.some((item) => item.id.includes(needle)));
    if (!match) {
      setLoanId(null);
      setLines([]);
      return;
    }
    if (match.id === loanId) return;
    setLoanId(match.id);
    setLines(linesFor(match.id));
  }

  function updateLine(id: string, patch: Partial<Line>) {
    setLines((current) => current.map((line) => (line.id === id ? { ...line, ...patch } : line)));
    setNotice("");
  }

  function addLine() {
    setLines((current) => [...current, { id: `new-${Date.now()}`, date: "", amount: "", status: "SCHEDULED" }]);
    setNotice("");
  }

  function setBorrowerStatus(next: string) {
    if (!application) return;
    updateApplication(application.id, {
      underwriting: { ...application.underwriting, borrowerStatus: next },
    });
    setNotice("");
  }

  function submit(event: { preventDefault: () => void }) {
    event.preventDefault();
    if (!application) return;
    savedLines.set(application.id, lines.map((line) => ({ ...line })));
    updateApplication(application.id, {
      disbursementHistory: nextDisbursementHistory(application.disbursementHistory ?? [], lines),
    });
    ops.addApplicationFeedNote(application.id, CURRENT_USER, disbursementNote(lines));
    setNotice("Disbursement changes saved.");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-lg overflow-auto p-xl">
      <ComboSearch
        value={loanNumber}
        field="loan-number"
        fields={LOAN_FIELDS}
        options={loanOptions}
        placeholder="Search loan number"
        matchWidth
        onChange={onLoanQuery}
        onFieldChange={() => {}}
      />
      {miss ? <p className="text-sm text-gray-medium">No loan matches that number.</p> : null}
      {application ? (
        <form className="flex flex-col gap-lg" onSubmit={submit}>
          <div className="grid grid-cols-2 gap-lg">
            <FloatInput label="School Approved Loan Amount" value={String(application.amount)} readOnly />
            <FloatInput label="Underwriter Approved Loan Amount" value={String(application.amount)} readOnly />
          </div>
          <Select
            variant="float"
            label="Borrower Status"
            aria-label="Borrower Status"
            value={borrowerStatus}
            options={statusOptions}
            onChange={setBorrowerStatus}
          />
          <table className="uw-data-table uw-data-table-bleed">
            <thead>
              <tr>
                <th className="w-16">Seq</th>
                <th>Disbursement Date</th>
                <th>Disbursement Amount</th>
                <th>Disbursement Status</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, index) => (
                <tr key={line.id}>
                  <td>{index + 1}</td>
                  <td>
                    <input
                      className="uw-input h-[34px] w-full"
                      aria-label={`Disbursement date ${index + 1}`}
                      value={line.date}
                      placeholder="MM/DD/YYYY"
                      onChange={(event) => updateLine(line.id, { date: event.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      className="uw-input h-[34px] w-full"
                      aria-label={`Disbursement amount ${index + 1}`}
                      inputMode="decimal"
                      value={line.amount}
                      onChange={(event) => updateLine(line.id, { amount: event.target.value })}
                    />
                  </td>
                  <td>
                    <Select
                      variant="box"
                      aria-label={`Disbursement status ${index + 1}`}
                      value={line.status}
                      options={LINE_STATUSES}
                      triggerClassName="h-[34px] py-0 text-sm"
                      onChange={(status) => updateLine(line.id, { status: status as LineStatus })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-end gap-sm">
            <Button variant="secondary" type="button" onClick={addLine}>
              Add new disbursement
            </Button>
            <Button type="submit">
              Submit
            </Button>
          </div>
          {notice ? <p className="text-center text-sm text-gray-medium">{notice}</p> : null}
        </form>
      ) : null}
    </div>
  );
}
