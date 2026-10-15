import { DataTable, DataTableScroll } from "@/components";
import { EDMED_BOARDED_AS_OF, EDMED_BOARDED_LOANS, EDMED_BOARDED_MONTHS } from "@/lib/edmed-boarded";
import { money } from "@/lib/format";

const LOAN_HEADERS = [
  "Loan Number",
  "Loan Type",
  "Loan Servicer",
  "Application Status ID",
  "Successful Board Date",
  "Loan Amount",
];

function blank(value: string | null) {
  return value ?? "Null";
}

export function EdMedBoardedLoans() {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="uw-edmed-header">
        <div className="flex items-baseline justify-between gap-sm">
          <p className="text-sm font-semibold text-gray-dark">Successful board month</p>
          <p className="text-sm text-gray-medium">As of {EDMED_BOARDED_AS_OF}</p>
        </div>
        <dl className="uw-edmed-stats uw-edmed-stats-board">
          {EDMED_BOARDED_MONTHS.map((row) => (
            <div key={row.month ?? "none"}>
              <dt>{row.month ?? "No board date"}</dt>
              <dd>{row.count.toLocaleString("en-US")}</dd>
              <dd>{money(row.amount)}</dd>
            </div>
          ))}
        </dl>
      </div>
      <DataTableScroll className="uw-list-scroll">
        <DataTable density="compact" className="uw-list-table uw-opp-table">
          <thead className="sticky top-0 z-10">
            <tr>
              {LOAN_HEADERS.map((label) => (
                <th key={label} className="uw-list-th">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {EDMED_BOARDED_LOANS.map((row) => (
              <tr key={row.loanNumber}>
                <td className="uw-list-td">{row.loanNumber}</td>
                <td className="uw-list-td">{row.loanType}</td>
                <td className="uw-list-td">{blank(row.servicer)}</td>
                <td className="uw-list-td">{row.applicationStatusId}</td>
                <td className="uw-list-td">{row.boardDate ?? "No board date"}</td>
                <td className="uw-list-td">{money(row.amount)}</td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </DataTableScroll>
    </div>
  );
}
