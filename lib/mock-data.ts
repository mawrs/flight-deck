import type {
  Application,
  DebtTrade,
  DocumentKind,
  DocumentStatus,
  IncomeWorksheet,
  Liability,
  Notes,
  Person,
  UploadedDocument,
  WorkflowStatus,
} from "./types";
import { estimatedPayment, seedCalculator } from "./calculations/income";
import { defaultLenderAddresses } from "./payoffs";

const PRIMARY_AMOUNT = 62494.9;

const emptyNotes = (): Notes => ({
  income: "",
  creditScore: "",
  degree: "",
  fico: "",
  documentation: "",
  payoff: "",
  general: "",
});

const defaultIncome = (overrides: Partial<IncomeWorksheet> = {}): IncomeWorksheet => {
  const income = {
    selectedFrequency: "biweekly" as const,
    grossPay: 0,
    hours: 40,
    payPeriods: 16,
    variableYtd: 0,
    variablePayPeriods: 0,
    priorYearIncome: 0,
    housingPayment: 0,
    estimatedNewPayment: 0,
    ...overrides,
  };
  return {
    ...income,
    calculator: overrides.calculator ?? seedCalculator(income),
  };
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function doc(partial: {
  id: string;
  name: string;
  kind: DocumentKind;
  typeLabel: string;
  description: string;
  fileName: string;
  uploadedAt: string;
  sourceStatus?: string;
  reviewStatus?: DocumentStatus;
  internal?: boolean;
}): UploadedDocument {
  return {
    sourceStatus: "",
    reviewStatus: "pending",
    reviewedAt: null,
    note: "",
    internal: false,
    ...partial,
  };
}

function liability(
  partial: Omit<
    Liability,
    "confirmed" | "selected" | "payoffType" | "adjLoanIdentifier" | "lenderAddresses" | "selectedAddress"
  > &
    Partial<Liability>,
): Liability {
  const addresses = partial.lenderAddresses ?? defaultLenderAddresses(partial.lender);
  return {
    selected: false,
    payoffType: "full",
    confirmed: false,
    adjLoanIdentifier: "",
    ...partial,
    lenderAddresses: addresses,
    selectedAddress: partial.selectedAddress ?? addresses[0] ?? "",
  };
}

function trade(
  partial: Omit<DebtTrade, "sysPayment" | "adjPayment" | "originalBalance"> & Partial<DebtTrade>,
): DebtTrade {
  return {
    ...partial,
    sysPayment: partial.sysPayment ?? partial.payment,
    adjPayment: partial.adjPayment ?? partial.payment,
    originalBalance: partial.originalBalance ?? partial.highCredit,
  };
}

function creditReportTrades(prefix = ""): DebtTrade[] {
  const id = (key: string) => (prefix ? `${prefix}-${key}` : key);
  return [
    trade({
      id: id("cr-auto-1"),
      tradeType: "Installment",
      accountNumber: "4482017731",
      lender: "EQUIFAX TEST DATA",
      category: "AUTOMOBILE",
      accountType: "I",
      highCredit: 40630,
      balance: 27555,
      payment: 559,
      reportedAt: "10/2025",
      ecoa: "J",
      includeInDti: true,
    }),
    trade({
      id: id("cr-card-1"),
      tradeType: "Revolving",
      accountNumber: "4482018842",
      lender: "EQUIFAX TEST DATA",
      category: "CREDIT_CARD",
      accountType: "R",
      highCredit: 1226,
      balance: 0,
      payment: 0,
      reportedAt: "10/2025",
      ecoa: "A",
      includeInDti: false,
    }),
    trade({
      id: id("cr-heloc-1"),
      tradeType: "Line of credit",
      accountNumber: "4482019953",
      lender: "EQUIFAX TEST DATA",
      category: "HOME_EQUITY_LINE_OF_CREDIT",
      accountType: "C",
      highCredit: 10060,
      balance: 0,
      payment: 0,
      reportedAt: "10/2025",
      ecoa: "I",
      includeInDti: false,
    }),
    trade({
      id: id("cr-card-2"),
      tradeType: "Revolving",
      accountNumber: "4482020064",
      lender: "EQUIFAX TEST DATA",
      category: "CREDIT_CARD",
      accountType: "R",
      highCredit: 3561,
      balance: 0,
      payment: 0,
      reportedAt: "10/2025",
      ecoa: "I",
      includeInDti: false,
    }),
    trade({
      id: id("cr-card-3"),
      tradeType: "Revolving",
      accountNumber: "4482021175",
      lender: "EQUIFAX TEST DATA",
      category: "CREDIT_CARD",
      accountType: "R",
      highCredit: 0,
      balance: 0,
      payment: 0,
      reportedAt: "10/2025",
      ecoa: "I",
      includeInDti: false,
    }),
    trade({
      id: id("cr-card-4"),
      tradeType: "Revolving",
      accountNumber: "4482022286",
      lender: "EQUIFAX TEST DATA",
      category: "CREDIT_CARD",
      accountType: "R",
      highCredit: 3528,
      balance: 0,
      payment: 0,
      reportedAt: "10/2025",
      ecoa: "I",
      includeInDti: false,
    }),
    trade({
      id: id("cr-mtg-1"),
      tradeType: "Mortgage",
      accountNumber: "4482023397",
      lender: "EQUIFAX TEST DATA",
      category: "FHA_REAL_ESTATE_MORTGAGE",
      accountType: "M",
      highCredit: 79256,
      balance: 67054,
      payment: 586,
      reportedAt: "10/2025",
      ecoa: "J",
      includeInDti: true,
    }),
    trade({
      id: id("cr-card-5"),
      tradeType: "Revolving",
      accountNumber: "4482024408",
      lender: "EQUIFAX TEST DATA",
      category: "FlexibleSpendingCreditCard",
      accountType: "R",
      highCredit: 8611,
      balance: 3916,
      payment: 78,
      reportedAt: "10/2025",
      ecoa: "I",
      includeInDti: true,
    }),
    trade({
      id: id("cr-auto-2"),
      tradeType: "Installment",
      accountNumber: "4482025519",
      lender: "EQUIFAX TEST DATA",
      category: "AUTOMOBILE",
      accountType: "I",
      highCredit: 21158,
      balance: 0,
      payment: 0,
      reportedAt: "06/2021",
      ecoa: "I",
      includeInDti: false,
    }),
  ];
}

const primaryLiabilities: Liability[] = [
  liability({
    id: "sm-1",
    lender: "SALLIE MAE",
    accountNumber: "6001842291766408",
    loanIdentifier: "6408",
    category: "EDUCATIONAL",
    accountType: "I",
    highCredit: 7600,
    balance: 6120,
    payment: 1,
    selected: false,
    adjCreditorName: "SALLIE MAE",
    adjAccountNumber: "6001842200842216",
    adjBalance: 6188.4,
    source: "sallie-mae",
  }),
  liability({
    id: "sm-2",
    lender: "SALLIE MAE",
    accountNumber: "6001842291764419",
    loanIdentifier: "4419",
    category: "EDUCATIONAL",
    accountType: "I",
    highCredit: 9100,
    balance: 8940,
    payment: 0,
    selected: false,
    adjCreditorName: "SALLIE MAE",
    adjAccountNumber: "6001842200843327",
    adjBalance: 9100,
    source: "sallie-mae",
  }),
  liability({
    id: "sm-3",
    lender: "SALLIE MAE",
    accountNumber: "6001842291763301",
    loanIdentifier: "3301",
    category: "EDUCATIONAL",
    accountType: "I",
    highCredit: 10400,
    balance: 10180,
    payment: 0,
    selected: false,
    adjCreditorName: "SALLIE MAE",
    adjAccountNumber: "6001842200844438",
    adjBalance: 10400,
    source: "sallie-mae",
  }),
  liability({
    id: "sm-4",
    lender: "SALLIE MAE",
    accountNumber: "6001842291762206",
    loanIdentifier: "2206",
    category: "EDUCATIONAL",
    accountType: "I",
    highCredit: 7900,
    balance: 7710,
    payment: 0,
    selected: false,
    adjCreditorName: "SALLIE MAE",
    adjAccountNumber: "6001842200845549",
    adjBalance: 7840,
    source: "sallie-mae",
  }),
  liability({
    id: "sm-5",
    lender: "SALLIE MAE",
    accountNumber: "6001842291761104",
    loanIdentifier: "1104",
    category: "EDUCATIONAL",
    accountType: "I",
    highCredit: 14200,
    balance: 13940,
    payment: 0,
    selected: false,
    adjCreditorName: "SALLIE MAE",
    adjAccountNumber: "6001842200846650",
    adjBalance: 14166.5,
    source: "sallie-mae",
  }),
  liability({
    id: "sm-6",
    lender: "SALLIE MAE",
    accountNumber: "6001842291760093",
    loanIdentifier: "0093",
    category: "EDUCATIONAL",
    accountType: "I",
    highCredit: 15000,
    balance: 14680,
    payment: 0,
    selected: false,
    adjCreditorName: "SALLIE MAE",
    adjAccountNumber: "6001842200847761",
    adjBalance: 14800,
    source: "sallie-mae",
  }),
  liability({
    id: "sa-1",
    lender: "LAKESHORE STUDENT AID",
    accountNumber: "9E88220190815550117",
    loanIdentifier: "0117",
    category: "EDUCATIONAL",
    accountType: "I",
    highCredit: 3400,
    balance: 3310,
    payment: 48,
    adjCreditorName: "LAKESHORE STUDENT AID",
    adjAccountNumber: "9E88220190815550117",
    adjBalance: 3310,
    source: "credit-report",
  }),
  liability({
    id: "sa-2",
    lender: "LAKESHORE STUDENT AID",
    accountNumber: "9E88220190815550228",
    loanIdentifier: "0228",
    category: "EDUCATIONAL",
    accountType: "I",
    highCredit: 8100,
    balance: 7980,
    payment: 61.2,
    adjCreditorName: "LAKESHORE STUDENT AID",
    adjAccountNumber: "9E88220190815550228",
    adjBalance: 7980,
    source: "credit-report",
  }),
  liability({
    id: "sa-3",
    lender: "LAKESHORE STUDENT AID",
    accountNumber: "9E88220190815550339",
    loanIdentifier: "0339",
    category: "EDUCATIONAL",
    accountType: "I",
    highCredit: 4300,
    balance: 4195,
    payment: 48,
    adjCreditorName: "LAKESHORE STUDENT AID",
    adjAccountNumber: "9E88220190815550339",
    adjBalance: 4195,
    source: "credit-report",
  }),
  liability({
    id: "cc-1",
    lender: "RIVERSTONE CARD",
    accountNumber: "600188447731",
    loanIdentifier: "7731",
    category: "CREDIT_CARD",
    accountType: "R",
    highCredit: 2800,
    balance: 1960,
    payment: 39,
    adjCreditorName: "RIVERSTONE CARD",
    adjAccountNumber: "600188447731",
    adjBalance: 1960,
    source: "credit-report",
  }),
  liability({
    id: "hl-1",
    lender: "HARBOR STUDENT LENDING",
    accountNumber: "8116623947",
    loanIdentifier: "3947",
    category: "EDUCATIONAL",
    accountType: "I",
    highCredit: 11800,
    balance: 10950,
    payment: 108,
    adjCreditorName: "HARBOR STUDENT LENDING",
    adjAccountNumber: "8116623947",
    adjBalance: 10950,
    source: "credit-report",
  }),
];

function samplePayoffs(prefix = ""): Liability[] {
  const id = (key: string) => (prefix ? `${prefix}-${key}` : key);
  return [
    liability({
      id: id("po-1"),
      lender: "SALLIE MAE",
      accountNumber: "1E00181230912312312093",
      loanIdentifier: "",
      category: "EDUCATIONAL",
      accountType: "I",
      highCredit: 13559,
      balance: 13559,
      payment: 160,
      adjCreditorName: "",
      adjAccountNumber: "",
      adjBalance: 0,
      source: "sallie-mae",
    }),
    liability({
      id: id("po-2"),
      lender: "SALLIE MAE",
      accountNumber: "1E00181230912312322104",
      loanIdentifier: "",
      category: "EDUCATIONAL",
      accountType: "I",
      highCredit: 9840,
      balance: 9840,
      payment: 142,
      adjCreditorName: "",
      adjAccountNumber: "",
      adjBalance: 0,
      source: "sallie-mae",
    }),
    liability({
      id: id("po-3"),
      lender: "LAKESHORE STUDENT AID",
      accountNumber: "9E88220190815550117",
      loanIdentifier: "",
      category: "EDUCATIONAL",
      accountType: "I",
      highCredit: 11275,
      balance: 11275,
      payment: 155,
      adjCreditorName: "",
      adjAccountNumber: "",
      adjBalance: 0,
      source: "credit-report",
    }),
  ];
}

const elena: Application = {
  id: "2084417",
  opportunityName: "Elena Voss-2084417",
  recordType: "Tavant",
  stage: "UW - PreReview",
  amount: PRIMARY_AMOUNT,
  requestedTerm: 60,
  requestedRateType: "Fixed",
  applicationDate: "2026-08-20T20:39:00",
  hardCreditDate: "2026-08-16T08:12:00",
  preReviewAt: "2026-08-28T09:24:00",
  priority: 1,
  difficulty: "Medium",
  referrer: "Credible",
  underwriter: "Dana Whitfield",
  owner: "Nolan Keene",
  borrower: {
    fullName: "Elena Voss",
    email: "elena.voss@example.com",
    zip: "55113",
    state: "MN",
    street: "418 Snelling Ave N",
    city: "Roseville",
    phone: "(651) 555-0144",
    ssn: "478-21-4417",
    ssnLast4: "4417",
    citizenship: "U.S Citizen",
    graduationYear: "2018",
    relationship: "",
    livingArrangement: "Renting",
    filingStatus: "Single",
    birthDate: "1996-09-21",
    creditScore: 731,
    fico: 734,
    statedAnnualIncome: 68900,
    degree: "Bachelor of Science, Nursing",
    school: "Midwest State University",
  },
  cosigner: null,
  cosignerStatus: "",
  employment: [
    {
      employer: "Riverside Medical Center",
      title: "Registered Nurse",
      startDate: "2024-06-03",
      status: "Full-time",
      monthlyIncome: 5741.67,
    },
  ],
  documents: [
    doc({
      id: "d-id",
      name: "Internal Identity Verification",
      kind: "identity",
      typeLabel: "Identification",
      description: "Identity Return",
      fileName: "Identity_Verification_[V1].pdf",
      uploadedAt: "2025-12-15T01:38:00-05:00",
      internal: true,
    }),
    doc({
      id: "d-kyc",
      name: "KYC / CIP",
      kind: "kyc",
      typeLabel: "KYC",
      description: "Customer identification program",
      fileName: "KYC_CIP_2084417.pdf",
      uploadedAt: "2025-12-15T01:38:00-05:00",
      sourceStatus: "Submitted",
      internal: true,
    }),
    doc({
      id: "d-cse",
      name: "Credit Score Exception Notice",
      kind: "credit-score-exception",
      typeLabel: "Credit Score Exception Notice",
      description: "Credit Score Exception Notice",
      fileName: "Credit Score Exception Notice.pdf",
      uploadedAt: "2025-12-15T01:38:00-05:00",
    }),
    doc({
      id: "d-cr",
      name: "Credit Report",
      kind: "credit-report",
      typeLabel: "Credit Report",
      description: "",
      fileName: "HardPullFile_5857.pdf",
      uploadedAt: "2025-12-15T01:38:00-05:00",
      sourceStatus: "Submitted",
      internal: true,
    }),
    doc({
      id: "d-mla",
      name: "MLA Verification",
      kind: "mla",
      typeLabel: "MLA Verification",
      description: "Military Leave Act Return",
      fileName: "Equifax_MLA_Verification.pdf",
      uploadedAt: "2025-12-15T01:38:00-05:00",
      internal: true,
    }),
    doc({
      id: "d-disc",
      name: "Application Disclosure Variable",
      kind: "application-disclosure",
      typeLabel: "Application Disclosure Variable",
      description: "Application Disclosure Variable",
      fileName: "Application_Disclosure.pdf",
      uploadedAt: "2025-12-15T01:38:00-05:00",
    }),
    doc({
      id: "d-deg",
      name: "Degree / Transcript",
      kind: "degree",
      typeLabel: "Education",
      description: "Bachelor of Science, Nursing — Midwest State University",
      fileName: "Degree_Verification_MSU.pdf",
      uploadedAt: "2025-12-15T01:38:00-05:00",
      sourceStatus: "Submitted",
      internal: true,
    }),
    doc({
      id: "d-ps1",
      name: "Pay Stub — Current",
      kind: "pay-stub",
      typeLabel: "Income",
      description: "Biweekly pay stub ending 08/15/2026",
      fileName: "Paystub_08152026.pdf",
      uploadedAt: "2025-12-15T01:38:00-05:00",
      sourceStatus: "Submitted",
    }),
    doc({
      id: "d-ps2",
      name: "Pay Stub — Prior",
      kind: "pay-stub",
      typeLabel: "Income",
      description: "Biweekly pay stub ending 08/01/2026",
      fileName: "Paystub_08012026.pdf",
      uploadedAt: "2025-12-15T01:38:00-05:00",
      sourceStatus: "Submitted",
    }),
  ],
  liabilities: primaryLiabilities,
  payoffs: samplePayoffs(),
  income: defaultIncome({
    selectedFrequency: "biweekly",
    grossPay: 2650,
    payPeriods: 16,
    housingPayment: 1380,
    estimatedNewPayment: round2(estimatedPayment(PRIMARY_AMOUNT, 60, 0.0639)),
    priorYearIncome: 66200,
  }),
  debtTrades: creditReportTrades(),
  notes: emptyNotes(),
  fileNotes: "",
  fileNotesUpdatedAt: null,
  status: "pre-review",
  decision: "",
  seniorNotes: "",
  seniorDecision: "",
  submittedAt: null,
  returnedAt: null,
  approvedAt: null,
  primarySnapshot: null,
  lastSavedAt: null,
  workbookFileName: null,
  workbookUploadedAt: null,
  workbookCopy: null,
  opportunity: {},
  underwriting: {
    borrowerStatus: "UW - PreReview",
    supervisorApproval: false,
    mlaEligible: "no",
    primaryHousingTradeId: "",
  },
  fileReview: null,
};

const sampleCosigner: Person = {
  fullName: "Morgan Phelps",
  email: "morgan.phelps@example.com",
  zip: "30318",
  state: "GA",
  street: "88 Piedmont Ave NE",
  city: "Atlanta",
  phone: "(404) 555-0198",
  ssn: "612-44-0318",
  ssnLast4: "0318",
  citizenship: "U.S Citizen",
  graduationYear: "1996",
  relationship: "Parent",
  livingArrangement: "Owning",
  filingStatus: "Single",
  birthDate: "1974-11-18",
  creditScore: 752,
  fico: 755,
  statedAnnualIncome: 91200,
  degree: "Bachelor of Arts",
  school: "Northridge College",
};

function cloneLiabilitiesFor(id: string, amount: number): Liability[] {
  const scale = amount / PRIMARY_AMOUNT;
  const items = primaryLiabilities.map((item) => ({
    ...item,
    id: `${id}-${item.id}`,
    highCredit: round2(item.highCredit * scale),
    balance: round2(item.balance * scale),
    adjBalance: round2(item.adjBalance * scale),
    payment: round2(item.payment * scale),
    selected: false,
    confirmed: false,
  }));
  const payoffLoans = items.filter((item) => item.source === "sallie-mae");
  const sum = payoffLoans.reduce((total, item) => total + item.adjBalance, 0);
  const last = payoffLoans[payoffLoans.length - 1];
  if (last) last.adjBalance = round2(last.adjBalance + (amount - sum));
  return items;
}

const STAGE: Record<WorkflowStatus, string> = {
  "pre-review": "UW - PreReview",
  "needs-docs": "Needs Documentation",
  "senior-review": "Senior Review",
  returned: "Returned to UW",
  approved: "Approved",
};
const UW_BORROWER_STATUSES = [
  "Lead",
  "Application Not Complete",
  "Awaiting CoSigner Completion",
  "UW - PreReview",
  "In Underwriting",
];
const COSIGNER_ON_FILE = ["On file", "Awaiting docs", "Incomplete", "Pending"];
const COSIGNER_NONE = ["", "Not required"];
const REFERRERS = ["Credible", "Splash", "Paid Search", "NerdWallet", "Organic", "Partner"];
const UNDERWRITERS = [
  "Dana Whitfield",
  "Dustin Pennington",
  "Harper Quinn",
  "June Calder",
  "Miles Crowe",
  "Owen Briggs",
  "Ravi Mehra",
  "Sasha Lind",
];
const OWNERS = ["Nolan Keene", "Ivy Tran", "Bennett Cole", "Reese Alvarez", "Casey Morrow"];
const STATES = [
  ["MN", "Roseville", "55113"],
  ["TX", "Austin", "78701"],
  ["CA", "Rancho Santa Margarita", "92688"],
  ["NY", "Brooklyn", "11201"],
  ["FL", "Miami", "33101"],
  ["HI", "Honolulu", "96813"],
  ["AK", "Anchorage", "99501"],
  ["VT", "Burlington", "05401"],
  ["WY", "Cheyenne", "82001"],
  ["GA", "Atlanta", "30318"],
  ["OH", "Cleveland", "44114"],
  ["AZ", "Phoenix", "85001"],
  ["CO", "Denver", "80202"],
  ["WA", "Seattle", "98101"],
  ["MA", "Boston", "02108"],
] as const;

const EDGE_BORROWERS = [
  "José García-López",
  "Siobhán O'Connor",
  "Mary-Anne de la Cruz",
  "Li Wei",
  "Christopher Montgomery-Whitaker IV",
  "Ngọc Trần",
  "Jean-Luc Moreau",
  "Jordan Hale",
  "Jordan Park",
  "Amina Al-Farsi",
  "Björk Sigurdsdóttir",
  "Ann",
  "Rae Kim-Park",
  "Theo Lang-Ellis",
];
const FIRST_NAMES = [
  "Ava", "Noah", "Mia", "Leo", "Zoe", "Kai", "Nina", "Omar", "Ivy", "Eli",
  "Sana", "Hugo", "Lila", "Beau", "Noor", "Wes", "Tessa", "Cruz", "Pia", "Asher",
  "Mara", "Felix", "Nadia", "Mateo", "Claire", "Anika", "Elena", "Priya", "Jonah", "Skye",
];
const LAST_NAMES = [
  "Patel", "Kim", "Rossi", "Nguyen", "Brooks", "Khan", "Diaz", "Okafor", "Berg", "Singh",
  "Cohen", "Walsh", "Ito", "Nasser", "Frost", "Adeyemi", "Vargas", "Hale", "Qureshi", "Lund",
  "Okoye", "Brennan", "Ruiz", "Bose", "Grant", "Voss", "Ellison", "Santos", "Meyer", "Cho",
];
const EDGE_COSIGNERS = [
  "Morgan Phelps",
  "Émile D'Arcy",
  "Jean-Pierre Dubois",
  "Hae-Won Choi",
  "Maria del Carmen Ruiz",
  "O'Neil Fitzgerald",
];
const COSIGNER_FIRST = ["Robin", "Alex", "Sam", "Taylor", "Casey", "Riley", "Quinn", "Drew", "Jamie", "Cameron"];
const COSIGNER_LAST = ["Phelps", "Hart", "Nguyen", "Cole", "Shah", "Bennett", "Ortiz", "Walsh", "Ibarra", "Young"];

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rand: () => number, items: readonly T[]) {
  return items[Math.floor(rand() * items.length)]!;
}

