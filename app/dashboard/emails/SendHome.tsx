"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Page, PageHeader, SearchField } from "@/components";
import { DropdownItem } from "@/components/ui/Dropdown";
import { CDA_DETAILS } from "@/lib/cda-record";
import { dateOnly } from "@/lib/format";
import { certificationById, displayCaseNumber } from "@/lib/ops-logic";
import { useOps } from "@/lib/ops-store";
import { schoolFileName, contactForSchool } from "@/lib/school-contacts";
import { useStore } from "@/lib/store";
import type { EmailLine } from "./activity";
import { logEmail, sentStamp } from "./email-log";
import { EMAIL_LINES, categoriesFor, lineLabel, templatesFor } from "./lines";
import { SingleSend } from "./SingleSend";
import styles from "./emails.module.css";

type Applicant = {
  id: string;
  name: string;
  email: string;
  alias: string;
  applications: string[];
};

type Draft = {
  line: EmailLine;
  category: string;
  template: string;
  title: string;
  name: string;
  email: string;
  product: string;
  audience: string;
  fileName: string;
  caseId?: string;
  caseNumber?: string;
  applicationId?: string;
  body?: string;
};

const APPLICANTS: Applicant[] = [
  {
    id: "981723123",
    name: "John Smith",
    email: "jsmith@email.com",
    alias: "810923",
    applications: ["6-Month CD", "12-Month CD", "Checking", "Savings"],
  },
  {
    id: "294",
    name: "Aardvark User",
    email: "jhart@southeastbank.com",
    alias: "294",
    applications: ["Personal Loan", "Auto Loan"],
  },
];

function Chevron({ direction }: { direction: "down" | "right" }) {
  const src = direction === "down" ? "/dashboard/chevron-down.svg" : "/dashboard/chevron-right.svg";
  return <img src={src} alt="" width={16} height={16} />;
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M5 4.06 8.9 8 5 11.94 6.05 13 11 8 6.05 3 5 4.06Z" fill="currentColor" />
    </svg>
  );
}

function matchesQuery(haystack: string, query: string) {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) return true;
  const text = haystack.toLowerCase();
  return tokens.every((token) => text.includes(token));
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

function starterBody(draft: Pick<Draft, "line" | "name" | "caseNumber" | "applicationId">) {
  if (draft.line === "deposits") return undefined;
  const hello = draft.name ? `Hello ${escapeHtml(draft.name)},` : "Hello,";
  const about =
    draft.line === "servicing" && draft.caseNumber
      ? `This message is about case ${escapeHtml(draft.caseNumber)}.`
      : draft.line === "los" && draft.applicationId
        ? `This message is about application ${escapeHtml(draft.applicationId)}.`
        : "";
  return `<p>${hello}</p>${about ? `<p>${about}</p>` : ""}<p></p>`;
}

