export interface InSchoolDisbursementRow {
  loanNumber: string;
  updatedAt: string;
  lastName: string;
  firstName: string;
  school: string;
  loanStatus: string;
  currentYear: boolean;
  disbursementDate: string;
  certifiedAt: string;
  daysToCertification: number;
  termMonths: number;
  rateType: "FIXED";
  rate: number;
  originalAmount: number;
  revisedAmount: number;
  modified: boolean;
  estimatedAssistance: number;
  disbursed: boolean;
}

function row(
  loanNumber: string,
  updatedAt: string,
  lastName: string,
  firstName: string,
  school: string,
  loanStatus: string,
  disbursementDate: string,
  certifiedAt: string,
  daysToCertification: number,
  termMonths: number,
  rate: number,
  originalAmount: number,
  revisedAmount: number,
  estimatedAssistance: number,
  currentYear = true,
  modified = true,
  disbursed = true,
): InSchoolDisbursementRow {
  return {
    loanNumber,
    updatedAt,
    lastName,
    firstName,
    school,
    loanStatus,
    currentYear,
    disbursementDate,
    certifiedAt,
    daysToCertification,
    termMonths,
    rateType: "FIXED",
    rate,
    originalAmount,
    revisedAmount,
    modified,
    estimatedAssistance,
    disbursed,
  };
}

export const INSCHOOL_DISBURSEMENTS: InSchoolDisbursementRow[] = [
  row("1391587", "2026-06-22T21:39:33", "jenison", "lance", "University of Michigan", "In School", "2026-08-15", "2025-01-23", 20.5, 120, 3.69, 15000, 15000, 20500),
  row("1391757", "2026-03-30T22:54:24", "Lind", "Bridget", "Ohio State University", "In School", "2026-08-20", "2025-01-28", 22.1, 180, 5.49, 53000, 53000, 0),
  row("1393248", "2026-04-07T12:35:51", "Mueckler", "Caroline", "Penn State University", "In School", "2026-09-01", "2026-04-24", 24.82, 120, 4.5, 95000, 95000, 0),
  row("1393269", "2026-01-21T18:33:21", "Campbell", "Parker", "University of Florida", "In School", "2026-08-18", "2025-04-17", 26.4, 120, 8.5, 520000, 483340, 910000),
  row("1393537", "2026-01-20T10:00:08", "ingram", "Dana", "Arizona State University", "Approved", "2026-09-04", "2025-06-03", 23, 120, 11, 169400, 169400, 38500),
  row("1393574", "2026-06-26T14:26:03", "Ma", "mireille", "University of Texas", "In School", "2026-08-25", "2025-06-23", 28.15, 120, 4.5, 50000, 50000, 30000),
  row("1393620", "2026-07-07T12:32:10", "Rowe", "Bria", "Purdue University", "In School", "2026-09-10", "2025-07-23", 21.7, 120, 3.69, 35000, 35000, 0),
  row("1393739", "2026-01-21T10:00:09", "Goodwin", "Bryce", "University of Washington", "In School", "2026-08-12", "2025-05-07", 30.2, 180, 5.49, 32000, 32000, 12000),
  row("1393749", "2026-04-23T22:40:16", "Fulton", "Jay", "Michigan State University", "In School", "2026-09-08", "2025-06-03", 26.51, 120, 8.5, 429000, 429000, 0),
  row(
    "1392104",
    "2025-09-14T15:12:04",
    "Walsh",
    "Owen",
    "University of Michigan",
    "In School",
    "2025-08-20",
    "2025-06-02",
    18,
    120,
    4.25,
    28000,
    28000,
    4000,
    false,
    false,
    true,
  ),
];

export function reportDate(value: string | null) {
  if (!value) return "Null";
  const [year, month, day] = value.split("-");
  return `${Number(month)}/${Number(day)}/${year}`;
}

export function reportDateTime(value: string) {
  const [date, time] = value.split("T");
  const [hour, minute, second] = time.split(":");
  const hours = Number(hour);
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${reportDate(date)} ${hour12}:${minute}:${second} ${suffix}`;
}
