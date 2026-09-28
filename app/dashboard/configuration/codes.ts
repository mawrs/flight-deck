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

export const ORGANIZATION_TYPES: CodeRow[] = [
  { code: "BRCH", description: "Branch" },
  { code: "CBUR", description: "Credit Bureau" },
  { code: "CRPT", description: "Credit Reporting Agency" },
  { code: "EMPL", description: "Employer" },
  { code: "ORIG", description: "Originator" },
  { code: "SCHL", description: "School/University" },
  { code: "SRVC", description: "Loan Servicer" },
  { code: "VNDR", description: "Third Party Vendor" },
];

export function codeSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function codeTitle(name: string) {
  return name.replace(/ Codes$/, "");
}

export function codeBySlug(slug: string) {
  return CODE_NAMES.find((name) => codeSlug(name) === slug) ?? null;
}
