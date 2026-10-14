export const CASE_ORIGINS = [
  "BSA",
  "Client Care",
  "Compliance",
  "Data Analytics",
  "Deposit Operations",
  "Digital Bank",
  "Digital Solutions",
  "ELFi",
  "Executive",
  "Finance",
  "Human Resources",
  "Information Security",
  "Information Technology",
  "Legal",
  "Loan Operations",
  "Marketing",
  "Retail Operations",
  "Risk Management",
  "Training/Development",
];

export const CASE_REQUEST_TYPES = [
  "Development Request (New Feature, Enhancement, Modification)",
  "Support Request (Question, Problem, Review)",
  "Dashboard/Report Request (Salesforce)",
];

export const CASE_QUEUES = [
  "ELFi Operations Analyst",
  "Marketing Queue",
  "Q2 Composable Dashboard",
  "SEB Central Disbursement",
  "SEB Central Processing",
  "SEB Compliance",
  "SEB Credit Department",
  "SEB Data Processing",
  "SEB Deposit Operations",
  "SEB Digital Solutions",
  "SEB ELFi",
  "SEB Invoices",
  "SEB Legal",
  "SEB Loan Audit",
  "SEB Loan Booking",
  "SEB Loan Operations",
  "SEB Loan Quality Control",
  "SEB Loan Servicing",
  "SEB Print Form",
];

export const CASE_SUB_QUEUES = [
  "Data Analytics",
  "ELFi Review Queue",
  "Escalation Queue",
  "Help Desk Queue",
  "Inactive",
  "InSchool ACA",
  "Late Fee Queue",
  "Rate Concession Queue",
  "Servicing Queue",
  "Underwriting Queue",
];

export const DISBURSEMENT_CASE_STATUSES = [
  "Pending",
  "Scheduled",
  "Disbursed",
  "On Hold",
  "Cancelled",
];

export const CASE_REASONS = [
  "Disbursement/Payoff",
  "Error",
  "Internal",
  "Question",
  "Refund Request - MOHELA",
  "Refund Request - PHEAA",
  "Review",
  "Other",
];

export const CASE_PRIORITIES = ["Low", "Medium", "High"];

export const CASE_CONTACTS = [
  { id: "melissa-markis", label: "Melissa Markis", meta: "9045537942" },
  { id: "earl-scott", label: "Earl Scott", meta: "(701)-721-2292" },
  { id: "kali-whitford", label: "Kali Whitford", meta: "(860)-910-6162" },
  { id: "brizha-knowles", label: "Brizha Knowles", meta: "(872)-772-9600" },
  { id: "paige-massey", label: "Paige Massey", meta: "(337)-678-2962" },
];

export const CASE_OPPORTUNITIES = [
  { id: "melissa-1412303", contactId: "melissa-markis", label: "Melissa Markis-1412303", meta: "Didier Leclaire" },
  { id: "melissa-1366122", contactId: "melissa-markis", label: "Melissa Markis-1366122", meta: "Dylan Sparks" },
  { id: "earl-1409328", contactId: "earl-scott", label: "Earl Scott-1409328", meta: "Jeremiah Simmons" },
  { id: "kali-1406101", contactId: "kali-whitford", label: "Kali Whitford-1406101", meta: "Stan Mitchell" },
  { id: "kali-1372758", contactId: "kali-whitford", label: "Kali Whitford-1372758", meta: "Dylan Sparks" },
  { id: "brizha-1408104", contactId: "brizha-knowles", label: "Brizha Knowles-1408104", meta: "Didier Leclaire" },
  { id: "paige-1399201", contactId: "paige-massey", label: "Paige Massey-1399201", meta: "Stan Mitchell" },
];

export function opportunitiesForContact(name: string) {
  const person = CASE_CONTACTS.find((item) => item.label === name);
  if (!person) return [];
  return CASE_OPPORTUNITIES.filter((item) => item.contactId === person.id);
}

export function picklist(labels: readonly string[]) {
  return [{ id: "", label: "--None--" }, ...labels.map((label) => ({ id: label, label }))];
}
