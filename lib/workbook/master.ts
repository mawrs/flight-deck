import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { monthlyFromFrequency } from "../calculations/income";
import type { IncomeFrequency } from "../types";

export const WORKBOOK_FREQUENCIES = [
  "annual",
  "monthly",
  "semi-monthly",
  "biweekly",
  "weekly",
  "hourly",
] as const;

export const PAYOFF_ROWS = 10;

export type WorkbookValues = Record<string, string>;

export interface WorkbookField {
  id: string;
  kind: "text" | "number" | "select" | "computed";
  options?: readonly string[];
}

export type GridCell =
  | { kind: "empty" }
  | { kind: "label"; text: string; strong?: boolean }
  | { kind: "title"; text: string }
  | { kind: "note"; text: string }
  | { kind: "field"; field: WorkbookField };

export interface WorkbookSheet {
  id: string;
  name: string;
  columns: string[];
  rows: GridCell[][];
}

function field(id: string, kind: WorkbookField["kind"] = "text", options?: readonly string[]): GridCell {
  return { kind: "field", field: { id, kind, options } };
}

function label(text: string, strong = false): GridCell {
  return { kind: "label", text, strong };
}

function empty(): GridCell {
  return { kind: "empty" };
}

export const MASTER_SHEETS: WorkbookSheet[] = [
  {
    id: "calculator",
    name: "Calculator",
    columns: ["A", "B", "C", "D"],
    rows: [
      [{ kind: "title", text: "ELFI Underwriting Calculator" }, empty(), empty(), empty()],
      [
        { kind: "note", text: "Master template — make a copy before entering file data. Do not type in the master." },
        empty(),
        empty(),
        empty(),
      ],
      [empty(), empty(), empty(), empty()],
      [label("Income", true), empty(), empty(), empty()],
      [label("Gross pay per period"), field("grossPay", "number"), label("Frequency"), field("frequency", "select", WORKBOOK_FREQUENCIES)],
      [label("Hours (hourly only)"), field("hours", "number"), empty(), empty()],
      [label("Monthly income"), field("monthlyIncome", "computed"), empty(), empty()],
      [label("Stated annual income"), field("statedAnnual", "number"), empty(), empty()],
      [label("Annualized verified"), field("annualized", "computed"), empty(), empty()],
      [label("Variance"), field("variance", "computed"), empty(), empty()],
      [empty(), empty(), empty(), empty()],
      [label("DTI", true), empty(), empty(), empty()],
      [label("Housing payment"), field("housing", "number"), empty(), empty()],
      [label("Remaining monthly debt"), field("remainingDebt", "number"), empty(), empty()],
      [label("Estimated new payment"), field("newPayment", "number"), empty(), empty()],
      [label("Qualifying monthly debt"), field("qualifyingDebt", "computed"), empty(), empty()],
      [label("DTI"), field("dti", "computed"), empty(), empty()],
    ],
  },
  {
    id: "application",
    name: "Application",
    columns: ["A", "B", "C", "D"],
    rows: [
      [{ kind: "title", text: "Application cross-check" }, empty(), empty(), empty()],
      [
        { kind: "note", text: "Enter LOS values here. Compare against the file in the other window." },
        empty(),
        empty(),
        empty(),
      ],
      [empty(), empty(), empty(), empty()],
      [label("Loan ID"), field("loanId"), label("Product"), field("product")],
      [label("Borrower name"), field("borrowerName"), label("FICO"), field("fico", "number")],
      [label("Date of birth"), field("dob"), label("Filing status"), field("filingStatus")],
      [label("Email"), field("email"), label("Employment"), field("employment")],
      [label("Permanent address"), field("address"), label("Living arrangement"), field("living")],
      [label("School"), field("school"), label("Highest degree"), field("degree")],
      [label("Loan amount"), field("loanAmount", "number"), label("Requested term"), field("term")],
      [label("Cosigner"), field("hasCosigner"), label("Cosigner name"), field("cosignerName")],
      [label("Cosigner email"), field("cosignerEmail"), empty(), empty()],
    ],
  },
  {
    id: "payoffs",
    name: "Payoffs",
    columns: ["A", "B", "C", "D", "E", "F"],
    rows: [
      [{ kind: "title", text: "Selected loan payoffs" }, empty(), empty(), empty(), empty(), empty()],
      [
        { kind: "note", text: "Type creditor, identifier, account, balance, and address from the servicer statement." },
        empty(),
        empty(),
        empty(),
        empty(),
        empty(),
      ],
      [empty(), empty(), empty(), empty(), empty(), empty()],
      [
        label("Adj creditor", true),
        label("Loan identifier", true),
        label("Account number", true),
        label("Adj balance", true),
        label("Lender address", true),
        label("Payoff type", true),
      ],
      ...Array.from({ length: PAYOFF_ROWS }, (_, index) => [
        field(`payoff.${index}.creditor`),
        field(`payoff.${index}.identifier`),
        field(`payoff.${index}.account`),
        field(`payoff.${index}.balance`, "number"),
        field(`payoff.${index}.address`),
        field(`payoff.${index}.type`, "select", ["full", "partial"]),
      ]),
      [empty(), empty(), empty(), empty(), empty(), empty()],
      [label("Total amount to be paid off", true), empty(), empty(), field("payoffTotal", "computed"), empty(), empty()],
    ],
  },
  {
    id: "notes",
    name: "Notes",
    columns: ["A", "B"],
    rows: [
      [{ kind: "title", text: "Underwriter observations" }, empty()],
      [empty(), empty()],
      [label("Income"), field("noteIncome")],
      [label("Credit / FICO"), field("noteCredit")],
      [label("Degree"), field("noteDegree")],
      [label("Documentation"), field("noteDocs")],
      [label("Payoff"), field("notePayoff")],
      [label("General"), field("noteGeneral")],
    ],
  },
];

