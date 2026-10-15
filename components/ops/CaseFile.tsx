"use client";

import { useState, type ReactNode } from "react";
import { NotesModal } from "@/components/application/NotesModal";
import { Button } from "@/components/Button";
import { Button as HeaderButton } from "@/components/ui/Button";
import { CaseDocuments, CaseFeed } from "@/components/ops/CaseFeed";
import { CustomerEmails } from "@/components/ops/CustomerEmails";
import { DisbursementHistory, RatesHistory, SERVICING_SECTIONS, type ServicingSection } from "@/components/ops/ServicingHistory";
import { OpsFile, OpsMissing } from "@/components/ops/OpsFile";
import { Select } from "@/components/ui/Dropdown";
import { FloatInput } from "@/components/ui/FloatInput";
import { SchoolEmailPicker } from "@/components/email/SchoolEmailPicker";
import { SectionTabs } from "@/components/ui/SectionTabs";
import { SingleSend } from "@/app/dashboard/emails/SingleSend";
import { dateOnly, shortDate } from "@/lib/format";
import { CDA_DETAILS } from "@/lib/cda-record";
import { contactForSchool, schoolFileName } from "@/lib/school-contacts";
import { servicingHome } from "@/lib/loan-routes";
import { certificationById, opsLabel } from "@/lib/ops-logic";
import { assignableNames, useUsers } from "@/app/dashboard/users/users";
import { useOps } from "@/lib/ops-store";
import { useStore } from "@/lib/store";
import { CASE_ORIGINS, CASE_QUEUES, CASE_REASONS, CASE_REQUEST_TYPES, CASE_SUB_QUEUES, picklist } from "@/lib/case-open";
import { CASE_STATUSES, type CaseForm, type CasePatch, type CasePriority, type CaseStatus, type CaseType } from "@/lib/ops-types";

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

const SECTION_FIELDS = {
  details: ["caseNumber", "assignee", "contactName", "phone", "opportunity", "email", "highestDegree", "suggestionForm"],
  loan: ["sla", "underwriter"],
  info: ["status", "type", "requestType", "origin", "reason", "queue", "subQueue", "projectDue", "priority", "disbursementStatus", "subject", "details", "notes", "openedLabel", "closedAt", "webEmail"],
} as const;

type EditSection = keyof typeof SECTION_FIELDS;
type DraftKey = (typeof SECTION_FIELDS)[EditSection][number];