function slug(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.|\.$/g, "") || "borrower";
}

function padDate(year: number, month: number, day: number, hour: number, minute: number) {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  const hh = String(hour).padStart(2, "0");
  const min = String(minute).padStart(2, "0");
  return `${year}-${mm}-${dd}T${hh}:${min}:00`;
}

function statusFor(index: number): WorkflowStatus {
  if (index % 7 === 0) return "approved";
  if (index % 7 === 1) return "senior-review";
  if (index % 7 === 2) return "needs-docs";
  if (index % 7 === 3) return "returned";
  return "pre-review";
}

function lightApplication(input: {
  id: string;
  name: string;
  recordType: Application["recordType"];
  amount: number;
  priority: number;
  difficulty: Application["difficulty"];
  referrer: string;
  underwriter: string;
  owner: string;
  applicationDate: string;
  hardCreditDate: string;
  preReviewAt: string;
  status: WorkflowStatus;
  email: string;
  state: string;
  city: string;
  zip: string;
  cosignerName?: string;
  cosignerStatus: string;
  borrowerStatus: string;
}): Application {
  const liabilities = cloneLiabilitiesFor(input.id, input.amount);
  const hasCosigner = Boolean(input.cosignerName);
  const nowStamp = input.preReviewAt;
  const submitted = input.status === "senior-review" || input.status === "approved" || input.status === "returned";

  return {
    ...elena,
    id: input.id,
    opportunityName: `${input.name}-${input.id}`,
    recordType: input.recordType,
    stage: STAGE[input.status],
    amount: input.amount,
    applicationDate: input.applicationDate,
    hardCreditDate: input.hardCreditDate,
    preReviewAt: input.preReviewAt,
    priority: input.priority,
    difficulty: input.difficulty,
    referrer: input.referrer,
    underwriter: input.underwriter,
    owner: input.owner,
    status: input.status,
    cosigner: hasCosigner
      ? {
          ...sampleCosigner,
          fullName: input.cosignerName!,
          email: `${slug(input.cosignerName!)}@example.com`,
        }
      : null,
    cosignerStatus: input.cosignerStatus,
    borrower: {
      ...elena.borrower,
      fullName: input.name,
      email: input.email,
      state: input.state,
      city: input.city,
      zip: input.zip,
    },
    income: {
      ...elena.income,
      estimatedNewPayment: round2(estimatedPayment(input.amount, 60, 0.0639)),
    },
    liabilities,
    payoffs: samplePayoffs(input.id),
    debtTrades: creditReportTrades(input.id),
    documents: elena.documents.map((item) => ({
      ...item,
      id: `${input.id}-${item.id}`,
      fileName: item.fileName.replace(elena.id, input.id),
      reviewStatus: "pending" as DocumentStatus,
      reviewedAt: null,
      note: "",
    })),
    notes: emptyNotes(),
    fileNotes: "",
    fileNotesUpdatedAt: null,
    decision: "",
    seniorNotes: "",
    seniorDecision: "",
    submittedAt: submitted ? nowStamp : null,
    returnedAt: input.status === "returned" ? nowStamp : null,
    approvedAt: input.status === "approved" ? nowStamp : null,
    primarySnapshot: null,
    lastSavedAt: null,
    underwriting: {
      borrowerStatus: input.borrowerStatus,
      supervisorApproval: input.status === "approved",
      mlaEligible: "no",
      primaryHousingTradeId: "",
    },
    fileReview: null,
  };
}

