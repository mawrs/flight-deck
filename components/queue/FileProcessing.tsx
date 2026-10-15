"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { DataTable, DataTableScroll } from "@/components";
import { Button } from "@/components/ui/Button";
import { applicationBase } from "@/lib/loan-routes";
import { PENDING_FILES, type FileRow } from "@/lib/file-processing";
import { useOps } from "@/lib/ops-store";
import { useStore } from "@/lib/store";
import type { DisbursementHistoryLine } from "@/lib/types";

function cancellationLine(row: FileRow): DisbursementHistoryLine {
  const [year, month, day] = row.date.split("/");
  const amount = Number(row.amount) / 100;
  return {
    id: `file-${row.id}`,
    date: `${year}-${month}-${day}T12:00:00`,
    amount: String(Number.isFinite(amount) ? amount : 0),
    status: "CANCELLED",
    statusUpdatedAt: new Date().toISOString(),
  };
}

const FILE_RECORD = [
  ["Certification Type", "ELM"],
  ["Alternative Student SSN", "000000000"],
  ["Actual Returned Amount", "020000000"],
  ["CLUID", "00373500008079875"],
  ["Funds Return Code", "E"],
  ["Sequence Number", "01"],
  ["Loan Period End Date", "20270513"],
  ["Revised Disbursement Date", "00000000"],
  ["Loan Period Begin Date", "20260818"],
  ["Revised Disbursement Amount", "00000000"],
  ["Servicer Code / Lender Id", "834351"],
  ["Cancellation Date", "20261002"],
  ["Alt. Loan Program Type Code", "L86"],
  ["Cancellation Amount", "020000000"],
  ["Guarantee Date", "00000000"],
  ["Re-Instatement Indicator", "N"],
  ["Loan Type Code", "AL"],
  ["Disbursement Consumption Indicator", "Y"],
  ["Funds Return Method Code", "E"],
];

const HEADERS = [
  "Expand",
  "Record Identifier",
  "Loan Number",
  "Borrower SSN",
  "Cancellation Amt",
  "Cancellation Date",
  "Cancellation Reason",
  "School ID",
  "Status",
  "Action",
];

export function FileProcessing() {
  const ops = useOps();
  const { applications, updateApplication } = useStore();
  const [rows, setRows] = useState(PENDING_FILES);
  const [openId, setOpenId] = useState<string | null>(null);

  function loanNumber(loanId: string) {
    return ops.loans.find((loan) => loan.id === loanId)?.applicationId ?? loanId;
  }

  function approve(row: FileRow) {
    const loanNumberId = loanNumber(row.loanId);
    const application = applications.find((item) => item.id === loanNumberId);
    if (!application) return;
    const entry = cancellationLine(row);
    const history = application.disbursementHistory ?? [];
    updateApplication(application.id, {
      disbursementHistory: history.some((line) => line.id === entry.id) ? history : [...history, entry].sort((a, b) => a.date.localeCompare(b.date)),
    });
    setRows((current) => current.map((item) => (item.id === row.id ? { ...item, status: "APPROVED" } : item)));
  }

  function reject(id: string) {
    setRows((current) => current.map((item) => (item.id === id ? { ...item, status: "REJECTED" } : item)));
  }

  function toggle(id: string) {
    setOpenId((current) => (current === id ? null : id));
  }

  return (
    <DataTableScroll className="uw-list-scroll">
      <DataTable density="compact" className="uw-list-table uw-opp-table">
        <thead className="sticky top-0 z-10">
          <tr>
            {HEADERS.map((label) => (
              <th key={label} className="uw-list-th">
                {label === "Expand" ? <span className="sr-only">{label}</span> : label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const open = openId === row.id;
            const loan = loanNumber(row.loanId);
            return (
              <Fragment key={row.id}>
                <tr className="uw-list-row uw-file-row" onClick={() => toggle(row.id)}>
                  <td className="uw-list-td">
                    <button
                      type="button"
                      className="uw-btn-link"
                      aria-expanded={open}
                      aria-label={`${open ? "Collapse" : "Expand"} ${loan}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        toggle(row.id);
                      }}
                    >
                      {open ? "–" : "+"}
                    </button>
                  </td>
                  <td className="uw-list-td">{row.record}</td>
                  <td className="uw-list-td">
                    <Link
                      href={applicationBase(loan)}
                      className="uw-file-loan"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {loan}
                    </Link>
                  </td>
                  <td className="uw-list-td">{row.ssn}</td>
                  <td className="uw-list-td">{row.amount}</td>
                  <td className="uw-list-td">{row.date}</td>
                  <td className="uw-list-td">{row.reason}</td>
                  <td className="uw-list-td">{row.school}</td>
                  <td className="uw-list-td">{row.status}</td>
                  <td className="uw-list-td">
                    {row.status === "PENDING" ? (
                      <div className="flex items-center gap-sm whitespace-nowrap">
                        <Button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            approve(row);
                          }}
                        >
                          Approve
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={(event) => {
                            event.stopPropagation();
                            reject(row.id);
                          }}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : null}
                  </td>
                </tr>
                {open ? (
                  <tr className="uw-file-detail">
                    <td className="uw-list-td" colSpan={HEADERS.length}>
                      <dl className="uw-file-record">
                        {FILE_RECORD.map(([label, value]) => (
                          <div key={label}>
                            <dt>{label}</dt>
                            <dd>{value}</dd>
                          </div>
                        ))}
                      </dl>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </DataTable>
    </DataTableScroll>
  );
}