export function CaseFile({
  id,
  embedded = false,
  section: sectionProp,
}: {
  id: string;
  embedded?: boolean;
  section?: ServicingSection;
}) {
  const ops = useOps();
  const users = useUsers();
  const { getApplication, applications } = useStore();
  const item = ops.cases.find((entry) => entry.id === id);
  const loan = item ? ops.loans.find((entry) => entry.id === item.loanId) : null;
  const cert = loan ? certificationById(ops, loan.certificationId) : null;
  const applicationId = loan?.applicationId ?? cert?.applicationId ?? null;
  const application = applicationId ? getApplication(applicationId) : undefined;
  const degreeBorrower =
    application?.borrower ??
    (loan ? applications.find((entry) => entry.borrower.fullName === loan.borrower)?.borrower : undefined);
  const [loanOpen, setLoanOpen] = useState(true);
  const [infoOpen, setInfoOpen] = useState(true);
  const [editing, setEditing] = useState({ details: false, loan: false, info: false });
  const [drafts, setDrafts] = useState<Partial<Record<DraftKey, string>>>({});
  const [notesOpen, setNotesOpen] = useState(false);
  const [sectionState, setSection] = useState<ServicingSection>("feed");
  const section = embedded && sectionProp ? sectionProp : sectionState;

  if (!item || !loan) {
    return (
      <OpsMissing
        message="This servicing case is not in the prototype data."
        href={servicingHome()}
        label="Back to servicing"
      />
    );
  }

  const closed = item.status === "closed";
  const assigneeOptions = assignableNames(users, item.assignee).map((name) => ({ id: name, label: name }));
  const form = item.form;
  const requestCase = Boolean(shown(form, "requestType", ""));
  const save = (patch: CasePatch) => ops.updateCase(item.id, patch);
  const setField = (key: DraftKey, value: string) => {
    setDrafts((current) => ({ ...current, [key]: value }));
  };
  const clearSection = (panel: EditSection) => {
    setDrafts((current) => {
      const next = { ...current };
      for (const key of SECTION_FIELDS[panel]) delete next[key];
      return next;
    });
  };
  const startEdit = (panel: EditSection) => {
    setEditing((current) => ({ ...current, [panel]: true }));
    if (panel === "loan") setLoanOpen(true);
    if (panel === "info") setInfoOpen(true);
  };
  const cancelEdit = (panel: EditSection) => {
    clearSection(panel);
    setEditing((current) => ({ ...current, [panel]: false }));
  };
  const saveEdit = (panel: EditSection) => {
    const patch: CasePatch = {};
    const formPatch: Partial<CaseForm> = {};
    const take = (key: DraftKey, current: string) => {
      const next = drafts[key];
      return next !== undefined && next !== current ? next : undefined;
    };
    const takeForm = (key: keyof CaseForm, current: string) => {
      const next = take(key, current);
      if (next !== undefined) formPatch[key] = next;
    };

    if (panel === "details") {
      takeForm("caseNumber", shown(form, "caseNumber", caseNumberLabel(item.id)));
      const assignee = take("assignee", item.assignee);
      if (assignee !== undefined) patch.assignee = assignee;
      takeForm("contactName", shown(form, "contactName", loan.borrower));
      takeForm("phone", shown(form, "phone", application?.borrower.phone ?? ""));
      takeForm("opportunity", shown(form, "opportunity", application?.opportunityName ?? ""));
      takeForm("email", shown(form, "email", application?.borrower.email ?? ""));
      takeForm("highestDegree", shown(form, "highestDegree", degreeLabel(degreeBorrower)));
      takeForm("suggestionForm", shown(form, "suggestionForm", ""));
    }

    if (panel === "loan") {
      takeForm("sla", shown(form, "sla", ""));
      takeForm("underwriter", shown(form, "underwriter", application?.underwriter ?? ""));
    }

    if (panel === "info") {
      const status = take("status", item.status);
      if (status !== undefined) patch.status = status as CaseStatus;
      if (requestCase) {
        takeForm("requestType", shown(form, "requestType", ""));
      } else {
        const type = take("type", item.type);
        if (type !== undefined) patch.type = type as CaseType;
      }
      takeForm("origin", shown(form, "origin", ""));
      takeForm("reason", shown(form, "reason", ""));
      takeForm("queue", shown(form, "queue", ""));
      takeForm("subQueue", shown(form, "subQueue", ""));
      takeForm("projectDue", shown(form, "projectDue", ""));
      const priority = take("priority", item.priority);
      if (priority !== undefined) patch.priority = priority as CasePriority;
      takeForm("disbursementStatus", shown(form, "disbursementStatus", ""));
      const subject = take("subject", item.subject);
      if (subject !== undefined) patch.subject = subject;
      const details = take("details", item.details);
      if (details !== undefined) patch.details = details;
      const notes = take("notes", item.notes);
      if (notes !== undefined) patch.notes = notes;
      takeForm("openedLabel", shown(form, "openedLabel", shortDate(item.openedAt)));
      takeForm("closedAt", shown(form, "closedAt", ""));
      takeForm("webEmail", shown(form, "webEmail", ""));
    }

    if (Object.keys(formPatch).length) patch.form = formPatch;
    if (Object.keys(patch).length) save(patch);
    clearSection(panel);
    setEditing((current) => ({ ...current, [panel]: false }));
  };

  const sections = (
    <>
      {section === "documents" ? <CaseDocuments caseId={item.id} /> : null}
      {section === "cda-history" ? (
        <CdaHistory assignee={item.assignee} />
      ) : null}
      {section === "disbursement-history" ? <DisbursementHistory applicationId={applicationId ?? ""} /> : null}
      {section === "rates-history" ? <RatesHistory applicationId={applicationId ?? ""} /> : null}
      {section === "email" ? <CustomerEmails applicationId={applicationId} caseId={item.id} /> : null}
      {section === "feed" ? (
      <div className="flex min-h-0 flex-1 flex-col bg-white">
        <div className="uw-card-header shrink-0">
          <h2 className="text-lg text-black">Case Details</h2>
          <SectionEdit editing={editing.details} onEdit={() => startEdit("details")} onSave={() => saveEdit("details")} onCancel={() => cancelEdit("details")} />
        </div>
        <div className="uw-case-sections min-h-0 flex-1 overflow-auto">
          <section className="uw-case-section">
            <div className="uw-case-grid">
              <CaseField editing={editing.details} label="Case Number" value={shown(form, "caseNumber", caseNumberLabel(item.id))} draft={drafts.caseNumber} onChange={(value) => setField("caseNumber", value)} />
              <CaseField editing={editing.details} label="Case Owner" value={item.assignee} draft={drafts.assignee} options={assigneeOptions} onChange={(value) => setField("assignee", value)} />
              <CaseField editing={editing.details} label="Contact Name" value={shown(form, "contactName", loan.borrower)} draft={drafts.contactName} onChange={(value) => setField("contactName", value)} />
              <CaseField editing={editing.details} label="Contact Phone" value={shown(form, "phone", application?.borrower.phone ?? "")} draft={drafts.phone} onChange={(value) => setField("phone", value)} />
              <CaseField editing={editing.details} label="Opportunity" value={shown(form, "opportunity", application?.opportunityName ?? "")} draft={drafts.opportunity} onChange={(value) => setField("opportunity", value)} />
              <CaseField editing={editing.details} label="Contact Email" value={shown(form, "email", application?.borrower.email ?? "")} draft={drafts.email} onChange={(value) => setField("email", value)} />
              <CaseField editing={editing.details} label="Highest Degree" value={shown(form, "highestDegree", degreeLabel(degreeBorrower))} draft={drafts.highestDegree} multiline onChange={(value) => setField("highestDegree", value)} />
              <CaseField editing={editing.details} label="Suggestion Form" value={shown(form, "suggestionForm", "")} draft={drafts.suggestionForm} onChange={(value) => setField("suggestionForm", value)} />
            </div>
          </section>

          <CaseFold title="Loan Details" open={loanOpen} onToggle={() => setLoanOpen((open) => !open)} editing={editing.loan} onEdit={() => startEdit("loan")} onSave={() => saveEdit("loan")} onCancel={() => cancelEdit("loan")}>
            <div className="uw-case-grid">
              <CaseField editing={editing.loan} label="SLA" value={shown(form, "sla", "")} draft={drafts.sla} onChange={(value) => setField("sla", value)} />
              <CaseField editing={editing.loan} label="Underwriter" value={shown(form, "underwriter", application?.underwriter ?? "")} draft={drafts.underwriter} onChange={(value) => setField("underwriter", value)} />
            </div>
          </CaseFold>

          <CaseFold title="Additional Information" open={infoOpen} onToggle={() => setInfoOpen((open) => !open)} editing={editing.info} onEdit={() => startEdit("info")} onSave={() => saveEdit("info")} onCancel={() => cancelEdit("info")}>
            <div className="uw-case-grid">
              <CaseField
                editing={editing.info}
                label="Status"
                value={item.status}
                draft={drafts.status}
                options={CASE_STATUSES.map((option) => ({ id: option.id, label: option.label }))}
                onChange={(value) => setField("status", value)}
              />
              <CaseField
                editing={editing.info}
                label="Type"
                value={requestCase ? shown(form, "requestType", "") : item.type}
                draft={requestCase ? drafts.requestType : drafts.type}
                options={requestCase ? picklist(CASE_REQUEST_TYPES) : TYPE_OPTIONS}
                onChange={(value) => setField(requestCase ? "requestType" : "type", value)}
              />
              <CaseField editing={editing.info} label="Case Origin" value={shown(form, "origin", "")} draft={drafts.origin} options={picklist(CASE_ORIGINS)} onChange={(value) => setField("origin", value)} />
              <CaseField editing={editing.info} label="Case Reason" value={shown(form, "reason", "")} draft={drafts.reason} options={picklist(CASE_REASONS)} onChange={(value) => setField("reason", value)} />
              {requestCase || editing.info ? (
                <>
                  <CaseField editing={editing.info} label="Queue" value={shown(form, "queue", "")} draft={drafts.queue} options={picklist(CASE_QUEUES)} onChange={(value) => setField("queue", value)} />
                  <CaseField editing={editing.info} label="Sub Queue" value={shown(form, "subQueue", "")} draft={drafts.subQueue} options={picklist(CASE_SUB_QUEUES)} onChange={(value) => setField("subQueue", value)} />
                  <CaseField editing={editing.info} label="Project Due Date" value={shown(form, "projectDue", "")} draft={drafts.projectDue} onChange={(value) => setField("projectDue", value)} />
                </>
              ) : null}
              <CaseField editing={editing.info} label="Priority" value={item.priority} draft={drafts.priority} options={PRIORITY_OPTIONS} onChange={(value) => setField("priority", value)} />
              <CaseField editing={editing.info} label="Disbursement Case Status" value={shown(form, "disbursementStatus", "")} draft={drafts.disbursementStatus} onChange={(value) => setField("disbursementStatus", value)} />
              <CaseField editing={editing.info} label="Subject" value={item.subject} draft={drafts.subject} onChange={(value) => setField("subject", value)} />
              <CaseField editing={editing.info} label="Description" value={item.details} draft={drafts.details} multiline wide onChange={(value) => setField("details", value)} />
              <CaseField editing={editing.info} label="Internal Comments" value={item.notes} draft={drafts.notes} multiline wide onChange={(value) => setField("notes", value)} />
              <CaseField editing={editing.info} label="Date/Time Opened" value={shown(form, "openedLabel", shortDate(item.openedAt))} draft={drafts.openedLabel} onChange={(value) => setField("openedLabel", value)} />
              <CaseField editing={editing.info} label="Date/Time Closed" value={shown(form, "closedAt", "")} draft={drafts.closedAt} onChange={(value) => setField("closedAt", value)} />
              <CaseField editing={editing.info} label="Web Email" value={shown(form, "webEmail", "")} draft={drafts.webEmail} onChange={(value) => setField("webEmail", value)} />
            </div>
          </CaseFold>
        </div>
      </div>
      ) : null}
    </>
  );

  if (embedded) {
    if (section !== "feed") return sections;
    return (
      <div className="flex h-[720px] overflow-hidden bg-white">
        <div className="flex h-full w-[60%] min-w-0 flex-col overflow-hidden">
          <CaseFeed caseId={item.id} author={item.assignee} applicationId={applicationId ?? undefined} />
        </div>
        <div className="h-full w-[40%] min-w-0 overflow-auto bg-white">{sections}</div>
      </div>
    );
  }

  return (
    <OpsFile
      backHref={servicingHome()}
      backLabel="Back to servicing cases"
      eyebrow="Servicing case"
      title={`${shown(form, "contactName", "") || loan.borrower} - ${shown(form, "requestType", "") || opsLabel(item.type)}`}
      tabs={
        <SectionTabs
          label="Servicing sections"
          current={section}
          tabs={SERVICING_SECTIONS.map((item) => ({ id: item.id, label: item.label }))}
          onSelect={(id) => setSection(id as ServicingSection)}
        />
      }
      flush
      aside={section === "feed" ? <CaseFeed caseId={item.id} author={item.assignee} applicationId={applicationId ?? undefined} /> : undefined}
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
                options={assigneeOptions}
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
          <Button size="small" disabled={closed} onClick={() => ops.resolveCase(item.id)}>
            {closed ? "Closed" : "Resolve case"}
          </Button>
        </>
      }
    >
      {sections}
    </OpsFile>
  );
}

