"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/Button";
import { useFileWorkspace } from "@/components/application/file-context";
import { ReviewCycleBadge } from "@/components/application/ReviewCycleBadge";
import { FloatInput } from "@/components/ui/FloatInput";
import { dateOnly } from "@/lib/format";
import { useApplication } from "@/lib/store";
import type {
  Application,
  ApplicationPatch,
  OpportunityField,
  OpportunityFields,
  WorkflowStatus,
} from "@/lib/types";

const LOAN_STATUS: Record<WorkflowStatus, string> = {
  "pre-review": "Borrower Application Submitted",
  "needs-docs": "Needs Documentation",
  "senior-review": "UW Final Review",
  returned: "Returned to UW",
  approved: "Approved",
};

function addDays(value: string, days: number) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function resolveOpportunity(application: Application): Required<OpportunityFields> {
  const extra = application.opportunity ?? {};
  return {
    opportunityName: extra.opportunityName ?? application.opportunityName,
    loanStatus: extra.loanStatus ?? LOAN_STATUS[application.status],
    stage: extra.stage ?? application.stage,
    accountName: extra.accountName ?? application.borrower.fullName,
    leadSource: extra.leadSource ?? "",
    recordType: extra.recordType ?? application.recordType,
    preReviewPriority: extra.preReviewPriority ?? application.difficulty,
    parentLoan: extra.parentLoan ?? "",
    owner: extra.owner ?? application.owner,
    cosignerDeadline: extra.cosignerDeadline ?? "",
    closeDate: extra.closeDate ?? dateOnly(addDays(application.applicationDate, 14)),
    loanStatusDate: extra.loanStatusDate ?? dateOnly(application.applicationDate),
    probability: extra.probability ?? "55%",
    lastReferralPartner: extra.lastReferralPartner ?? application.referrer,
    referralPartner: extra.referralPartner ?? application.referrer,
    duplicateApplication: extra.duplicateApplication ?? "",
  };
}

function patchForField(
  application: Application,
  key: OpportunityField,
  value: string,
): ApplicationPatch {
  const patch: ApplicationPatch = { opportunity: { [key]: value } };
  if (key === "opportunityName") patch.opportunityName = value;
  if (key === "stage") patch.stage = value;
  if (key === "accountName") patch.borrower = { ...application.borrower, fullName: value };
  if (key === "owner") patch.owner = value;
  if (key === "referralPartner") patch.referrer = value;
  if (key === "preReviewPriority" && (value === "Medium" || value === "Hard")) {
    patch.difficulty = value;
  }
  if (key === "recordType" && (value === "InSchool" || value === "ReFi" || value === "EdMed")) {
    patch.recordType = value;
  }
  return patch;
}

const LEFT_FIELDS: OpportunityField[] = [
    "opportunityName",
    "loanStatus",
    "stage",
    "accountName",
    "leadSource",
    "recordType",
    "preReviewPriority",
    "parentLoan",
  ];
const RIGHT_FIELDS: OpportunityField[] = [
    "owner",
    "cosignerDeadline",
    "closeDate",
    "loanStatusDate",
    "probability",
    "lastReferralPartner",
    "referralPartner",
    "duplicateApplication",
];

function patchForValues(application: Application, values: Required<OpportunityFields>): ApplicationPatch {
  return [...LEFT_FIELDS, ...RIGHT_FIELDS].reduce<ApplicationPatch>((patch, key) => {
    const next = patchForField(application, key, values[key]);
    return {
      ...patch,
      ...next,
      opportunity: { ...patch.opportunity, ...next.opportunity },
      borrower: next.borrower ?? patch.borrower,
    };
  }, { opportunity: {} });
}

