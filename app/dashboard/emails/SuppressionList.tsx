"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Badge,
  Button,
  DataTable,
  DataTableCard,
  DataTableFooter,
  DataTableScroll,
  FilterTags,
  FiltersPanel,
  Page,
  PageHeader,
  SearchField,
  SortLabel,
  emptyFilters,
  removeTag,
  type FilterState,
} from "@/components";
import shell from "../dashboard.module.css";
import { SUPPRESSION } from "./activity";
import styles from "./emails.module.css";

const FILTER_OPTIONS = ["Unsubscribed", "Bouncing", "Reported as Spam", "Blocked"] as const;

const REASON_BY_FILTER: Record<(typeof FILTER_OPTIONS)[number], string> = {
  Unsubscribed: "Unsubscribed",
  Bouncing: "Hard Bounce",
  "Reported as Spam": "Spam Complaint",
  Blocked: "Blocked",
};

const REASON_TONE: Record<string, "warning" | "success" | "error"> = {
  Unsubscribed: "error",
  "Hard Bounce": "error",
  "Spam Complaint": "error",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function daysInMonth(year: number, month: number) {
  const first = new Date(year, month, 1).getDay();
  const count = new Date(year, month + 1, 0).getDate();
  const cells: Array<number | null> = Array.from({ length: first }, () => null);
  for (let day = 1; day <= count; day += 1) cells.push(day);
  while (cells.length % 7) cells.push(null);
  return cells;
}

function toIso(label: string) {
  const match = label.match(/([A-Za-z]+) (\d+), (\d+)/);
  if (!match) return "";
  const month = MONTHS.indexOf(match[1]) + 1;
  if (!month) return "";
  return `${match[3]}-${String(month).padStart(2, "0")}-${match[2].padStart(2, "0")}`;
}

function formatDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}

