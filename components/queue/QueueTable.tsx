"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DataTable, DataTableCard, DataTableScroll } from "@/components";
import { FilterBadges, type FilterChip } from "@/components/list/FilterBadges";
import { ListPagination, usePagedList } from "@/components/list/ListPagination";
import { SortHeader } from "@/components/list/SortHeader";
import { QueueViewSelect } from "@/components/queue/QueueViewSelect";
import { ComboSearch, Select } from "@/components/ui/Dropdown";
import { dateOnly, money, shortDate } from "@/lib/format";
import { compareSortValues, timeValue, type SortDirection } from "@/lib/list-sort";
import { queueView } from "@/lib/queues";
import {
  OPPORTUNITY_SEARCH_FIELDS,
  fileWorkspaceHref,
  matchesOpportunityQuery,
  opportunitySearchOptions,
  type OpportunitySearchField,
} from "@/lib/search";
import { OPPORTUNITY_STAGES } from "@/lib/stages";
import { useStore } from "@/lib/store";
import type { Application, RecordType } from "@/lib/types";

type ApplicationWindow = "all" | "today" | "7" | "30" | "90";

type OpportunitySortKey =
  | "recordType"
  | "hardCreditDate"
  | "applicationDate"
  | "priority"
  | "preReviewAt"
  | "referrer"
  | "difficulty"
  | "cosigner"
  | "stage"
  | "opportunityName"
  | "amount"
  | "underwriter"
  | "owner";

const OPPORTUNITY_COLUMNS: { key: OpportunitySortKey; label: string }[] = [
  { key: "recordType", label: "Opportunity Record Type" },
  { key: "hardCreditDate", label: "Hard Credit Date" },
  { key: "applicationDate", label: "Application Date" },
  { key: "priority", label: "UW Priority" },
  { key: "preReviewAt", label: "UW-PreReview" },
  { key: "referrer", label: "Last Referral Partner" },
  { key: "difficulty", label: "Difficulty" },
  { key: "cosigner", label: "Cosigner" },
  { key: "stage", label: "Stage" },
  { key: "opportunityName", label: "Opportunity Name" },
  { key: "amount", label: "Amount" },
  { key: "underwriter", label: "Underwriter" },
  { key: "owner", label: "Owner Full Name" },
];

function opportunitySortValue(app: Application, key: OpportunitySortKey): string | number {
  switch (key) {
    case "recordType":
      return app.recordType;
    case "hardCreditDate":
      return timeValue(app.hardCreditDate);
    case "applicationDate":
      return timeValue(app.applicationDate);
    case "priority":
      return app.priority;
    case "preReviewAt":
      return timeValue(app.preReviewAt);
    case "referrer":
      return app.opportunity?.lastReferralPartner || app.referrer;
    case "difficulty":
      return app.difficulty;
    case "cosigner":
      return app.cosigner ? 1 : 0;
    case "stage":
      return app.stage;
    case "opportunityName":
      return app.opportunityName;
    case "amount":
      return app.amount;
    case "underwriter":
      return app.underwriter;
    case "owner":
      return app.owner;
  }
}

function defaultOpportunityDirection(key: OpportunitySortKey): SortDirection {
  if (key === "hardCreditDate" || key === "applicationDate" || key === "preReviewAt" || key === "amount" || key === "cosigner") {
    return "desc";
  }
  return "asc";
}

const RECORD_TYPES: { id: "all" | RecordType; label: string }[] = [
  { id: "all", label: "Opportunity Record Type" },
  { id: "InSchool", label: "InSchool" },
  { id: "ReFi", label: "ReFi" },
  { id: "EdMed", label: "EdMed" },
];

const APPLICATION_DATES: { id: ApplicationWindow; label: string }[] = [
  { id: "all", label: "Application Date" },
  { id: "today", label: "Today" },
  { id: "7", label: "Last 7 days" },
  { id: "30", label: "Last 30 days" },
  { id: "90", label: "Last 90 days" },
];

