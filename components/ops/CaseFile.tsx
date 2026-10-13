"use client";

import { useState, type ReactNode } from "react";
import { NotesModal } from "@/components/application/NotesModal";
import { Button } from "@/components/Button";
import { Button as HeaderButton } from "@/components/ui/Button";
import { CaseFeed } from "@/components/ops/CaseFeed";
import { OpsCard, OpsFile, OpsMissing } from "@/components/ops/OpsFile";
import { Select } from "@/components/ui/Dropdown";
import { FloatInput } from "@/components/ui/FloatInput";
import { shortDate } from "@/lib/format";
import { servicingHome } from "@/lib/loan-routes";
import { certificationById, opsLabel } from "@/lib/ops-logic";
import { ADVISORS } from "@/lib/ops-data";
import { useOps } from "@/lib/ops-store";
import { useStore } from "@/lib/store";
import type { CaseForm, CasePatch, CasePriority, CaseStatus, CaseType } from "@/lib/ops-types";

const STATUS_OPTIONS: { id: CaseStatus; label: string }[] = [
  { id: "open", label: "New" },
  { id: "waiting-on-advisor", label: "On Hold" },
  { id: "waiting-on-school", label: "On Hold" },
  { id: "resolved", label: "Resolved" },
];

const PRIORITY_OPTIONS: { id: CasePriority; label: string }[] = [
  { id: "high", label: "High" },
  { id: "medium", label: "Medium" },
  { id: "low", label: "Low" },
];

const TYPE_OPTIONS: { id: CaseType; label: string }[] = [
  { id: "disbursement-change", label: "Disbursement change" },
  { id: "disbursement-review", label: "Disbursement review" },
  { id: "school-code", label: "School code correction" },
  { id: "resend-certification", label: "Resend certification" },
  { id: "borrower-follow-up", label: "Borrower follow-up" },
];