export function SendHome() {
  const router = useRouter();
  const { applications } = useStore();
  const ops = useOps();
  const [line, setLine] = useState<EmailLine | "">("");
  const [query, setQuery] = useState("");
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [productOwner, setProductOwner] = useState("");
  const [productChoice, setProductChoice] = useState("");
  const [category, setCategory] = useState("");
  const [template, setTemplate] = useState("");
  const [templateOwner, setTemplateOwner] = useState("");
  const [school, setSchool] = useState("");
  const [menu, setMenu] = useState<null | "category" | "template" | "case" | "school">(null);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const openCases = useMemo(() => {
    return ops.cases
      .filter((item) => item.status !== "closed")
      .map((item) => {
        const loan = ops.loans.find((entry) => entry.id === item.loanId);
        const number = displayCaseNumber(item);
        const borrower = loan?.borrower ?? "Unknown borrower";
        return {
          id: item.id,
          number,
          borrower,
          school: loan?.school ?? "",
          schoolCode: loan?.schoolCode ?? "",
          product: loan?.product ?? "",
          servicer: loan?.servicer ?? "Mohela",
          applicationId: loan?.applicationId ?? "",
          label: `${number} · ${borrower}`,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [ops.cases, ops.loans]);

  const schools = useMemo(
    () => [...new Set(ops.loans.map((loan) => loan.school.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [ops.loans],
  );

  const depositMatches = useMemo(
    () =>
      APPLICANTS.filter((person) =>
        matchesQuery([person.name, person.email, person.id, person.alias, `#${person.id}`, `#${person.alias}`].join(" "), query),
      ),
    [query],
  );
  const losMatches = useMemo(
    () =>
      applications.filter((item) =>
        matchesQuery([item.borrower.fullName, item.borrower.email, item.id, item.recordType, item.opportunityName].join(" "), query),
      ),
    [applications, query],
  );
  const caseMatches = useMemo(
    () => openCases.filter((item) => matchesQuery([item.label, item.school, item.product, item.number, item.borrower].join(" "), query)),
    [openCases, query],
  );

  const applicant = line === "deposits"
    ? pickedId
      ? (APPLICANTS.find((person) => person.id === pickedId) ?? null)
      : query.trim() && depositMatches.length === 1
        ? depositMatches[0]
        : null
    : null;
  const losApp = line === "los" ? (applications.find((item) => item.id === pickedId) ?? null) : null;
  const servicingCase = line === "servicing" ? (openCases.find((item) => item.id === pickedId) ?? null) : null;
  const recordKey = line === "deposits" ? (applicant?.id ?? "") : line === "los" || line === "servicing" ? (pickedId ?? "") : line === "other" ? "other" : "";
  const product = applicant && productOwner === applicant.id ? productChoice : (applicant?.applications[0] ?? "");
  const activeTemplate = templateOwner === recordKey ? template : "";
  const chosenSchool = school || servicingCase?.school || "";
  const recordReady = line === "other" || Boolean(applicant || losApp || servicingCase);
  const categories = line && line !== "servicing" ? categoriesFor(line) : [];
  const templates = line && line !== "servicing" ? templatesFor(line, category) : [];
  const ready = line === "servicing" ? Boolean(servicingCase && chosenSchool) : Boolean(line && recordReady && activeTemplate);
  const showSearch = line === "deposits" || line === "los" || line === "servicing";

  useEffect(() => {
    if (!menu && !resultsOpen) return;
    function closeOnOutside(event: PointerEvent) {
      const target = event.target as Node;
      if (menu && !stepsRef.current?.contains(target)) setMenu(null);
      if (resultsOpen && !searchRef.current?.contains(target)) setResultsOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setMenu(null);
      setResultsOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menu, resultsOpen]);

  function chooseLine(next: EmailLine) {
    setLine(next);
    setQuery("");
    setPickedId(null);
    setProductOwner("");
    setProductChoice("");
    setCategory(categoriesFor(next)[0] ?? "");
    setTemplate("");
    setTemplateOwner("");
    setSchool("");
    setMenu(null);
    setResultsOpen(false);
  }

  function chooseTemplate(next: string) {
    setTemplate(next);
    setTemplateOwner(recordKey);
    setMenu(null);
  }

  function chooseCase(id: string) {
    setPickedId(id);
    setResultsOpen(false);
    setMenu(null);
    const match = openCases.find((item) => item.id === id);
    if (match?.school) setSchool(match.school);
  }

  function openDraft() {
    if (line === "servicing" && servicingCase && chosenSchool) {
      const item = ops.cases.find((entry) => entry.id === servicingCase.id);
      const loan = ops.loans.find((entry) => entry.id === item?.loanId);
      const cert = loan ? certificationById(ops, loan.certificationId) : null;
      const contact = contactForSchool(chosenSchool, servicingCase.schoolCode);
      const disbursementDate =
        cert?.disbursements.find((entry) => entry.status === "scheduled")?.date ??
        cert?.disbursements[0]?.date ??
        loan?.disbursements.find((entry) => entry.status === "scheduled")?.date ??
        loan?.disbursements[0]?.date ??
        "";
      const notes = (ops.feed ?? [])
        .filter((post) => post.caseId === servicingCase.id && post.kind !== "created" && post.kind !== "email" && !post.id.startsWith("created-"))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const ask = notes[0]?.body || "Please speed up certification for this loan.";
      const body = `<p>Hello ${escapeHtml(contact.name)},</p><p>${escapeHtml(ask)}</p><p>Borrower: ${escapeHtml(servicingCase.borrower)}<br>School: ${escapeHtml(chosenSchool)}<br>Loan type: ${escapeHtml(servicingCase.product)}<br>Disbursement date: ${escapeHtml(dateOnly(disbursementDate))}</p><p>Please speed up certification so we can release these funds.</p><p>This message is about case ${escapeHtml(servicingCase.number)}.</p>`;
      setDraft({
        line,
        category: "School",
        template: `Certification follow-up for ${servicingCase.borrower}`,
        title: `Email ${chosenSchool}`,
        name: contact.name,
        email: contact.email,
        product: chosenSchool,
        audience: contact.school,
        fileName: schoolFileName(chosenSchool, item?.subject || "Certification follow-up"),
        caseId: servicingCase.id,
        caseNumber: servicingCase.number,
        body,
      });
      return;
    }
    if (!line || !activeTemplate) return;
    const title = `${category} - ${activeTemplate}`;
    if (line === "deposits" && applicant) {
      setDraft({
        line,
        category,
        template: activeTemplate,
        title,
        name: applicant.name,
        email: applicant.email,
        product,
        audience: applicant.name,
        fileName: "",
      });
      return;
    }
    if (line === "los" && losApp) {
      setDraft({
        line,
        category,
        template: activeTemplate,
        title,
        name: losApp.borrower.fullName,
        email: losApp.borrower.email,
        product: losApp.recordType,
        audience: losApp.borrower.fullName,
        fileName: "",
        applicationId: losApp.id,
      });
      return;
    }
    if (line === "other") {
      setDraft({
        line,
        category,
        template: activeTemplate,
        title,
        name: "",
        email: "",
        product: "Other",
        audience: "Other",
        fileName: "",
      });
    }
  }

  if (draft) {
    const startingBody = starterBody(draft);
    return (
      <SingleSend
        templateTitle={draft.title}
        applicantName={draft.name}
        applicantEmail={draft.email}
        productName={draft.product}
        initialSubject={draft.template}
        body={draft.body ?? startingBody}
        caseNumber={draft.caseNumber}
        caseId={draft.caseId}
        lineLabel={draft.line === "servicing" ? undefined : lineLabel(draft.line)}
        applicationId={draft.line === "los" ? draft.applicationId : undefined}
        embedded={draft.line === "servicing"}
        hideFooter={draft.line === "servicing"}
        directSend={draft.line === "servicing"}
        doneLabel={draft.line === "servicing" ? "Return to dashboard" : undefined}
        onCancel={() => setDraft(null)}
        onDone={() => router.push("/dashboard/emails")}
        onSent={({ subject, body, to, cc, bcc }) => {
          const text = htmlToText(body);
          if (draft.line === "servicing" && draft.caseId) {
            ops.sendSchoolEmail(draft.caseId, "Demo Account", {
              to: to.trim() || draft.email,
              cc,
              bcc,
              school: draft.audience,
              subject,
              body: text,
              fileName: draft.fileName,
            });
          }
          logEmail({
            id: `sent-${Date.now().toString(36)}`,
            template: draft.title,
            subject,
            email: to.trim() || draft.email,
            customer: draft.name || to.trim() || "Other",
            status: "Delivered",
            sent: sentStamp(),
            line: draft.line,
            caseId: draft.caseId,
            caseNumber: draft.caseNumber,
            applicationId: draft.line === "los" ? draft.applicationId : undefined,
            recordLabel: draft.line === "deposits" ? draft.product : draft.line === "other" ? "Other" : undefined,
            body,
          });
        }}
      />
    );
  }

  const searchLabel = line === "los" ? "Search applications" : line === "servicing" ? "Search cases" : "Search applicants";
  const paneTitle = applicant?.name || losApp?.borrower.fullName || servicingCase?.borrower || (line === "other" ? "Other" : "Record");
  const paneMeta = applicant
    ? `ID #${applicant.id}`
    : losApp
      ? losApp.id
      : servicingCase
        ? servicingCase.number
        : "";

  return (
    <Page flush className={styles.homePage}>
      <PageHeader
        className={styles.pageHeader}
        title="New Email"
        actions={
          ready ? (
            <Button size="small" onClick={openDraft}>
              {line === "servicing" ? "Next" : "Choose this template"}
              <ChevronRight />
            </Button>
          ) : (
            <button className={styles.chooseIdle} type="button" disabled>
              {line === "servicing" ? "Next" : "Choose this template"}
              <Chevron direction="right" />
            </button>
          )
        }
      />
      <div className={styles.homeBody}>
        <div className={styles.lineRow} role="group" aria-label="Line of business">
          {EMAIL_LINES.map((item) => (
            <button
              key={item.id}
              className={line === item.id ? styles.lineSelected : styles.line}
              type="button"
              aria-pressed={line === item.id}
              onClick={() => chooseLine(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        {showSearch ? (
          <div className={styles.homeSearchWrap} ref={searchRef}>
            <SearchField
              label={searchLabel}
              placeholder={searchLabel}
              value={query}
              onFocus={() => setResultsOpen(true)}
              onBlur={(event) => {
                const next = event.relatedTarget;
                if (next instanceof Node && searchRef.current?.contains(next)) return;
                setResultsOpen(false);
              }}
            onChange={(event) => {
              setQuery(event.target.value);
              setPickedId(null);
              if (line === "servicing") setSchool("");
              setResultsOpen(true);
            }}
            />
            {resultsOpen ? (
              <div className={`uw-dropdown ${styles.homeResults}`} role="listbox" aria-label={searchLabel}>
                {line === "deposits" && depositMatches.length === 0 ? <p className={styles.homeEmpty}>No matching applicants.</p> : null}
                {line === "los" && losMatches.length === 0 ? <p className={styles.homeEmpty}>No matching applications.</p> : null}
                {line === "servicing" && caseMatches.length === 0 ? <p className={styles.homeEmpty}>No matching cases.</p> : null}
                {line === "deposits"
                  ? depositMatches.map((person) => (
                      <DropdownItem
                        key={person.id}
                        role="option"
                        onClick={() => {
                          setPickedId(person.id);
                          setResultsOpen(false);
                        }}
                      >
                        <span className={styles.homeResultLabel}>
                          {person.name}
                          <span>ID #{person.id}</span>
                        </span>
                      </DropdownItem>
                    ))
                  : null}
                {line === "los"
                  ? losMatches.map((item) => (
                      <DropdownItem
                        key={item.id}
                        role="option"
                        onClick={() => {
                          setPickedId(item.id);
                          setResultsOpen(false);
                        }}
                      >
                        <span className={styles.homeResultLabel}>
                          {item.borrower.fullName}
                          <span>{item.id}</span>
                        </span>
                      </DropdownItem>
                    ))
                  : null}
                {line === "servicing"
                  ? caseMatches.map((item) => (
                      <DropdownItem
                        key={item.id}
                        role="option"
                        onClick={() => chooseCase(item.id)}
                      >
                        <span className={styles.homeResultLabel}>
                          {item.label}
                          <span>{item.school}</span>
                        </span>
                      </DropdownItem>
                    ))
                  : null}
              </div>
            ) : null}
          </div>
        ) : null}
        <section className={styles.homeCard}>
          <div className={styles.homeApps}>
            <div className={styles.homePaneHead}>
              <p className={styles.homeName}>{paneTitle}</p>
              {paneMeta ? <p className={styles.homeId}>{paneMeta}</p> : null}
            </div>
            {line === "deposits" && applicant ? (
              <div className={styles.homeAppList}>
                {applicant.applications.map((name) => (
                  <button
                    key={name}
                    className={name === product ? styles.homeAppSelected : styles.homeApp}
                    type="button"
                    aria-pressed={name === product}
                    onClick={() => {
                      setProductOwner(applicant.id);
                      setProductChoice(name);
                    }}
                  >
                    <span className={styles.homeAppLabel}>
                      <span className={styles.homeDot} />
                      {name}
                    </span>
                    <Chevron direction="right" />
                  </button>
                ))}
              </div>
            ) : null}
            {losApp ? (
              <div className={styles.homeAppList}>
                <div className={styles.homeAppSelected}>
                  <span className={styles.homeAppLabel}>
                    <span className={styles.homeDot} />
                    {losApp.recordType}
                  </span>
                  <span>{losApp.id}</span>
                </div>
              </div>
            ) : null}
            {servicingCase ? (
              <dl className={styles.recordGrid}>
                {CDA_DETAILS.map((field) => (
                  <div key={field.label} className={field.wide ? styles.recordWide : undefined}>
                    <dt>{field.label}</dt>
                    <dd>{field.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            {!recordReady || !line ? (
              <div className={styles.homePaneEmpty}>
                <strong>{line ? "No record selected" : "Choose a line of business"}</strong>
                <p>
                  {line === "deposits"
                    ? "Search by name, email, or ID to see their applications."
                    : line === "los"
                      ? "Search by borrower, email, or application number."
                      : line === "servicing"
                        ? "Search by case number, borrower, or school."
                        : "Deposits, LOS, and Servicing each attach to their own record. Other stays unlinked."}
                </p>
              </div>
            ) : null}
            {line === "other" ? (
              <div className={styles.homePaneEmpty}>
                <strong>No record attached</strong>
                <p>Other emails go out on their own. They are not filed on a case or an application.</p>
              </div>
            ) : null}
          </div>
          <div className={styles.homeSend}>
            <div className={styles.homePaneHead}>
              <p className={styles.homeName}>Send New Email</p>
            </div>
            {line === "servicing" ? (
              <div className={styles.homeSteps} ref={stepsRef}>
                <div className={styles.homeStep}>
                  <span className={styles.homeStepNum}>1</span>
                  <div className={styles.homeStepBody}>
                    <p className={styles.homeStepLabel}>Student/Case Number</p>
                    <button
                      className={styles.homeSelect}
                      type="button"
                      aria-expanded={menu === "case"}
                      onClick={() => setMenu((current) => (current === "case" ? null : "case"))}
                    >
                      <span className={servicingCase ? undefined : styles.homePlaceholder}>{servicingCase?.label || "Select..."}</span>
                      <Chevron direction="down" />
                    </button>
                    {menu === "case" ? (
                      <div className={styles.homeMenu} role="listbox" aria-label="Student/Case Number">
                        {openCases.map((item) => (
                          <button
                            key={item.id}
                            className={item.id === servicingCase?.id ? styles.homeOptionActive : styles.homeOption}
                            type="button"
                            role="option"
                            aria-selected={item.id === servicingCase?.id}
                            onClick={() => chooseCase(item.id)}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className={styles.homeStep}>
                  <span className={styles.homeStepNum}>2</span>
                  <div className={styles.homeStepBody}>
                    <p className={styles.homeStepLabel}>School</p>
                    <button
                      className={styles.homeSelect}
                      type="button"
                      aria-expanded={menu === "school"}
                      onClick={() => setMenu((current) => (current === "school" ? null : "school"))}
                    >
                      <span className={chosenSchool ? undefined : styles.homePlaceholder}>{chosenSchool || "Select..."}</span>
                      <Chevron direction="down" />
                    </button>
                    {menu === "school" ? (
                      <div className={styles.homeMenu} role="listbox" aria-label="School">
                        {schools.map((name) => (
                          <button
                            key={name}
                            className={name === chosenSchool ? styles.homeOptionActive : styles.homeOption}
                            type="button"
                            role="option"
                            aria-selected={name === chosenSchool}
                            onClick={() => {
                              setSchool(name);
                              setMenu(null);
                            }}
                          >
                            {name}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : line && recordReady ? (
              <div className={styles.homeSteps} ref={stepsRef}>
                <div className={styles.homeStep}>
                  <span className={styles.homeStepNum}>1</span>
                  <div className={styles.homeStepBody}>
                    <p className={styles.homeStepLabel}>Choose email category</p>
                    <button
                      className={styles.homeSelect}
                      type="button"
                      aria-expanded={menu === "category"}
                      onClick={() => setMenu((current) => (current === "category" ? null : "category"))}
                    >
                      <span>{category}</span>
                      <Chevron direction="down" />
                    </button>
                    {menu === "category" ? (
                      <div className={styles.homeMenu} role="listbox" aria-label="Email category">
                        {categories.map((item) => (
                          <button
                            key={item}
                            className={item === category ? styles.homeOptionActive : styles.homeOption}
                            type="button"
                            role="option"
                            aria-selected={item === category}
                            onClick={() => {
                              setCategory(item);
                              setTemplate("");
                              setTemplateOwner("");
                              setMenu(null);
                            }}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className={styles.homeStep}>
                  <span className={styles.homeStepNum}>2</span>
                  <div className={styles.homeStepBody}>
                    <p className={styles.homeStepLabel}>Choose a template for {category}</p>
                    <button
                      className={styles.homeSelect}
                      type="button"
                      aria-expanded={menu === "template"}
                      onClick={() => setMenu((current) => (current === "template" ? null : "template"))}
                    >
                      <span className={activeTemplate ? undefined : styles.homePlaceholder}>{activeTemplate || "Select..."}</span>
                      <Chevron direction="down" />
                    </button>
                    {menu === "template" ? (
                      <div className={styles.homeMenu} role="listbox" aria-label="Email template">
                        {templates.map((item) => (
                          <button
                            key={item}
                          className={item === activeTemplate ? styles.homeOptionActive : styles.homeOption}
                          type="button"
                          role="option"
                          aria-selected={item === activeTemplate}
                          onClick={() => chooseTemplate(item)}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.homePaneEmpty}>
                <strong>No template selected</strong>
                <p>{line ? "Choose a record before picking a category and template." : "Choose a line of business before picking a template."}</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </Page>
  );
}
