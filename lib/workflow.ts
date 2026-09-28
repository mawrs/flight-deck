import { calculate } from "./calculations";
import { percent } from "./format";
import type { Application } from "./types";
import { submissionChecklist } from "./validation";

export const WORKFLOW_STEPS = [
  { slug: "opportunity", label: "Opportunity" },
  { slug: "notes", label: "Notes" },
  { slug: "payoffs", label: "Liabilities" },
  { slug: "loan-payoff", label: "Loan Payoff" },
  { slug: "review", label: "Review Application" },
  { slug: "documents", label: "Documents" },
  { slug: "underwriting", label: "Underwriting" },
  { slug: "rates", label: "Rates" },
  { slug: "submit", label: "Completion" },
] as const;

export const FILE_TABS = [
  { slug: "opportunity", label: "Opportunity" },
  { slug: "payoffs", label: "Liabilities" },
  { slug: "loan-payoff", label: "Loan Payoff" },
  { slug: "review", label: "Review Application" },
  { slug: "documents", label: "Documents" },
  { slug: "underwriting", label: "Underwriting" },
  { slug: "rates", label: "Rates" },
] as const;

export type WorkflowSlug = (typeof WORKFLOW_STEPS)[number]["slug"];

export type FlagTone = "good" | "warn" | "bad";

export interface StepFlag {
  tone: FlagTone;
  text: string;
}

export function isWorkflowSlug(value: string): value is WorkflowSlug {
  return WORKFLOW_STEPS.some((step) => step.slug === value);
}

export function workflowSlugFromPath(pathname: string): WorkflowSlug {
  const slug = pathname.split("/").filter(Boolean).at(-1) ?? "";
  return isWorkflowSlug(slug) ? slug : "payoffs";
}

export function stepIndex(slug: WorkflowSlug): number {
  return WORKFLOW_STEPS.findIndex((step) => step.slug === slug);
}

export function stepDone(application: Application, slug: WorkflowSlug): boolean {
  const items = Object.fromEntries(
    submissionChecklist(application).map((item) => [item.id, item.done]),
  );

  switch (slug) {
    case "opportunity":
      return Boolean(application.opportunityName);
    case "notes":
      return Boolean(items["notes-income"] && items["notes-credit"] && items["notes-degree"]);
    case "payoffs":
    case "loan-payoff":
      return Boolean(items.payoffs);
    case "review":
      return Boolean(application.borrower.fullName);
    case "documents":
      return Boolean(items.docs);
    case "underwriting":
      return Boolean(items.income);
    case "rates":
      return application.requestedTerm > 0 && application.income.estimatedNewPayment > 0;
    case "submit":
      return (
        application.status === "senior-review" ||
        application.status === "approved" ||
        Boolean(items.decision)
      );
  }
}

export function incomeVariance(application: Application): number | null {
  const stated = application.borrower.statedAnnualIncome;
  const verified = calculate(application).annualizedIncome;
  if (!stated || !verified) return null;
  return (verified - stated) / stated;
}

export function stepFlags(application: Application, slug: WorkflowSlug | "dti"): StepFlag[] {
  const calc = calculate(application);
  const items = submissionChecklist(application);

  if (slug === "documents") {
    const blocked = items.find((item) => item.id === "blocked-docs");
    const docs = items.find((item) => item.id === "docs");
    if (docs?.done && blocked?.done) {
      return [{ tone: "good", text: "Required documents have been reviewed." }];
    }
    if (!docs?.done) {
      return [
        {
          tone: "warn",
          text: "Required documents are still unreviewed. Income and payoff figures stay unconfirmed until they are.",
        },
      ];
    }
    return [
      {
        tone: "warn",
        text: "A required document is incomplete or rejected. Set needs documentation, or resolve it before submit.",
      },
    ];
  }

  if (slug === "underwriting") {
    const flags: StepFlag[] = [];
    if (!items.find((item) => item.id === "docs")?.done) {
      flags.push({
        tone: "warn",
        text: "Required documents are not all reviewed, so this income is still unconfirmed.",
      });
    }
    const variance = incomeVariance(application);
    if (variance != null && Math.abs(variance) > 0.1) {
      flags.push({
        tone: "warn",
        text: `Verified income is ${percent(Math.abs(variance))} ${variance < 0 ? "below" : "above"} stated, over the 10% tolerance. Note this before submitting.`,
      });
    } else if (calc.monthlyIncome > 0) {
      flags.push({ tone: "good", text: "Verified income is within tolerance of stated." });
    }
    return flags;
  }

  if (slug === "payoffs") {
    if (calc.selectedCount === 0) {
      return [{ tone: "warn", text: "No loans are selected for payoff." }];
    }
    if (calc.discrepancyCount > 0) {
      return [
        {
          tone: "warn",
          text: `${calc.discrepancyCount} selected payoff${calc.discrepancyCount === 1 ? "" : "s"} differ from the source document. Confirm before submitting.`,
        },
      ];
    }
    return [{ tone: "good", text: "Selected payoffs match the source documents." }];
  }

  if (slug === "dti") {
    if (calc.dti == null) {
      return [{ tone: "warn", text: "DTI cannot be calculated until monthly income is entered." }];
    }
    if (calc.dti > 0.45) {
      return [
        {
          tone: "bad",
          text: `DTI is ${percent(calc.dti)}, over the 45% policy maximum. This is a counter-offer or a decline.`,
        },
      ];
    }
    if (calc.dti > 0.4) {
      return [
        {
          tone: "warn",
          text: `DTI is ${percent(calc.dti)}, under the maximum with limited room. Call this out in the notes.`,
        },
      ];
    }
    return [{ tone: "good", text: `DTI is ${percent(calc.dti)}, inside the 45% maximum.` }];
  }

  return [];
}

export function requiredDocument(kind: Application["documents"][number]["kind"]): boolean {
  return ["identity", "kyc", "credit-report", "degree", "pay-stub"].includes(kind);
}
