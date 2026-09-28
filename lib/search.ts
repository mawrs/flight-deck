import type { Application, WorkflowStatus } from "./types";

export const BORROWER_STATUS_LABEL: Record<WorkflowStatus, string> = {
  "pre-review": "UW Pre-Review",
  "needs-docs": "Needs Documentation",
  "senior-review": "Senior Review",
  returned: "Returned to UW",
  approved: "Approved",
};

export type SearchField = "loan-number" | "borrower" | "cosigner";
export type OpportunitySearchField = "opportunity" | "underwriter" | "owner";
export type CosignerFilter = "all" | "has" | "none";
export type CategoryFilter = "all" | "InSchool" | "Tavant";

export type SearchChoice<T extends string = string> = {
  id: T;
  label: string;
  prompt: string;
  aria: string;
};

export const SEARCH_FIELDS: SearchChoice<SearchField>[] = [
  { id: "borrower", label: "Borrower", prompt: "Search for borrowers", aria: "Search borrower name" },
  { id: "loan-number", label: "Loan #", prompt: "Search for loan numbers", aria: "Search loan number" },
  { id: "cosigner", label: "Co-Signer", prompt: "Search for co-signers", aria: "Search co-signer name" },
];

export const OPPORTUNITY_SEARCH_FIELDS: SearchChoice<OpportunitySearchField>[] = [
  {
    id: "opportunity",
    label: "Opportunity Name",
    prompt: "Search for opportunities",
    aria: "Search opportunity name",
  },
  { id: "underwriter", label: "Underwriter", prompt: "Search for underwriters", aria: "Search underwriter" },
  { id: "owner", label: "Owner Full Name", prompt: "Search for owners", aria: "Search owner" },
];

export function fileWorkspaceHref(app: Application) {
  const senior = app.status === "senior-review" || app.status === "approved";
  const base = senior
    ? `/dashboard/loan-origination/senior/${app.id}`
    : `/dashboard/loan-origination/applications/${app.id}`;
  return `${base}/opportunity`;
}

export function loanTypeLabel(app: Application) {
  return app.recordType === "InSchool" ? "Student Loan InSchool" : "Student Loan Refi";
}

export function loanTypeFullLabel(app: Application) {
  return app.recordType === "InSchool" ? "In-School Student Loan" : "Student Loan Refinancing";
}

export function matchesBorrowerName(app: Application, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return (
    app.borrower.fullName.toLowerCase().includes(needle) ||
    app.opportunityName.toLowerCase().includes(needle)
  );
}

export function borrowerNameOptions(apps: Application[]) {
  const seen = new Set<string>();
  return apps
    .flatMap((app) => {
      const name = app.borrower.fullName.trim();
      if (!name || seen.has(name)) return [];
      seen.add(name);
      return [{ id: name, label: name }];
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function matchesSearchQuery(app: Application, query: string, field: SearchField) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  if (field === "loan-number") return app.id.toLowerCase().includes(needle);
  if (field === "cosigner") return (app.cosigner?.fullName ?? "").toLowerCase().includes(needle);
  return matchesBorrowerName(app, needle);
}

export function searchFieldOptions(apps: Application[], field: SearchField) {
  if (field === "loan-number") {
    return [...apps]
      .map((app) => ({ id: app.id, label: app.id }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }
  if (field === "cosigner") {
    const seen = new Set<string>();
    return apps
      .flatMap((app) => {
        const name = app.cosigner?.fullName.trim() ?? "";
        if (!name || seen.has(name)) return [];
        seen.add(name);
        return [{ id: name, label: name }];
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }
  return borrowerNameOptions(apps);
}

export function searchFieldAriaLabel(field: SearchField) {
  return SEARCH_FIELDS.find((item) => item.id === field)?.aria ?? "Search borrower name";
}

export function matchesOpportunityQuery(app: Application, query: string, field: OpportunitySearchField) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  if (field === "underwriter") return app.underwriter.toLowerCase().includes(needle);
  if (field === "owner") return app.owner.toLowerCase().includes(needle);
  return app.opportunityName.toLowerCase().includes(needle);
}

export function opportunitySearchOptions(apps: Application[], field: OpportunitySearchField) {
  const seen = new Set<string>();
  return apps
    .flatMap((app) => {
      const label = (
        field === "underwriter" ? app.underwriter : field === "owner" ? app.owner : app.opportunityName
      ).trim();
      if (!label || seen.has(label)) return [];
      seen.add(label);
      return [{ id: label, label }];
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}
