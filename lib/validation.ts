import { calculate } from "./calculations";
import type { Application } from "./types";

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export function submissionChecklist(application: Application): ChecklistItem[] {
  const calc = calculate(application);
  const requiredDocs = application.documents.filter((doc) =>
    ["identity", "credit-report", "degree", "pay-stub"].includes(doc.kind),
  );
  const docsReviewed = requiredDocs.every(
    (doc) =>
      doc.reviewStatus === "approved" ||
      doc.reviewStatus === "rejected" ||
      doc.reviewStatus === "incomplete",
  );
  const blockedDocs = application.documents.filter(
    (doc) => doc.reviewStatus === "incomplete" || doc.reviewStatus === "rejected",
  );
  const selected = application.liabilities.filter((item) => item.selected);
  const unconfirmed = selected.filter((item) => !item.confirmed);

  return [
    {
      id: "docs",
      label: "Identity, credit report, degree, and pay stubs have been reviewed",
      done: docsReviewed && requiredDocs.length > 0,
    },
    {
      id: "blocked-docs",
      label: "No documents marked incomplete or rejected (or file is set to needs documentation)",
      done: blockedDocs.length === 0 || application.decision === "needs-docs",
    },
    {
      id: "payoffs",
      label: "Selected loan payoffs are confirmed against source documents",
      done: selected.length > 0 && unconfirmed.length === 0,
    },
    {
      id: "income",
      label: "Monthly income has been calculated from documented pay",
      done: calc.monthlyIncome > 0,
    },
    {
      id: "notes-income",
      label: "Income observation is documented",
      done: application.notes.income.trim().length > 0,
    },
    {
      id: "notes-credit",
      label: "Credit score / FICO observations are documented",
      done:
        application.notes.creditScore.trim().length > 0 &&
        application.notes.fico.trim().length > 0,
    },
    {
      id: "notes-degree",
      label: "Degree observation is documented",
      done: application.notes.degree.trim().length > 0,
    },
    {
      id: "workbook",
      label: "Completed underwriting workbook is attached to the file",
      done: Boolean(application.workbookFileName),
    },
    {
      id: "decision",
      label: "Primary underwriter decision is selected",
      done: application.decision !== "",
    },
  ];
}

export function canSubmitToSenior(application: Application): boolean {
  return submissionChecklist(application).every((item) => item.done);
}

export function progress(application: Application): {
  complete: number;
  total: number;
  percent: number;
} {
  const items = submissionChecklist(application);
  const complete = items.filter((item) => item.done).length;
  return {
    complete,
    total: items.length,
    percent: Math.round((complete / items.length) * 100),
  };
}
