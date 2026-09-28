"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "./Button";
import { Divider } from "./Divider";
import styles from "./DecisionPanel.module.css";

export const DECISIONS = [
  {
    id: "approve",
    label: "Approve",
    outcome: "Approved",
    status: "booked",
    statusLabel: "Approved",
    tone: "success",
    result: "Application has been approved and booked",
  },
  {
    id: "action",
    label: "Action Required",
    outcome: "Action Required",
    status: "review",
    statusLabel: "Action Required",
    tone: "warning",
    result: "Application has been marked action required",
  },
  {
    id: "reject",
    label: "Reject",
    outcome: "Rejected",
    status: "rejected",
    statusLabel: "Rejected",
    tone: "error",
    result: "Application has been rejected",
  },
  {
    id: "cancel",
    label: "Cancel Application",
    outcome: "Canceled",
    status: "canceled",
    statusLabel: "Canceled",
    tone: "error",
    result: "Application has been canceled",
  },
] as const;

export type DecisionId = (typeof DECISIONS)[number]["id"];

type DecisionPanelProps = {
  onClose: () => void;
  onSubmit: (decision: DecisionId, note: string) => void;
  onRedirect: () => void;
};

export function DecisionPanel({ onClose, onSubmit, onRedirect }: DecisionPanelProps) {
  const [decision, setDecision] = useState<DecisionId | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState<DecisionId | null>(null);
  const selected = DECISIONS.find((item) => item.id === decision);
  const result = DECISIONS.find((item) => item.id === submitted);

  useEffect(() => {
    if (!submitted) return;
    const timer = window.setTimeout(onRedirect, 2400);
    return () => window.clearTimeout(timer);
  }, [submitted, onRedirect]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!decision || !confirmed) return;
    onSubmit(decision, note.trim());
    setSubmitted(decision);
  }

  if (result) {
    return (
      <aside className={styles.result} aria-live="polite">
        <div className={styles.resultBody}>
          <img src="/dashboard/paper-plane.svg" alt="" width={202} height={124} />
          <div className={styles.resultCopy}>
            <h2>{result.result}</h2>
            <p>Redirecting you to the Application Overview...</p>
          </div>
          <span className={styles.dots} aria-hidden="true">
            <span />
            <span />
          </span>
        </div>
      </aside>
    );
  }

  return (
    <form className={styles.panel} aria-label="Application Decision" onSubmit={submit}>
      <div className={styles.content}>
        <header className={styles.header}>
          <h2>Application Decision</h2>
          <button className={styles.close} type="button" aria-label="Close application decision" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </header>
        <div className={styles.options} role="radiogroup" aria-label="Decision">
          {DECISIONS.map((item) => {
            const active = decision === item.id;
            return (
              <label key={item.id} className={active ? `${styles.optionSelected} ${styles[item.tone]}` : styles.option}>
                <input
                  type="radio"
                  name="application-decision"
                  checked={active}
                  onChange={() => {
                    setDecision(item.id);
                    setConfirmed(false);
                  }}
                />
                <span className={styles.radio} aria-hidden="true" />
                {item.label}
              </label>
            );
          })}
        </div>
        <Divider />
        <label className={styles.confirm}>
          <input
            type="checkbox"
            checked={confirmed}
            disabled={!decision}
            onChange={(event) => setConfirmed(event.target.checked)}
          />
          <span className={styles.box} aria-hidden="true" />
          I confirm I&apos;d like to mark this application as {selected?.outcome ?? "selected"}
        </label>
        <label className={styles.note}>
          <span>Leave a note</span>
          <textarea
            value={note}
            placeholder="Leave a helpful note about this application..."
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
      </div>
      <div className={styles.footer}>
        <Divider />
        <Button type="submit" size="small" fullWidth disabled={!decision || !confirmed}>
          Submit Decision
        </Button>
      </div>
    </form>
  );
}
