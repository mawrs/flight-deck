export type OpsProduct = "InSchool" | "ReFi" | "EdMed";

export type CertificationStatus = "requested" | "in-review" | "certified" | "reduced" | "rejected" | "withdrawn";

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
  withdrawalReason?: string;
  withdrawalNote?: string;
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

export const CASE_STATUSES = [
  { id: "none", label: "--None--" },
  { id: "new", label: "New" },
  { id: "open", label: "Open" },
  { id: "review", label: "Review" },
  { id: "on-hold", label: "On Hold" },
  { id: "awaiting-information", label: "Awaiting Additional Information" },
  { id: "pending-servicer", label: "Pending Response - Servicer" },
  { id: "pending-seb-loan-ops", label: "Pending Response - SEB Loan Ops" },
  { id: "closed", label: "Closed" },
] as const;

export type CaseStatus = (typeof CASE_STATUSES)[number]["id"];

export interface CaseForm {
  caseNumber: string;
  contactName: string;
  opportunity: string;
  suggestionForm: string;
  phone: string;
  email: string;
  highestDegree: string;
  sla: string;
  underwriter: string;
  origin: string;
  reason: string;
  requestType: string;
  queue: string;
  subQueue: string;
  projectDue: string;
  disbursementStatus: string;
  openedLabel: string;
  closedAt: string;
  webEmail: string;
}

export interface ServicingCase {
  id: string;
  loanId: string;
  type: CaseType;
  priority: CasePriority;
  status: CaseStatus;
  openedBy: string;
  assignee: string;
  openedAt: string;
  subject: string;
  disbursement: string;
  details: string;
  notes: string;
  fileNotes?: string;
  fileNotesUpdatedAt?: string | null;
  form?: Partial<CaseForm>;
}

export type CasePatch = Partial<
  Pick<
    ServicingCase,
    "subject" | "details" | "notes" | "fileNotes" | "fileNotesUpdatedAt" | "status" | "priority" | "type" | "assignee" | "form"
  >
>;

export interface FeedComment {
  id: string;
  author: string;
  body: string;
  createdAt: string;
}

export interface FeedPost {
  id: string;
  caseId: string;
  applicationId?: string;
  author: string;
  body: string;
  createdAt: string;
  likes: number;
  liked: boolean;
  comments: FeedComment[];
  kind?: "created" | "note" | "email";
  audience?: string;
  subject?: string;
  emailTo?: string;
  emailCc?: string;
  emailBcc?: string;
}

export interface OpsNotification {
  id: string;
  kind: "mention" | "case-created" | "change" | "cancellation";
  actor: string;
  body: string;
  caseId: string;
  href?: string;
  createdAt: string;
  read: boolean;
}

export interface CaseDocument {
  id: string;
  caseId: string;
  name: string;
  fileName: string;
  uploadedBy: string;
  uploadedAt: string;
  subject?: string;
  emailBody?: string;
  emailTo?: string;
  emailCc?: string;
  emailBcc?: string;
}

export interface OpsState {
  certifications: Certification[];
  loans: ServicingLoan[];
  cases: ServicingCase[];
  feed: FeedPost[];
  documents: CaseDocument[];
  notifications: OpsNotification[];
}

export interface SchoolResponse {
  enrollment: Exclude<EnrollmentStatus, "">;
  certifiedAmount: number;
  costOfAttendance: number;
  disbursements: { id?: string; date: string; amount: number; status?: DisbursementStatus }[];
}
