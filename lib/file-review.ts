import { calculate } from "@/lib/calculations";
import { RATE_TERMS, rateFor, type RateTerm } from "@/lib/calculations/rates";
import { money, percent } from "@/lib/format";
import { loansForPayoff } from "@/lib/payoffs";
import type { Application, FileReview, Person } from "@/lib/types";

export const FILE_REVIEW_OWNER = "Casey Morrow";

export const FILE_REVIEW_TYPES = [
  {
    id: "applicant-only",
    label: "Applicant Only",
    detail: "ReFi Applicant Only File Review",
    cosigner: false,
  },
  {
    id: "co-applicant",
    label: "Co-Applicant",
    detail: "ReFi Co-Applicant File Review",
    cosigner: true,
  },
  {
    id: "edmed-applicant",
    label: "EdMed Incomeless Applicant Only",
    detail: "",
    cosigner: false,
  },
  {
    id: "edmed-coapplicant",
    label: "EdMed Incomeless Co-Applicant",
    detail: "",
    cosigner: true,
  },
  {
    id: "inschool-applicant",
    label: "InSchool/EdMed Applicant Only",
    detail: "",
    cosigner: false,
  },
  {
    id: "inschool-coapplicant",
    label: "InSchool/EdMed Co-Applicant",
    detail: "",
    cosigner: true,
  },
] as const;

export type FileReviewTypeId = (typeof FILE_REVIEW_TYPES)[number]["id"];

export const FILE_REVIEW_STATUSES = ["New", "In Review", "Completed"];
export const QUALIFIED_TO = ["Applicant", "Cosigner", "Both"];
export const QUALIFIED_TIERS = ["Tier 1", "Tier 2", "Tier 3", "Tier 4", "Tier 5"];
export const LOAN_STATEMENT = ["Yes", "No"];
export const SERVICERS = ["MOHELA", "PHEAA", "Nelnet", "Aidvantage", "Great Lakes", "OSLA"];

export function fileReviewType(id: string) {
  return FILE_REVIEW_TYPES.find((item) => item.id === id) ?? FILE_REVIEW_TYPES[0];
}

function dateMdY(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-");
  if (!year || !month || !day) return value;
  return `${month}/${day}/${year}`;
}

function formatSsn(person: Person) {
  const digits = (person.ssn || person.ssnLast4).replace(/\D/g, "");
  if (digits.length === 9) return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  if (digits.length === 4) return `***-**-${digits}`;
  return person.ssn || person.ssnLast4;
}

function tierFromFico(fico: number) {
  if (fico >= 780) return "Tier 1";
  if (fico >= 740) return "Tier 2";
  if (fico >= 700) return "Tier 3";
  if (fico >= 660) return "Tier 4";
  return "Tier 5";
}

function qualifiedRate(application: Application) {
  const term = (RATE_TERMS.includes(application.requestedTerm as RateTerm)
    ? application.requestedTerm
    : 120) as RateTerm;
  return percent(rateFor(application.requestedRateType, term) ?? 0.0849);
}

function suggestedServicer(application: Application) {
  const payoffLoans = loansForPayoff(application);
  const selected = payoffLoans.find((item) => item.selected) ?? payoffLoans[0];
  const lender = selected?.adjCreditorName || selected?.lender || "";
  if (/pheaa/i.test(lender)) return "PHEAA";
  if (/mohela/i.test(lender)) return "MOHELA";
  if (/nelnet/i.test(lender)) return "Nelnet";
  if (lender && !/equifax|sallie mae|lakeshore|riverstone|harbor/i.test(lender)) return lender;
  return "MOHELA";
}

export function fileReviewDefaults(application: Application, recordTypeId: string): FileReview {
  const type = fileReviewType(recordTypeId);
  const calc = calculate(application);
  const job = application.employment[0];
  const borrower = application.borrower;
  const cosigner = application.cosigner;
  const opportunityLabel = `${borrower.fullName}-${application.id}`;
  const docsReady = application.documents.some(
    (item) => item.reviewStatus === "approved" || item.reviewStatus === "submitted",
  );

  return {
    recordTypeId: type.id,
    recordType: type.label,
    name: `${opportunityLabel} ${type.label}`,
    status: "New",
    owner: FILE_REVIEW_OWNER,
    underwriter: application.underwriter,
    opportunityLabel,
    qualifiedTo: type.cosigner && cosigner ? "Both" : "Applicant",
    qualifiedRate: qualifiedRate(application),
    qualifiedTier: tierFromFico(borrower.fico || borrower.creditScore),
    loanStatementCompliant: docsReady || application.documents.length ? "Yes" : "No",
    suggestedServicer: suggestedServicer(application),
    servicerOverridePheaa: false,
    servicerOverrideMohela: false,
    loanAmount: money(application.amount),
    term: `${application.requestedTerm} months`,
    rateType: application.requestedRateType,
    applicantName: borrower.fullName,
    birthDate: dateMdY(borrower.birthDate),
    phone: borrower.phone,
    email: borrower.email,
    street: borrower.street,
    city: borrower.city,
    state: borrower.state,
    zip: borrower.zip,
    ssn: formatSsn(borrower),
    citizenship: borrower.citizenship,
    livingArrangement:
      borrower.livingArrangement || (application.income.housingPayment > 0 ? "Renting" : "Owning"),
    degree: borrower.degree,
    school: borrower.school,
    graduationYear: borrower.graduationYear,
    annualIncome: money(borrower.statedAnnualIncome || calc.annualizedIncome),
    monthlyIncome: money(calc.monthlyIncome),
    housingPayment: money(calc.housingPayment),
    fico: String(borrower.fico || borrower.creditScore || ""),
    dti: calc.dti == null ? "" : `${(calc.dti * 100).toFixed(2)}%`,
    employmentStatus: job?.status ?? "",
    employer: job?.employer ?? "",
    cosignerName: cosigner?.fullName ?? "",
    cosignerEmail: cosigner?.email ?? "",
    cosignerRelationship: cosigner?.relationship ?? "",
    savedAt: null,
  };
}