export function SuppressionList() {
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterState, setFilterState] = useState<FilterState>(emptyFilters);
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const reasons = filterState.selected
      .filter((id) => id.startsWith("option:"))
      .map((id) => REASON_BY_FILTER[id.slice("option:".length) as (typeof FILTER_OPTIONS)[number]])
      .filter(Boolean);
    return SUPPRESSION.filter((row) => {
      const iso = toIso(row.date);
      if (from && iso < from) return false;
      if (to && iso > to) return false;
      if (reasons.length && !reasons.includes(row.reason)) return false;
      if (!q) return true;
      return [row.email, row.source, row.reason].join(" ").toLowerCase().includes(q);
    });
  }, [filterState.selected, from, query, to]);

  const tags = filterState.selected
    .filter((id) => id.startsWith("option:"))
    .map((id) => ({ id, label: id.slice("option:".length) }));

  useEffect(() => {
    if (!filtersOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setFiltersOpen(false);
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [filtersOpen]);

  return (
    <>
    <Page>
      <PageHeader
        eyebrow={
          <>
            <Link href="/dashboard/emails">Emails</Link> &gt; Suppression List
          </>
        }
        title="Email Suppression List"
        subtitle="Contacts that have unsubscribed, bounced, blocked or reported emails as spam"
      />

      <DataTableCard className={styles.paddedCard}>
        <div className={styles.cardHead}>
          <div>
            <h2 className={styles.cardTitle}>Suppression List</h2>
            <p className={styles.cardMeta}>{rows.length} contacts suppressed</p>
          </div>
          <Button variant="outline" size="small">
            Export List
          </Button>
        </div>
        <div className={styles.suppressionToolbar}>
          <div className={styles.dateRow}>
            <DateField label="From Date" value={from} onChange={setFrom} />
            <span className={styles.dateDash} aria-hidden="true">
              –
            </span>
            <DateField label="To Date" value={to} onChange={setTo} />
            {from || to ? (
              <Button
                variant="text"
                size="small"
                onClick={() => {
                  setFrom("");
                  setTo("");
                }}
              >
                Clear Dates
              </Button>
            ) : null}
          </div>
          <div className={styles.searchRow}>
            <SearchField
              label="Search suppression list"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <Button
              variant="outline"
              size="small"
              aria-expanded={filtersOpen}
              aria-pressed={filtersOpen}
              icon={<FilterIcon />}
              onClick={() => setFiltersOpen((open) => !open)}
            >
              Filters
            </Button>
            <FilterTags
              className={styles.filterTags}
              tags={tags.map((tag) => ({
                ...tag,
                onRemove: () => setFilterState((current) => removeTag(current, tag.id)),
              }))}
            />
          </div>
        </div>
        <DataTableScroll>
          <DataTable>
            <thead>
              <tr>
                {["Email Address", "Source", "Reason", "Date"].map((label) => (
                  <th key={label} scope="col">
                    <SortLabel>{label}</SortLabel>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.email}>
                  <td>{row.email}</td>
                  <td>{row.source}</td>
                  <td>
                    <Badge tone={REASON_TONE[row.reason] ?? "error"}>{row.reason}</Badge>
                  </td>
                  <td>{row.date}</td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </DataTableScroll>
        <DataTableFooter>
          <span>
            1-{rows.length} of {query ? rows.length : 100}
          </span>
          <span>Rows per page 5</span>
        </DataTableFooter>
      </DataTableCard>
    </Page>
    {filtersOpen ? (
      <div className={shell.sideSlot}>
        <FiltersPanel
          filters={filterState}
          options={FILTER_OPTIONS}
          onChange={setFilterState}
          onClose={() => setFiltersOpen(false)}
        />
      </div>
    ) : null}
    </>
  );
}

function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M1.66 3.7c.13-.3.42-.5.74-.5h11.2c.32 0 .61.2.74.5.12.3.05.64-.18.87L9.6 9.13v4.47c0 .32-.2.61-.5.74-.3.12-.64.05-.87-.18l-1.6-1.6a.8.8 0 0 1-.23-.56l.01-2.87L1.83 4.57c-.23-.23-.3-.57-.17-.87M13.6 4H2.4l4.68 4.68c.08.08.12.18.12.29v3.03l1.6 1.6V8.97c0-.1.04-.2.12-.28L13.6 4Z"
      />
    </svg>
  );
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const today = new Date();
  const selected = value ? value.split("-").map(Number) : null;
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState({
    year: selected?.[0] ?? today.getFullYear(),
    month: selected ? selected[1] - 1 : today.getMonth(),
  });

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle() {
    if (selected) setCursor({ year: selected[0], month: selected[1] - 1 });
    setOpen((current) => !current);
  }

  const selectedDay = selected && selected[0] === cursor.year && selected[1] - 1 === cursor.month ? selected[2] : null;

  return (
    <div className={styles.dateField} ref={rootRef}>
      <button className={styles.dateTrigger} type="button" aria-label={label} aria-expanded={open} onClick={toggle}>
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <rect x="2" y="3" width="12" height="11" rx="1.5" fill="none" stroke="currentColor" />
          <path d="M2 6.5h12M5 2v2.5M11 2v2.5" stroke="currentColor" />
        </svg>
        <span className={value ? styles.dateSet : undefined}>{value ? formatDate(value) : label}</span>
      </button>
      {open ? (
        <div className={styles.datePicker} role="dialog" aria-label={`${label} calendar`}>
          <div className={styles.scheduleHead}>
            <button
              className={styles.calendarNav}
              type="button"
              aria-label="Previous month"
              onClick={() =>
                setCursor((current) =>
                  current.month === 0 ? { year: current.year - 1, month: 11 } : { year: current.year, month: current.month - 1 },
                )
              }
            >
              ‹
            </button>
            <span className={styles.monthLabel}>
              {MONTH_NAMES[cursor.month]} {cursor.year}
            </span>
            <button
              className={styles.calendarNav}
              type="button"
              aria-label="Next month"
              onClick={() =>
                setCursor((current) =>
                  current.month === 11 ? { year: current.year + 1, month: 0 } : { year: current.year, month: current.month + 1 },
                )
              }
            >
              ›
            </button>
          </div>
          <div className={styles.week}>
            {WEEKDAYS.map((day, index) => (
              <span key={`${day}-${index}`}>{day}</span>
            ))}
          </div>
          <div className={styles.days}>
            {daysInMonth(cursor.year, cursor.month).map((day, index) =>
              day ? (
                <button
                  key={day}
                  className={day === selectedDay ? `${styles.day} ${styles.daySelected}` : styles.day}
                  type="button"
                  onClick={() => {
                    onChange(`${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
                    setOpen(false);
                  }}
                >
                  {day}
                </button>
              ) : (
                <span key={`empty-${index}`} />
              ),
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