const TH = "h-11 border-b border-gray-light px-xl py-3 font-semibold whitespace-nowrap text-black";
const TD = "border-b border-gray-light px-xl py-md";

function CdaHistory({ assignee }: { assignee: string }) {
  const ops = useOps();
  const [open, setOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draft, setDraft] = useState<{ caseId: string; school: string } | null>(null);
  const openCases = ops.cases
    .filter((item) => item.status !== "closed")
    .map((item) => {
      const loan = ops.loans.find((entry) => entry.id === item.loanId);
      const number = item.form?.caseNumber?.trim() || caseNumberLabel(item.id);
      const borrower = loan?.borrower ?? "Unknown borrower";
      return { id: item.id, label: `${number} · ${borrower}`, school: loan?.school.trim() ?? "" };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
  const schools = [...new Set(ops.loans.map((loan) => loan.school.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const target = draft ? ops.cases.find((item) => item.id === draft.caseId) : null;
  const targetLoan = target ? ops.loans.find((item) => item.id === target.loanId) : null;
  const targetCert = targetLoan ? certificationById(ops, targetLoan.certificationId) : null;
  const contact = draft ? contactForSchool(draft.school, targetLoan?.schoolCode ?? "") : null;
  const disbursementDate =
    targetCert?.disbursements.find((line) => line.status === "scheduled")?.date ??
    targetCert?.disbursements[0]?.date ??
    targetLoan?.disbursements.find((line) => line.status === "scheduled")?.date ??
    targetLoan?.disbursements[0]?.date ??
    "";
  const emailSubject = `Certification follow-up for ${targetLoan?.borrower ?? "borrower"}`;
  const emailBody = contact
    ? certificationDraft({
        contactName: contact.name,
        note: latestFeedNote(ops.feed ?? [], draft?.caseId ?? ""),
        borrower: targetLoan?.borrower ?? "",
        school: contact.school,
        product: targetLoan?.product ?? "",
        disbursementDate: dateOnly(disbursementDate),
      })
    : "";

  function toggle() {
    setOpen((value) => !value);
  }

  function closeEmail() {
    setPickerOpen(false);
    setDraft(null);
  }

  return (
    <div className={draft ? "flex min-h-0 flex-1 flex-col overflow-hidden bg-white" : "flex flex-col bg-white"}>
      <div className="uw-card-header">
        <h2 className="text-lg text-black">CDA History</h2>
        <Button variant="link" size="small" icon={<PlusIcon />} aria-expanded={pickerOpen || Boolean(draft)} onClick={() => (pickerOpen || draft ? closeEmail() : setPickerOpen(true))}>
          Email the school
        </Button>
      </div>
      {pickerOpen && !draft ? (
        <SchoolEmailPicker
          cases={openCases}
          schools={schools}
          onCancel={closeEmail}
          onNext={(choice) => {
            setDraft(choice);
            setPickerOpen(false);
          }}
        />
      ) : null}
      {draft && contact && target ? (
        <SingleSend
          embedded
          templateTitle={`Email ${contact.school}`}
          initialSubject={emailSubject}
          body={emailBody}
          applicantName={contact.name}
          applicantEmail={contact.email}
          doneLabel="Return to case"
          caseNumber={target.form?.caseNumber?.trim() || caseNumberLabel(target.id)}
          caseId={target.id}
          hideFooter
          directSend
          onCancel={closeEmail}
          onSent={({ subject, body, to, cc, bcc }) => {
            ops.sendSchoolEmail(target.id, assignee, {
              to: to.trim() || contact.email,
              cc,
              bcc,
              school: contact.school,
              subject,
              body: htmlToText(body),
              fileName: schoolFileName(contact.school, target.subject),
            });
          }}
        />
      ) : (
      <div className="overflow-x-auto">
        <table className="uw-data-table min-w-[1100px] table-fixed">
          <thead className="bg-gray-lightest">
            <tr>
              <th className={TH}>Record Identifier</th>
              <th className={TH}>Integration Type</th>
              <th className={TH}>Source</th>
              <th className={TH}>Sent to CDA</th>
              <th className={TH}>Received from CDA</th>
              <th className={TH}>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr
              className="cursor-pointer"
              role="button"
              tabIndex={0}
              aria-expanded={open}
              aria-label="School certification request @1C"
              onClick={toggle}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  toggle();
                }
              }}
            >
              <td className={TD}>
                <span className="inline-flex items-center gap-sm">
                  <Chevron open={open} />
                  @1C
                </span>
              </td>
              <td className={TD}>SCHOOL CERTIFICATION REQUEST</td>
              <td className={TD}>SOUTHEAST BANK</td>
              <td className={TD}>10/07/2026</td>
              <td className={TD}>-</td>
              <td className={TD}>SENT</td>
            </tr>
            {open ? (
              <tr>
                <td className="uw-cda-detail border-b border-gray-light" colSpan={6}>
                  <div className="uw-case-grid">
                    {CDA_DETAILS.map((field) => (
                      <div key={field.label} className={field.wide ? "uw-case-field-wide" : undefined}>
                        <div className="flex min-w-0 flex-col gap-xs">
                          <span className="text-xs text-gray-medium">{field.label}</span>
                          <span className="text-sm wrap-break-word text-black">{field.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}

function latestFeedNote(feed: { caseId: string; body: string; createdAt: string; kind?: string; id: string }[], caseId: string) {
  const notes = feed.filter((post) => post.caseId === caseId && post.kind !== "created" && post.kind !== "email" && !post.id.startsWith("created-"));
  notes.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return notes[0]?.body ?? "";
}

function certificationDraft({
  contactName,
  note,
  borrower,
  school,
  product,
  disbursementDate,
}: {
  contactName: string;
  note: string;
  borrower: string;
  school: string;
  product: string;
  disbursementDate: string;
}) {
  const ask = note || "Please speed up certification for this loan.";
  return `<p>Hello ${escapeHtml(contactName)},</p><p>${escapeHtml(ask)}</p><p>Borrower: ${escapeHtml(borrower)}<br>School: ${escapeHtml(school)}<br>Loan type: ${escapeHtml(product)}<br>Disbursement date: ${escapeHtml(disbursementDate)}</p><p>Please speed up certification so we can release these funds.</p>`;
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function htmlToText(html: string) {
  const node = document.createElement("div");
  node.innerHTML = html;
  node.querySelectorAll("br").forEach((item) => item.replaceWith("\n"));
  node.querySelectorAll("p, div, li, h1, h2, h3").forEach((item) => item.append("\n\n"));
  return (node.textContent || "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 21 21" aria-hidden="true">
      <path d="M11.55 4.2C11.55 3.61921 11.0808 3.15 10.5 3.15C9.91921 3.15 9.45 3.61921 9.45 4.2V9.45H4.2C3.61921 9.45 3.15 9.91921 3.15 10.5C3.15 11.0808 3.61921 11.55 4.2 11.55H9.45V16.8C9.45 17.3808 9.91921 17.85 10.5 17.85C11.0808 17.85 11.55 17.3808 11.55 16.8V11.55H16.8C17.3808 11.55 17.85 11.0808 17.85 10.5C17.85 9.91921 17.3808 9.45 16.8 9.45H11.55V4.2Z" fill="currentColor" />
    </svg>
  );
}

function SectionEdit({
  editing,
  onEdit,
  onSave,
  onCancel,
}: {
  editing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  if (!editing) {
    return (
      <Button size="small" variant="link" onClick={onEdit}>
        Edit
      </Button>
    );
  }

  return (
    <div className="uw-case-edit-actions">
      <Button size="small" variant="link" onClick={onCancel}>
        Cancel
      </Button>
      <Button size="small" variant="link" onClick={onSave}>
        Save Changes
      </Button>
    </div>
  );
}

function CaseFold({
  title,
  open,
  onToggle,
  editing,
  onEdit,
  onSave,
  onCancel,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  editing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  children: ReactNode;
}) {
  return (
    <section className="uw-case-section">
      <div className="uw-case-fold">
        <button type="button" className="uw-case-fold-toggle" aria-expanded={open} onClick={onToggle}>
          <Chevron open={open} />
          {title}
        </button>
        <SectionEdit editing={editing} onEdit={onEdit} onSave={onSave} onCancel={onCancel} />
      </div>
      {open ? children : null}
    </section>
  );
}

function CaseField({
  editing,
  label,
  value,
  draft,
  multiline,
  wide,
  options,
  onChange,
}: {
  editing: boolean;
  label: string;
  value: string;
  draft?: string;
  multiline?: boolean;
  wide?: boolean;
  options?: { id: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const current = draft ?? value;
  const answer = options?.find((option) => option.id === value)?.label ?? value.trim();

  return (
    <div className={wide ? "uw-case-field-wide" : undefined}>
      {editing ? (
        options ? (
          <Select label={label} aria-label={label} variant="float" value={current} options={options} onChange={onChange} />
        ) : (
          <FloatInput label={label} value={current} multiline={multiline} onChange={onChange} />
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

function degreeLabel(borrower?: { degree: string; school: string; graduationYear: string }) {
  if (!borrower) return "";
  return [borrower.degree, borrower.school, borrower.graduationYear.trim() ? `Graduated ${borrower.graduationYear.trim()}` : ""]
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
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