export function OpportunityPage() {
  const { id, readOnly } = useFileWorkspace();
  const { application, updateApplication } = useApplication(id);
  const [editing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState<Required<OpportunityFields> | null>(null);
  if (!application) return null;
  const file = application;
  const fields = resolveOpportunity(file);
  const shown = editing && drafts ? drafts : fields;

  function startEdit() {
    setDrafts(fields);
    setEditing(true);
  }

  function finishEdit() {
    if (drafts) updateApplication(id, patchForValues(file, drafts));
    setEditing(false);
    setDrafts(null);
  }

  return (
    <div className="flex min-h-full flex-col md:flex-row md:items-stretch">
      <section className="flex min-w-0 flex-1 flex-col border-b border-gray-light md:border-b-0">
        <PanelHeader
          action={
            readOnly ? null : (
              <Button variant="text" size="small" onClick={editing ? finishEdit : startEdit}>
                {editing ? "Done" : "Edit responses"}
              </Button>
            )
          }
        >
          Opportunity Information
        </PanelHeader>
        <div className="p-lg">
          <div className="flex flex-wrap gap-3xl">
            <FieldList
              fields={LEFT_FIELDS}
              values={shown}
              editing={editing}
              onChange={(key, value) => setDrafts((current) => (current ? { ...current, [key]: value } : current))}
            >
              <div className="flex flex-col gap-xs">
                <dt className="text-xs text-gray-medium">Review Cycle</dt>
                <dd className="flex min-h-5 items-center">
                  <ReviewCycleBadge application={file} />
                </dd>
              </div>
            </FieldList>
            <FieldList
              fields={RIGHT_FIELDS}
              values={shown}
              editing={editing}
              onChange={(key, value) => setDrafts((current) => (current ? { ...current, [key]: value } : current))}
            />
          </div>
        </div>
      </section>
      <section className="flex w-full flex-col border-t border-gray-light md:w-[498px] md:shrink-0 md:border-t-0 md:border-l">
        <PanelHeader as="h2">Summary</PanelHeader>
        <SummaryList application={application} />
      </section>
    </div>
  );
}

function PanelHeader({
  children,
  action,
  as: Tag = "h1",
}: {
  children: string;
  action?: ReactNode;
  as?: "h1" | "h2";
}) {
  return (
    <div className="uw-card-header">
      <Tag className="text-lg text-black">{children}</Tag>
      {action}
    </div>
  );
}

function daysSince(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const start = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((today - start) / 86_400_000);
}

function daysLabel(days: number | null) {
  if (days == null) return "—";
  return `${days} ${days === 1 ? "day" : "days"}`;
}

function SummaryList({ application }: { application: Application }) {
  const decisionDate = application.approvedAt ?? addDays(application.applicationDate, 14);
  const items: { label: string; value: string; tone?: "days" }[] = [
    { label: "Decision Date", value: dateOnly(decisionDate) },
    {
      label: "Days since borrower hard pull",
      value: daysLabel(daysSince(application.hardCreditDate)),
      tone: "days",
    },
    {
      label: "Days since cosigner hard pull",
      value: application.cosigner ? daysLabel(daysSince(application.hardCreditDate)) : "—",
      tone: application.cosigner ? "days" : undefined,
    },
    {
      label: "Days since Initial PreReview",
      value: daysLabel(daysSince(application.preReviewAt)),
      tone: "days",
    },
    { label: "Degree", value: application.borrower.degree || "—" },
    { label: "Repayment", value: "Immediate" },
  ];

  return (
    <dl className="flex flex-col gap-md p-lg">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-xs">
          <dt className="text-xs text-gray-medium">{item.label}</dt>
          <dd className={`text-sm ${item.tone === "days" ? "text-success" : "text-black"}`}>
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

const LABELS: Record<OpportunityField, string> = {
  opportunityName: "Opportunity Name",
  loanStatus: "Loan Status",
  stage: "Stage",
  accountName: "Account Name",
  leadSource: "Lead Source",
  recordType: "Opportunity Record Type",
  preReviewPriority: "PreReview Priority",
  parentLoan: "Parent Loan",
  owner: "Opportunity Owner",
  cosignerDeadline: "Cosigner Deadline",
  closeDate: "Close Date",
  loanStatusDate: "Loan Status Date",
  probability: "Probability (%)",
  lastReferralPartner: "Last Referral Partner",
  referralPartner: "Referral Partner",
  duplicateApplication: "Duplicate Application",
};

function FieldList({
  fields,
  values,
  editing,
  onChange,
  children,
}: {
  fields: OpportunityField[];
  values: Required<OpportunityFields>;
  editing: boolean;
  onChange: (key: OpportunityField, value: string) => void;
  children?: ReactNode;
}) {
  return (
    <dl className={`flex flex-col gap-md ${editing ? "min-w-[240px] flex-1" : "min-w-40"}`}>
      {children}
      {fields.map((key) =>
        editing ? (
          <FloatInput
            key={key}
            label={LABELS[key]}
            value={values[key]}
            onChange={(value) => onChange(key, value)}
          />
        ) : (
          <div key={key} className="flex flex-col gap-xs">
            <dt className="text-xs text-gray-medium">{LABELS[key]}</dt>
            <dd className="flex min-h-5 items-center">
              <ValueDisplay field={key} value={values[key]} />
            </dd>
          </div>
        ),
      )}
    </dl>
  );
}

function ValueDisplay({ field, value }: { field: OpportunityField; value: string }) {
  if (!value) return <span className="text-sm text-black">&nbsp;</span>;
  if (field === "accountName") {
    return <span className="text-sm text-primary underline">{value}</span>;
  }
  if (field === "owner") {
    return <Owner name={value} />;
  }
  return <span className="text-sm text-black">{value}</span>;
}

function Owner({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-sm text-sm text-black">
      <span
        aria-hidden
        className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-bg text-[10px] font-semibold text-primary"
      >
        {initials(name)}
      </span>
      {name}
    </span>
  );
}

