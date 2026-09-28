"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DataTable, DataTableCard, DataTableScroll } from "@/components";
import { FilterBadges, listFilterChips } from "@/components/list/FilterBadges";
import { ListPagination, usePagedList } from "@/components/list/ListPagination";
import { SortHeader } from "@/components/list/SortHeader";
import { ComboSearch, Select } from "@/components/ui/Dropdown";
import { compareSortValues, timeValue, type SortDirection } from "@/lib/list-sort";
import {
  BORROWER_STATUS_LABEL,
  SEARCH_FIELDS,
  fileWorkspaceHref,
  loanTypeLabel,
  matchesSearchQuery,
  searchFieldOptions,
  type CategoryFilter,
  type CosignerFilter,
  type SearchField,
} from "@/lib/search";
import { useStore } from "@/lib/store";
import type { Application, WorkflowStatus } from "@/lib/types";

type LoanSortKey =
  | "applicationDate"
  | "loanType"
  | "loanNumber"
  | "borrower"
  | "cosigner"
  | "borrowerStatus"
  | "cosignerStatus";

const LOAN_COLUMNS: { key: Exclude<LoanSortKey, "applicationDate">; label: string }[] = [
  { key: "loanType", label: "Loan Type" },
  { key: "loanNumber", label: "Loan Number" },
  { key: "borrower", label: "Borrower" },
  { key: "cosigner", label: "Co-Signer" },
  { key: "borrowerStatus", label: "Borrower Status" },
  { key: "cosignerStatus", label: "Co-Signer Status" },
];

function loanSortValue(app: Application, key: LoanSortKey): string | number {
  switch (key) {
    case "applicationDate":
      return timeValue(app.applicationDate);
    case "loanType":
      return loanTypeLabel(app);
    case "loanNumber":
      return Number(app.id) || 0;
    case "borrower":
      return app.borrower.fullName;
    case "cosigner":
      return app.cosigner?.fullName ?? "";
    case "borrowerStatus":
      return BORROWER_STATUS_LABEL[app.status];
    case "cosignerStatus":
      return app.cosignerStatus;
  }
}

function defaultLoanDirection(key: LoanSortKey): SortDirection {
  return key === "applicationDate" || key === "loanNumber" ? "desc" : "asc";
}

const CATEGORIES: { id: CategoryFilter; label: string }[] = [
  { id: "all", label: "Loan Type" },
  { id: "Tavant", label: "Student Loan Refi" },
  { id: "InSchool", label: "In-School" },
];

const STATUSES: { id: "all" | WorkflowStatus; label: string }[] = [
  { id: "all", label: "Borrower Status" },
  { id: "pre-review", label: BORROWER_STATUS_LABEL["pre-review"] },
  { id: "needs-docs", label: BORROWER_STATUS_LABEL["needs-docs"] },
  { id: "senior-review", label: BORROWER_STATUS_LABEL["senior-review"] },
  { id: "returned", label: BORROWER_STATUS_LABEL.returned },
  { id: "approved", label: BORROWER_STATUS_LABEL.approved },
];

const COSIGNER: { id: CosignerFilter; label: string }[] = [
  { id: "all", label: "Co-Signer Status" },
  { id: "has", label: "Has co-signer" },
  { id: "none", label: "No co-signer" },
];

