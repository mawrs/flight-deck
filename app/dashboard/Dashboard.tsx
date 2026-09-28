"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  DataTable,
  DataTableCard,
  DataTableFooter,
  DataTableScroll,
  DataTableToolbar,
  FilterTags,
  FiltersPanel,
  NotesPanel,
  Page,
  PageHeader,
  SearchField,
  SortLabel,
  emptyFilters,
  filterTags,
  removeTag,
  requestMatches,
  type FilterState,
  type PanelNote,
} from "@/components";
import { REQUESTS } from "./requests";
import styles from "./dashboard.module.css";

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

function noteStamp(date: Date) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const hours = date.getHours();
  const hour = hours % 12 || 12;
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} ${hour}:${minutes} ${suffix}`;
}

const PAGES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const ROW_FILTERS: Record<string, { kyc: string; tasks: string[]; kycTags: string[]; branch: string }> = {
  "john-smith": {
    kyc: "Review",
    tasks: ["Information Required", "Signatures Required"],
    kycTags: ["Any Account in Account History"],
    branch: "Online",
  },
  "alvaro-rose": {
    kyc: "Pass",
    tasks: ["Missing Initial Deposit"],
    kycTags: ["Core Person Flag: Decline"],
    branch: "Online",
  },
  "willis-grimes": {
    kyc: "Fail",
    tasks: ["Documents Required"],
    kycTags: [],
    branch: "Online",
  },
  "ricardo-weathers": {
    kyc: "Pending",
    tasks: ["Attestations Required"],
    kycTags: ["Core Person Flag: No Auto Approval"],
    branch: "Online",
  },
  "mohammad-bloom": {
    kyc: "Pass",
    tasks: ["Missing Initial Deposit"],
    kycTags: [],
    branch: "Online",
  },
  "armand-sparks": {
    kyc: "Not Started",
    tasks: [],
    kycTags: ["Any Account in Account History"],
    branch: "Online",
  },
  "kobe-kate": {
    kyc: "Pass",
    tasks: [],
    kycTags: [],
    branch: "Online",
  },
  "kobe-caleb": {
    kyc: "Fail",
    tasks: ["Information Required"],
    kycTags: ["Core Person Flag: Decline"],
    branch: "Online",
  },
};

export function Dashboard() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [requests, setRequests] = useState(REQUESTS);
  const [notesRowId, setNotesRowId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterState, setFilterState] = useState<FilterState>(emptyFilters);

  useEffect(() => {
    if (!notesRowId && !filtersOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setNotesRowId(null);
      setFiltersOpen(false);
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [notesRowId, filtersOpen]);

  const tags = filterTags(filterState);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return requests.filter((row) => {
      const extra = ROW_FILTERS[row.id] ?? { kyc: "Not Started", tasks: [], kycTags: [], branch: "Online" };
      if (!requestMatches({ ...row, ...extra }, filterState)) return false;
      if (!needle) return true;
      return [row.type, row.customer, row.assignee, row.account, row.product, row.statusLabel, ...row.notes.map((note) => note.body)]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [query, requests, filterState]);

  const notesRow = requests.find((row) => row.id === notesRowId) ?? null;

  function addNote(body: string) {
    if (!notesRowId) return;
    const note: PanelNote = { author: "Aniko Brewer", at: noteStamp(new Date()), body };
    setRequests((current) =>
      current.map((row) => (row.id === notesRowId ? { ...row, notes: [note, ...row.notes] } : row)),
    );
  }

  const narrowed = query.trim().length > 0 || tags.length > 0;
  const rangeStart = rows.length === 0 ? 0 : narrowed ? 1 : (page - 1) * 5 + 1;
  const rangeEnd = narrowed ? rows.length : page * 5;
  const total = narrowed ? rows.length : 100;

  return (
    <>
        <Page flush>
          <PageHeader className={styles.pageHeader} title="Welcome back, John" />
          <DataTableCard rules aria-label="Account requests">
            <DataTableToolbar>
              <SearchField label="Search account requests" value={query} onChange={(event) => setQuery(event.target.value)} />
              <Button
                variant="outline"
                size="small"
                aria-expanded={filtersOpen}
                aria-pressed={filtersOpen}
                icon={<FilterIcon />}
                onClick={() => {
                  setNotesRowId(null);
                  setFiltersOpen((open) => !open);
                }}
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
            </DataTableToolbar>
            <DataTableScroll>
              <DataTable className={styles.requestTable}>
                <thead>
                  <tr>
                    {["Account Request Type", "Customer Name", "Assignee", "Account Number", "Product Name", "Status", "Notes"].map(
                      (label) => (
                        <th key={label} scope="col">
                          <SortLabel sortable={label !== "Notes"}>{label}</SortLabel>
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td className={styles.empty} colSpan={7}>
                        No matching requests
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr
                        key={row.id}
                        className={styles.row}
                        tabIndex={0}
                        onClick={() => router.push(`/dashboard/${row.id}`)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && event.target === event.currentTarget) {
                            router.push(`/dashboard/${row.id}`);
                          }
                        }}
                      >
                        <td>
                          <div className={styles.stack}>
                            <span className={styles.strong}>{row.type}</span>
                            <span className={styles.meta}>Created on: {row.created}</span>
                          </div>
                        </td>
                        <td>{row.customer}</td>
                        <td>{row.assignee}</td>
                        <td>{row.account}</td>
                        <td>{row.product}</td>
                        <td>
                          <div className={styles.stackLoose}>
                            <Badge tone={row.status === "booked" ? "success" : row.status === "review" ? "warning" : "error"}>
                              {row.statusLabel}
                            </Badge>
                            <span className={styles.meta}>Last Update: {row.updated}</span>
                          </div>
                        </td>
                        <td className={styles.noteTd}>
                          <button
                            className={styles.noteCell}
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setFiltersOpen(false);
                              setNotesRowId(row.id);
                            }}
                          >
                            {row.notes[0] ? (
                              <span className={styles.stackLoose}>
                                <span className={styles.note}>{row.notes[0].body}</span>
                                <span className={styles.meta}>Last Update: {row.notes[0].at.split(" ").slice(0, 3).join(" ")}</span>
                              </span>
                            ) : (
                              <span className={styles.noteButton}>Write a note</span>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </DataTable>
            </DataTableScroll>
            <DataTableFooter>
              <div className={styles.pageSize}>
                <span>Rows per page</span>
                <button className={styles.pageSizeButton} type="button" aria-label="Rows per page">
                  5
                  <img src="/dashboard/chevron-down-sm.svg" alt="" width={16} height={16} />
                </button>
                <p className={styles.range}>
                  <strong>
                    {rangeStart}-{rangeEnd}
                  </strong>{" "}
                  of <strong>{total}</strong>
                </p>
              </div>
              <nav className={styles.pager} aria-label="Pagination">
                <button
                  className={styles.pageButton}
                  type="button"
                  aria-label="Previous page"
                  disabled={page === 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <img src="/dashboard/angle-left.svg" alt="" width={16} height={16} />
                </button>
                {PAGES.map((number) => (
                  <button
                    key={number}
                    className={number === page ? styles.pageCurrent : styles.pageButton}
                    type="button"
                    aria-current={number === page ? "page" : undefined}
                    onClick={() => setPage(number)}
                  >
                    {number}
                  </button>
                ))}
                <button
                  className={styles.pageButton}
                  type="button"
                  aria-label="Next page"
                  disabled={page === PAGES.length}
                  onClick={() => setPage((current) => Math.min(PAGES.length, current + 1))}
                >
                  <img src="/dashboard/angle-right.svg" alt="" width={16} height={16} />
                </button>
              </nav>
            </DataTableFooter>
          </DataTableCard>
        </Page>
        {notesRow || filtersOpen ? (
          <div className={styles.sideSlot}>
            {notesRow ? (
              <NotesPanel
                requestType={notesRow.type}
                created={notesRow.created}
                customer={notesRow.customer}
                notes={notesRow.notes}
                onClose={() => setNotesRowId(null)}
                onAdd={addNote}
              />
            ) : (
              <FiltersPanel filters={filterState} onChange={setFilterState} onClose={() => setFiltersOpen(false)} />
            )}
          </div>
        ) : null}
    </>
  );
}
