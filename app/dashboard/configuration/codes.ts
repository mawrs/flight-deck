export type CodeRow = { code: string; description: string };

export const CODE_NAMES = [
  "Account Type Codes",
  "Address Own Type Codes",
  "Address Line Type Codes",
  "Address Usage Codes",
  "Country Codes",
  "Document Format Codes",
  "Delivery Method Codes",
  "Document Request Status Codes",
  "Document Storage Method Codes",
  "Document SQL",
  "Document Type Codes",
  "Escrow Type Codes",
  "Fund Sources",
  "Initially Payable To",
  "Organization Type Codes",
  "Payment Method Codes",
  "Business/Commercial Purpose Codes",
  "State Codes",
  "Components",
  "Value Source",
  "User Sign-On Attempts",
  "Suffix Codes",
];

const CODE_TABLES: Record<string, CodeRow[]> = {
  "Account Type Codes": [
    { code: "CKNG", description: "Checking" },
    { code: "SVNG", description: "Savings" },
    { code: "MMDA", description: "Money Market" },
    { code: "CD", description: "Certificate of Deposit" },
    { code: "LOAN", description: "Loan" },
    { code: "GL", description: "General Ledger" },
  ],
  "Address Own Type Codes": [
    { code: "OWN", description: "Own" },
    { code: "RENT", description: "Rent" },
    { code: "FAM", description: "Family" },
    { code: "OTH", description: "Other" },
  ],
  "Address Line Type Codes": [
    { code: "STR", description: "Street" },
    { code: "PO", description: "PO Box" },
    { code: "RUR", description: "Rural Route" },
    { code: "MIL", description: "Military" },
  ],
  "Address Usage Codes": [
    { code: "HOME", description: "Home" },
    { code: "MAIL", description: "Mailing" },
    { code: "BUS", description: "Business" },
    { code: "PREV", description: "Previous" },
  ],
  "Country Codes": [
    { code: "US", description: "United States" },
    { code: "CA", description: "Canada" },
    { code: "MX", description: "Mexico" },
    { code: "GB", description: "United Kingdom" },
  ],
  "Document Format Codes": [
    { code: "PDF", description: "PDF" },
    { code: "TIFF", description: "TIFF Image" },
    { code: "JPEG", description: "JPEG Image" },
    { code: "DOCX", description: "Word Document" },
  ],
  "Delivery Method Codes": [
    { code: "EMAL", description: "Email" },
    { code: "MAIL", description: "Postal Mail" },
    { code: "PORT", description: "Portal" },
    { code: "FAX", description: "Fax" },
  ],
  "Document Request Status Codes": [
    { code: "PEND", description: "Pending" },
    { code: "SENT", description: "Sent" },
    { code: "RECV", description: "Received" },
    { code: "INCM", description: "Incomplete" },
    { code: "WAIV", description: "Waived" },
  ],
  "Document Storage Method Codes": [
    { code: "IMAG", description: "Imaged" },
    { code: "ELEC", description: "Electronic" },
    { code: "PAPR", description: "Paper" },
    { code: "HYBR", description: "Hybrid" },
  ],
  "Document SQL": [
    { code: "CRDT", description: "Credit Report Query" },
    { code: "INC", description: "Income Document Query" },
    { code: "IDNT", description: "Identity Document Query" },
    { code: "EDUC", description: "Education Document Query" },
  ],
  "Document Type Codes": [
    { code: "ID", description: "Identity" },
    { code: "KYC", description: "KYC / CIP" },
    { code: "CRPT", description: "Credit Report" },
    { code: "INC", description: "Income" },
    { code: "EDUC", description: "Education" },
    { code: "MLA", description: "MLA Verification" },
    { code: "DISC", description: "Disclosure" },
  ],
  "Escrow Type Codes": [
    { code: "TAX", description: "Tax" },
    { code: "INS", description: "Insurance" },
    { code: "HOA", description: "HOA" },
    { code: "FLT", description: "Flood" },
  ],
  "Fund Sources": [
    { code: "CASH", description: "Cash" },
    { code: "GIFT", description: "Gift" },
    { code: "SALE", description: "Sale of Asset" },
    { code: "RET", description: "Retirement" },
    { code: "GRNT", description: "Grant" },
  ],
  "Initially Payable To": [
    { code: "BORR", description: "Borrower" },
    { code: "SCHL", description: "School" },
    { code: "SRVC", description: "Servicer" },
    { code: "LEND", description: "Lender" },
  ],
  "Organization Type Codes": [
    { code: "BRCH", description: "Branch" },
    { code: "CBUR", description: "Credit Bureau" },
    { code: "CRPT", description: "Credit Reporting Agency" },
    { code: "EMPL", description: "Employer" },
    { code: "ORIG", description: "Originator" },
    { code: "SCHL", description: "School/University" },
    { code: "SRVC", description: "Loan Servicer" },
    { code: "VNDR", description: "Third Party Vendor" },
  ],
  "Payment Method Codes": [
    { code: "ACH", description: "ACH" },
    { code: "WIRE", description: "Wire" },
    { code: "CHK", description: "Check" },
    { code: "CARD", description: "Card" },
  ],
  "Business/Commercial Purpose Codes": [
    { code: "RENT", description: "Rental Property" },
    { code: "BUS", description: "Business Investment" },
    { code: "AGR", description: "Agriculture" },
    { code: "CONS", description: "Construction" },
  ],
  "State Codes": [
    { code: "AL", description: "Alabama" },
    { code: "CA", description: "California" },
    { code: "FL", description: "Florida" },
    { code: "GA", description: "Georgia" },
    { code: "IL", description: "Illinois" },
    { code: "NY", description: "New York" },
    { code: "TX", description: "Texas" },
    { code: "WA", description: "Washington" },
  ],
  Components: [
    { code: "INC", description: "Income" },
    { code: "DTI", description: "DTI" },
    { code: "FICO", description: "FICO" },
    { code: "PAY", description: "Payoff" },
    { code: "DOC", description: "Documents" },
    { code: "RATE", description: "Rates" },
  ],
  "Value Source": [
    { code: "APP", description: "Application" },
    { code: "CR", description: "Credit Report" },
    { code: "CALC", description: "Calculated" },
    { code: "MAN", description: "Manual" },
    { code: "VER", description: "Verified" },
  ],
  "User Sign-On Attempts": [
    { code: "OK", description: "Successful Sign-On" },
    { code: "FAIL", description: "Failed Sign-On" },
    { code: "LOCK", description: "Account Locked" },
    { code: "RST", description: "Password Reset" },
  ],
  "Suffix Codes": [
    { code: "JR", description: "Jr." },
    { code: "SR", description: "Sr." },
    { code: "II", description: "II" },
    { code: "III", description: "III" },
    { code: "IV", description: "IV" },
  ],
};

export const ORGANIZATION_TYPES = CODE_TABLES["Organization Type Codes"];

export function codesFor(name: string): CodeRow[] {
  return CODE_TABLES[name]?.map((row) => ({ ...row })) ?? [];
}

export function codeSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function codeTitle(name: string) {
  return name.replace(/ Codes$/, "");
}

export function codeBySlug(slug: string) {
  return CODE_NAMES.find((name) => codeSlug(name) === slug) ?? null;
}
