"use client";

import { useEffect, useState } from "react";
import { DataTable, DataTableScroll } from "@/components";
import { CURRENT_USER } from "@/lib/mentions";
import { servicingReportHref } from "@/lib/loan-routes";
import {
  updateChangeValue,
  useChangeTransactions,
  type ChangeTransaction,
  type ChangeValueField,
} from "@/lib/change-transactions";
import { useOps } from "@/lib/ops-store";

const HEADERS = [
  "Borrower SSN",
  "Borrower Last Name",
  "Borrower First Name",
  "CL Unique ID",
  "Change Date",
  "Action",
  "Change Field Name",
  "Previous Value",
  "New Value",
  "Requested Amount",
];

const VALUE_LABEL: Record<ChangeValueField, string> = {
  previous: "Previous Value",
  next: "New Value",
  requested: "Requested Amount",
};

export function ChangeTransactions() {
  const rows = useChangeTransactions();
  const ops = useOps();

  function commit(row: ChangeTransaction, field: ChangeValueField, value: string) {
    const updated = updateChangeValue(row.id, field, value);
    if (!updated) return;
    const from = updated.from || "blank";
    const to = value || "blank";
    ops.addNotification({
      kind: "change",
      actor: CURRENT_USER,
      body: `${row.firstName} ${row.lastName} — ${VALUE_LABEL[field]} for ${row.field} changed from ${from} to ${to}.`,
      href: servicingReportHref("change-transactions"),
    });
  }

  return (
    <DataTableScroll className="uw-list-scroll">
      <DataTable density="compact" className="uw-list-table uw-opp-table">
        <thead className="sticky top-0 z-10">
          <tr>
            {HEADERS.map((label) => (
              <th key={label} className="uw-list-th">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="uw-list-td">{row.ssn}</td>
              <td className="uw-list-td">{row.lastName}</td>
              <td className="uw-list-td">{row.firstName}</td>
              <td className="uw-list-td">{row.clUniqueId}</td>
              <td className="uw-list-td">{row.changeDate}</td>
              <td className="uw-list-td">{row.action}</td>
              <td className="uw-list-td">{row.field}</td>
              <td className="uw-list-td">
                <ValueInput row={row} field="previous" onCommit={commit} />
              </td>
              <td className="uw-list-td">
                <ValueInput row={row} field="next" onCommit={commit} />
              </td>
              <td className="uw-list-td">
                <ValueInput row={row} field="requested" onCommit={commit} />
              </td>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </DataTableScroll>
  );
}

function ValueInput({
  row,
  field,
  onCommit,
}: {
  row: ChangeTransaction;
  field: ChangeValueField;
  onCommit: (row: ChangeTransaction, field: ChangeValueField, value: string) => void;
}) {
  const value = row[field];
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  return (
    <input
      className="uw-input h-[34px] w-full min-w-[9rem]"
      aria-label={`${VALUE_LABEL[field]} for ${row.field}`}
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => onCommit(row, field, draft)}
    />
  );
}