function buildSeedApplications(): Application[] {
  const rand = mulberry32(0x51ed56);
  const usedIds = new Set<string>(["2000001", "2199999", "2080008", "2075208", "1994400", "2108080"]);
  const forcedIds = [...usedIds];

  function nextId() {
    let id = "";
    do {
      id = String(1_900_000 + Math.floor(rand() * 300_000));
    } while (usedIds.has(id));
    usedIds.add(id);
    return id;
  }

  const usedNames = new Set(EDGE_BORROWERS);
  const names = [...EDGE_BORROWERS];
  while (names.length < 56) {
    const name = `${pick(rand, FIRST_NAMES)} ${pick(rand, LAST_NAMES)}`;
    if (usedNames.has(name)) continue;
    usedNames.add(name);
    names.push(name);
  }
  for (let i = names.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [names[i], names[j]] = [names[j]!, names[i]!];
  }

  const cosignerPool = [
    ...EDGE_COSIGNERS,
    ...COSIGNER_FIRST.flatMap((first) => COSIGNER_LAST.map((last) => `${first} ${last}`)),
  ];

  return names.map((name, index) => {
    const id = index < forcedIds.length ? forcedIds[index]! : nextId();
    const status = statusFor(index);
    const [state, city, zip] = pick(rand, STATES);
    const hasCosigner = index % 5 !== 0;
    const cosignerName = hasCosigner
      ? index === 7 || index === 14
        ? "Morgan Phelps"
        : pick(rand, cosignerPool)
      : undefined;
    const month = 6 + (index % 4);
    const day = index % 11 === 0 ? 15 : 1 + (index % 28);
    const applicationDate = padDate(2026, month, Math.min(day, 28), 8 + (index % 10), (index * 7) % 60);
    const hardCreditDate = padDate(2026, month, Math.max(1, Math.min(day, 28) - 3), 9, 12);
    const preReviewAt = padDate(2026, month, Math.min(day + 1, 28), 7, 40);
    return lightApplication({
      id,
      name,
      recordType: index % 2 === 0 ? "Tavant" : "InSchool",
      amount: index === 3 ? 5200 : index === 5 ? 151200 : 4200 + Math.round(rand() * 176000),
      priority: 1 + (index % 6),
      difficulty: index === 5 || index % 5 === 0 ? "Hard" : "Medium",
      referrer: pick(rand, REFERRERS),
      underwriter: pick(rand, UNDERWRITERS),
      owner: pick(rand, OWNERS),
      applicationDate,
      hardCreditDate,
      preReviewAt,
      status,
      email: `${slug(name)}.${id}@example.com`,
      state,
      city,
      zip,
      cosignerName,
      cosignerStatus: hasCosigner ? pick(rand, COSIGNER_ON_FILE) : pick(rand, COSIGNER_NONE),
      borrowerStatus: pick(rand, UW_BORROWER_STATUSES),
    });
  });
}

export const seedApplications: Application[] = buildSeedApplications();
