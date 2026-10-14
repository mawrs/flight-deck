import { jsPDF } from "jspdf";

export function openEmailPdf(email: {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  sentAt: string;
  caseNumber?: string;
}) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  doc.setFontSize(14);
  doc.text(email.subject || "Certification follow-up", 40, 48);
  doc.setFontSize(10);
  const header = [];
  if (email.caseNumber?.trim()) header.push(`Case: ${email.caseNumber.trim()}`);
  header.push(`To: ${email.to}`);
  if (email.cc?.trim()) header.push(`Cc: ${email.cc.trim()}`);
  if (email.bcc?.trim()) header.push(`Bcc: ${email.bcc.trim()}`);
  header.push(`Sent: ${email.sentAt}`);
  const text = [...header, "", email.body].join("\n");
  doc.text(doc.splitTextToSize(text, 532), 40, 76);
  const url = URL.createObjectURL(doc.output("blob"));
  window.open(url, "_blank", "noopener,noreferrer");
}
