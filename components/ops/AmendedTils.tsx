import { DataTable, DataTableScroll } from "@/components";

const ROWS = [
  {
    month: "October 2026",
    date: "10/5/2026",
    loanType: "IS",
    loanNumber: "1410233",
    applicationId: "523660",
  },
];

const HEADERS = ["Month of Amended Date", "Amended Date", "Loan Type", "Loan Number", "Application ID"];

export function AmendedTils() {
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
          {ROWS.map((row) => (
            <tr key={`${row.loanNumber}-${row.date}`}>
              <td className="uw-list-td">{row.month}</td>
              <td className="uw-list-td">{row.date}</td>
              <td className="uw-list-td">{row.loanType}</td>
              <td className="uw-list-td">{row.loanNumber}</td>
              <td className="uw-list-td">{row.applicationId}</td>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </DataTableScroll>
  );
}
