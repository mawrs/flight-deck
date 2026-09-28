import type { Application } from "./types";

export interface FieldChange {
  path: string;
  label: string;
  before: string;
  after: string;
}

export function seniorChanges(application: Application): FieldChange[] {
  const snapshot = application.primarySnapshot;
  if (!snapshot) return [];

  const changes: FieldChange[] = [];

  if (snapshot.decision !== application.decision) {
    changes.push({
      path: "decision",
      label: "Primary decision",
      before: snapshot.decision || "—",
      after: application.decision || "—",
    });
  }

  if (snapshot.income.grossPay !== application.income.grossPay) {
    changes.push({
      path: "income.grossPay",
      label: "Gross pay",
      before: String(snapshot.income.grossPay),
      after: String(application.income.grossPay),
    });
  }

  if (snapshot.income.selectedFrequency !== application.income.selectedFrequency) {
    changes.push({
      path: "income.frequency",
      label: "Income frequency",
      before: snapshot.income.selectedFrequency,
      after: application.income.selectedFrequency,
    });
  }

  if (snapshot.income.housingPayment !== application.income.housingPayment) {
    changes.push({
      path: "income.housing",
      label: "Housing payment",
      before: String(snapshot.income.housingPayment),
      after: String(application.income.housingPayment),
    });
  }

  for (const key of ["income", "creditScore", "degree", "fico", "documentation", "payoff", "general"] as const) {
    if (snapshot.notes[key] !== application.notes[key]) {
      changes.push({
        path: `notes.${key}`,
        label: `${key} note`,
        before: snapshot.notes[key] || "—",
        after: application.notes[key] || "—",
      });
    }
  }

  for (const current of application.liabilities) {
    const prior = snapshot.liabilities.find((item) => item.id === current.id);
    if (!prior) continue;
    if (prior.selected !== current.selected) {
      changes.push({
        path: `liability.${current.id}.selected`,
        label: `${current.lender} •${current.loanIdentifier} selected`,
        before: String(prior.selected),
        after: String(current.selected),
      });
    }
    if (prior.adjBalance !== current.adjBalance) {
      changes.push({
        path: `liability.${current.id}.adjBalance`,
        label: `${current.lender} •${current.loanIdentifier} adj. balance`,
        before: String(prior.adjBalance),
        after: String(current.adjBalance),
      });
    }
    if (prior.confirmed !== current.confirmed) {
      changes.push({
        path: `liability.${current.id}.confirmed`,
        label: `${current.lender} •${current.loanIdentifier} confirmed`,
        before: String(prior.confirmed),
        after: String(current.confirmed),
      });
    }
  }

  for (const current of application.documents) {
    const prior = snapshot.documents.find((item) => item.id === current.id);
    if (!prior) continue;
    if (prior.reviewStatus !== current.reviewStatus) {
      changes.push({
        path: `document.${current.id}.status`,
        label: `${current.name} status`,
        before: prior.reviewStatus,
        after: current.reviewStatus,
      });
    }
  }

  return changes;
}
