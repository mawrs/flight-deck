"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DataTable, DataTableCard, DataTableScroll, SearchField } from "@/components";
import { FilterBadges, type FilterChip } from "@/components/list/FilterBadges";
import { ListPagination, usePagedList } from "@/components/list/ListPagination";
import { SortHeader } from "@/components/list/SortHeader";
import { OpsBadge } from "@/components/ops/OpsBadge";
import { OpsViewSelect } from "@/components/ops/OpsViewSelect";
import { Select } from "@/components/ui/Dropdown";
import { dateOnly, money } from "@/lib/format";
import { compareSortValues, timeValue, type SortDirection } from "@/lib/list-sort";
import { servicingCaseHref, servicingHome, servicingLoanHref } from "@/lib/loan-routes";
import {
  PRIORITY_RANK,
  SERVICING_VIEWS,
  disbursementsForLoan,
  isOnOrBeforeToday,
  opsLabel,
  servicingView,
} from "@/lib/ops-logic";
import { useOps } from "@/lib/ops-store";
import type { CasePriority, ServicingCase, ServicingLoan } from "@/lib/ops-types";

type CaseSort = "priority" | "borrower" | "product" | "type" | "openedBy" | "assignee" | "openedAt" | "status";
type RosterSort = "priority" | "borrower" | "product" | "school" | "date" | "amount" | "status";
type BoardSort = "borrower" | "product" | "servicer" | "boardedAt" | "status";

const CASE_COLUMNS: { key: CaseSort; label: string }[] = [
  { key: "priority", label: "Priority" },
  { key: "borrower", label: "Borrower" },
  { key: "product", label: "Loan type" },
  { key: "type", label: "Case type" },
  { key: "openedBy", label: "Opened by" },
  { key: "assignee", label: "Assignee" },
  { key: "openedAt", label: "Opened" },
  { key: "status", label: "Status" },
];

const ROSTER_COLUMNS: { key: RosterSort; label: string }[] = [
  { key: "priority", label: "Priority" },
  { key: "borrower", label: "Borrower" },
  { key: "product", label: "Loan type" },
  { key: "school", label: "School" },
  { key: "date", label: "Disbursement date" },
  { key: "amount", label: "Amount" },
  { key: "status", label: "Status" },
];

const BOARD_COLUMNS: { key: BoardSort; label: string }[] = [
  { key: "borrower", label: "Borrower" },
  { key: "product", label: "Loan type" },
  { key: "servicer", label: "Servicer" },
  { key: "boardedAt", label: "Boarded" },
  { key: "status", label: "Status" },
];

const SERVICERS = [
  { id: "all", label: "Servicer" },
  { id: "Mohela", label: "Mohela" },
  { id: "Nelnet", label: "Nelnet" },
];

const BOARDING = [
  { id: "all", label: "Status" },
  { id: "completed", label: "Completed" },
  { id: "pending", label: "Pending" },
];

const PRODUCTS = [
  { id: "all", label: "Loan type" },
  { id: "InSchool", label: "InSchool" },
  { id: "ReFi", label: "ReFi" },
  { id: "EdMed", label: "EdMed" },
];

function rosterPriority(status: string, due: boolean): CasePriority {
  if (due) return "high";
  if (status === "scheduled") return "medium";
  return "low";
}