export function CaseFile({ id }: { id: string }) {
  const ops = useOps();
  const { getApplication } = useStore();
  const item = ops.cases.find((entry) => entry.id === id);
  const loan = item ? ops.loans.find((entry) => entry.id === item.loanId) : null;
  const cert = loan ? certificationById(ops, loan.certificationId) : null;
  const applicationId = loan?.applicationId ?? cert?.applicationId ?? null;
  const application = applicationId ? getApplication(applicationId) : undefined;
  const [loanOpen, setLoanOpen] = useState(true);
  const [infoOpen, setInfoOpen] = useState(true);
  const [editing, setEditing] = useState({ details: false, loan: false, info: false });
  const [notesOpen, setNotesOpen] = useState(false);

  if (!item || !loan) {
    return (
      <OpsMissing
        message="This servicing case is not in the prototype data."
        href={servicingHome()}
        label="Back to servicing"
      />
    );
  }

  const resolved = item.status === "resolved";
  const form = item.form;
  const save = (patch: CasePatch) => ops.updateCase(item.id, patch);
  const saveForm = (key: keyof CaseForm, value: string) => save({ form: { [key]: value } });
  const toggleEdit = (section: keyof typeof editing) => {
    const next = !editing[section];
    setEditing((current) => ({ ...current, [section]: next }));
    if (next && section === "loan") setLoanOpen(true);
    if (next && section === "info") setInfoOpen(true);
  };

  return (
    <OpsFile
      backHref={servicingHome()}
      backLabel="Back to servicing cases"
      eyebrow="Servicing case"
      title={`${loan.borrower} - ${opsLabel(item.type)}`}
      aside={<CaseFeed caseId={item.id} author={item.assignee} />}
      actions={
        <>
          <div className="flex items-center gap-sm">
            <span className="text-sm text-gray-medium">Assignee</span>
            <div className="w-[200px]">
              <Select
                aria-label="Assignee"
                variant="field"
                align="right"
                value={item.assignee}
                disabled={resolved}
                options={ADVISORS.map((name) => ({ id: name, label: name }))}
                onChange={(value) => ops.reassignCase(item.id, value)}
              />
            </div>
          </div>
          <HeaderButton variant="secondary" onClick={() => setNotesOpen(true)}>
            Notes
          </HeaderButton>
          <NotesModal
            open={notesOpen}
            value={item.fileNotes ?? ""}
            updatedAt={item.fileNotesUpdatedAt ?? null}
            emptyHtml=""
            onChange={(fileNotes, touch) =>
              ops.updateCase(item.id, {
                fileNotes,
                ...(touch ? { fileNotesUpdatedAt: new Date().toISOString() } : {}),
              })
            }
            onClose={() => setNotesOpen(false)}
          />
          <Button size="small" disabled={resolved} onClick={() => ops.resolveCase(item.id)}>
            {resolved ? "Resolved" : "Resolve case"}
          </Button>
        </>
      }
    >
      <OpsCard title="Case Details" action={<SectionEdit editing={editing.details} onClick={() => toggleEdit("details")} />}>
        <div className="uw-case-sections">
          <section className="uw-case-section">
            <div className="uw-case-tab">
              <span>Details</span>
            </div>
            <div className="uw-case-grid">
              <CaseField editing={editing.details} label="Case Number" value={shown(form, "caseNumber", caseNumberLabel(item.id))} onSave={(value) => saveForm("caseNumber", value)} />
              <CaseField editing={editing.details} label="Case Owner" value={item.assignee} onSave={(value) => save({ assignee: value })} />
              <CaseField editing={editing.details} label="Contact Name" value={shown(form, "contactName", loan.borrower)} onSave={(value) => saveForm("contactName", value)} />
              <CaseField editing={editing.details} label="Contact Phone" value={shown(form, "phone", application?.borrower.phone ?? "")} onSave={(value) => saveForm("phone", value)} />
              <CaseField editing={editing.details} label="Opportunity" value={shown(form, "opportunity", application?.opportunityName ?? "")} onSave={(value) => saveForm("opportunity", value)} />
              <CaseField editing={editing.details} label="Contact Email" value={shown(form, "email", application?.borrower.email ?? "")} onSave={(value) => saveForm("email", value)} />
              <CaseField editing={editing.details} label="Suggestion Form" value={shown(form, "suggestionForm", "")} onSave={(value) => saveForm("suggestionForm", value)} />
            </div>
          </section>

          <CaseFold title="Loan Details" open={loanOpen} onToggle={() => setLoanOpen((open) => !open)} editing={editing.loan} onEdit={() => toggleEdit("loan")}>
            <div className="uw-case-grid">
              <CaseField editing={editing.loan} label="SLA" value={shown(form, "sla", "")} onSave={(value) => saveForm("sla", value)} />
              <CaseField editing={editing.loan} label="Underwriter" value={shown(form, "underwriter", application?.underwriter ?? "")} onSave={(value) => saveForm("underwriter", value)} />
            </div>
          </CaseFold>

          <CaseFold title="Additional Information" open={infoOpen} onToggle={() => setInfoOpen((open) => !open)} editing={editing.info} onEdit={() => toggleEdit("info")}>
            <div className="uw-case-grid">
              <CaseField
                editing={editing.info}
                label="Status"
                value={item.status}
                options={STATUS_OPTIONS.filter((option) =>
                  item.status === "waiting-on-school" ? option.id !== "waiting-on-advisor" : option.id !== "waiting-on-school",
                )}
                onSave={(value) => save({ status: value as CaseStatus })}
              />
              <CaseField editing={editing.info} label="Type" value={item.type} options={TYPE_OPTIONS} onSave={(value) => save({ type: value as CaseType })} />
              <CaseField editing={editing.info} label="Case Origin" value={shown(form, "origin", "")} onSave={(value) => saveForm("origin", value)} />
              <CaseField editing={editing.info} label="Case Reason" value={shown(form, "reason", "")} onSave={(value) => saveForm("reason", value)} />
              <CaseField editing={editing.info} label="Priority" value={item.priority} options={PRIORITY_OPTIONS} onSave={(value) => save({ priority: value as CasePriority })} />
              <CaseField editing={editing.info} label="Disbursement Case Status" value={shown(form, "disbursementStatus", "")} onSave={(value) => saveForm("disbursementStatus", value)} />
              <CaseField editing={editing.info} label="Subject" value={item.subject} onSave={(value) => save({ subject: value })} />
              <CaseField editing={editing.info} label="Description" value={item.details} multiline wide onSave={(value) => save({ details: value })} />
              <CaseField editing={editing.info} label="Internal Comments" value={item.notes} multiline wide onSave={(value) => save({ notes: value })} />
              <CaseField editing={editing.info} label="Date/Time Opened" value={shown(form, "openedLabel", shortDate(item.openedAt))} onSave={(value) => saveForm("openedLabel", value)} />
              <CaseField editing={editing.info} label="Date/Time Closed" value={shown(form, "closedAt", "")} onSave={(value) => saveForm("closedAt", value)} />
              <CaseField editing={editing.info} label="Web Email" value={shown(form, "webEmail", "")} onSave={(value) => saveForm("webEmail", value)} />
            </div>
          </CaseFold>
        </div>
      </OpsCard>
    </OpsFile>
  );
}