function num(values: WorkbookValues, id: string) {
  return Number(values[id]) || 0;
}

export function computedValue(id: string, values: WorkbookValues): string {
  const monthly = monthlyFromFrequency(
    (values.frequency || "biweekly") as IncomeFrequency,
    num(values, "grossPay"),
    num(values, "hours"),
  );
  const annualized = monthly * 12;
  const stated = num(values, "statedAnnual");
  const qualifying = num(values, "housing") + num(values, "remainingDebt") + num(values, "newPayment");
  const payoffTotal = Array.from({ length: PAYOFF_ROWS }, (_, index) => num(values, `payoff.${index}.balance`)).reduce(
    (sum, value) => sum + value,
    0,
  );

  switch (id) {
    case "monthlyIncome":
      return monthly ? monthly.toFixed(2) : "";
    case "annualized":
      return annualized ? annualized.toFixed(2) : "";
    case "variance":
      if (!stated || !annualized) return "";
      return `${(((annualized - stated) / stated) * 100).toFixed(2)}%`;
    case "qualifyingDebt":
      return qualifying ? qualifying.toFixed(2) : "";
    case "dti":
      if (!monthly || !qualifying) return "";
      return `${((qualifying / monthly) * 100).toFixed(2)}%`;
    case "payoffTotal":
      return payoffTotal ? payoffTotal.toFixed(2) : "";
    default:
      return values[id] ?? "";
  }
}

export function displayValue(field: WorkbookField, values: WorkbookValues) {
  if (field.kind === "computed") return computedValue(field.id, values);
  return values[field.id] ?? "";
}

export function emptyWorkbookValues(): WorkbookValues {
  return { frequency: "biweekly" };
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function buildMasterXlsx(values: WorkbookValues, title = "ELFI Underwriting Master") {
  const wb = XLSX.utils.book_new();
  for (const sheet of MASTER_SHEETS) {
    const aoa = sheet.rows.map((row) =>
      row.map((cell) => {
        if (cell.kind === "title" || cell.kind === "note" || cell.kind === "label") return cell.text;
        if (cell.kind === "field") return displayValue(cell.field, values);
        return "";
      }),
    );
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = sheet.columns.map(() => ({ wch: 28 }));
    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
  }
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      [title],
      ["This file is a working copy of the ELFI underwriting master."],
      ["Enter LOS values, then download XLS and PDF and upload the completed workbook back to the file."],
    ]),
    "About",
  );
  return wb;
}

export function downloadWorkbookXlsx(values: WorkbookValues, fileId: string, copied: boolean) {
  const wb = buildMasterXlsx(values, copied ? `Working copy · ${fileId}` : "ELFI Underwriting Master");
  const output = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  downloadBlob(
    copied ? `UW-Workbook-${fileId}.xlsx` : "ELFI-UW-Master.xlsx",
    new Blob([output], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
  );
}

export function downloadWorkbookPdf(values: WorkbookValues, fileId: string, copied: boolean) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  doc.setFontSize(16);
  doc.text(copied ? `Underwriting workbook · ${fileId}` : "ELFI Underwriting Master", 40, 48);
  doc.setFontSize(10);
  doc.text(copied ? "Working copy" : "Read-only master template", 40, 66);

  let startY = 88;
  for (const sheet of MASTER_SHEETS) {
    const body = sheet.rows
      .map((row) =>
        row.map((cell) => {
          if (cell.kind === "title" || cell.kind === "note" || cell.kind === "label") return cell.text;
          if (cell.kind === "field") return displayValue(cell.field, values);
          return "";
        }),
      )
      .filter((row) => row.some((cell) => cell));
    autoTable(doc, {
      startY,
      head: [[sheet.name, ...sheet.columns.slice(1).map(() => "")]],
      body,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [23, 121, 186] },
    });
    startY = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? startY) + 18;
  }

  doc.save(copied ? `UW-Workbook-${fileId}.pdf` : "ELFI-UW-Master.pdf");
}
