"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Badge, Button, DataTable, DataTableFooter, DataTableScroll, Pagination, SearchField, type BadgeTone } from "@/components";
import { SingleSend } from "../emails/SingleSend";
import { AccountOpeningRecord } from "@/app/account-manifest/AccountOpeningRecord";
import { buttonClassName } from "@/components/Button";
import type { Status } from "../requests";
import styles from "./details.module.css";

type Choice = string | null;

function Menu({
  title,
  items,
  selected,
  onSelect,
  wide = false,
}: {
  title: string;
  items: { id: string; label: string }[];
  selected: Choice;
  onSelect: (id: Choice) => void;
  wide?: boolean;
}) {
  return (
    <section className={wide ? styles.railWide : styles.rail} aria-label={title}>
      <h2>{title}</h2>
      <div className={styles.railBody}>
        {items.map((item) => {
          const active = selected === item.id;
          return (
            <button
              key={item.id}
              className={active ? styles.navItemSelected : styles.navItem}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(active ? null : item.id)}
            >
              {item.label}
              {active ? <img src="/dashboard/chevron-right.svg" alt="" width={16} height={16} /> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function Detail({
  title,
  empty,
  children,
  replace,
}: {
  title: string;
  empty: string;
  children?: ReactNode;
  replace?: ReactNode;
}) {
  if (replace) return <section className={styles.detail}>{replace}</section>;
  return (
    <section className={styles.detail} aria-label={title}>
      <h2>{title}</h2>
      {children ? <div className={styles.detailBody}>{children}</div> : <p className={styles.emptyCopy}>{empty}</p>}
    </section>
  );
}

function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className={styles.panel}>
      <header className={styles.panelHead}>
        <h3>{title}</h3>
        {action}
      </header>
      <div className={styles.panelBody}>{children}</div>
    </section>
  );
}

function Field({ label, value, alert = false }: { label: string; value: ReactNode; alert?: boolean }) {
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <span className={alert ? styles.alert : undefined}>{value}</span>
    </div>
  );
}

function Code({ code, text, tone }: { code: string; text: string; tone: "error" | "warning" | "booked" }) {
  return (
    <div className={styles.codeRow}>
      <span className={styles.codeChip}>
        <span className={styles[tone]} />
        {code}
      </span>
      <span>- {text}</span>
    </div>
  );
}

const RISK_ITEMS = [
  { id: "matched", label: "Matched Data" },
  { id: "reasons", label: "Reason Codes" },
  { id: "scores", label: "Scores & Findings" },
  { id: "tags", label: "Tags" },
  { id: "all", label: "View All" },
];

const APPLICANT_ITEMS = [
  { id: "person", label: "Application Person Information" },
  { id: "dna", label: "DNA Information" },
  { id: "documents", label: "Documents" },
  { id: "funding", label: "Funding Sources" },
  { id: "history", label: "Application History" },
  { id: "reports", label: "Reports" },
  { id: "all", label: "View All" },
];

const APPLICATION_ITEMS = [
  { id: "questionnaire", label: "Account Questionnaire" },
  { id: "deposit", label: "Initial Deposit" },
  { id: "email", label: "Email Communication" },
  { id: "rates", label: "Rate Details" },
  { id: "terms", label: "Terms & Disclosures" },
  { id: "manifest", label: "Account Manifest" },
  { id: "all", label: "View All" },
];

function MatchedData() {
  const rows = [
    ["DOB", ["Lexis Nexis Instant ID", "Socure 30"]],
    ["SSN", ["Lexis Nexis Instant ID", "Socure 30"]],
    ["Name", ["Lexis Nexis Instant ID", "Socure 30"]],
    ["Email", ["Ekata", "Socure 30"]],
  ] as const;
  return (
    <Panel title="Matched Data">
      <div className={styles.stack}>
        {rows.map(([label, chips]) => (
          <div key={label} className={styles.field}>
            <strong>{label}</strong>
            <div className={styles.chips}>
              {chips.map((chip) => (
                <span className={styles.chip} key={chip}>
                  {chip}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function ReasonCodes() {
  return (
    <Panel title="Reason Codes">
      <p className={styles.groupLabel}>QualiFile</p>
      <div className={styles.codeList}>
        <Code code="AC" text="Time since dda activity" tone="error" />
        <Code code="AD" text="Dda closure(s)" tone="error" />
        <Code code="AE" text="Time since dda closure(s)" tone="error" />
        <Code code="AA" text="Retail item activity" tone="warning" />
        <Code code="AB" text="Dda history" tone="booked" />
      </div>
      <p className={styles.groupLabel}>ID Analytics ID Score</p>
      <div className={styles.codeList}>
        <Code code="909" text="SSN generally associated with low risk" tone="booked" />
        <Code code="925" text="Address type in generally associated with low risk" tone="booked" />
        <Code code="934" text="Low risk patterns associated with address history" tone="booked" />
      </div>
    </Panel>
  );
}

function Scores() {
  const rows = [
    ["QualiFile", "Qualifile Score", "800", false],
    ["Socure Fraud", "Sigma Fraud Score", "0.1", false],
    ["ID Analytics ID Score", "Score", "750", true],
  ] as const;
  return (
    <Panel title="Scores & Findings">
      <div>
        {rows.map(([title, label, value, warn]) => (
          <div className={warn ? `${styles.score} ${styles.scoreWarn}` : styles.score} key={title}>
            <div>
              <strong>{title}</strong>
              <span>{label}</span>
            </div>
            <b>{value}</b>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function Tags() {
  const tags = [
    ["Fraud Risk", "error"],
    ["Phone Warning", "warning"],
    ["KYC DOB Match", "booked"],
    ["KYC SSN Match", "booked"],
    ["KYC Phone Number Match", "booked"],
  ] as const;
  return (
    <Panel title="Tags">
      <div className={styles.tagList}>
        {tags.map(([label, tone]) => (
          <div key={label}>
            <span className={styles[tone]} />
            {label}
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function RiskPanel() {
  const [selected, setSelected] = useState<Choice>(null);
  const show = (id: string) => selected === id || selected === "all";
  return (
    <div className={styles.columns}>
      <Menu title="Risk Verification" items={RISK_ITEMS} selected={selected} onSelect={setSelected} />
      <Detail title="Risk Verification Details" empty="Select a KYC tag to review its contents.">
        {selected ? (
          <>
            {show("matched") ? <MatchedData /> : null}
            {show("reasons") ? <ReasonCodes /> : null}
            {show("scores") ? <Scores /> : null}
            {show("tags") ? <Tags /> : null}
          </>
        ) : undefined}
      </Detail>
    </div>
  );
}

function PersonInfo() {
  return (
    <>
      <div className={styles.fields}>
        <Panel title="Profile">
          <div className={styles.fields}>
            <Field label="First Name" value="John" />
            <Field label="Date of Birth" value="May 10, 1992" />
            <Field label="Middle Initial" value="M" />
            <Field label="Social Security Number" value="*** - ** - 1892" />
            <Field label="Last Name" value="Smith" />
            <span />
            <Field label="Suffix" value="Jr" />
          </div>
        </Panel>
        <Panel title="Contact Information">
          <div className={styles.stack}>
            <Field label="Email Address" value="jsmith@email.com" />
            <Field label="Mobile Telephone" value="(417) 128-2919" />
          </div>
        </Panel>
        <Panel title="Addresses">
          <div className={styles.stack}>
            <Field label="Primary Address" value={"123 Maple St\nLos Angeles, CA 90032"} />
            <Field label="Mailing Address" value={"1999 Oxford Rd PO Box 00491\nLos Angeles CA, 90032"} />
          </div>
        </Panel>
        <Panel title="Additional Details">
          <div className={styles.stack}>
            <Field label="Employer" value="Walmart" />
            <Field label="Occupation" value="Bakery" />
            <Field label="Politically Exposed" value="No" />
          </div>
        </Panel>
      </div>
      <div className={styles.actions}>
        <Button variant="outline" size="small">
          Edit
        </Button>
        <Button size="small">
          Resubmit for verification
        </Button>
      </div>
    </>
  );
}

function DnaInfo({
  mismatch = false,
  overview = false,
  onViewAll,
}: {
  mismatch?: boolean;
  overview?: boolean;
  onViewAll?: () => void;
}) {
  return (
    <>
      <Panel
        title="DNA Information"
        action={
          overview ? (
            <Button variant="text" size="small" className={styles.textButton} onClick={onViewAll}>
              View all DNA data
            </Button>
          ) : undefined
        }
      >
        <div className={styles.fields}>
          <Field label="DNA Person Number" value="87912" />
          <Field label="Date of Birth" value={mismatch ? "Mar 26, 1992" : "May 10, 1992"} alert={mismatch} />
          <Field label="Name" value="Jonathan Smith" alert />
          <Field label="Social Security Number" value="*** - ** - 1892" alert={mismatch} />
          <Field label="Primary Address" value={"123 Maple St\nLos Angeles, CA 90032"} />
          <Field label="Phone Number" value="(417) 102-0931" alert />
          <Field label="Email Address" value="jsmith@email.com" />
          <Field label="Warning" value={"Kiting Suspect (KITE)\nDeceased Persons (DEAD)"} alert />
        </div>
      </Panel>
      <Panel title="Account Information">
        <p className={styles.alert}>No accounts found</p>
      </Panel>
      <Panel title="Additional Information">
        <Field label="Customer Since" value={mismatch ? "02/10/2023" : ""} />
      </Panel>
    </>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 21 21" aria-hidden="true">
      <path d="M11.55 4.2C11.55 3.61921 11.0808 3.15 10.5 3.15C9.91921 3.15 9.45 3.61921 9.45 4.2V9.45H4.2C3.61921 9.45 3.15 9.91921 3.15 10.5C3.15 11.0808 3.61921 11.55 4.2 11.55H9.45V16.8C9.45 17.3808 9.91921 17.85 10.5 17.85C11.0808 17.85 11.55 17.3808 11.55 16.8V11.55H16.8C17.3808 11.55 17.85 11.0808 17.85 10.5C17.85 9.91921 17.3808 9.45 16.8 9.45H11.55V4.2Z" fill="currentColor" />
    </svg>
  );
}

function OpenIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 12.0117 12.0117" aria-hidden="true">
      <path d="M6.75659 0.563049C6.75659 0.875072 7.00762 1.1261 7.31964 1.1261H10.0903L4.67096 6.54545C4.45044 6.76598 4.45044 7.12257 4.67096 7.34076C4.89149 7.55894 5.24809 7.56128 5.46627 7.34076L10.8856 1.92141V4.69208C10.8856 5.0041 11.1366 5.25513 11.4487 5.25513C11.7607 5.25513 12.0117 5.0041 12.0117 4.69208V0.563049C12.0117 0.251026 11.7607 0 11.4487 0H7.31964C7.00762 0 6.75659 0.251026 6.75659 0.563049ZM1.87683 2.2522C0.839882 2.2522 0 3.09208 0 4.12903V10.1349C0 11.1718 0.839882 12.0117 1.87683 12.0117H7.88269C8.91964 12.0117 9.75952 11.1718 9.75952 10.1349V8.07037C9.75952 7.75835 9.5085 7.50732 9.19647 7.50732C8.88445 7.50732 8.63342 7.75835 8.63342 8.07037V10.1349C8.63342 10.5501 8.29794 10.8856 7.88269 10.8856H1.87683C1.46158 10.8856 1.1261 10.5501 1.1261 10.1349V4.12903C1.1261 3.71378 1.46158 3.3783 1.87683 3.3783H3.94135C4.25337 3.3783 4.50439 3.12727 4.50439 2.81525C4.50439 2.50322 4.25337 2.2522 3.94135 2.2522H1.87683Z" fill="currentColor" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 15.0146 15.0146" aria-hidden="true">
      <path d="M11.4485 13.5132C11.7606 13.5132 12.0116 13.2622 12.0116 12.9501C12.0116 12.6381 11.7606 12.3871 11.4485 12.3871H3.56586C3.25384 12.3871 3.00281 12.6381 3.00281 12.9501C3.00281 13.2622 3.25384 13.5132 3.56586 13.5132H11.4485ZM7.10838 10.346C7.32891 10.5666 7.6855 10.5666 7.90368 10.346L11.0966 7.15543C11.3172 6.9349 11.3172 6.5783 11.0966 6.36012C10.8761 6.14194 10.5195 6.13959 10.3013 6.36012L8.0726 8.58886V2.06453C8.0726 1.7525 7.82157 1.50148 7.50955 1.50148C7.19753 1.50148 6.9465 1.7525 6.9465 2.06453V8.58886L4.71776 6.36012C4.49724 6.13959 4.14064 6.13959 3.92246 6.36012C3.70428 6.58065 3.70193 6.93725 3.92246 7.15543L7.10838 10.346Z" fill="currentColor" />
    </svg>
  );
}

const DOCUMENTS = [
  { name: "Driver's License", src: "/dashboard/id-card.png", alt: "Driver's license uploaded by the applicant" },
  { name: "Passport", src: "/dashboard/passport.png", alt: "Passport uploaded by the applicant" },
];

function openDocument(src: string) {
  window.open(src, "_blank", "noopener,noreferrer");
}

function downloadDocument(src: string, name: string) {
  const anchor = window.document.createElement("a");
  anchor.href = src;
  anchor.download = `${name}.png`;
  anchor.click();
}

function Documents() {
  const [decision, setDecision] = useState<"approve" | "reject" | null>(null);
  const [note, setNote] = useState("");
  const [page, setPage] = useState(1);
  const current = DOCUMENTS[page - 1];
  return (
    <Panel
      title="Document Preview"
      action={
        <div className={styles.actions}>
          <Button variant="link" size="small" icon={<PlusIcon />}>
            Add additional documents
          </Button>
          <Button variant="link" size="small" icon={<OpenIcon />} onClick={() => openDocument(current.src)}>
            Open in new tab
          </Button>
          <Button variant="link" size="small" icon={<DownloadIcon />} onClick={() => downloadDocument(current.src, current.name)}>
            Download
          </Button>
        </div>
      }
    >
      <div className={styles.docLayout}>
        <div className={styles.docForm}>
          <div className={styles.stack}>
            <Field label="Uploaded Document" value={current.name} />
            <Field label="Collected" value="Mar 6, 2026 9:15 AM" />
          </div>
          <div className={styles.decisions}>
            <label className={styles.decision}>
              <input type="radio" name="document-decision" checked={decision === "approve"} onChange={() => setDecision("approve")} />
              Approve
            </label>
            <label className={styles.decision}>
              <input type="radio" name="document-decision" checked={decision === "reject"} onChange={() => setDecision("reject")} />
              Reject
            </label>
          </div>
          <div className={styles.decisionNote}>
            <p>Document Decision Note</p>
            <textarea className={styles.noteField} placeholder="Type note here..." value={note} onChange={(event) => setNote(event.target.value)} />
            <Button size="small">Confirm Decision</Button>
          </div>
        </div>
        <div className={styles.docPreviewColumn}>
          <div className={styles.docToolbar}>
            <p>Viewing document {page} of {DOCUMENTS.length}</p>
            <Pagination count={DOCUMENTS.length} page={page} pageSize={1} onPageChange={setPage} showRange={false} disabledPages={[2]} />
          </div>
          <img className={styles.docPreview} src={current.src} alt={current.alt} width={713} height={450} />
        </div>
      </div>
    </Panel>
  );
}

function Funding() {
  const [sources, setSources] = useState([
    { id: "1", name: "ORNL Federal Credit Union Savings Account", account: "147223710" },
    { id: "2", name: "SouthEast Bank Checking Account", account: "882104563" },
    { id: "3", name: "First Horizon Money Market", account: "550918274" },
  ]);
  return (
    <Panel
      title="Funding Sources"
      action={
        <Button
          variant="link"
          size="small"
          icon={<PlusIcon />}
          onClick={() =>
            setSources((current) => [
              ...current,
              { id: String(Date.now()), name: "ORNL Federal Credit Union Savings Account", account: "147223710" },
            ])
          }
        >
          Add new funding source
        </Button>
      }
    >
      {sources.map((source) => (
        <div className={styles.source} key={source.id}>
          <div>
            <p className={styles.sourceName}>{source.name}</p>
            <div>{source.account}</div>
            <span className={styles.fieldLabel}>Account Number</span>
          </div>
          <Button variant="link" size="small" onClick={() => setSources((current) => current.filter((item) => item.id !== source.id))}>
            Remove source
          </Button>
        </div>
      ))}
    </Panel>
  );
}

export type HistoryApplication = {
  id: string;
  name: string;
  status: Status;
  statusLabel: string;
  tone: BadgeTone;
  idLabel: string;
  applicationNumber: string;
  updated: string;
  deposit: string;
  overviewCount: number;
};

export const HISTORY_APPLICATIONS: HistoryApplication[] = [
  {
    id: "rewards-checking",
    name: "Rewards Checking",
    status: "booked",
    statusLabel: "Booked",
    tone: "success",
    idLabel: "Account number",
    applicationNumber: "17232100",
    updated: "12/28/2025",
    deposit: "$5,000.00",
    overviewCount: 0,
  },
  {
    id: "bonus-rate-savings",
    name: "Bonus Rate Savings",
    status: "review",
    statusLabel: "Submitted in Review",
    tone: "warning",
    idLabel: "Application ID",
    applicationNumber: "0329129",
    updated: "03/04/2026",
    deposit: "$2,000.00",
    overviewCount: 3,
  },
  {
    id: "cd-special",
    name: "12-Month CD Special",
    status: "review",
    statusLabel: "Action Required",
    tone: "error",
    idLabel: "Application ID",
    applicationNumber: "91298312",
    updated: "05/12/2026",
    deposit: "$15,000.00",
    overviewCount: 3,
  },
];

function History({ selectedId, onSelect }: { selectedId: string | null; onSelect: (id: string) => void }) {
  return (
    <Panel title="Application History">
      {HISTORY_APPLICATIONS.map((item) => {
        const active = selectedId === item.id;
        return (
          <button
            key={item.id}
            className={active ? `${styles.historyItem} ${styles.historyItemSelected}` : styles.historyItem}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(item.id)}
          >
            <p className={styles.historyTitle}>{item.name}</p>
            <div className={styles.historyMeta}>
              <div className={styles.historyStatus}>
                <span>Status</span>
                <Badge tone={item.tone}>{item.statusLabel}</Badge>
              </div>
              <div>
                {item.idLabel}
                <strong>{item.applicationNumber}</strong>
              </div>
              <div>
                Last updated
                <strong>{item.updated}</strong>
              </div>
            </div>
          </button>
        );
      })}
    </Panel>
  );
}

function Reports() {
  return (
    <Panel title="Reports">
      <a
        className={buttonClassName({ variant: "text", size: "small", className: styles.linkButton })}
        href="/qualifile"
        target="_blank"
        rel="noopener noreferrer"
      >
        QualiFile
      </a>
      <div className={styles.fieldLabel}>Created on Mar 19, 2026</div>
    </Panel>
  );
}

export function ApplicantPanel({
  selected,
  onSelect,
  applicationId,
  onOpenApplication,
}: {
  selected: Choice;
  onSelect: (id: Choice) => void;
  applicationId: string | null;
  onOpenApplication: (id: string) => void;
}) {
  const show = (id: string) => selected === id || selected === "all";
  return (
    <div className={styles.columns}>
      <Menu title="Applicant Information" items={APPLICANT_ITEMS} selected={selected} onSelect={onSelect} />
      <Detail title="Applicant Details" empty="Select an applicant section to view its contents.">
        {selected ? (
          <>
            {show("person") ? <PersonInfo /> : null}
            {show("dna") ? <DnaInfo /> : null}
            {show("documents") ? <Documents /> : null}
            {show("funding") ? <Funding /> : null}
            {show("history") ? <History selectedId={applicationId} onSelect={onOpenApplication} /> : null}
            {show("reports") ? <Reports /> : null}
          </>
        ) : undefined}
      </Detail>
    </div>
  );
}

function Questionnaire() {
  return (
    <Panel title="Account Questionnaire">
      <div className={styles.splitFields}>
        <div className={styles.stack}>
          <Field label="Purpose of Account" value="Payroll" />
          <Field label="Expected Deposit Frequency" value="Monthly" />
          <Field label="Expected Deposit" value="Direct Deposit Payroll" />
          <Field label="Do you expect to deposit and/or withdraw from this account?" value="Yes" />
          <Field label="Expects Cash Deposits" value="Yes" />
          <Field label="Monthly Cash Deposit Volume" value="$ 0 - $1,000" />
          <Field label="Expects Cash Withdrawals" value="Yes" />
          <Field label="Monthly Cash Withdrawal Volume" value="$ 0 - $1,000" />
        </div>
        <div className={styles.stack}>
          <Field label="Do you expect to deposit and/or withdraw money from this account via ACH Transfer?" value="Yes" />
          <Field label="Expects Domestic ACH Deposits" value="Yes" />
          <Field label="Monthly Check Withdrawal Volume" value="$3,001 - $5,000" />
          <Field label="Expects Domestic ACH Withdrawals" value="Yes" />
          <Field label="Do you expected to make foreign ACH withdrawals?" value="No" />
          <Field label="Do you expect to deposit and/or withdraw money from this account via wire transfers?" value="No" />
          <Field label="Expects Domestic Wire Deposits" value="No" />
          <Field label="Expects Domestic Wire Withdrawals" value="No" />
        </div>
      </div>
    </Panel>
  );
}

function Deposit() {
  return (
    <Panel title="Initial Deposit">
      <div className={styles.fields}>
        <Field label="Amount" value="$500.00" />
        <Field label="Institution" value="Sample Community Bank" />
        <Field label="Funding Source" value="Manual Add" />
        <Field label="Routing Number" value="1238901" />
        <Field label="Date Added" value="March 24, 2026" />
        <Field label="Account" value="XXXXXX1023" />
      </div>
    </Panel>
  );
}

const EMAIL_CATEGORIES = [
  "New Account Open",
  "Cancelled",
  "Rejection/Decline",
  "Joint Owner",
  "Security/Verification",
  "Additional Items",
  "Marketing",
  "Follow Up",
  "In Branch",
];

const EMAIL_TEMPLATES: Record<string, string[]> = {
  "New Account Open": ["Welcome", "Account is now open", "Online banking setup", "Direct deposit instructions"],
  Cancelled: ["Application cancelled", "Account closure confirmation"],
  "Rejection/Decline": ["General Rejection", "Qualifile", "Unable to verify identity"],
  "Joint Owner": ["Application Invitation", "Joint owner added", "Invitation reminder"],
  "Security/Verification": ["Self Serve OTP", "Password Reset", "Verify your email"],
  "Additional Items": ["Document request", "Missing signature", "Funding source needed"],
  Marketing: ["Experience the benefits of SouthEast Bank", "New rate offer", "Referral invitation"],
  "Follow Up": ["Continue your application", "Application Drop Off", "We haven't heard from you"],
  "In Branch": ["Appointment confirmation", "In-branch application received", "Branch visit follow-up"],
};

function templatesFor(category: string) {
  return EMAIL_TEMPLATES[category] ?? [];
}

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.2 10.2 8.7 12.6 13.8 7.4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function OptionMenu({
  id,
  label,
  options,
  value,
  disabled = false,
  onChange,
}: {
  id: string;
  label: string;
  options: readonly string[];
  value: string;
  disabled?: boolean;
  onChange: (next: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuBox, setMenuBox] = useState({ top: 0, left: 0, width: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (disabled) setMenuOpen(false);
  }, [disabled]);

  useEffect(() => {
    if (!menuOpen || !buttonRef.current) return;
    function place() {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMenuBox({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
    function closeOnOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    place();
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [menuOpen]);

  return (
    <div className={styles.categoryMenu} ref={rootRef}>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        className={value ? styles.newEmailSelect : `${styles.newEmailSelect} ${styles.newEmailSelectEmpty}`}
        aria-haspopup="listbox"
        aria-expanded={menuOpen}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          const rect = buttonRef.current?.getBoundingClientRect();
          if (rect) setMenuBox({ top: rect.bottom + 4, left: rect.left, width: rect.width });
          setMenuOpen((current) => !current);
        }}
      >
        {value || "Select one"}
      </button>
      {menuOpen ? (
        <ul
          className={styles.categoryList}
          role="listbox"
          aria-label={label}
          style={{ top: menuBox.top, left: menuBox.left, width: menuBox.width }}
        >
          {options.map((name) => {
            const selected = name === value;
            return (
              <li key={name}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={selected ? styles.categoryOptionSelected : styles.categoryOption}
                  onClick={() => {
                    onChange(name);
                    setMenuOpen(false);
                  }}
                >
                  <span>{name}</span>
                  {selected ? <CheckIcon /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M6.1 2.2h3.8l.35.7H13v1.2H3V2.9h2.75l.35-.7ZM4.15 5.2h7.7l-.55 8.1H4.7L4.15 5.2Z" fill="currentColor" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M5 4.06 8.9 8 5 11.94 6.05 13 11 8 6.05 3 5 4.06Z" fill="currentColor" />
    </svg>
  );
}

const SENT_EMAILS = [
  {
    title: "Experience the benefits of SouthEast Bank",
    sent: "Jul 16, 2026 at 12:25pm",
    body: "<p>Hi John Smith,</p><p>Your 6-Month CD application is a great start. SouthEast Bank customers earn a competitive rate, manage the account online, and reach Client Care seven days a week.</p><p>Sign in or visit a branch to see what else your account can do.</p>",
  },
  {
    title: "Continue your application",
    sent: "Jul 16, 2026 at 11:25am",
    body: "<p>Hi John Smith,</p><p>You started an application for a 6-Month CD, and we saved your progress. It only takes a few minutes to finish and fund the account.</p><p>If you have questions, call our Client Care Team at 1-844-732-2657.</p>",
  },
];

function Emails({ onEdit, onView }: { onEdit: (template: string) => void; onView: (title: string) => void }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [template, setTemplate] = useState("");
  const templates = templatesFor(category);

  function closeComposer() {
    setOpen(false);
    setCategory("");
    setTemplate("");
  }

  return (
    <section className={styles.panel}>
      <header className={styles.panelHead}>
        <h3>Email Communication</h3>
        <Button variant="link" size="small" icon={<PlusIcon />} aria-expanded={open} onClick={() => (open ? closeComposer() : setOpen(true))}>
          Send new email
        </Button>
      </header>
      {open ? (
        <div className={styles.newEmail}>
          <div className={styles.newEmailHead}>New Email</div>
          <div className={styles.newEmailBody}>
            <div className={styles.newEmailStep}>
              <span className={styles.newEmailNumber}>1</span>
              <div className={styles.newEmailField}>
                <label htmlFor="email-category">Choose email Category</label>
                <OptionMenu
                  id="email-category"
                  label="Choose email Category"
                  options={EMAIL_CATEGORIES}
                  value={category}
                  onChange={(next) => {
                    setCategory(next);
                    setTemplate("");
                  }}
                />
              </div>
            </div>
            <div className={styles.newEmailStep}>
              <span className={styles.newEmailNumber}>2</span>
              <div className={styles.newEmailField}>
                <label htmlFor="email-template">Choose a template for{category ? ` ${category}` : ""}</label>
                <OptionMenu
                  id="email-template"
                  label={category ? `Choose a template for ${category}` : "Choose a template"}
                  options={templates}
                  value={template}
                  disabled={!category}
                  onChange={setTemplate}
                />
              </div>
            </div>
            <div className={styles.newEmailActions}>
              <Button variant="link" size="small" icon={<TrashIcon />} onClick={closeComposer}>
                Cancel
              </Button>
              <Button
                size="small"
                className={styles.newEmailNext}
                disabled={!category || !template}
                onClick={() => onEdit(template)}
              >
                Next
                <ChevronRightIcon />
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      <div className={styles.panelBody}>
        {SENT_EMAILS.map((email) => (
          <div className={styles.emailRow} key={email.title}>
            <div>
              <Button variant="text" size="small" className={styles.linkButton} onClick={() => onView(email.title)}>
                <img src="/dashboard/email.svg" alt="" width={16} height={16} /> {email.title}
              </Button>
              <div className={styles.fieldLabel}>Sent {email.sent}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Rates() {
  return (
    <Panel title="Rates Details">
      <Field label="Annual Percentage Yield" value="0.05%" />
      <div className={styles.note}>
        <strong>Please Note</strong>
        <div>
          These are the rates at the time of account opening. The final rate for this account can be found on the customers’
          statement or via online banking. SouthEast Bank will show core rates on the Account Overview after booking when
          available.
        </div>
      </div>
    </Panel>
  );
}

type DocBlock = { heading?: string; paragraphs?: string[]; bullets?: string[] };

const LEGAL_DOCS: { title: string; when: string; blocks: DocBlock[] }[] = [
  {
    title: "Truth in Savings for Checking Accounts",
    when: "Acknowledged Mar 6, 2026 7:58 AM",
    blocks: [
      {
        paragraphs: [
          "This Truth in Savings disclosure describes the rates, fees, and balance requirements for a SouthEast Bank personal checking account. The terms below were the terms in effect when this application was submitted.",
        ],
      },
      {
        heading: "Rate information",
        paragraphs: [
          "The interest rate and annual percentage yield for this account may change. At account opening the annual percentage yield was 0.05%. Interest is compounded daily and credited to the account on the last business day of each statement cycle.",
        ],
      },
      {
        heading: "Minimum balance",
        paragraphs: [
          "There is no minimum balance required to open this account or to earn the disclosed annual percentage yield. A $0.00 balance may be maintained after opening.",
        ],
      },
      {
        heading: "Fees",
        paragraphs: ["The following fees may be charged against the account and could reduce earnings:"],
        bullets: [
          "Monthly service fee: $0 when direct deposit or a $500 average daily balance is maintained; otherwise $8.",
          "Paper statement fee: $2 each cycle if electronic statements are not selected.",
          "Overdraft paid item: $34 per item, up to three fees per business day.",
          "Stop payment: $30 per request.",
        ],
      },
      {
        heading: "Transaction limitations",
        paragraphs: [
          "Deposits and withdrawals may be made in any amount at a branch, ATM, or through online banking. SouthEast Bank may refuse a deposit or close the account if activity is inconsistent with personal checking use.",
        ],
      },
    ],
  },
  {
    title: "Account Terms and Conditions and Disclosures for Checking",
    when: "Acknowledged Mar 6, 2026 7:59 AM",
    blocks: [
      {
        paragraphs: [
          "This agreement governs the personal checking account opened with SouthEast Bank. By acknowledging it, the applicant agrees to the rules for deposits, withdrawals, and account ownership described here and in the related disclosures.",
        ],
      },
      {
        heading: "Ownership",
        paragraphs: [
          "The account is owned by the person named on the application. Joint owners, if added later, have equal right to withdraw funds. SouthEast Bank may accept instructions from any owner.",
        ],
      },
      {
        heading: "Deposits and withdrawals",
        paragraphs: [
          "Funds are available according to the bank’s funds-availability policy. The bank may return a deposit, delay availability, or require identification before paying an item. The applicant is responsible for transactions made with a debit card, online banking credentials, or a signed item.",
        ],
      },
      {
        heading: "Overdrafts",
        paragraphs: [
          "If an item is presented and the available balance is not enough to pay it, SouthEast Bank may pay or return the item. A fee may apply. The applicant can opt out of discretionary overdraft coverage for everyday debit card and ATM transactions.",
        ],
      },
      {
        heading: "Changes",
        paragraphs: [
          "SouthEast Bank may change these terms by notice to the address or email on file. Continued use of the account after the effective date is agreement to the change.",
        ],
      },
    ],
  },
  {
    title: "E-Sign Consent Agreement",
    when: "Acknowledged Mar 6, 2026 7:56 AM",
    blocks: [
      {
        paragraphs: [
          "You may choose to receive documents electronically instead of in paper form by affirmatively consenting to this Electronic Disclosure and Electronic Signature Consent Agreement (“Agreement”). This Agreement applies to all documents and notices we provide to you in electronic form, including regulatory disclosures, contracts, change-in-terms notices, forms, records, and other information relating to your accounts and applications.",
          "This does not include account statements. You may choose how account statements are delivered separately.",
          "“You” and “your” refer to the consumer submitting an account application. “We,” “us,” and “our” refer to SouthEast Bank, including its affiliates.",
        ],
      },
      {
        heading: "Access and system requirements",
        paragraphs: ["To view electronic documents, you must have:"],
        bullets: [
          "A computer or device that can access the internet and download HTML or PDF files.",
          "A current web browser that supports 128-bit encryption.",
          "An active email account.",
          "Adobe Acrobat Reader, available at www.adobe.com.",
          "Storage to keep electronic copies, or a printer for paper copies.",
        ],
      },
      {
        heading: "Requesting paper copies",
        paragraphs: [
          "You may request a paper copy of any electronic record in person, by mail, or by calling 1-844-732-2657. The fee in effect at the time of the request applies.",
        ],
      },
      {
        heading: "Withdrawing your consent",
        paragraphs: [
          "You may withdraw consent by emailing Esignoptout@southeastbank.com, visiting a branch, writing to us, or calling 1-844-732-2657. Records already provided electronically, and any electronic signature already made, remain valid.",
        ],
      },
    ],
  },
  {
    title: "Electronic Delivery of Account Agreements and Disclosures",
    when: "Signed Mar 6, 2026 8:00 AM",
    blocks: [
      {
        paragraphs: [
          "The applicant confirmed that SouthEast Bank may deliver account agreements, disclosures, and related notices electronically to the email address on the application.",
        ],
      },
      {
        heading: "What was confirmed",
        bullets: [
          "The applicant can access and retain electronic documents with the hardware and software described in the E-Sign Consent Agreement.",
          "Electronic delivery applies to agreements and disclosures, and does not by itself change how account statements are delivered.",
          "A paper copy can be requested later, and consent can be withdrawn by contacting Client Care at 1-844-732-2657.",
        ],
      },
      {
        paragraphs: [
          "This attestation was signed after the applicant reviewed the E-Sign Consent Agreement. Withdrawing consent later does not undo documents already delivered.",
        ],
      },
    ],
  },
  {
    title: "Read and agreed to the statements, agreements, and disclosures",
    when: "Signed Mar 6, 2026 8:01 AM",
    blocks: [
      {
        paragraphs: [
          "The applicant attested that they read the account documents presented during this application and agree to be bound by them.",
        ],
      },
      {
        heading: "Documents covered",
        bullets: [
          "Truth in Savings for Checking Accounts.",
          "Account Terms and Conditions and Disclosures for Checking.",
          "E-Sign Consent Agreement.",
          "Electronic Delivery of Account Agreements and Disclosures.",
        ],
      },
      {
        paragraphs: [
          "The signature applies to the versions shown at the time of application. Later changes are provided separately, by the notice method in the account agreement.",
        ],
      },
    ],
  },
];

function DocumentView({ title, onClose }: { title: string; onClose: () => void }) {
  const doc = LEGAL_DOCS.find((item) => item.title === title);
  if (!doc) return null;
  return (
    <div className={styles.docPreview}>
      <div className={styles.docFrame}>
        <Button variant="outline" size="small" onClick={onClose}>
          Back
        </Button>
        <article className={styles.docCard}>
          <header className={styles.docHead}>
            <img src="/dashboard/logo.png" alt="SouthEast Bank" width={130} height={35} />
            <p className={styles.docHeadCopy}>
              {doc.title}
              <br />
              Keep a copy for your records.
            </p>
          </header>
          <div className={styles.docBody}>
            {doc.blocks.map((block) => (
              <section key={block.heading ?? block.paragraphs?.[0]}>
                {block.heading ? <h3>{block.heading}</h3> : null}
                {block.paragraphs?.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {block.bullets ? (
                  <ul>
                    {block.bullets.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}

function Terms({ onOpen }: { onOpen: (title: string) => void }) {
  const disclosures = LEGAL_DOCS.slice(0, 3);
  const attestations = LEGAL_DOCS.slice(3);
  return (
    <>
      <Panel title="Disclosures">
        <div className={styles.stack}>
          {disclosures.map((doc) => (
            <div key={doc.title}>
              <Button variant="text" size="small" className={styles.linkButton} onClick={() => onOpen(doc.title)}>
                {doc.title}
              </Button>
              <div className={styles.fieldLabel}>{doc.when}</div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Attestations">
        <div className={styles.stack}>
          {attestations.map((doc) => (
            <div key={doc.title}>
              <Button variant="text" size="small" className={styles.linkButton} onClick={() => onOpen(doc.title)}>
                {doc.title}
              </Button>
              <div className={styles.fieldLabel}>{doc.when}</div>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}

function Manifest() {
  return (
    <Panel
      title="Account Manifest"
      action={
        <a className={styles.openWindow} href="/account-manifest" target="_blank" rel="noopener noreferrer">
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path
              d="M7.2 1.2H10.8V4.8M10.8 1.2 5.2 6.8M4.6 2.4H2.2A1.2 1.2 0 0 0 1 3.6v6.2A1.2 1.2 0 0 0 2.2 11h6.2a1.2 1.2 0 0 0 1.2-1.2V7.4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Open in new window
        </a>
      }
    >
      <div className={styles.viewer}>
        <AccountOpeningRecord />
      </div>
    </Panel>
  );
}

export function ApplicationPanel() {
  const [selected, setSelected] = useState<Choice>(null);
  const [templateTitle, setTemplateTitle] = useState<string | null>(null);
  const [sentTitle, setSentTitle] = useState<string | null>(null);
  const [documentTitle, setDocumentTitle] = useState<string | null>(null);
  const sentEmail = SENT_EMAILS.find((email) => email.title === sentTitle);
  const show = (id: string) => selected === id || selected === "all";
  return (
    <div className={styles.columns}>
      <Menu
        title="Application Information"
        items={APPLICATION_ITEMS}
        selected={selected}
        onSelect={(id) => {
          setSelected(id);
          setTemplateTitle(null);
          setSentTitle(null);
          setDocumentTitle(null);
        }}
      />
      <Detail
        title="Application Details"
        empty="Select an applicant section to view its contents."
        replace={
          templateTitle ? (
            <SingleSend embedded templateTitle={templateTitle} onCancel={() => setTemplateTitle(null)} />
          ) : sentEmail ? (
            <SingleSend
              embedded
              readOnly
              templateTitle={sentEmail.title}
              body={sentEmail.body}
              sentLabel={sentEmail.sent}
              onCancel={() => setSentTitle(null)}
            />
          ) : documentTitle ? (
            <DocumentView title={documentTitle} onClose={() => setDocumentTitle(null)} />
          ) : undefined
        }
      >
        {selected ? (
          <>
            {show("questionnaire") ? <Questionnaire /> : null}
            {show("deposit") ? <Deposit /> : null}
            {show("email") ? (
              <Emails
                onEdit={(template) => {
                  setSentTitle(null);
                  setTemplateTitle(template);
                }}
                onView={(title) => {
                  setTemplateTitle(null);
                  setSentTitle(title);
                }}
              />
            ) : null}
            {show("rates") ? <Rates /> : null}
            {show("terms") ? (
              <Terms
                onOpen={(title) => {
                  setTemplateTitle(null);
                  setSentTitle(null);
                  setDocumentTitle(title);
                }}
              />
            ) : null}
            {show("manifest") ? <Manifest /> : null}
          </>
        ) : undefined}
      </Detail>
    </div>
  );
}

const OVERVIEW_ITEMS = [
  {
    id: "fraud",
    label: "Fraud Risk",
    tone: "error" as const,
    findings: [] as [string, string][],
  },
  {
    id: "dna",
    label: "DNA Mismatch",
    tone: "error" as const,
    findings: [
      ["Name mismatch", "John Smith"],
      ["DOB mismatch", "Dec 9, 1980"],
      ["Phone number mismatch", "(123) 890-1029"],
      ["Warning codes", "Kiting Suspect (KITE)\nDeceased Persons (DEAD)"],
    ],
  },
  {
    id: "phone",
    label: "Phone Warning",
    tone: "warning" as const,
    findings: [
      ["Socure 30", "R620 - Phone risk score represents high risk"],
      ["Socure 30", "I690 - Phone risk score represents high risk"],
    ],
  },
];

export function OverviewPanel({ onViewDna, pending = true }: { onViewDna: () => void; pending?: boolean }) {
  const [selected, setSelected] = useState<Choice>(null);
  const [socureOpen, setSocureOpen] = useState(false);
  if (!pending) {
    return (
      <div className={styles.columns}>
        <section className={styles.railWide} aria-label="Needs Review">
          <h2>Needs Review</h2>
          <p className={styles.emptyCopy}>Nothing pending review.</p>
        </section>
        <Detail title="Application Details" empty="This application has no pending review items." />
      </div>
    );
  }
  return (
    <div className={styles.columns}>
      <section className={styles.railWide} aria-label="Needs Review">
        <h2>Needs Review</h2>
        <div className={styles.railBody}>
          {OVERVIEW_ITEMS.map((item) => {
            const open = selected === item.id;
            return (
              <div className={open ? `${styles.accordion} ${styles.accordionOpen}` : styles.accordion} key={item.id}>
                <button
                  className={styles.accordionButton}
                  type="button"
                  aria-expanded={open}
                  onClick={() => {
                    setSelected(open ? null : item.id);
                    setSocureOpen(false);
                  }}
                >
                  <span className={styles.cardTitle}>
                    <span className={styles[item.tone]} />
                    {item.label}
                  </span>
                  <img src={open ? "/dashboard/chevron-down.svg" : "/dashboard/chevron-right.svg"} alt="" width={16} height={16} />
                </button>
                {open && item.findings.length > 0 ? (
                  <div className={item.id === "phone" ? `${styles.accordionBody} ${styles.accordionBodyTight}` : styles.accordionBody}>
                    {item.findings.map(([label, value], index) => {
                      const opensSocure = item.id === "phone" && index === 0;
                      if (!opensSocure) {
                        return (
                          <div className={styles.finding} key={`${item.id}-${index}`}>
                            <strong>{label}</strong>
                            <span>{value}</span>
                          </div>
                        );
                      }
                      return (
                        <button
                          className={socureOpen ? `${styles.finding} ${styles.findingSelected}` : styles.finding}
                          key={`${item.id}-${index}`}
                          type="button"
                          aria-pressed={socureOpen}
                          onClick={() => setSocureOpen((open) => !open)}
                        >
                          <strong>{label}</strong>
                          <span>{value}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>
      <Detail title="Application Details" empty="Select a KYC tag to review its contents.">
        {selected === "phone" ? (
          <>
            <Panel title="Person Details">
              <Field label="Phone Number" value="(123) 830-0182" />
            </Panel>
            {socureOpen ? <Panel title="Socure 30 Details">
              <div className={styles.fields}>
                <Field label="Real IP Address" value="00.102.982.102" />
                <Field label="Suspect Device Data" value="False" />
                <Field label="Device Alias" value="1209312312390" />
                <Field label="Suspect OS" value="False" />
                <Field label="Device Badge" value="999" />
                <span />
                <Field label="Device Timestamp" value="2026-08-26T15:34:00Z" />
                <span />
                <Field label="Device Browser Config" value="EN-US, EN;Q=0.9" />
                <span />
                <Field label="Device Browser Language" value="EN-US" />
              </div>
            </Panel> : null}
          </>
        ) : selected === "dna" ? (
          <DnaInfo mismatch overview onViewAll={onViewDna} />
        ) : selected === "fraud" ? (
          <Panel title="Fraud Risk">
            <div className={styles.tagList}>
              <div>
                <span className={styles.error} />
                Fraud Risk
              </div>
            </div>
          </Panel>
        ) : undefined}
      </Detail>
    </div>
  );
}

const ACTIVITY = [
  { date: "Mar 10, 2025", time: "2:34 PM", actor: "person" as const, parts: [["John Smith", true], [" visited ", false], ["page", true]], category: "Application" },
  { date: "Mar 10, 2025", time: "2:39 PM", actor: "person" as const, parts: [["John Smith", true], [" updated ", false], ["application details", true]], category: "Application" },
  { date: "Mar 10, 2025", time: "3:33 PM", actor: "bank" as const, parts: [["SouthEast Bank", true], [" requires KYC Manual Review ", false], ["John Smith", true]], category: "KYC / Compliance" },
  { date: "Mar 10, 2025", time: "2:48 PM", actor: "bank" as const, parts: [["SouthEast Bank", true], [" KYC Approved ", false], ["John Smith", true]], category: "Document" },
  { date: "Mar 10, 2025", time: "3:22 PM", actor: "person" as const, parts: [["John Smith", true], [" submitted application for ", false], ["review", true]], category: "Document" },
  { date: "Mar 10, 2025", time: "3:11 PM", actor: "person" as const, parts: [["John Smith", true], [" uploaded ", false], ["Passport", true]], category: "Funding" },
  { date: "Mar 10, 2025", time: "2:56 PM", actor: "person" as const, parts: [["John Smith", true], [" visited ", false], ["page", true]], category: "Communication" },
  { date: "Mar 10, 2025", time: "3:42 PM", actor: "bank" as const, parts: [["SouthEast Bank", true], [" requires KYC Approved ", false], ["John Smith", true]], category: "Navigation" },
  { date: "Mar 10, 2025", time: "3:42 PM", actor: "person" as const, parts: [["John Smith", true], [" visited ", false], ["page", true]], category: "Assignment" },
  { date: "Mar 10, 2025", time: "3:42 PM", actor: "person" as const, parts: [["John Smith", true], [" visited ", false], ["page", true]], category: "Assignment" },
];

export function ActivityPanel() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const needle = query.trim().toLowerCase();
  const rows = ACTIVITY.filter((row) => {
    if (!needle) return true;
    const text = row.parts.map(([part]) => part).join(" ");
    return `${row.date} ${row.time} ${text} ${row.category}`.toLowerCase().includes(needle);
  });

  return (
    <section className={styles.activity} aria-label="Activity">
      <h2>Activity</h2>
      <div className={styles.activityToolbar}>
        <SearchField
          containerClassName={styles.activitySearch}
          label="Search activity"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Button variant="outline" size="small" icon={<img src="/dashboard/filter.svg" alt="" width={16} height={16} />}>
          Filters
        </Button>
      </div>
      <DataTableScroll className={styles.activityTableWrap}>
        <DataTable density="compact" className={styles.activityTable}>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Time</th>
              <th scope="col">Activity</th>
              <th scope="col">Category</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className={styles.activityEmpty} colSpan={4}>
                  No matching activity
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={`${row.time}-${row.category}-${index}`}>
                  <td>{row.date}</td>
                  <td>{row.time}</td>
                  <td>
                    <div className={styles.activityEvent}>
                      {row.actor === "bank" ? (
                        <img className={styles.bankAvatar} src="/dashboard/bank-mark.png" alt="" width={40} height={40} />
                      ) : (
                        <span className={styles.initials} aria-hidden="true">
                          JS
                        </span>
                      )}
                      <p>
                        {row.parts.map(([text, link], partIndex) =>
                          link ? (
                            <span className={styles.activityLink} key={partIndex}>
                              {text}
                            </span>
                          ) : (
                            <span key={partIndex}>{text}</span>
                          ),
                        )}
                      </p>
                    </div>
                  </td>
                  <td>{row.category}</td>
                </tr>
              ))
            )}
          </tbody>
        </DataTable>
      </DataTableScroll>
      {needle ? null : (
        <DataTableFooter>
          <Pagination count={100} page={page} pageSize={10} onPageChange={setPage} />
        </DataTableFooter>
      )}
    </section>
  );
}