export function LoanSearch({ initialQuery = "" }: { initialQuery?: string }) {
  const { applications, ready } = useStore();
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [field, setField] = useState<SearchField>("borrower");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [borrowerStatus, setBorrowerStatus] = useState<"all" | WorkflowStatus>("all");
  const [cosigner, setCosigner] = useState<CosignerFilter>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sort, setSort] = useState<{ key: LoanSortKey; direction: SortDirection }>({
    key: "applicationDate",
    direction: "desc",
  });

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return applications.filter((app) => {
      if (category !== "all" && app.recordType !== category) return false;
      if (borrowerStatus !== "all" && app.status !== borrowerStatus) return false;
      if (cosigner === "has" && !app.cosigner) return false;
      if (cosigner === "none" && app.cosigner) return false;
      if (fromDate && app.applicationDate.slice(0, 10) < fromDate) return false;
      if (toDate && app.applicationDate.slice(0, 10) > toDate) return false;
      if (!needle) return true;
      return matchesSearchQuery(app, needle, field);
    }).sort((a, b) => {
      const byColumn = compareSortValues(loanSortValue(a, sort.key), loanSortValue(b, sort.key), sort.direction);
      return byColumn || a.id.localeCompare(b.id);
    });
  }, [applications, borrowerStatus, category, cosigner, field, fromDate, query, sort, toDate]);
  const { page, setPage, pageSize, pageItems, count } = usePagedList(rows);
  const suggestions = useMemo(() => searchFieldOptions(applications, field), [applications, field]);
  const chips = listFilterChips(
    { query, category, borrowerStatus, cosigner, fromDate, toDate },
    {
      query: () => setSearch(""),
      category: () => setCategory("all"),
      borrowerStatus: () => setBorrowerStatus("all"),
      cosigner: () => setCosigner("all"),
      fromDate: () => setFromDate(""),
      toDate: () => setToDate(""),
    },
  );

  function onSort(key: LoanSortKey) {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: defaultLoanDirection(key) },
    );
    setPage(1);
  }

  function setSearch(next: string) {
    setQuery(next);
    setPage(1);
    if (!next && initialQuery) router.replace("/dashboard/loan-origination/search");
  }

  function clearAllFilters() {
    setQuery("");
    setCategory("all");
    setBorrowerStatus("all");
    setCosigner("all");
    setFromDate("");
    setToDate("");
    setPage(1);
    if (initialQuery) router.replace("/dashboard/loan-origination/search");
  }

  if (!ready) {
    return <p className="uw-page-status">Loading files…</p>;
  }

  return (
    <div className="uw-list-page">
      <div className="uw-list-header">
        <h1 className="uw-list-heading">Loan Search</h1>
        <div className="uw-filter-grid uw-filter-grid-search">
          <ComboSearch
            value={query}
            field={field}
            fields={SEARCH_FIELDS}
            options={suggestions}
            onChange={setSearch}
            onFieldChange={(next) => {
              setField(next);
              setPage(1);
            }}
          />
          <Select value={category} onChange={(value) => setCategory(value as CategoryFilter)} options={CATEGORIES} />
          <Select
            value={borrowerStatus}
            onChange={(value) => setBorrowerStatus(value as "all" | WorkflowStatus)}
            options={STATUSES}
          />
          <Select value={cosigner} onChange={(value) => setCosigner(value as CosignerFilter)} options={COSIGNER} />
          <DateField placeholder="From date" value={fromDate} onChange={setFromDate} />
          <DateField placeholder="To date" value={toDate} onChange={setToDate} />
        </div>
        <FilterBadges chips={chips} onClearAll={clearAllFilters} />
      </div>

      {rows.length === 0 ? (
        <p className="uw-list-empty">
          No files match those criteria.
        </p>
      ) : (
        <DataTableCard className="uw-list-card">
          <DataTableScroll className="uw-list-scroll">
          <DataTable density="compact" className="uw-list-table">
            <thead className="sticky top-0 z-10">
              <tr>
                {LOAN_COLUMNS.map((column) => (
                  <SortHeader
                    key={column.key}
                    label={column.label}
                    active={sort.key === column.key}
                    direction={sort.direction}
                    onSort={() => onSort(column.key)}
                  />
                ))}
              </tr>
            </thead>
            <tbody>
              {pageItems.map((app) => {
                const href = fileWorkspaceHref(app);
                return (
                  <tr key={app.id} className="uw-list-row">
                    <td className="uw-list-td">
                      <Link
                        href={href}
                        className="uw-list-row-link"
                        aria-label={`Open ${app.borrower.fullName} ${app.id}`}
                      />
                      {loanTypeLabel(app)}
                    </td>
                    <td className="uw-list-td">{app.id}</td>
                    <td className="uw-list-td">{app.borrower.fullName}</td>
                    <td className="uw-list-td">{app.cosigner?.fullName ?? ""}</td>
                    <td className="uw-list-td">{BORROWER_STATUS_LABEL[app.status]}</td>
                    <td className="uw-list-td">{app.cosignerStatus}</td>
                  </tr>
                );
              })}
            </tbody>
          </DataTable>
          </DataTableScroll>
          <ListPagination count={count} page={page} pageSize={pageSize} onPageChange={setPage} />
        </DataTableCard>
      )}
    </div>
  );
}

function DateField({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="uw-list-field relative cursor-pointer">
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={placeholder}
        className="absolute inset-0 z-10 cursor-pointer bg-transparent text-transparent [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-datetime-edit]:text-transparent"
      />
      <span className="h-7 min-w-0 flex-1 truncate text-base leading-7 text-gray-dark">
        {value ? formatDisplayDate(value) : placeholder}
      </span>
      <CalendarIcon />
    </label>
  );
}

function formatDisplayDate(value: string) {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function CalendarIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0 text-gray-dark">
      <rect x="3.5" y="5.5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3.5 10h17" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 3.5v4M16 3.5v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
