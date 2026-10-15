"use client";

import { useMemo, useState } from "react";
import { DataTable, DataTableScroll, SearchField } from "@/components";
import { Select } from "@/components/ui/Dropdown";
import {
  EDMED_DISBURSEMENTS,
  reportDate,
  scheduledToday,
  sortEdMedRows,
  type EdMedDisbursementLine,
  type EdMedDisbursementRow,
} from "@/lib/edmed-disbursements";
import { money } from "@/lib/format";

const HEADERS = [
  "Loan Number",
  "Update Date",
  "Last Name",
  "First Name",
  "School Certification Completed Date",
  "Term Months Approved",
  "Rate Approved %",
  "Rate Type Approved",
  "Original Loan Amount",
  "Revised Loan Amount",
  "Disbursement Date 1",
  "Disbursement Amount 1",
  "Disbursement Status 1",
  "Fund Release Date 1",
  "Disbursement Date 2",
  "Disbursement Amount 2",
  "Disbursement Status 2",
  "Fund Release Date 2",
  "Disbursement Date 3",
  "Disbursement Amount 3",
  "Disbursement Status 3",
  "Fund Release Date 3",
];

function unique(values: string[]) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function amountCell(value: number | null) {
  return value == null ? "Null" : money(value);
}

function textCell(value: string | null) {
  return value || "Null";
}

function lineCells(line: EdMedDisbursementLine) {
  return [reportDate(line.date), amountCell(line.amount), textCell(line.status), reportDate(line.fundRelease)];
}

function cells(row: EdMedDisbursementRow) {
  return [
    row.loanNumber,
    reportDate(row.updatedAt),
    row.lastName,
    row.firstName,
    reportDate(row.certifiedAt),
    String(row.termMonths),
    `${row.rate.toFixed(2)}%`,
    row.rateType,
    money(row.originalAmount),
    money(row.revisedAmount),
    ...row.disbursements.flatMap(lineCells),
  ];
}

export function EdMedDisbursements() {
  const [query, setQuery] = useState("");
  const [school, setSchool] = useState("all");
  const [status, setStatus] = useState("all");
  const [currentYear, setCurrentYear] = useState("true");
  const [firstDate, setFirstDate] = useState("all");

  const schools = unique(EDMED_DISBURSEMENTS.map((row) => row.school));
  const statuses = unique(EDMED_DISBURSEMENTS.map((row) => row.loanStatus));
  const dates = unique(
    EDMED_DISBURSEMENTS.map((row) => row.disbursements[0].date).filter((date): date is string => Boolean(date)),
  );

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = EDMED_DISBURSEMENTS.filter((row) => {
      if (school !== "all" && row.school !== school) return false;
      if (status !== "all" && row.loanStatus !== status) return false;
      if (currentYear === "true" && !row.currentYear) return false;
      if (currentYear === "false" && row.currentYear) return false;
      if (firstDate !== "all" && row.disbursements[0].date !== firstDate) return false;
      if (!needle) return true;
      return [row.loanNumber, row.lastName, row.firstName, row.school, row.loanStatus, row.rateType]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
    return sortEdMedRows(filtered);
  }, [currentYear, firstDate, query, school, status]);

  const certified = rows.length;
  const disbursed = rows.filter((row) => row.disbursements.some((line) => line.status === "COMPLETED")).length;
  const average =
    certified === 0 ? "—" : `${(rows.reduce((sum, row) => sum + row.daysToCertification, 0) / certified).toFixed(1)} days`;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="uw-edmed-header">
        <dl className="uw-edmed-stats">
          <div>
            <dt>Number of Successful Certification</dt>
            <dd>{certified.toLocaleString("en-US")}</dd>
          </div>
          <div>
            <dt>Average time to Certification</dt>
            <dd>{average}</dd>
          </div>
          <div>
            <dt>Number of Disbursed</dt>
            <dd>{disbursed.toLocaleString("en-US")}</dd>
          </div>
        </dl>
        <div className="uw-filter-grid uw-filter-grid-queue">
          <SearchField
            label="Search EdMed disbursements"
            placeholder="Search the list..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Select
            aria-label="School Name"
            value={school}
            options={[{ id: "all", label: "School Name" }, ...schools.map((item) => ({ id: item, label: item }))]}
            onChange={setSchool}
          />
          <Select
            aria-label="Loan Status"
            value={status}
            options={[{ id: "all", label: "Loan Status" }, ...statuses.map((item) => ({ id: item, label: item }))]}
            onChange={setStatus}
          />
          <Select
            aria-label="Current Year"
            value={currentYear}
            options={[
              { id: "all", label: "Current Year" },
              { id: "true", label: "True" },
              { id: "false", label: "False" },
            ]}
            onChange={setCurrentYear}
          />
          <Select
            aria-label="1st Disbursement Date"
            value={firstDate}
            options={[
              { id: "all", label: "1st Disbursement Date" },
              ...dates.map((item) => ({ id: item, label: reportDate(item) })),
            ]}
            onChange={setFirstDate}
          />
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="uw-list-empty">No EdMed disbursements match those filters.</p>
      ) : (
        <DataTableScroll className="uw-list-scroll">
          <DataTable density="compact" className="uw-list-table uw-opp-table uw-edmed-table">
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
                const due = scheduledToday(row);
                const values = cells(row);
                return (
                  <tr key={row.loanNumber} className={due ? "uw-edmed-today" : undefined}>
                    {values.map((value, index) => (
                      <td key={HEADERS[index]} className="uw-list-td">
                        {index === 0 && due ? (
                          <span className="inline-flex items-center gap-2">
                            {value}
                            <span className="uw-edmed-today-tag">Today</span>
                          </span>
                        ) : (
                          value
                        )}
                      </td>
                    ))}
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
