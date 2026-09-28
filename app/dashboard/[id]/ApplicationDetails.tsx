"use client";

import { useCallback, useEffect, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { AssignMenu, Button, DECISIONS, DecisionPanel, NotesPanel, type DecisionId, type PanelNote } from "@/components";
import shell from "../dashboard.module.css";
import type { RequestRow } from "../requests";
import { ActivityPanel, ApplicantPanel, ApplicationPanel, OverviewPanel, RiskPanel } from "./TabPanels";
import styles from "./details.module.css";

const TABS = [
  { id: "overview", label: "Overview", icon: "/dashboard/overview.svg", width: 16, height: 16 },
  { id: "risk", label: "Risk verification", icon: "/dashboard/risk.svg", width: 16, height: 16 },
  { id: "applicant", label: "Applicant", icon: "/dashboard/applicant.svg", width: 16, height: 16 },
  { id: "application", label: "Application", icon: "/dashboard/invoice.svg", width: 15, height: 15 },
  { id: "activity", label: "Activity", icon: "/dashboard/activity.svg", width: 11, height: 11 },
] as const;

function emailFor(name: string) {
  const [first = "", last = ""] = name.toLowerCase().split(" ");
  return `${first.slice(0, 1)}${last}@email.com`;
}

function noteStamp(date: Date) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const hours = date.getHours();
  const hour = hours % 12 || 12;
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} ${hour}:${minutes} ${suffix}`;
}

export function ApplicationDetails({ request }: { request: RequestRow }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("overview");
  const [ssnVisible, setSsnVisible] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [decisionOpen, setDecisionOpen] = useState(false);
  const [notes, setNotes] = useState<PanelNote[]>(request.notes);
  const [assignee, setAssignee] = useState(request.id === "john-smith" ? "Unassigned" : request.assignee);
  const [assignOpen, setAssignOpen] = useState(false);
  const [status, setStatus] = useState(request.status);
  const [statusLabel, setStatusLabel] = useState(request.statusLabel);

  useEffect(() => {
    if (!notesOpen && !decisionOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setNotesOpen(false);
      setDecisionOpen(false);
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [notesOpen, decisionOpen]);

  function submitDecision(id: DecisionId, body: string) {
    const choice = DECISIONS.find((item) => item.id === id);
    if (!choice) return;
    setStatus(choice.status);
    setStatusLabel(choice.statusLabel);
    if (body) {
      setNotes((current) => [{ author: "Aniko Brewer", at: noteStamp(new Date()), body }, ...current]);
    }
  }

  const finishDecision = useCallback(() => {
    setTab("overview");
    setDecisionOpen(false);
  }, []);

  const lastFour = request.id === "john-smith" ? "7291" : request.account === "N/A" ? "4820" : request.account.slice(-4);
  const ssn = ssnVisible ? `123 - 45 - ${lastFour}` : `*** - ** - ${lastFour}`;
  const applicationNumber = request.id === "john-smith" ? "138701283" : request.account;
  const noteCount = request.id === "john-smith" ? Math.max(3, notes.length) : notes.length;

  function moveTab(event: ReactKeyboardEvent<HTMLButtonElement>, index: number) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const last = TABS.length - 1;
    const nextIndex =
      event.key === "Home" ? 0 : event.key === "End" ? last : event.key === "ArrowLeft" ? (index + last) % TABS.length : (index + 1) % TABS.length;
    const next = TABS[nextIndex];
    setTab(next.id);
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[nextIndex]?.focus();
  }

  return (
    <>
      <main className={styles.stage}>
        <header className={styles.profile}>
          <div className={styles.identity}>
            <div className={styles.identityTop}>
              <h4>{request.customer}</h4>
              <Button
                variant="outline"
                size="small"
                className={`${styles.headerAction} ${styles.notesButton}`}
                aria-expanded={notesOpen}
                onClick={() => {
                  setDecisionOpen(false);
                  setNotesOpen(true);
                }}
              >
                Notes
                {noteCount > 0 ? <span className={styles.noteBadge}>{noteCount}</span> : null}
              </Button>
            </div>
            <dl className={styles.facts}>
              <div>
                <dt>Email</dt>
                <dd>{emailFor(request.customer)}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>
                  (123) 890-1029
                  <span className={styles.verified}>
                    <img src="/dashboard/check-circle.svg" alt="" width={12} height={12} />
                    Verified
                  </span>
                </dd>
              </div>
              <div>
                <dt>DOB</dt>
                <dd>Dec 9, 1980</dd>
              </div>
              <div>
                <dt>SSN</dt>
                <dd>
                  <span className={styles.ssn}>{ssn}</span>
                  <button
                    className={styles.eye}
                    type="button"
                    aria-pressed={ssnVisible}
                    aria-label={ssnVisible ? "Hide Social Security number" : "Show Social Security number"}
                    onClick={() => setSsnVisible((visible) => !visible)}
                  >
                    <img src="/dashboard/show.svg" alt="" width={14} height={14} />
                  </button>
                </dd>
              </div>
              <div>
                <dt>Address</dt>
                <dd className={styles.address}>
                  123 Maple St
                  <span>Los Angeles, CA 90032</span>
                </dd>
              </div>
            </dl>
          </div>
          <div className={styles.product}>
            <div className={styles.identityTop}>
              <h4>{request.product}</h4>
              <Button
                size="small"
                className={styles.headerAction}
                aria-expanded={decisionOpen}
                onClick={() => {
                  setNotesOpen(false);
                  setDecisionOpen((open) => !open);
                }}
              >
                Application Decision
              </Button>
            </div>
            <dl className={styles.facts}>
              <div>
                <dt>Initial Deposit</dt>
                <dd>$10,000.00</dd>
              </div>
              <div>
                <dt>Application Number</dt>
                <dd>{applicationNumber}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  <span className={styles.status}>
                    <span className={styles[status]} />
                    {statusLabel}
                  </span>
                </dd>
              </div>
              <div>
                <dt>Assigned to</dt>
                <dd>
                  <span className={styles.assignWrap}>
                    <Button
                      variant="link"
                      size="small"
                      className={styles.assign}
                      data-assign-trigger=""
                      aria-expanded={assignOpen}
                      aria-haspopup="dialog"
                      onClick={() => setAssignOpen((open) => !open)}
                    >
                      {assignee}
                    </Button>
                    {assignOpen ? (
                      <AssignMenu
                        value={assignee}
                        onCancel={() => setAssignOpen(false)}
                        onAssign={(name) => {
                          setAssignee(name);
                          setAssignOpen(false);
                        }}
                      />
                    ) : null}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </header>
        <div className={styles.tabs} role="tablist" aria-label="Application">
          {TABS.map((item, index) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                id={`application-tab-${item.id}`}
                className={active ? styles.tabActive : styles.tab}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`application-panel-${item.id}`}
                tabIndex={active ? 0 : -1}
                onClick={() => setTab(item.id)}
                onKeyDown={(event) => moveTab(event, index)}
              >
                <img
                  className={item.id === "overview" && !active ? styles.iconMute : undefined}
                  src={item.icon}
                  alt=""
                  width={item.width}
                  height={item.height}
                />
                {item.label}
                {item.id === "overview" ? <span className={styles.tabBadge}>3</span> : null}
              </button>
            );
          })}
        </div>
        <div
          className={styles.tabPanel}
          role="tabpanel"
          id={`application-panel-${tab}`}
          aria-labelledby={`application-tab-${tab}`}
        >
          {tab === "overview" ? <OverviewPanel /> : null}
          {tab === "risk" ? <RiskPanel /> : null}
          {tab === "applicant" ? <ApplicantPanel /> : null}
          {tab === "application" ? <ApplicationPanel /> : null}
          {tab === "activity" ? <ActivityPanel /> : null}
        </div>
      </main>
      {notesOpen || decisionOpen ? (
        <div className={shell.sideSlot}>
          {decisionOpen ? (
            <DecisionPanel onClose={() => setDecisionOpen(false)} onSubmit={submitDecision} onRedirect={finishDecision} />
          ) : (
            <NotesPanel
              requestType={request.type}
              created={request.created}
              customer={request.customer}
              notes={notes}
              onClose={() => setNotesOpen(false)}
              onAdd={(body) => {
                const note: PanelNote = { author: "Aniko Brewer", at: noteStamp(new Date()), body };
                setNotes((current) => [note, ...current]);
              }}
            />
          )}
        </div>
      ) : null}
    </>
  );
}
