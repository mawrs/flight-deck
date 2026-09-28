"use client";

import { useState, type ReactNode } from "react";
import { Badge, Button, DataTable, DataTableFooter, DataTableScroll, Pagination, SearchField, type BadgeTone } from "@/components";
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

function Detail({ title, empty, children }: { title: string; empty: string; children?: ReactNode }) {
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

function DnaInfo({ mismatch = false, overview = false }: { mismatch?: boolean; overview?: boolean }) {
  return (
    <>
      <Panel
        title="DNA Information"
        action={
          <Button variant="text" size="small" className={styles.textButton}>
            View all DNA data
          </Button>
        }
      >
        {overview ? null : (
          <>
            <div className={styles.actions}>
              <Button variant="outline" size="small">
                Refresh data from DNA
              </Button>
            </div>
            <p className={styles.quiet}>Last refreshed on March 12, 2026 1:15 PM</p>
          </>
        )}
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

function Documents() {
  const [decision, setDecision] = useState<"approve" | "reject" | null>(null);
  const [note, setNote] = useState("");
  const [page, setPage] = useState(1);
  return (
    <Panel title="Document Preview">
      <div className={styles.docLayout}>
        <div>
          <Field label="Uploaded Document" value="Passport" />
          <Field label="Collected" value="March 6, 2026 9:15 AM" />
          <div className={styles.decisionBlock}>
            <label className={styles.choice}>
              <input type="radio" name="document-decision" checked={decision === "approve"} onChange={() => setDecision("approve")} />
              Approve
            </label>
            <label className={styles.choice}>
              <input type="radio" name="document-decision" checked={decision === "reject"} onChange={() => setDecision("reject")} />
              Reject
            </label>
            <p className={styles.fieldLabel}>Document Decision Note</p>
            <textarea className={styles.noteField} placeholder="Type note here..." value={note} onChange={(event) => setNote(event.target.value)} />
            <Button size="small" className={styles.confirm} disabled={!decision}>
              Confirm Decision
            </Button>
          </div>
        </div>
        <div>
          <div className={styles.actions}>
            <Button variant="text" size="small" className={styles.textButton}>
              Add additional documents
            </Button>
            <Button variant="text" size="small" className={styles.textButton}>
              Open in new tab
            </Button>
            <Button variant="text" size="small" className={styles.textButton}>
              Download
            </Button>
          </div>
          <img className={styles.docPreview} src="/dashboard/passport.png" alt="Passport uploaded by the applicant" width={679} height={422} />
          <DataTableFooter>
            <Pagination count={2} page={page} pageSize={1} onPageChange={setPage} />
          </DataTableFooter>
        </div>
      </div>
    </Panel>
  );
}

function Funding() {
  const [sources, setSources] = useState([
    { id: "1", name: "ORNL Federal Credit Union Savings Account", account: "147223710" },
    { id: "2", name: "ORNL Federal Credit Union Savings Account", account: "147223710" },
    { id: "3", name: "ORNL Federal Credit Union Savings Account", account: "147223710" },
  ]);
  return (
    <Panel
      title="Funding Sources"
      action={
        <Button
          variant="text"
          size="small"
          className={styles.textButton}
          onClick={() =>
            setSources((current) => [
              ...current,
              { id: String(Date.now()), name: "ORNL Federal Credit Union Savings Account", account: "147223710" },
            ])
          }
        >
          + Add new funding source
        </Button>
      }
    >
      {sources.map((source) => (
        <div className={styles.source} key={source.id}>
          <div>
            <strong>{source.name}</strong>
            <div>{source.account}</div>
            <span className={styles.fieldLabel}>Account Number</span>
          </div>
          <Button variant="text" size="small" className={styles.textButton} onClick={() => setSources((current) => current.filter((item) => item.id !== source.id))}>
            Remove source
          </Button>
        </div>
      ))}
    </Panel>
  );
}

function History() {
  const rows = [
    ["Rewards Checking", "Booked", "success", "Account number", "17232100", "12/28/2025"],
    ["Bonus Rate Savings", "Submitted in Review", "warning", "Application ID", "0329129", "03/04/2026"],
    ["12-Month CD Special", "Action Required", "error", "Application ID", "91298312", "05/12/2026"],
  ] as const;
  return (
    <Panel title="Application History">
      {rows.map(([name, status, tone, idLabel, id, updated]) => (
        <article className={styles.historyItem} key={name}>
          <strong>{name}</strong>
          <div className={styles.historyMeta}>
            <div>
              Status
              <Badge tone={tone as BadgeTone}>{status}</Badge>
            </div>
            <div>
              {idLabel}
              <strong>{id}</strong>
            </div>
            <div>
              Last updated
              <strong>{updated}</strong>
            </div>
          </div>
        </article>
      ))}
    </Panel>
  );
}

function Reports() {
  return (
    <Panel title="Reports">
      <Button variant="text" size="small" className={styles.linkButton}>
        QualiFile
      </Button>
      <div className={styles.fieldLabel}>Created on Mar 19, 2026</div>
    </Panel>
  );
}

export function ApplicantPanel() {
  const [selected, setSelected] = useState<Choice>(null);
  const show = (id: string) => selected === id || selected === "all";
  return (
    <div className={styles.columns}>
      <Menu title="Applicant Information" items={APPLICANT_ITEMS} selected={selected} onSelect={setSelected} />
      <Detail title="Applicant Details" empty="Select an applicant section to view its contents.">
        {selected ? (
          <>
            {show("person") ? <PersonInfo /> : null}
            {show("dna") ? <DnaInfo /> : null}
            {show("documents") ? <Documents /> : null}
            {show("funding") ? <Funding /> : null}
            {show("history") ? <History /> : null}
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

function Emails() {
  const rows = [
    ["Experience the benefits of SouthEast Bank", "Sent Jul 16, 2026 at 12:25pm"],
    ["Continue your application", "Sent Jul 16, 2026 at 11:25am"],
  ];
  return (
    <Panel
      title="Email Communication"
      action={
        <Button size="small">
          + Send new email
        </Button>
      }
    >
      {rows.map(([title, sent]) => (
        <div className={styles.emailRow} key={title}>
          <div>
            <Button variant="text" size="small" className={styles.linkButton}>
              <img src="/dashboard/email.svg" alt="" width={16} height={16} /> {title}
            </Button>
            <div className={styles.fieldLabel}>{sent}</div>
          </div>
        </div>
      ))}
    </Panel>
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

function Terms() {
  const disclosures = [
    ["Truth in Savings for Checking Accounts", "Acknowledged Mar 6, 2026 7:58 AM"],
    ["Account Terms and Conditions and Disclosures for Checking", "Acknowledged Mar 6, 2026 7:59 AM"],
    ["E-Sign Consent Agreement", "Acknowledged Mar 6, 2026 7:56 AM"],
  ];
  const attestations = [
    ["Electronic Delivery of Account Agreements and Disclosures", "Signed Mar 6, 2026 8:00 AM"],
    ["Read and agreed to the statements, agreements, and disclosures", "Signed Mar 6, 2026 8:01 AM"],
  ];
  return (
    <>
      <Panel title="Disclosures">
        <div className={styles.stack}>
          {disclosures.map(([label, when]) => (
            <div key={label}>
              <Button variant="text" size="small" className={styles.linkButton}>
                {label}
              </Button>
              <div className={styles.fieldLabel}>{when}</div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Attestations">
        <div className={styles.stack}>
          {attestations.map(([label, when]) => (
            <div key={label}>
              <Button variant="text" size="small" className={styles.linkButton}>
                {label}
              </Button>
              <div className={styles.fieldLabel}>{when}</div>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}

function Manifest() {
  const rows = [
    ["Application Status", "Successfully Booked"],
    ["Account Type", "Rewards Checking"],
    ["Account Variant", "Personal Account"],
    ["Account Number", "172515242"],
    ["Routing Number", "555555555"],
    ["Annual Percentage Yield", "0.00%"],
    ["Interest Rate *", "-"],
  ];
  return (
    <Panel
      title="Account Manifest"
      action={
        <Button variant="text" size="small" className={styles.textButton}>
          Open in new window
        </Button>
      }
    >
      <div className={styles.record}>
        <h3>Account Information</h3>
        <p>Account Opening Record</p>
        {rows.map(([label, value]) => (
          <div className={styles.recordRow} key={label}>
            <span>{label}</span>
            <span>{value}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function ApplicationPanel() {
  const [selected, setSelected] = useState<Choice>(null);
  const show = (id: string) => selected === id || selected === "all";
  return (
    <div className={styles.columns}>
      <Menu title="Application Information" items={APPLICATION_ITEMS} selected={selected} onSelect={setSelected} />
      <Detail title="Application Details" empty="Select an applicant section to view its contents.">
        {selected ? (
          <>
            {show("questionnaire") ? <Questionnaire /> : null}
            {show("deposit") ? <Deposit /> : null}
            {show("email") ? <Emails /> : null}
            {show("rates") ? <Rates /> : null}
            {show("terms") ? <Terms /> : null}
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

export function OverviewPanel() {
  const [selected, setSelected] = useState<Choice>(null);
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
                  onClick={() => setSelected(open ? null : item.id)}
                >
                  <span className={styles.cardTitle}>
                    <span className={styles[item.tone]} />
                    {item.label}
                  </span>
                  <img src={open ? "/dashboard/chevron-down.svg" : "/dashboard/chevron-right.svg"} alt="" width={16} height={16} />
                </button>
                {open && item.findings.length > 0 ? (
                  <div className={styles.accordionBody}>
                    {item.findings.map(([label, value], index) => (
                      <div className={styles.finding} key={`${item.id}-${index}`}>
                        <strong>{label}</strong>
                        <span>{value}</span>
                      </div>
                    ))}
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
            <Panel title="Socure 30 Details">
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
            </Panel>
          </>
        ) : selected === "dna" ? (
          <DnaInfo mismatch overview />
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