const COSIGNER: { id: "all" | "has" | "none"; label: string }[] = [
  { id: "all", label: "Cosigner" },
  { id: "has", label: "Has cosigner" },
  { id: "none", label: "No cosigner" },
];

export function QueueTable() {
  const view = queueView(useSearchParams().get("view") ?? undefined);
  const { applications, ready } = useStore();
  const [query, setQuery] = useState("");
  const [field, setField] = useState<OpportunitySearchField>("opportunity");
  const [recordType, setRecordType] = useState<"all" | RecordType>("all");
  const [applicationWindow, setApplicationWindow] = useState<ApplicationWindow>("all");
  const [stage, setStage] = useState("all");
  const [cosigner, setCosigner] = useState<"all" | "has" | "none">("all");
  const [sort, setSort] = useState<{ key: OpportunitySortKey; direction: SortDirection }>({
    key: "applicationDate",
    direction: "desc",
  });

  const stageOptions = useMemo(() => {
    const order: string[] = OPPORTUNITY_STAGES.map((item) => item.label);
    const labels = new Set<string>(order);
    for (const app of applications) {
      if (app.stage) labels.add(app.stage);
    }
    const sorted = [...labels].sort((a, b) => {
      const ai = order.indexOf(a);
      const bi = order.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
    return [{ id: "all", label: "Stage" }, ...sorted.map((label) => ({ id: label, label }))];
  }, [applications]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return applications.filter((app) => {
      if (!view.statuses.includes(app.status)) return false;
      if (recordType !== "all" && app.recordType !== recordType) return false;
      if (!matchesApplicationWindow(app.applicationDate, applicationWindow)) return false;
      if (stage !== "all" && app.stage !== stage) return false;
      if (cosigner === "has" && !app.cosigner) return false;
      if (cosigner === "none" && app.cosigner) return false;
      if (!needle) return true;
      return matchesOpportunityQuery(app, needle, field);
    }).sort((a, b) => {
      const byColumn = compareSortValues(
        opportunitySortValue(a, sort.key),
        opportunitySortValue(b, sort.key),
        sort.direction,
      );
      return byColumn || a.id.localeCompare(b.id);
    });
  }, [applicationWindow, applications, cosigner, field, query, recordType, sort, stage, view]);
  const { page, setPage, pageSize, pageItems, count } = usePagedList(rows);
  const suggestions = useMemo(() => opportunitySearchOptions(applications, field), [applications, field]);
  const chips: FilterChip[] = [];
  if (query.trim()) {
    chips.push({
      id: "query",
      label: query.trim(),
      onClear: () => {
        setQuery("");
        setPage(1);
      },
    });
  }
  if (recordType !== "all") {
    chips.push({ id: "recordType", label: recordType, onClear: () => setRecordType("all") });
  }
  if (applicationWindow !== "all") {
    const label = APPLICATION_DATES.find((item) => item.id === applicationWindow)?.label ?? applicationWindow;
    chips.push({ id: "applicationDate", label, onClear: () => setApplicationWindow("all") });
  }
  if (stage !== "all") {
    chips.push({ id: "stage", label: stage, onClear: () => setStage("all") });
  }
  if (cosigner !== "all") {
    chips.push({
      id: "cosigner",
      label: cosigner === "has" ? "Has cosigner" : "No cosigner",
      onClear: () => setCosigner("all"),
    });
  }
  const filtered = chips.length > 0;

  function onSort(key: OpportunitySortKey) {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: defaultOpportunityDirection(key) },
    );
    setPage(1);
  }

  function clearAllFilters() {
    setQuery("");
    setRecordType("all");
    setApplicationWindow("all");
    setStage("all");
    setCosigner("all");
    setPage(1);
  }

  if (!ready) {
    return <p className="uw-page-status">Loading queue…</p>;
  }

  return (
    <div className="uw-list-page uw-list-page-flush">
      <div className="uw-list-header">
        <QueueViewSelect value={view.id} />
      </div>
      <DataTableCard rules className="uw-list-card">
        <div className="uw-list-toolbar">
        <div className="uw-filter-grid uw-filter-grid-queue">
          <ComboSearch
            value={query}
            field={field}
            fields={OPPORTUNITY_SEARCH_FIELDS}
            options={suggestions}
            placeholder="Search the list..."
            onChange={(next) => {
              setQuery(next);
              setPage(1);
            }}
            onFieldChange={(next) => {
              setField(next);
              setPage(1);
            }}
          />
          <Select
            value={recordType}
            onChange={(value) => {
              setRecordType(value as "all" | RecordType);
              setPage(1);
            }}
            options={RECORD_TYPES}
          />
          <Select
            value={applicationWindow}
            onChange={(value) => {
              setApplicationWindow(value as ApplicationWindow);
              setPage(1);
            }}
            options={APPLICATION_DATES}
          />
          <Select
            value={stage}
            onChange={(value) => {
              setStage(value);
              setPage(1);
            }}
            options={stageOptions}
          />
          <Select
            value={cosigner}
            onChange={(value) => {
              setCosigner(value as "all" | "has" | "none");
              setPage(1);
            }}
            options={COSIGNER}
          />
        </div>
        <FilterBadges chips={chips} onClearAll={clearAllFilters} />
        </div>

      {rows.length === 0 ? (
        <p className="uw-list-empty">
          {filtered ? "No files match those criteria." : view.empty}
        </p>
      ) : (
        <>
          <DataTableScroll className="uw-list-scroll">
          <DataTable density="compact" className="uw-list-table uw-opp-table">
            <thead className="sticky top-0 z-10">
              <tr>
                {OPPORTUNITY_COLUMNS.map((column) => (
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
                const hasCosigner = Boolean(app.cosigner);
                return (
                  <tr key={app.id} className="uw-list-row">
                    <td className="uw-list-td">
                      <Link
                        href={href}
                        className="uw-list-row-link"
                        aria-label={`Open ${app.opportunityName}`}
                      />
                      {app.recordType}
                    </td>
                    <td className="uw-list-td">{dateOnly(app.hardCreditDate)}</td>
                    <td className="uw-list-td">{dateOnly(app.applicationDate)}</td>
                    <td className="uw-list-td">{app.priority}</td>
                    <td className="uw-list-td">{shortDate(app.preReviewAt)}</td>
                    <td className="uw-list-td">{app.opportunity?.lastReferralPartner || app.referrer}</td>
                    <td className="uw-list-td">{app.difficulty}</td>
                    <td className="uw-list-td">
                      <CosignerMark present={hasCosigner} />
                    </td>
                    <td className="uw-list-td">{app.stage}</td>
                    <td className="uw-list-td">{app.opportunityName}</td>
                    <td className="uw-list-td">{money(app.amount)}</td>
                    <td className="uw-list-td">{app.underwriter}</td>
                    <td className="uw-list-td">{app.owner}</td>
                  </tr>
                );
              })}
            </tbody>
          </DataTable>
          </DataTableScroll>
          <ListPagination count={count} page={page} pageSize={pageSize} onPageChange={setPage} />
        </>
      )}
      </DataTableCard>
    </div>
  );
}

function matchesApplicationWindow(value: string, window: ApplicationWindow) {
  if (window === "all") return true;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (window !== "today") start.setDate(start.getDate() - (Number(window) - 1));
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return day >= start && day <= end;
}

function CosignerMark({ present }: { present: boolean }) {
  return (
    <span
      className={`inline-flex size-4 items-center justify-center rounded-[2px] border ${
        present ? "border-success text-success" : "border-gray-medium text-transparent"
      }`}
      aria-label={present ? "Has cosigner" : "No cosigner"}
    >
      {present ? (
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path
            d="M2.5 6.2l2.4 2.4 4.6-5.2"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
    </span>
  );
}