export function ServicingQueue() {
  const view = servicingView(useSearchParams().get("view") ?? undefined);
  const viewMeta = SERVICING_VIEWS.find((item) => item.id === view) ?? SERVICING_VIEWS[0];
  const { cases, loans, certifications } = useOps();
  const [query, setQuery] = useState("");
  const [product, setProduct] = useState("all");
  const [servicer, setServicer] = useState("all");
  const [boarding, setBoarding] = useState("all");
  const [caseSort, setCaseSort] = useState<{ key: CaseSort; direction: SortDirection }>({
    key: "priority",
    direction: "asc",
  });
  const [rosterSort, setRosterSort] = useState<{ key: RosterSort; direction: SortDirection }>({
    key: "priority",
    direction: "asc",
  });
  const [boardSort, setBoardSort] = useState<{ key: BoardSort; direction: SortDirection }>({
    key: "boardedAt",
    direction: "desc",
  });

  const needle = query.trim().toLowerCase();
  const loanById = useMemo(() => new Map(loans.map((loan) => [loan.id, loan])), [loans]);

  const caseRows = useMemo(() => {
    return cases
      .filter((item) => {
        const loan = loanById.get(item.loanId);
        if (!loan) return false;
        if (product !== "all" && loan.product !== product) return false;
        if (!needle) return true;
        return [loan.borrower, loan.product, item.type, item.openedBy, item.assignee, item.details]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      })
      .sort((a, b) => {
        const primary = compareSortValues(caseValue(a, loanById, caseSort.key), caseValue(b, loanById, caseSort.key), caseSort.direction);
        return primary || timeValue(a.openedAt) - timeValue(b.openedAt) || a.id.localeCompare(b.id);
      });
  }, [caseSort, cases, loanById, needle, product]);

  const rosterRows = useMemo(() => {
    return loans
      .filter((loan) => !loan.readOnly)
      .filter((loan) => product === "all" || loan.product === product)
      .flatMap((loan) =>
        disbursementsForLoan({ certifications }, loan).map((line) => {
          const due = line.status === "scheduled" && isOnOrBeforeToday(line.date);
          return { loan, line, due, priority: rosterPriority(line.status, due) };
        }),
      )
      .filter((row) => {
        if (!needle) return true;
        return [row.loan.borrower, row.loan.product, row.loan.school].join(" ").toLowerCase().includes(needle);
      })
      .sort((a, b) => {
        const primary = compareSortValues(rosterValue(a, rosterSort.key), rosterValue(b, rosterSort.key), rosterSort.direction);
        return primary || timeValue(a.line.date) - timeValue(b.line.date);
      });
  }, [certifications, loans, needle, product, rosterSort]);

  const boardRows = useMemo(() => {
    return loans
      .filter((loan) => product === "all" || loan.product === product)
      .filter((loan) => servicer === "all" || loan.servicer === servicer)
      .filter((loan) => boarding === "all" || loan.boardingStatus === boarding)
      .filter((loan) => {
        if (!needle) return true;
        return [loan.borrower, loan.product, loan.servicer].join(" ").toLowerCase().includes(needle);
      })
      .sort((a, b) => compareSortValues(boardValue(a, boardSort.key), boardValue(b, boardSort.key), boardSort.direction) || a.id.localeCompare(b.id));
  }, [boardSort, boarding, loans, needle, product, servicer]);

  const casePage = usePagedList(caseRows);
  const rosterPage = usePagedList(rosterRows);
  const boardPage = usePagedList(boardRows);
  const rows = view === "cases" ? caseRows : view === "roster" ? rosterRows : boardRows;
  const [seenView, setSeenView] = useState(view);
  if (seenView !== view) {
    setSeenView(view);
    casePage.setPage(1);
    rosterPage.setPage(1);
    boardPage.setPage(1);
  }

  const chips: FilterChip[] = [];
  if (query.trim()) chips.push({ id: "query", label: query.trim(), onClear: () => setQuery("") });
  if (product !== "all") chips.push({ id: "product", label: product, onClear: () => setProduct("all") });
  if (view === "onboarded" && servicer !== "all") {
    chips.push({ id: "servicer", label: servicer, onClear: () => setServicer("all") });
  }
  if (view === "onboarded" && boarding !== "all") {
    chips.push({ id: "boarding", label: opsLabel(boarding), onClear: () => setBoarding("all") });
  }

  return (
    <div className="uw-list-page uw-list-page-flush">
      <div className="uw-list-header">
        <OpsViewSelect value={view} views={SERVICING_VIEWS} hrefFor={(id) => servicingHome(id)} />
      </div>
      <DataTableCard rules className="uw-list-card">
        <div className="uw-list-toolbar">
          <div className="uw-filter-grid uw-filter-grid-queue">
            <SearchField
              label="Search servicing"
              placeholder="Search the list..."
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                casePage.setPage(1);
                rosterPage.setPage(1);
                boardPage.setPage(1);
              }}
            />
            <Select
              value={product}
              options={PRODUCTS}
              onChange={(value) => {
                setProduct(value);
                casePage.setPage(1);
                rosterPage.setPage(1);
                boardPage.setPage(1);
              }}
            />
            {view === "onboarded" ? (
              <>
                <Select
                  value={servicer}
                  options={SERVICERS}
                  onChange={(value) => {
                    setServicer(value);
                    boardPage.setPage(1);
                  }}
                />
                <Select
                  value={boarding}
                  options={BOARDING}
                  onChange={(value) => {
                    setBoarding(value);
                    boardPage.setPage(1);
                  }}
                />
              </>
            ) : null}
          </div>
          <FilterBadges
            chips={chips}
            onClearAll={() => {
              setQuery("");
              setProduct("all");
              setServicer("all");
              setBoarding("all");
              casePage.setPage(1);
              rosterPage.setPage(1);
              boardPage.setPage(1);
            }}
          />
        </div>
        {rows.length === 0 ? (
          <p className="uw-list-empty">{chips.length ? "Nothing matches those criteria." : viewMeta.empty}</p>
        ) : view === "cases" ? (
          <CaseTable
            rows={casePage.pageItems}
            loanById={loanById}
            sort={caseSort}
            onSort={(key) => {
              setCaseSort((current) => toggleSort(current, key, "asc"));
              casePage.setPage(1);
            }}
            count={casePage.count}
            page={casePage.page}
            pageSize={casePage.pageSize}
            onPageChange={casePage.setPage}
          />
        ) : view === "roster" ? (
          <RosterTable
            rows={rosterPage.pageItems}
            sort={rosterSort}
            onSort={(key) => {
              setRosterSort((current) => toggleSort(current, key, "asc"));
              rosterPage.setPage(1);
            }}
            count={rosterPage.count}
            page={rosterPage.page}
            pageSize={rosterPage.pageSize}
            onPageChange={rosterPage.setPage}
          />
        ) : (
          <BoardTable
            rows={boardPage.pageItems}
            sort={boardSort}
            onSort={(key) => {
              setBoardSort((current) => toggleSort(current, key, key === "boardedAt" ? "desc" : "asc"));
              boardPage.setPage(1);
            }}
            count={boardPage.count}
            page={boardPage.page}
            pageSize={boardPage.pageSize}
            onPageChange={boardPage.setPage}
          />
        )}
      </DataTableCard>
    </div>
  );
}

