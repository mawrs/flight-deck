import type { Application, WorkflowStatus } from "./types";

export const OPPORTUNITY_STAGES = [
  { id: "lead", label: "Lead" },
  { id: "application-not-complete", label: "Application Not Complete" },
  { id: "awaiting-cosigner", label: "Awaiting CoSigner Completion" },
  { id: "application-submitted", label: "Application Submitted" },
  { id: "identity-verified", label: "Identity Verified" },
  { id: "credit-pulled", label: "Credit Pulled" },
  { id: "pre-review", label: "UW - PreReview" },
  { id: "in-underwriting", label: "In Underwriting" },
  { id: "needs-docs", label: "Needs Documentation" },
  { id: "final-review", label: "UW Final Review" },
  { id: "second-level-review", label: "Second-Level Review" },
  { id: "supervisor-approval", label: "Supervisor Approval" },
  { id: "proposal", label: "Proposal" },
  { id: "solicit", label: "Solicit" },
  { id: "closed", label: "Closed" },
] as const;

export type OpportunityStageId = (typeof OPPORTUNITY_STAGES)[number]["id"];
export type OpportunityStage = (typeof OPPORTUNITY_STAGES)[number];

export const SUPERVISOR_STAGE_INDEX = OPPORTUNITY_STAGES.findIndex(
  (stage) => stage.id === "supervisor-approval",
);

const STAGE_ALIASES: Record<string, string> = {
  "Senior Review": "UW Final Review",
  "Returned to UW": "In Underwriting",
  Approved: "Supervisor Approval",
  "UW Pre-Review": "UW - PreReview",
};

const STATUS_STAGE_INDEX: Record<WorkflowStatus, number> = {
  "pre-review": 6,
  "needs-docs": 8,
  "senior-review": 9,
  returned: 7,
  approved: 11,
};

export function stageIndexFor(application: Pick<Application, "stage" | "status">) {
  const raw = application.stage?.trim() ?? "";
  const aliased = STAGE_ALIASES[raw] ?? raw;
  const match = OPPORTUNITY_STAGES.findIndex(
    (stage) => stage.label === aliased || stage.id === aliased,
  );
  if (match >= 0) return match;
  return STATUS_STAGE_INDEX[application.status] ?? 6;
}

export function isSupervisorStage(index: number) {
  return index >= SUPERVISOR_STAGE_INDEX;
}
