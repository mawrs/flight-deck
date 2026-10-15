"use client";

import { useState, type ReactNode } from "react";
import { shortDate } from "@/lib/format";
import type { Application } from "@/lib/types";

type ActivityKind = "task" | "email";

type ActivityItem = {
  id: string;
  kind: ActivityKind;
  title: string;
  at: string;
  actor: string;
  counterpart: string;
  body: string;
};

function atTime(value: string, days: number, hour: number, minute: number) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  date.setDate(date.getDate() + days);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function activitiesFor(application: Application): ActivityItem[] {
  const owner = application.owner || "Opportunity owner";
  const borrower = application.borrower.fullName;
  const email = application.borrower.email;
  const first = borrower.split(" ")[0] || borrower;
  const approved = application.status === "approved";
  const decisionAt = application.approvedAt ?? application.preReviewAt;

  return [
    {
      id: `${application.id}-til-approval`,
      kind: "task",
      title: "Approval TIL",
      at: atTime(decisionAt, 1, 9, 15),
      actor: owner,
      counterpart: borrower,
      body: "Prepare and send the Approval Truth in Lending disclosure to the borrower.",
    },
    {
      id: `${application.id}-decision-email`,
      kind: "email",
      title: approved
        ? "Your ELFI Loan Has Been Approved"
        : "Your ELFI Loan Has Been Conditionally Approved!",
      at: atTime(decisionAt, 0, 12, 24),
      actor: owner,
      counterpart: email,
      body: `Hi ${first},\n\nYour ELFI loan has been ${approved ? "approved" : "conditionally approved"}. Sign in to review the terms and complete any remaining items.\n\n${owner}\nELFI`,
    },
    {
      id: `${application.id}-csr-prereview`,
      kind: "task",
      title: "CSR Read",
      at: atTime(application.preReviewAt, 0, 8, 40),
      actor: owner,
      counterpart: borrower,
      body: "Complete the credit services review for the initial pre-review.",
    },
    {
      id: `${application.id}-csr-pull`,
      kind: "task",
      title: "CSR Read",
      at: atTime(application.hardCreditDate, 0, 11, 5),
      actor: owner,
      counterpart: borrower,
      body: "Review the borrower hard credit pull before pre-review.",
    },
    {
      id: `${application.id}-application-status`,
      kind: "task",
      title: "Application Status",
      at: atTime(application.applicationDate, 0, 10, 0),
      actor: owner,
      counterpart: borrower,
      body: "Confirm the application was received and the borrower was notified of the current status.",
    },
    {
      id: `${application.id}-til-initial`,
      kind: "task",
      title: "Approval TIL",
      at: atTime(application.applicationDate, 0, 9, 30),
      actor: owner,
      counterpart: borrower,
      body: "Open the initial Truth in Lending task for this application.",
    },
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function activityStamp(value: string, withTime: boolean) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const dayLabel = sameDay(date, now)
    ? "Today"
    : sameDay(date, yesterday)
      ? "Yesterday"
      : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (!withTime) return dayLabel;
  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${time} | ${dayLabel}`;
}

function monthGroups(items: ActivityItem[]) {
  const now = new Date();
  const groups: { key: string; label: string; current: boolean; items: ActivityItem[] }[] = [];
  for (const item of items) {
    const date = new Date(item.at);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const last = groups.at(-1);
    if (last?.key === key) {
      last.items.push(item);
      continue;
    }
    groups.push({
      key,
      label: `${date.toLocaleDateString("en-US", { month: "long" })} • ${date.getFullYear()}`,
      current: date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth(),
      items: [item],
    });
  }
  return groups;
}

export function BorrowerActivity({ application }: { application: Application }) {
  const items = activitiesFor(application);
  const groups = monthGroups(items);
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const allOpen = items.length > 0 && items.every((item) => openItems[item.id]);

  function toggleGroup(key: string) {
    setClosed((current) => ({ ...current, [key]: !current[key] }));
  }

  function toggleItem(id: string) {
    setOpenItems((current) => ({ ...current, [id]: !current[id] }));
  }

  function toggleAll() {
    setOpenItems(allOpen ? {} : Object.fromEntries(items.map((item) => [item.id, true])));
    if (!allOpen) setClosed({});
  }

  return (
    <div className="uw-activity">
      <div className="uw-card-header">
        <h2 className="text-lg text-black">Activity</h2>
        <button type="button" className="uw-btn-link" onClick={toggleAll}>
          {allOpen ? "Collapse all" : "Expand all"}
        </button>
      </div>
      <Group label="Upcoming & Overdue" open={!closed.upcoming} onToggle={() => toggleGroup("upcoming")}>
        <div className="uw-activity-empty">
          <p>No activities to show.</p>
          <span>Get started by sending an email, scheduling a task, and more.</span>
        </div>
      </Group>
      {groups.map((group) => (
        <Group
          key={group.key}
          label={group.label}
          meta={group.current ? "This Month" : undefined}
          open={!closed[group.key]}
          onToggle={() => toggleGroup(group.key)}
        >
          <ul className="uw-activity-list">
            {group.items.map((item, index) => (
              <ActivityRow
                key={item.id}
                item={item}
                first={index === 0}
                last={index === group.items.length - 1}
                open={Boolean(openItems[item.id])}
                onToggle={() => toggleItem(item.id)}
              />
            ))}
          </ul>
        </Group>
      ))}
    </div>
  );
}

function Group({
  label,
  meta,
  open,
  onToggle,
  children,
}: {
  label: string;
  meta?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section>
      <button type="button" className="uw-activity-group" aria-expanded={open} onClick={onToggle}>
        <Chevron open={open} />
        <span className="uw-activity-group-label">{label}</span>
        {meta ? <span>{meta}</span> : null}
      </button>
      {open ? children : null}
    </section>
  );
}

function ActivityRow({
  item,
  first,
  last,
  open,
  onToggle,
}: {
  item: ActivityItem;
  first: boolean;
  last: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const task = item.kind === "task";
  return (
    <li className="uw-activity-item">
      <button
        type="button"
        className="uw-activity-chevron"
        aria-expanded={open}
        aria-label={`${open ? "Collapse" : "Expand"} ${item.title}`}
        onClick={onToggle}
      >
        <Chevron open={open} />
      </button>
      <div className="uw-activity-rail" aria-hidden="true">
        {first ? <span className="uw-activity-gap" /> : <span className="uw-activity-line" />}
        <span className={task ? "uw-activity-icon uw-activity-icon-task" : "uw-activity-icon uw-activity-icon-email"}>
          {task ? <TaskGlyph /> : <EmailGlyph />}
        </span>
        {last ? <span className="uw-activity-gap" /> : <span className="uw-activity-line" />}
      </div>
      <div className="uw-activity-main">
        <button type="button" className="uw-activity-toggle" aria-expanded={open} onClick={onToggle}>
          <span className="uw-activity-copy">
            <span className="uw-activity-title-row">
              <span className="uw-activity-title">{item.title}</span>
              {item.kind === "email" ? <ExternalGlyph /> : null}
            </span>
            <span className="uw-activity-meta">
              <span className="uw-activity-person">{item.actor}</span>
              {task ? " had a task with " : " sent an email to "}
              <span className="uw-activity-person">{item.counterpart}</span>
            </span>
          </span>
          <time className="uw-activity-when" dateTime={item.at}>
            {activityStamp(item.at, item.kind === "email")}
          </time>
        </button>
        {open ? <ActivityDetail item={item} /> : null}
      </div>
    </li>
  );
}

function ActivityDetail({ item }: { item: ActivityItem }) {
  return (
    <dl className="uw-activity-detail">
      <div className="uw-activity-detail-grid">
        <div className="uw-activity-field">
          <dt>Assigned To</dt>
          <dd className="uw-activity-person">{item.actor}</dd>
        </div>
        <div className="uw-activity-field">
          <dt>Created Date</dt>
          <dd>
            <time dateTime={item.at}>{shortDate(item.at)}</time>
          </dd>
        </div>
      </div>
      <div className="uw-activity-field uw-activity-description">
        <dt>Description</dt>
        <dd>{item.body}</dd>
      </div>
    </dl>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      className={open ? "uw-case-chevron uw-case-chevron-open" : "uw-case-chevron"}
    >
      <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TaskGlyph() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2.25" y="3.25" width="11.5" height="10.5" rx="1.25" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.25 6.25h11.5M5.25 2v2.5M10.75 2v2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function EmailGlyph() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.75" y="3.25" width="12.5" height="9.5" rx="1.25" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.25 4.25 8 8.75l5.75-4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ExternalGlyph() {
  return (
    <svg className="uw-activity-external" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M6.5 3.5H3.75A1.25 1.25 0 0 0 2.5 4.75v7.5c0 .69.56 1.25 1.25 1.25h7.5c.69 0 1.25-.56 1.25-1.25V9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M8.5 2.5h5v5M13.25 2.75 7.5 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