function toggleSort<Key extends string>(
  current: { key: Key; direction: SortDirection },
  key: Key,
  initial: SortDirection,
) {
  return current.key === key
    ? { key, direction: current.direction === "asc" ? "desc" as const : "asc" as const }
    : { key, direction: initial };
}

function caseValue(item: ServicingCase, loans: Map<string, ServicingLoan>, key: CaseSort): string | number {
  const loan = loans.get(item.loanId);
  switch (key) {
    case "priority":
      return PRIORITY_RANK[item.priority];
    case "borrower":
      return loan?.borrower ?? "";
    case "product":
      return loan?.product ?? "";
    case "type":
      return item.type;
    case "openedBy":
      return item.openedBy;
    case "assignee":
      return item.assignee;
    case "openedAt":
      return timeValue(item.openedAt);
    case "status":
      return item.status;
  }
}

function rosterValue(
  row: { priority: CasePriority; loan: ServicingLoan; line: { date: string; amount: number; status: string } },
  key: RosterSort,
): string | number {
  switch (key) {
    case "priority":
      return PRIORITY_RANK[row.priority];
    case "borrower":
      return row.loan.borrower;
    case "product":
      return row.loan.product;
    case "school":
      return row.loan.school;
    case "date":
      return timeValue(row.line.date);
    case "amount":
      return row.line.amount;
    case "status":
      return row.line.status;
  }
}

function boardValue(loan: ServicingLoan, key: BoardSort): string | number {
  switch (key) {
    case "borrower":
      return loan.borrower;
    case "product":
      return loan.product;
    case "servicer":
      return loan.servicer;
    case "boardedAt":
      return timeValue(loan.boardedAt);
    case "status":
      return loan.boardingStatus;
  }
}

