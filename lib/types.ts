export type RecordType = "InSchool" | "Tavant";
export type Difficulty = "Medium" | "Hard";
export type Role = "underwriter" | "senior";

export type WorkflowStatus =
  | "pre-review"
  | "needs-docs"
  | "senior-review"
  | "returned"
  | "approved";

export type DocumentKind =
  | "identity"
  | "kyc"
  | "credit-report"
  | "credit-score-exception"
  | "mla"
  | "degree"
  | "pay-stub"
  | "application-disclosure";

export type DocumentStatus =
  | "pending"
  | "submitted"
  | "approved"
  | "rejected"
  | "incomplete";

export type PayoffType = "full" | "partial";
export type AccountType = "I" | "R" | "C" | "M";

export type IncomeFrequency =
  | "annual"
  | "monthly"
  | "semi-monthly"
  | "biweekly"
  | "weekly"
  | "hourly"
  | "ytd";

export type Decision =
  | ""
  | "approve"
  | "counter-offer"
  | "deny"
  | "needs-docs"
  | "return-to-uw";

export interface Person {
  fullName: string;
  email: string;
  zip: string;
  state: string;
  street: string;
  city: string;
  phone: string;
  ssn: string;
  ssnLast4: string;
  citizenship: string;
  graduationYear: string;
  relationship: string;
  livingArrangement: string;
  filingStatus: string;
  birthDate: string;
  creditScore: number;
  fico: number;
  statedAnnualIncome: number;
  degree: string;
  school: string;
}

export interface Employment {
  employer: string;
  title: string;
  startDate: string;
  status: string;
  monthlyIncome: number;
}

export interface UploadedDocument {
  id: string;
  name: string;
  kind: DocumentKind;
  typeLabel: string;
  description: string;
  fileName: string;
  uploadedAt: string;
  sourceStatus: string;
  reviewStatus: DocumentStatus;
  reviewedAt: string | null;
  note: string;
  internal: boolean;
}

export interface Liability {
  id: string;
  lender: string;
  accountNumber: string;
  loanIdentifier: string;
  category: string;
  accountType: AccountType;
  highCredit: number;
  balance: number;
  payment: number;
  selected: boolean;
  payoffType: PayoffType;
  adjCreditorName: string;
  adjAccountNumber: string;
  adjLoanIdentifier: string;
  adjBalance: number;
  source: "credit-report" | "sallie-mae" | "manual";
  confirmed: boolean;
  lenderAddresses: string[];
  selectedAddress: string;
}

export interface IncomeCalculator {
  annual: number;
  monthly: number;
  semiMonthly: number;
  biweekly: number;
  weekly: number;
  hourlyRate: number;
  hourlyHours: number;
  ytdGross: number;
  ytdPeriods: number;
  ytdAnnualPeriods: number;
  yearCurrent: number;
  yearPrior: number;
}

export interface NursingCalculator {
  hospitalYtd: number;
  hospitalYtdMonths: number;
  hospitalPriorYear: number;
  hospitalIncluded: boolean;
  agencyYtd: number;
  agencyYtdMonths: number;
  agencyPriorYear: number;
  agencyIncluded: boolean;
  prnYtd: number;
  prnYtdMonths: number;
  prnPriorYear: number;
  prnIncluded: boolean;
  stipendYtd: number;
  stipendYtdMonths: number;
}

export interface SelfEmployedCalculator {
  currentNet: number;
  currentDepreciation: number;
  currentHomeUse: number;
  currentDepletionAmortization: number;
  currentOtherAddbacks: number;
  currentNonRecurringIncome: number;
  priorNet: number;
  priorDepreciation: number;
  priorHomeUse: number;
  priorDepletionAmortization: number;
  priorOtherAddbacks: number;
  priorNonRecurringIncome: number;
  ytdNet: number;
  ytdAddbacks: number;
  ytdMonths: number;
}

export interface IncomeWorksheet {
  selectedFrequency: IncomeFrequency;
  grossPay: number;
  hours: number;
  payPeriods: number;
  variableYtd: number;
  variablePayPeriods: number;
  priorYearIncome: number;
  housingPayment: number;
  estimatedNewPayment: number;
  calculator?: IncomeCalculator;
  nursing?: NursingCalculator;
  selfEmployed?: SelfEmployedCalculator;
}

export interface DebtTrade {
  id: string;
  tradeType: string;
  accountNumber: string;
  lender: string;
  category: string;
  accountType: AccountType;
  highCredit: number;
  balance: number;
  payment: number;
  sysPayment: number;
  adjPayment: number;
  originalBalance: number;
  reportedAt: string;
  ecoa: string;
  includeInDti: boolean;
}

