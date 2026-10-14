import type { EmailLine } from "./activity";

export const EMAIL_LINES: { id: EmailLine; label: string }[] = [
  { id: "deposits", label: "Deposits" },
  { id: "los", label: "LOS" },
  { id: "servicing", label: "Servicing" },
  { id: "other", label: "Other" },
];

export const LINE_TEMPLATES: Record<EmailLine, Record<string, string[]>> = {
  deposits: {
    "Rejection/Decline": ["General Rejection V2", "QualiFile Rejection", "QualiFile or Telecheck Funding Rejection"],
    "New Account Open": ["Welcome"],
    "Follow up": ["Application Drop Off", "Application Drop Off 2"],
    "Security/Verification": ["Self Serve OTP", "Password Reset"],
  },
  los: {
    "Follow up": ["Continue your application", "Document request"],
    "Rejection/Decline": ["Unable to approve"],
    Offer: ["Rate offer"],
  },
  servicing: {},
  other: {
    General: ["Client care follow-up", "General notice"],
  },
};

export function lineLabel(id: EmailLine) {
  return EMAIL_LINES.find((item) => item.id === id)?.label ?? id;
}

export function categoriesFor(line: EmailLine) {
  return Object.keys(LINE_TEMPLATES[line]);
}

export function templatesFor(line: EmailLine, category: string) {
  return LINE_TEMPLATES[line][category] ?? [];
}
