import { money } from "./format";
import { loanQueueHref } from "./loan-routes";
import type { OpsNotification } from "./ops-types";

export type FileStatus = "PENDING" | "APPROVED" | "REJECTED";

export type FileRow = {
  id: string;
  record: string;
  loanId: string;
  ssn: string;
  amount: string;
  date: string;
  reason: string;
  school: string;
  status: FileStatus;
};

const LOANS = ["loan-5001", "loan-5002", "loan-5003", "loan-5004", "loan-5005", "loan-5006", "loan-5007"];

export const PENDING_FILES: FileRow[] = [
  { id: "1", record: "@1-10", loanId: LOANS[0], ssn: "", amount: "020000000", date: "2026/01/22", reason: "", school: "003778500", status: "PENDING" },
  { id: "2", record: "@1-10", loanId: LOANS[1], ssn: "", amount: "002175000", date: "2026/01/22", reason: "", school: "012303327", status: "PENDING" },
  { id: "3", record: "@1-10", loanId: LOANS[2], ssn: "", amount: "000647000", date: "2026/08/22", reason: "", school: "00981500", status: "PENDING" },
  { id: "4", record: "@1-10", loanId: LOANS[3], ssn: "", amount: "013078500", date: "2026/05/22", reason: "", school: "00981500", status: "PENDING" },
  { id: "5", record: "@1-10", loanId: LOANS[4], ssn: "", amount: "001376500", date: "2026/06/05", reason: "", school: "00981500", status: "PENDING" },
  { id: "6", record: "@1-10", loanId: LOANS[5], ssn: "", amount: "000152210", date: "2026/08/05", reason: "", school: "002288000", status: "PENDING" },
  { id: "7", record: "@1-10", loanId: LOANS[6], ssn: "", amount: "009800000", date: "2026/08/06", reason: "", school: "00232300", status: "PENDING" },
];

export function cancellationNotices(loans: { id: string; applicationId: string | null }[]): OpsNotification[] {
  return PENDING_FILES.filter((row) => row.status === "PENDING").map((row, index) => {
    const number = loans.find((loan) => loan.id === row.loanId)?.applicationId ?? row.loanId;
    const [year, month, day] = row.date.split("/");
    const amount = Number(row.amount) / 100;
    return {
      id: `cancel-${row.id}`,
      kind: "cancellation",
      actor: "File Processing",
      body: `Loan ${number} has a pending cancellation of ${money(Number.isFinite(amount) ? amount : 0)} dated ${month}/${day}/${year}.`,
      caseId: "",
      href: loanQueueHref("file-processing"),
      createdAt: `2026-10-15T${String(9 + index).padStart(2, "0")}:15:00`,
      read: false,
    };
  });
}
