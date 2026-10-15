"use client";

import { useMemo, useState } from "react";
import { DataTable, DataTableScroll, SearchField } from "@/components";
import { Select } from "@/components/ui/Dropdown";
import {
  INSCHOOL_DISBURSEMENTS,
  reportDate,
  reportDateTime,
  type InSchoolDisbursementRow,
} from "@/lib/inschool-disbursements";
import { money } from "@/lib/format";

const HEADERS = [
  "Loan Number",
  "Update Date",
  "Last Name",
  "First Name",
  "School Certification Completed Date",
  "Term Months Approved",
  "Rate Type Approved",
  "Rate Approved",
  "Original Loan Amount",
  "Revised Loan Amount",
  "Is Modified Loan Amount",
  "Estimated Financial Assistance Amount",
];

function unique(values: string[]) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function cells(row: InSchoolDisbursementRow) {
  return [
    row.loanNumber,
    reportDateTime(row.updatedAt),
    row.lastName,
    row.firstName,
    reportDate(row.certifiedAt),
    String(row.termMonths),
    row.rateType,
    `${row.rate.toFixed(2)}%`,
    money(row.originalAmount),
    money(row.revisedAmount),
    row.modified ? "True" : "False",
    money(row.estimatedAssistance),
  ];
}

export function InSchoolDisbursements() {
  const [query, setQuery] = useState("");
  const [school, setSchool] = useState("all");
  const [status, setStatus] = useState("all");
  const [currentYear, setCurrentYear] = useState("true");
  const [disbursementDate, setDisbursementDate] = useState("all");

  const schools = unique(INSCHOOL_DISBURSEMENTS.map((row) => row.school));
  const statuses = unique(INSCHOOL_DISBURSEMENTS.map((row) => row.loanStatus));
  const dates = unique(INSCHOOL_DISBURSEMENTS.map((row) => row.disbursementDate));

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return INSCHOOL_DISBURSEMENTS.filter((row) => {
      if (school !== "all" && row.school !== school) return false;
      if (status !== "all" && row.loanStatus !== status) return false;
      if (currentYear === "true" && !row.currentYear) return false;
      if (currentYear === "false" && row.currentYear) return false;
      if (disbursementDate !== "all" && row.disbursementDate !== disbursementDate) return false;
      if (!needle) return true;
      return [row.loanNumber, row.lastName, row.firstName, row.school, row.loanStatus, row.rateType]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [currentYear, disbursementDate, query, school, status]);

  const certified = rows.length;
  const disbursed = rows.filter((row) => row.disbursed).length;
  const average =
    certified === 0
      ? "—"
      : `${(rows.reduce((sum, row) => sum + row.daysToCertification, 0) / certified).toFixed(2)} days`;

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
            label="Search In-School disbursements"
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
            aria-label="Current Year Disbursement"
            value={currentYear}
            options={[
              { id: "all", label: "Current Year Disbursement" },
              { id: "true", label: "True" },
              { id: "false", label: "False" },
            ]}
            onChange={setCurrentYear}
          />
          <Select
            aria-label="Disbursement Date"
            value={disbursementDate}
            options={[
              { id: "all", label: "Disbursement Date" },
              ...dates.map((item) => ({ id: item, label: reportDate(item) })),
            ]}
            onChange={setDisbursementDate}
          />
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="uw-list-empty">No In-School disbursements match those filters.</p>
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
              {rows.map((row) => (
                <tr key={row.loanNumber}>
                  {cells(row).map((value, index) => (
                    <td key={HEADERS[index]} className="uw-list-td">
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </DataTable>
        </DataTableScroll>
      )}
    </div>
  );
}
