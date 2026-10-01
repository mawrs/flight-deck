export type OpsProduct = "InSchool" | "ReFi" | "EdMed";

export type CertificationStatus = "requested" | "certified" | "reduced" | "rejected";

export type EnrollmentStatus = "" | "full-time" | "half-time" | "less-than-half-time";

export type DisbursementStatus = "scheduled" | "disbursed";

export interface Disbursement {
  id: string;
  date: string;
  amount: number;
  status: DisbursementStatus;
}

export interface Certification {
  id: string;
  applicationId: string | null;
  borrower: string;
  product: OpsProduct;
  school: string;
  schoolCode: string;
  requestedAt: string;
  certifiedAt: string | null;
  approvedAmount: number;
  certifiedAmount: number | null;
  costOfAttendance: number | null;
  enrollment: EnrollmentStatus;
  status: CertificationStatus;
  disbursements: Disbursement[];
}

export type ServicerName = "Mohela" | "Nelnet";

export type BoardingStatus = "completed" | "pending";

export interface ServicingLoan {
  id: string;
  certificationId: string | null;
  applicationId: string | null;
  borrower: string;
  product: OpsProduct;
  school: string;
  schoolCode: string;
  servicer: ServicerName;
  boardedAt: string | null;
  boardingStatus: BoardingStatus;
  principal: number;
  interest: number;
  disbursements: Disbursement[];
  readOnly: boolean;
}

export type CaseType =
  | "disbursement-change"
  | "disbursement-review"
  | "school-code"
  | "resend-certification"
  | "borrower-follow-up";

export type CasePriority = "high" | "medium" | "low";

export type CaseStatus = "open" | "waiting-on-advisor" | "waiting-on-school" | "resolved";

export interface ServicingCase {
  id: string;
  loanId: string;
  type: CaseType;
  priority: CasePriority;
  status: CaseStatus;
  openedBy: string;
  assignee: string;
  openedAt: string;
  details: string;
  notes: string;
}

export interface OpsState {
  certifications: Certification[];
  loans: ServicingLoan[];
  cases: ServicingCase[];
}

export interface SchoolResponse {
  enrollment: Exclude<EnrollmentStatus, "">;
  certifiedAmount: number;
  costOfAttendance: number;
  disbursements: { id?: string; date: string; amount: number; status?: DisbursementStatus }[];
}
