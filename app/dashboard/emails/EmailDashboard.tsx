"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  DataTable,
  DataTableCard,
  DataTableFooter,
  DataTableScroll,
  DataTableToolbar,
  Page,
  PageHeader,
  SearchField,
} from "@/components";
import { CONFIGURE, EMAIL_ACTIVITY, type EmailStatus } from "./activity";
import styles from "./emails.module.css";

const STATUS_TONE: Record<EmailStatus, "warning" | "success" | "error"> = {
  Delivered: "warning",
  Opened: "success",
  Bounced: "error",
  Blocked: "error",
  Unsubscribed: "error",
};

function Chevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M11.94 5 8 8.9 4.06 5 3 6.05 8 11l5-4.95L11.94 5Z" fill="currentColor" />
    </svg>
  );
}

export function EmailDashboard() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [configureOpen, setConfigureOpen] = useState(false);
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return EMAIL_ACTIVITY;
    return EMAIL_ACTIVITY.filter((row) =>
      [row.template, row.subject, row.email, row.customer, row.status].join(" ").toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <Page>
      <PageHeader
        title="Dashboard"
        subtitle="Last updated Sep 14, 2026 8:05am"
        actions={
          <div className={styles.menuWrap}>
          <Button size="small" aria-expanded={configureOpen} onClick={() => setConfigureOpen((open) => !open)}>
            Configure
            <Chevron />
          </Button>
          {configureOpen ? (
            <div className={styles.menu} role="menu">
              {CONFIGURE.map((item) => (
                <button key={item} type="button" role="menuitem" onClick={() => setConfigureOpen(false)}>
                  {item}
                </button>
              ))}
            </div>
          ) : null}
          </div>
        }
      />

      <section className={styles.stats} aria-label="Email stats">
        <Stat label="Emails Sent" value="24,190" />
        <Stat label="Delivery Rates" value="97%" />
        <Stat label="Open Rate" value="4.3%" />
        <Stat label="Unsubscribes" value="33" />
      </section>

      <DataTableCard>
        <div className={styles.emailActivityHead}>
          <h2 className={styles.cardTitle}>Email Activity</h2>
        </div>
        <DataTableToolbar>
          <SearchField
            label="Search email activity"
            value={query}
            placeholder="Search"
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button variant="outline" size="small">
            Filters
          </Button>
        </DataTableToolbar>
        <DataTableScroll>
          <DataTable>
            <thead>
              <tr>
                <th>Template Name</th>
                <th>Email Address</th>
                <th>Customer Name</th>
                <th>Status</th>
                <th>Date/Time Sent</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <button className={styles.link} type="button" onClick={() => router.push("/dashboard/emails/send")}>
                      {row.template}
                    </button>
                    <p className={styles.templateSub}>{row.subject}</p>
                  </td>
                  <td>{row.email}</td>
                  <td>{row.customer}</td>
                  <td>
                    <Badge tone={STATUS_TONE[row.status]}>{row.status}</Badge>
                  </td>
                  <td>{row.sent}</td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </DataTableScroll>
        <DataTableFooter>
          <span>
            1-{rows.length} of {query ? rows.length : 100}
          </span>
          <span>Rows per page 10</span>
        </DataTableFooter>
      </DataTableCard>
    </Page>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <article className={styles.stat}>
      <span className={styles.statIcon} aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3 6l7 5 7-5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </span>
      <div>
        <p className={styles.statValue}>{value}</p>
        <p className={styles.statLabel}>{label}</p>
      </div>
    </article>
  );
}