function CaseTable({
  rows,
  loanById,
  sort,
  onSort,
  count,
  page,
  pageSize,
  onPageChange,
}: {
  rows: ServicingCase[];
  loanById: Map<string, ServicingLoan>;
  sort: { key: CaseSort; direction: SortDirection };
  onSort: (key: CaseSort) => void;
  count: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <>
      <DataTableScroll className="uw-list-scroll">
        <DataTable density="compact" className="uw-list-table uw-opp-table">
          <thead className="sticky top-0 z-10">
            <tr>
              {CASE_COLUMNS.map((column) => (
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
            {rows.map((item) => {
              const loan = loanById.get(item.loanId);
              return (
                <tr key={item.id} className="uw-list-row">
                  <td className="uw-list-td">
                    <Link href={servicingCaseHref(item.id)} className="uw-list-row-link" aria-label={`Open case for ${loan?.borrower}`} />
                    <OpsBadge value={item.priority} />
                  </td>
                  <td className="uw-list-td">{loan?.borrower}</td>
                  <td className="uw-list-td">{loan?.product}</td>
                  <td className="uw-list-td">{opsLabel(item.type)}</td>
                  <td className="uw-list-td">{item.openedBy}</td>
                  <td className="uw-list-td">{item.assignee}</td>
                  <td className="uw-list-td">{dateOnly(item.openedAt)}</td>
                  <td className="uw-list-td">
                    <OpsBadge value={item.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      </DataTableScroll>
      <ListPagination count={count} page={page} pageSize={pageSize} onPageChange={onPageChange} />
    </>
  );
}

function RosterTable({
  rows,
  sort,
  onSort,
  count,
  page,
  pageSize,
  onPageChange,
}: {
  rows: { loan: ServicingLoan; line: { id: string; date: string; amount: number; status: string }; priority: CasePriority }[];
  sort: { key: RosterSort; direction: SortDirection };
  onSort: (key: RosterSort) => void;
  count: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <>
      <DataTableScroll className="uw-list-scroll">
        <DataTable density="compact" className="uw-list-table uw-opp-table">
          <thead className="sticky top-0 z-10">
            <tr>
              {ROSTER_COLUMNS.map((column) => (
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
            {rows.map((row) => (
              <tr key={row.line.id} className="uw-list-row">
                <td className="uw-list-td">
                  <Link
                    href={servicingLoanHref(row.loan.id)}
                    className="uw-list-row-link"
                    aria-label={`Open loan for ${row.loan.borrower}`}
                  />
                  <OpsBadge value={row.priority} />
                </td>
                <td className="uw-list-td">{row.loan.borrower}</td>
                <td className="uw-list-td">{row.loan.product}</td>
                <td className="uw-list-td">{row.loan.school}</td>
                <td className="uw-list-td">{dateOnly(row.line.date)}</td>
                <td className="uw-list-td">{money(row.line.amount)}</td>
                <td className="uw-list-td">
                  <OpsBadge value={row.line.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </DataTableScroll>
      <ListPagination count={count} page={page} pageSize={pageSize} onPageChange={onPageChange} />
    </>
  );
}

function BoardTable({
  rows,
  sort,
  onSort,
  count,
  page,
  pageSize,
  onPageChange,
}: {
  rows: ServicingLoan[];
  sort: { key: BoardSort; direction: SortDirection };
  onSort: (key: BoardSort) => void;
  count: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <>
      <DataTableScroll className="uw-list-scroll">
        <DataTable density="compact" className="uw-list-table uw-opp-table">
          <thead className="sticky top-0 z-10">
            <tr>
              {BOARD_COLUMNS.map((column) => (
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
            {rows.map((loan) => (
              <tr key={loan.id} className="uw-list-row">
                <td className="uw-list-td">
                  <Link href={servicingLoanHref(loan.id)} className="uw-list-row-link" aria-label={`Open loan for ${loan.borrower}`} />
                  {loan.borrower}
                </td>
                <td className="uw-list-td">{loan.product}</td>
                <td className="uw-list-td">{loan.servicer}</td>
                <td className="uw-list-td">{dateOnly(loan.boardedAt)}</td>
                <td className="uw-list-td">
                  <OpsBadge value={loan.boardingStatus} />
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </DataTableScroll>
      <ListPagination count={count} page={page} pageSize={pageSize} onPageChange={onPageChange} />
    </>
  );
}