export interface Notes {
  income: string;
  creditScore: string;
  degree: string;
  fico: string;
  documentation: string;
  payoff: string;
  general: string;
}

export interface CalculationResult {
  monthlyBaseIncome: number;
  monthlyVariableIncome: number;
  monthlyIncome: number;
  annualizedIncome: number;
  selectedPayoffTotal: number;
  remainingMonthlyDebt: number;
  housingPayment: number;
  borrowerDebt: number;
  estimatedNewPayment: number;
  qualifyingMonthlyDebt: number;
  dti: number | null;
  selectedCount: number;
  discrepancyCount: number;
}

export interface PrimarySnapshot {
  submittedAt: string;
  submittedBy: string;
  documents: UploadedDocument[];
  liabilities: Liability[];
  payoffs: Liability[];
  income: IncomeWorksheet;
  debtTrades: DebtTrade[];
  notes: Notes;
  decision: Decision;
  calculations: CalculationResult;
}

export interface UnderwritingExtras {
  borrowerStatus: string;
  supervisorApproval: boolean;
  mlaEligible: "yes" | "no";
  primaryHousingTradeId: string;
}

export interface FileReview {
  recordTypeId: string;
  recordType: string;
  name: string;
  status: string;
  owner: string;
  underwriter: string;
  opportunityLabel: string;
  qualifiedTo: string;
  qualifiedRate: string;
  qualifiedTier: string;
  loanStatementCompliant: string;
  suggestedServicer: string;
  servicerOverridePheaa: boolean;
  servicerOverrideMohela: boolean;
  loanAmount: string;
  term: string;
  rateType: string;
  applicantName: string;
  birthDate: string;
  phone: string;
  email: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  ssn: string;
  citizenship: string;
  livingArrangement: string;
  degree: string;
  school: string;
  graduationYear: string;
  annualIncome: string;
  monthlyIncome: string;
  housingPayment: string;
  fico: string;
  dti: string;
  employmentStatus: string;
  employer: string;
  cosignerName: string;
  cosignerEmail: string;
  cosignerRelationship: string;
  savedAt: string | null;
}

export interface Application {
  id: string;
  opportunityName: string;
  recordType: RecordType;
  stage: string;
  amount: number;
  requestedTerm: number;
  requestedRateType: "Fixed" | "Variable";
  applicationDate: string;
  hardCreditDate: string;
  preReviewAt: string;
  priority: number;
  difficulty: Difficulty;
  referrer: string;
  underwriter: string;
  owner: string;
  borrower: Person;
  cosigner: Person | null;
  cosignerStatus: string;
  employment: Employment[];
  documents: UploadedDocument[];
  liabilities: Liability[];
  payoffs: Liability[];
  income: IncomeWorksheet;
  debtTrades: DebtTrade[];
  notes: Notes;
  fileNotes: string;
  fileNotesUpdatedAt: string | null;
  status: WorkflowStatus;
  decision: Decision;
  seniorNotes: string;
  seniorDecision: Decision;
  submittedAt: string | null;
  returnedAt: string | null;
  approvedAt: string | null;
  primarySnapshot: PrimarySnapshot | null;
  lastSavedAt: string | null;
  workbookFileName: string | null;
  workbookUploadedAt: string | null;
  workbookCopy: Record<string, string> | null;
  opportunity: OpportunityFields;
  underwriting: UnderwritingExtras;
  fileReview: FileReview | null;
}

export type OpportunityField =
  | "opportunityName"
  | "loanStatus"
  | "stage"
  | "accountName"
  | "leadSource"
  | "recordType"
  | "preReviewPriority"
  | "parentLoan"
  | "owner"
  | "cosignerDeadline"
  | "closeDate"
  | "loanStatusDate"
  | "probability"
  | "lastReferralPartner"
  | "referralPartner"
  | "duplicateApplication";

export type OpportunityFields = Partial<Record<OpportunityField, string>>;

export type ApplicationPatch = Partial<
  Pick<
    Application,
    | "documents"
    | "liabilities"
    | "payoffs"
    | "income"
    | "debtTrades"
    | "notes"
    | "fileNotes"
    | "fileNotesUpdatedAt"
    | "decision"
    | "seniorNotes"
    | "seniorDecision"
    | "status"
    | "borrower"
    | "cosigner"
    | "employment"
    | "amount"
    | "workbookFileName"
    | "workbookUploadedAt"
    | "workbookCopy"
    | "requestedTerm"
    | "requestedRateType"
    | "opportunityName"
    | "stage"
    | "owner"
    | "underwriter"
    | "referrer"
    | "difficulty"
    | "recordType"
    | "opportunity"
    | "underwriting"
    | "fileReview"
  >
>;
