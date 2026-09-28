import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { calculate } from "../calculations";
import { money, percent, titleCase } from "../format";
import type { Application } from "../types";

export function exportPdf(application: Application) {
  const calc = calculate(application);
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const borrower = application.borrower.fullName;

  doc.setFontSize(16);
  doc.text("Underwriting Audit Package", 40, 48);
  doc.setFontSize(10);
  doc.text(`${borrower}  •  Application ${application.id}`, 40, 68);
  doc.text(
    `Status: ${application.status}  •  Decision: ${application.decision || "—"}`,
    40,
    84,
  );

  autoTable(doc, {
    startY: 100,
    head: [["Field", "Value"]],
    body: [
      ["Opportunity", application.opportunityName],
      ["Record type", application.recordType],
      ["Requested amount", money(application.amount)],
      ["Term / type", `${application.requestedTerm} / ${application.requestedRateType}`],
      ["Underwriter", application.underwriter],
      ["Credit score / FICO", `${application.borrower.creditScore} / ${application.borrower.fico}`],
      ["Degree", application.borrower.degree],
      ["Submitted at", application.submittedAt || "—"],
      ["Senior decision", application.seniorDecision || "—"],
    ],
    styles: { fontSize: 8 },
    headStyles: { fillColor: [30, 64, 124] },
  });

  autoTable(doc, {
    head: [["Document", "Kind", "Status", "Note"]],
    body: application.documents.map((item) => [
      item.name,
      item.kind,
      item.reviewStatus,
      item.note || "",
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [30, 64, 124] },
  });

  autoTable(doc, {
    head: [["Sel", "Lender", "Adj. account", "Source bal", "Adj. bal", "Type"]],
    body: application.liabilities.map((item) => [
      item.selected ? "Y" : "",
      item.lender,
      item.adjAccountNumber,
      money(item.balance),
      money(item.adjBalance),
      item.payoffType,
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [30, 64, 124] },
  });

  autoTable(doc, {
    head: [["Calculation", "Result"]],
    body: [
      ["Monthly income", money(calc.monthlyIncome)],
      ["Selected payoff total", money(calc.selectedPayoffTotal)],
      ["Remaining monthly debt", money(calc.remainingMonthlyDebt)],
      ["Housing", money(calc.housingPayment)],
      ["Borrower debt", money(calc.borrowerDebt)],
      ["Est. new payment", money(calc.estimatedNewPayment)],
      ["DTI", percent(calc.dti)],
    ],
    styles: { fontSize: 8 },
    headStyles: { fillColor: [30, 64, 124] },
  });

  autoTable(doc, {
    head: [["Note", "Observation"]],
    body: Object.entries(application.notes).map(([key, value]) => [
      titleCase(key),
      value || "—",
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [30, 64, 124] },
    columnStyles: { 1: { cellWidth: 420 } },
  });

  if (application.seniorNotes) {
    autoTable(doc, {
      head: [["Senior underwriter notes"]],
      body: [[application.seniorNotes]],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [120, 53, 15] },
    });
  }

  doc.save(`UW-Audit-${application.id}.pdf`);
}
