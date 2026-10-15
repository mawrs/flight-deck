"use client";

import { useMemo, useState } from "react";
import { DataTable, DataTableScroll } from "@/components";
import { Select } from "@/components/ui/Dropdown";
import { ELFI_CHECKS, ELFI_CHECKS_AS_OF, isOverdueCheck } from "@/lib/elfi-checks";
import { money } from "@/lib/format";

const HEADERS = [
  "External Check Number",
  "Issue Date",
  "Pay To",
  "Memo Info",
  "Status",
  "Employee",
  "Days After Issued",
  "Check Amount",
];

const DAY_FILTERS = [
  { id: "all", label: "Days category" },
  { id: "over-30", label: "Over 30 days" },
  { id: "0-30", label: "0 – 30 days" },
];

export function OutstandingElfiChecks() {
  const [days, setDays] = useState("all");

  const rows = useMemo(() => {
    return ELFI_CHECKS.filter((row) => {
      if (days === "over-30") return isOverdueCheck(row);
      if (days === "0-30") return !isOverdueCheck(row);
      return true;
    }).sort((a, b) => Number(isOverdueCheck(b)) - Number(isOverdueCheck(a)) || b.days - a.days || a.number.localeCompare(b.number));
  }, [days]);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="uw-edmed-header">
        <div className="flex items-center justify-between gap-md">
          <div className="w-[240px]">
            <Select aria-label="Days category" value={days} options={DAY_FILTERS} onChange={setDays} />
          </div>
          <p className="text-sm text-gray-medium">As of {ELFI_CHECKS_AS_OF}</p>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="uw-list-empty">
          {days === "over-30" ? "No outstanding checks are over 30 days." : "No outstanding checks match that filter."}
        </p>
      ) : (
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
              {rows.map((row) => {
                const overdue = isOverdueCheck(row);
                return (
                  <tr key={row.number}>
                    <td className="uw-list-td">{row.number}</td>
                    <td className="uw-list-td">{row.issued}</td>
                    <td className="uw-list-td">{row.payTo}</td>
                    <td className="uw-list-td">{row.memo}</td>
                    <td className="uw-list-td">{row.status}</td>
                    <td className="uw-list-td">{row.employee}</td>
                    <td className="uw-list-td">
                      <span className="inline-flex items-center gap-2">
                        {row.days}
                        {overdue ? <span className="uw-edmed-today-tag">Over 30 days</span> : null}
                      </span>
                    </td>
                    <td className="uw-list-td">{money(row.amount)}</td>
                  </tr>
                );
              })}
            </tbody>
          </DataTable>
        </DataTableScroll>
      )}
    </div>
  );
}
