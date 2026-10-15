import type { Application } from "@/lib/types";

export type CustomerEmail = {
  id: string;
  title: string;
  sentAt: string;
  body: string;
  emailTo?: string;
  emailCc?: string;
  emailBcc?: string;
};

function atTime(value: string, days: number, hour: number, minute: number) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  date.setDate(date.getDate() + days);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

export function sentStamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const day = date.getDate();
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const meridiem = hours >= 12 ? "pm" : "am";
  hours = hours % 12 || 12;
  return `${month} ${day}, ${year} at ${hours}:${minutes}${meridiem}`;
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function emailHtml(value: string) {
  if (/<[a-z][\s\S]*>/i.test(value)) return value;
  return value
    .split(/\n{2,}/)
    .map((part) => `<p>${escapeHtml(part).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export function emailsForApplication(application: Application): CustomerEmail[] {
  const owner = application.owner || "SouthEast Bank";
  const borrower = application.borrower.fullName;
  const first = borrower.split(" ")[0] || borrower;
  const approved = application.status === "approved";
  const decisionAt = application.approvedAt ?? application.preReviewAt;
  const product = application.recordType;

  const items: CustomerEmail[] = [
    {
      id: `${application.id}-received`,
      title: "We received your application",
      sentAt: atTime(application.applicationDate, 0, 10, 5),
      body: `Hi ${first},\n\nWe received your ${product} application and saved your progress. Sign in if you still need to add documents or review what you submitted.\n\n${owner}\nELFI`,
    },
    {
      id: `${application.id}-decision`,
      title: approved ? "Your ELFI Loan Has Been Approved" : "Your ELFI Loan Has Been Conditionally Approved!",
      sentAt: atTime(decisionAt, 0, 12, 24),
      body: `Hi ${first},\n\nYour ELFI loan has been ${approved ? "approved" : "conditionally approved"}. Sign in to review the terms and complete any remaining items.\n\n${owner}\nELFI`,
    },
  ];

  if (application.status === "needs-docs") {
    items.push({
      id: `${application.id}-documents`,
      title: "Documents needed for your application",
      sentAt: atTime(application.preReviewAt, 1, 9, 40),
      body: `Hi ${first},\n\nWe still need documents before we can finish reviewing your ${product} application. Sign in and upload the items listed on your file.\n\n${owner}\nELFI`,
    });
  }

  return items.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
}
