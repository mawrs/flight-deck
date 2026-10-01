export const LOAN_HOME = "/dashboard/loan-origination";

export function loanQueueHref(view?: string) {
  if (!view || view === "pre-review") return LOAN_HOME;
  return `${LOAN_HOME}?view=${view}`;
}

export function loanSearchHref() {
  return `${LOAN_HOME}/search`;
}

export function applicationBase(id: string, senior = false) {
  return senior ? `${LOAN_HOME}/senior/${id}` : `${LOAN_HOME}/applications/${id}`;
}

export function workbookHref(id: string) {
  return `${LOAN_HOME}/workbook/${id}`;
}

export function certificationHome(view?: string) {
  if (!view || view === "pending") return `${LOAN_HOME}/certification`;
  return `${LOAN_HOME}/certification?view=${view}`;
}

export function certificationHref(id: string) {
  return `${LOAN_HOME}/certification/${id}`;
}

export function servicingHome(view?: string) {
  if (!view || view === "cases") return `${LOAN_HOME}/servicing`;
  return `${LOAN_HOME}/servicing?view=${view}`;
}

export function servicingCaseHref(id: string) {
  return `${LOAN_HOME}/servicing/cases/${id}`;
}

export function servicingLoanHref(id: string) {
  return `${LOAN_HOME}/servicing/loans/${id}`;
}

export function fileRoute(pathname: string) {
  const application = pathname.match(/\/loan-origination\/applications\/([^/]+)/);
  if (application) return { id: application[1], senior: false };
  const senior = pathname.match(/\/loan-origination\/senior\/([^/]+)/);
  if (senior) return { id: senior[1], senior: true };
  return null;
}
