import * as XLSX from "xlsx";
import { calculate } from "../calculations";
import { money, titleCase } from "../format";
import type { Application } from "../types";

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function exportWorkbook(application: Application) {
  const calc = calculate(application);
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ["Underwriting Audit Package"],
      [],
      ["Application ID", application.id],
      ["Opportunity", application.opportunityName],
      ["Borrower", application.borrower.fullName],
      ["Record type", application.recordType],
      ["Stage / status", `${application.stage} / ${application.status}`],
      ["Requested amount", money(application.amount)],
      ["Requested term", application.requestedTerm],
      ["Rate type", application.requestedRateType],
      ["Underwriter", application.underwriter],
      ["Primary decision", application.decision || "—"],
      ["Submitted at", application.submittedAt || "—"],
      ["Senior decision", application.seniorDecision || "—"],
      ["Senior notes", application.seniorNotes || "—"],
    ]),
    "Summary",
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ["Name", "Kind", "Type", "File", "Uploaded", "Status", "Reviewed", "Note"],
      ...application.documents.map((doc) => [
        doc.name,
        doc.kind,
        doc.typeLabel,
        doc.fileName,
        doc.uploadedAt,
        doc.reviewStatus,
        doc.reviewedAt || "",
        doc.note,
      ]),
    ]),
    "Documents",
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      [
        "Selected",
        "Lender",
        "Source account",
        "Adj. creditor",
        "Adj. account",
        "Adj. loan identifier",
        "Source balance",
        "Adj. balance",
        "Lender address",
        "Payoff type",
        "Confirmed",
        "Source",
      ],
      ...application.liabilities.map((item) => [
        item.selected ? "Y" : "N",
        item.lender,
        item.accountNumber,
        item.adjCreditorName,
        item.adjAccountNumber,
        item.adjLoanIdentifier,
        item.balance,
        item.adjBalance,
        item.selectedAddress,
        item.payoffType,
        item.confirmed ? "Y" : "N",
        item.source,
      ]),
    ]),
    "Payoffs",
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ["Field", "Value"],
      ["Frequency", application.income.selectedFrequency],
      ["Gross pay", application.income.grossPay],
      ["Hours", application.income.hours],
      ["Pay periods", application.income.payPeriods],
      ["Variable YTD", application.income.variableYtd],
      ["Variable pay periods", application.income.variablePayPeriods],
      ["Prior year income", application.income.priorYearIncome],
      ["Housing payment", application.income.housingPayment],
      ["Estimated new payment", application.income.estimatedNewPayment],
      ["Monthly base income", calc.monthlyBaseIncome],
      ["Monthly variable income", calc.monthlyVariableIncome],
      ["Monthly income", calc.monthlyIncome],
      ["Annualized income", calc.annualizedIncome],
      ["Selected payoff total", calc.selectedPayoffTotal],
      ["Remaining monthly debt", calc.remainingMonthlyDebt],
      ["Borrower debt", calc.borrowerDebt],
      ["Qualifying monthly debt", calc.qualifyingMonthlyDebt],
      ["DTI", calc.dti == null ? "" : calc.dti],
    ]),
    "Income & DTI",
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ["Lender", "Category", "Type", "Payment", "Sys Pmt", "Adj Pmt", "Balance", "Original Balance", "Reported", "ECOA", "In DTI"],
      ...application.debtTrades.map((trade) => [
        trade.lender,
        trade.category,
        trade.accountType,
        trade.payment,
        trade.sysPayment ?? trade.payment,
        trade.adjPayment ?? trade.payment,
        trade.balance,
        trade.originalBalance ?? trade.highCredit,
        trade.reportedAt ?? "",
        trade.ecoa ?? "",
        trade.includeInDti ? "Y" : "N",
      ]),
    ]),
    "Debt Trades",
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ["Topic", "Note"],
      ...Object.entries(application.notes).map(([key, value]) => [
        titleCase(key),
        value,
      ]),
    ]),
    "Notes",
  );

  const output = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  downloadBlob(
    `UW-Audit-${application.id}.xlsx`,
    new Blob([output], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
  );
}

export function exportLiabilities(application: Application) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      [
        "Creditor Name",
        "Type",
        "Description",
        "Payment",
        "Sys Pmt",
        "Adj Pmt",
        "Balance",
        "Original Balance",
        "Reported",
        "ECOA",
        "In DTI",
      ],
      ...application.debtTrades.map((trade) => [
        trade.lender,
        trade.accountType,
        trade.category,
        trade.includeInDti ? trade.payment : "",
        trade.sysPayment ?? trade.payment,
        trade.adjPayment ?? trade.payment,
        trade.balance,
        trade.originalBalance ?? trade.highCredit,
        trade.reportedAt ?? "",
        trade.ecoa ?? "",
        trade.includeInDti ? "Y" : "N",
      ]),
    ]),
    "Liabilities",
  );
  const output = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  downloadBlob(
    `Liabilities-${application.id}.xlsx`,
    new Blob([output], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
  );
}