function SectionEdit({ editing, onClick }: { editing: boolean; onClick: () => void }) {
  return (
    <Button size="small" variant="link" aria-pressed={editing} onClick={onClick}>
      {editing ? "Done" : "Edit"}
    </Button>
  );
}

function CaseFold({
  title,
  open,
  onToggle,
  editing,
  onEdit,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  editing: boolean;
  onEdit: () => void;
  children: ReactNode;
}) {
  return (
    <section className="uw-case-section">
      <div className="uw-case-fold">
        <button type="button" className="uw-case-fold-toggle" aria-expanded={open} onClick={onToggle}>
          <Chevron open={open} />
          {title}
        </button>
        <SectionEdit editing={editing} onClick={onEdit} />
      </div>
      {open ? children : null}
    </section>
  );
}

function CaseField({
  editing,
  label,
  value,
  multiline,
  wide,
  options,
  onSave,
}: {
  editing: boolean;
  label: string;
  value: string;
  multiline?: boolean;
  wide?: boolean;
  options?: { id: string; label: string }[];
  onSave: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [seen, setSeen] = useState(value);
  if (seen !== value) {
    setSeen(value);
    setDraft(value);
  }

  const answer = options?.find((option) => option.id === value)?.label ?? value.trim();

  return (
    <div className={wide ? "uw-case-field-wide" : undefined}>
      {editing ? (
        options ? (
          <Select label={label} aria-label={label} variant="float" value={value} options={options} onChange={onSave} />
        ) : (
          <FloatInput
            label={label}
            value={draft}
            multiline={multiline}
            onChange={setDraft}
            onBlur={() => {
              if (draft !== value) onSave(draft);
            }}
          />
        )
      ) : (
        <div className="flex min-w-0 flex-col gap-xs">
          <span className="text-xs text-gray-medium">{label}</span>
          <span className={`text-sm wrap-break-word whitespace-pre-wrap ${answer ? "text-black" : "text-gray-medium"}`}>{answer || "—"}</span>
        </div>
      )}
    </div>
  );
}

function shown(form: Partial<CaseForm> | undefined, key: keyof CaseForm, fallback: string) {
  if (form && Object.prototype.hasOwnProperty.call(form, key)) return form[key] ?? fallback;
  return fallback;
}

function caseNumberLabel(id: string) {
  const match = id.match(/(\d+)$/);
  const suffix = (match?.[1] ?? "0").slice(-4).padStart(4, "0");
  return `0004${suffix}`;
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden className={open ? "uw-case-chevron uw-case-chevron-open" : "uw-case-chevron"}>
      <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

