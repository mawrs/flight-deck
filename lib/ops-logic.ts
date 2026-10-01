import type {
  CasePriority,
  Certification,
  CertificationStatus,
  Disbursement,
  OpsState,
  ServicingLoan,
} from "./ops-types";

export const CERT_VIEWS = [
  {
    id: "pending",
    label: "Pending certification",
    empty: "No certifications are waiting on a school.",
  },
  {
    id: "due",
    label: "Disbursement due",
    empty: "No certified loans have a disbursement date that has arrived.",
  },
  {
    id: "exceptions",
    label: "Amount exceptions",
    empty: "No certifications came back below the approved amount.",
  },
  {
    id: "all",
    label: "All certifications",
    empty: "No certification files.",
  },
] as const;

export type CertViewId = (typeof CERT_VIEWS)[number]["id"];

export const SERVICING_VIEWS = [
  {
    id: "cases",
    label: "Servicing cases",
    empty: "No servicing cases match this view.",
  },
  {
    id: "roster",
    label: "Disbursement roster",
    empty: "No disbursements match this view.",
  },
  {
    id: "onboarded",
    label: "Onboarded loans",
    empty: "No onboarded loans match this view.",
  },
] as const;

export type ServicingViewId = (typeof SERVICING_VIEWS)[number]["id"];

export const OPS_LABELS: Record<string, string> = {
  requested: "Requested",
  certified: "Certified",
  reduced: "Reduced",
  rejected: "Rejected",
  scheduled: "Scheduled",
  disbursed: "Disbursed",
  high: "High",
  medium: "Medium",
  low: "Low",
  open: "Open",
  "waiting-on-advisor": "Waiting on advisor",
  "waiting-on-school": "Waiting on school",
  resolved: "Resolved",
  completed: "Completed",
  pending: "Pending",
  "full-time": "Full time",
  "half-time": "Half time",
  "less-than-half-time": "Less than half time",
  "disbursement-change": "Disbursement change",
  "disbursement-review": "Disbursement review",
  "school-code": "School code correction",
  "resend-certification": "Resend certification",
  "borrower-follow-up": "Borrower follow-up",
  InSchool: "InSchool",
  "In-School": "InSchool",
  EdMed: "EdMed",
  ReFi: "ReFi",
};

export const PRIORITY_RANK: Record<CasePriority, number> = { high: 0, medium: 1, low: 2 };

export function opsLabel(value: string) {
  return OPS_LABELS[value] ?? value;
}

export function certView(id: string | undefined): CertViewId {
  return CERT_VIEWS.some((view) => view.id === id) ? (id as CertViewId) : "pending";
}

export function servicingView(id: string | undefined): ServicingViewId {
  return SERVICING_VIEWS.some((view) => view.id === id) ? (id as ServicingViewId) : "cases";
}

export function startOfDay(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 0;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function isOnOrBeforeToday(value: string) {
  return startOfDay(value) <= startOfDay(new Date());
}

export function scheduledDisbursements(cert: Pick<Certification, "disbursements">) {
  return cert.disbursements
    .filter((item) => item.status === "scheduled")
    .sort((a, b) => startOfDay(a.date) - startOfDay(b.date));
}

export function nextDisbursement(cert: Pick<Certification, "disbursements">) {
  return scheduledDisbursements(cert)[0] ?? null;
}

export function isDisbursementDue(cert: Pick<Certification, "status" | "disbursements">) {
  if (cert.status !== "certified" && cert.status !== "reduced") return false;
  return cert.disbursements.some((item) => item.status === "scheduled" && isOnOrBeforeToday(item.date));
}

export function isAmountException(cert: Pick<Certification, "status" | "certifiedAmount" | "approvedAmount">) {
  if (cert.status !== "reduced" && cert.status !== "certified") return false;
  return cert.certifiedAmount != null && cert.certifiedAmount < cert.approvedAmount;
}

export function matchesCertView(cert: Certification, view: CertViewId) {
  if (view === "pending") return cert.status === "requested";
  if (view === "due") return isDisbursementDue(cert);
  if (view === "exceptions") return isAmountException(cert);
  return true;
}

export function loanForCertification(loans: ServicingLoan[], certificationId: string) {
  return loans.find((loan) => loan.certificationId === certificationId) ?? null;
}

export function certificationById(state: Pick<OpsState, "certifications">, id: string | null) {
  if (!id) return null;
  return state.certifications.find((item) => item.id === id) ?? null;
}

export function disbursementsForLoan(state: Pick<OpsState, "certifications">, loan: ServicingLoan): Disbursement[] {
  if (loan.certificationId) {
    return certificationById(state, loan.certificationId)?.disbursements ?? [];
  }
  return loan.disbursements;
}

export function daysSince(value: string | null) {
  if (!value) return null;
  const start = startOfDay(value);
  if (!start) return null;
  return Math.round((startOfDay(new Date()) - start) / 86_400_000);
}

export function statusAfterAmounts(certifiedAmount: number, approvedAmount: number): CertificationStatus {
  return certifiedAmount < approvedAmount ? "reduced" : "certified";
}
