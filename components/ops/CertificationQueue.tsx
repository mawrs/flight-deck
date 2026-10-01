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
import { certificationHome, certificationHref } from "@/lib/loan-routes";
import {
  CERT_VIEWS,
  certView,
  isDisbursementDue,
  matchesCertView,
  nextDisbursement,
  type CertViewId,
} from "@/lib/ops-logic";
import { useOps } from "@/lib/ops-store";
import type { Certification } from "@/lib/ops-types";

type SortKey =
  | "borrower"
  | "product"
  | "school"
  | "schoolCode"
  | "requestedAt"
  | "certifiedAt"
  | "approvedAmount"
  | "certifiedAmount"
  | "nextDate"
  | "status";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "borrower", label: "Borrower" },
  { key: "product", label: "Loan type" },
  { key: "school", label: "School" },
  { key: "schoolCode", label: "School code" },
  { key: "requestedAt", label: "Requested" },
  { key: "certifiedAt", label: "Certified" },
  { key: "approvedAmount", label: "Approved" },
  { key: "certifiedAmount", label: "Certified amount" },
  { key: "nextDate", label: "Next disbursement" },
  { key: "status", label: "Status" },
];

const PRODUCTS = [
  { id: "all", label: "Loan type" },
  { id: "InSchool", label: "InSchool" },
  { id: "ReFi", label: "ReFi" },
  { id: "EdMed", label: "EdMed" },
];

function defaultSort(view: CertViewId): { key: SortKey; direction: SortDirection } {
  if (view === "pending") return { key: "requestedAt", direction: "asc" };
  if (view === "due") return { key: "nextDate", direction: "asc" };
  return { key: "requestedAt", direction: "desc" };
}

function sortValue(cert: Certification, key: SortKey): string | number {
  const next = nextDisbursement(cert);
  switch (key) {
    case "borrower":
      return cert.borrower;
    case "product":
      return cert.product;
    case "school":
      return cert.school;
    case "schoolCode":
      return cert.schoolCode;
    case "requestedAt":
      return timeValue(cert.requestedAt);
    case "certifiedAt":
      return timeValue(cert.certifiedAt);
    case "approvedAmount":
      return cert.approvedAmount;
    case "certifiedAmount":
      return cert.certifiedAmount ?? -1;
    case "nextDate":
      return next ? timeValue(next.date) : Number.MAX_SAFE_INTEGER;
    case "status":
      return cert.status;
  }
}

export function CertificationQueue() {
  const view = certView(useSearchParams().get("view") ?? undefined);
  const viewMeta = CERT_VIEWS.find((item) => item.id === view) ?? CERT_VIEWS[0];
  const { certifications } = useOps();
  const [query, setQuery] = useState("");
  const [product, setProduct] = useState("all");
  const [sortView, setSortView] = useState(view);
  const [sort, setSort] = useState(() => defaultSort(view));

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return certifications
      .filter((cert) => matchesCertView(cert, view))
      .filter((cert) => product === "all" || cert.product === product)
      .filter((cert) => {
        if (!needle) return true;
        return [cert.borrower, cert.school, cert.schoolCode, cert.product].join(" ").toLowerCase().includes(needle);
      })
      .sort((a, b) => {
        const dueBoost = Number(isDisbursementDue(b)) - Number(isDisbursementDue(a));
        if (view === "due" && sort.key === "nextDate" && dueBoost) return dueBoost;
        return compareSortValues(sortValue(a, sort.key), sortValue(b, sort.key), sort.direction) || a.id.localeCompare(b.id);
      });
  }, [certifications, product, query, sort, view]);

  const { page, setPage, pageSize, pageItems, count } = usePagedList(rows);
  if (sortView !== view) {
    setSortView(view);
    setSort(defaultSort(view));
    setPage(1);
  }

  const chips: FilterChip[] = [];
  if (query.trim()) chips.push({ id: "query", label: query.trim(), onClear: () => setQuery("") });
  if (product !== "all") chips.push({ id: "product", label: product, onClear: () => setProduct("all") });

  function onSort(key: SortKey) {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: key === "borrower" || key === "school" || key === "status" || key === "product" ? "asc" : "desc" },
    );
    setPage(1);
  }

  return (
    <div className="uw-list-page uw-list-page-flush">
      <div className="uw-list-header">
        <OpsViewSelect value={view} views={CERT_VIEWS} hrefFor={(id) => certificationHome(id)} />
      </div>
      <DataTableCard rules className="uw-list-card">
        <div className="uw-list-toolbar">
          <div className="uw-filter-grid uw-filter-grid-queue">
            <SearchField
              label="Search certifications"
              placeholder="Search borrower, school, or school code"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
            />
            <Select
              value={product}
              options={PRODUCTS}
              onChange={(value) => {
                setProduct(value);
                setPage(1);
              }}
            />
          </div>
          <FilterBadges
            chips={chips}
            onClearAll={() => {
              setQuery("");
              setProduct("all");
              setPage(1);
            }}
          />
        </div>
        {rows.length === 0 ? (
          <p className="uw-list-empty">{chips.length ? "No certifications match those criteria." : viewMeta.empty}</p>
        ) : (
          <>
            <DataTableScroll className="uw-list-scroll">
              <DataTable density="compact" className="uw-list-table uw-opp-table">
                <thead className="sticky top-0 z-10">
                  <tr>
                    {COLUMNS.map((column) => (
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
                  {pageItems.map((cert) => {
                    const next = nextDisbursement(cert);
                    return (
                      <tr key={cert.id} className="uw-list-row">
                        <td className="uw-list-td">
                          <Link href={certificationHref(cert.id)} className="uw-list-row-link" aria-label={`Open ${cert.borrower}`} />
                          {cert.borrower}
                        </td>
                        <td className="uw-list-td">{cert.product}</td>
                        <td className="uw-list-td">{cert.school}</td>
                        <td className="uw-list-td">{cert.schoolCode}</td>
                        <td className="uw-list-td">{dateOnly(cert.requestedAt)}</td>
                        <td className="uw-list-td">{dateOnly(cert.certifiedAt)}</td>
                        <td className="uw-list-td">{money(cert.approvedAmount)}</td>
                        <td className="uw-list-td">{money(cert.certifiedAmount)}</td>
                        <td className="uw-list-td">{next ? dateOnly(next.date) : "—"}</td>
                        <td className="uw-list-td">
                          <OpsBadge value={cert.status} />
                        </td>
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
