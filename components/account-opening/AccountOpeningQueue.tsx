"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { buttonClassName } from "@/components/Button";
import { DataTable, DataTableCard, DataTableScroll } from "@/components/DataTable";
import { SortHeader } from "@/components/list/SortHeader";
import { Select } from "@/components/ui/Dropdown";
import { channelLabel, openingAmountLabel, openingProductName, PRODUCTS, statusLabel } from "@/lib/account-opening-data";
import { shortDate } from "@/lib/format";
import { compareSortValues, timeValue, type SortDirection } from "@/lib/list-sort";
import { useAccountOpenings } from "@/lib/account-opening-store";
import type { AccountOpening, AccountOpeningChannel, AccountOpeningStatus } from "@/lib/account-opening-types";

type StatusFilter = "all" | AccountOpeningStatus;
type ChannelFilter = "all" | AccountOpeningChannel;
type SortKey = "applicant" | "id" | "channel" | "product" | "amount" | "status" | "started";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "applicant", label: "Applicant" },
  { key: "id", label: "Application" },
  { key: "channel", label: "Channel" },
  { key: "product", label: "Product" },
  { key: "amount", label: "Amount" },
  { key: "status", label: "Status" },
  { key: "started", label: "Started" },
];

function sortValue(opening: AccountOpening, key: SortKey): string | number {
  switch (key) {
    case "applicant":
      return opening.fields.fullName.value;
    case "id":
      return opening.id;
    case "channel":
      return channelLabel(opening.channel);
    case "product":
      return openingProductName(opening);
    case "amount":
      return Number(opening.fields.transferAmount.value) || 0;
    case "status":
      return statusLabel(opening.status);
    case "started":
      return timeValue(opening.startedAt);
  }
}

export function AccountOpeningQueue() {
  const openings = useAccountOpenings();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [channel, setChannel] = useState<ChannelFilter>("all");
  const [product, setProduct] = useState("all");
  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection }>({ key: "started", direction: "desc" });
  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return openings
      .filter((opening) => {
        if (status !== "all" && opening.status !== status) return false;
        if (channel !== "all" && opening.channel !== channel) return false;
        if (product !== "all" && !productIds(opening).has(product)) return false;
        if (!needle) return true;
        return [opening.id, opening.fields.fullName.value, opening.fields.phone.value, opening.fields.email.value, opening.fields.accountNumber.value]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      })
      .sort((a, b) => compareSortValues(sortValue(a, sort.key), sortValue(b, sort.key), sort.direction) || a.id.localeCompare(b.id));
  }, [channel, openings, product, query, sort, status]);

  function onSort(key: SortKey) {
    setSort((current) =>
      current.key === key ? { key, direction: current.direction === "asc" ? "desc" : "asc" } : { key, direction: key === "started" || key === "amount" ? "desc" : "asc" },
    );
  }

  return (
    <div className="uw-list-page uw-list-page-flush">
      <div className="uw-list-header">
        <div className="uw-list-header-row">
          <h1 className="uw-view-select">Account Opening</h1>
          <div className="uw-list-header-actions">
            <Link className={buttonClassName({ size: "small" })} href="/dashboard/loan-origination/account-opening/new">
              Start account opening
            </Link>
          </div>
        </div>
      </div>
      <DataTableCard rules className="uw-list-card">
        <div className="uw-list-toolbar">
          <div className="uw-filter-grid uw-filter-grid-queue">
            <label className="uw-list-field">
              <input
                className="min-w-0 flex-1 bg-transparent text-base outline-none"
                value={query}
                placeholder="Search the list..."
                aria-label="Search account openings"
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <Select
              value={status}
              onChange={(value) => setStatus(value as StatusFilter)}
              options={[
                { id: "all", label: "Status" },
                { id: "in-progress", label: "In progress" },
                { id: "awaiting-signature", label: "Awaiting submission" },
                { id: "opened", label: "Opened" },
              ]}
            />
            <Select
              value={channel}
              onChange={(value) => setChannel(value as ChannelFilter)}
              options={[
                { id: "all", label: "Channel" },
                { id: "call-center", label: "Call center" },
                { id: "branch-event", label: "Branch event" },
              ]}
            />
            <Select
              value={product}
              onChange={setProduct}
              options={[{ id: "all", label: "Product" }, ...PRODUCTS.map((item) => ({ id: item.id, label: item.name }))]}
            />
          </div>
        </div>
        {rows.length === 0 ? (
          <p className="uw-list-empty">No account openings match those filters.</p>
        ) : (
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
                {rows.map((opening) => (
                  <tr key={opening.id} className="uw-list-row">
                    <td className="uw-list-td">
                      <Link
                        href={`/dashboard/loan-origination/account-opening/${opening.id}`}
                        className="uw-list-row-link"
                        aria-label={`Open ${opening.fields.fullName.value || opening.id}`}
                      />
                      {opening.fields.fullName.value || "New customer"}
                    </td>
                    <td className="uw-list-td">{opening.id}</td>
                    <td className="uw-list-td">{channelLabel(opening.channel)}</td>
                    <td className="uw-list-td">{openingProductName(opening)}</td>
                    <td className="uw-list-td">{openingAmountLabel(opening)}</td>
                    <td className="uw-list-td">{statusLabel(opening.status)}</td>
                    <td className="uw-list-td">{shortDate(opening.startedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </DataTableScroll>
        )}
      </DataTableCard>
    </div>
  );
}

function productIds(opening: AccountOpening) {
  const ids = new Set<string>();
  if (opening.fields.productId.value) ids.add(opening.fields.productId.value);
  for (const insight of opening.insights) {
    if (insight.field === "productId" && insight.status !== "dismissed") ids.add(insight.value);
  }
  return ids;
}
