"use client";

import { FilterTags } from "@/components/FilterTags";
import { BORROWER_STATUS_LABEL, type CategoryFilter, type CosignerFilter } from "@/lib/search";
import type { WorkflowStatus } from "@/lib/types";

export type FilterChip = {
  id: string;
  label: string;
  onClear: () => void;
};

export type ListFilterValues = {
  query: string;
  category: CategoryFilter;
  borrowerStatus: "all" | WorkflowStatus;
  cosigner: CosignerFilter;
  fromDate?: string;
  toDate?: string;
};

export function listFilterChips(
  values: ListFilterValues,
  onClear: {
    query: () => void;
    category: () => void;
    borrowerStatus: () => void;
    cosigner: () => void;
    fromDate?: () => void;
    toDate?: () => void;
  },
): FilterChip[] {
  const chips: FilterChip[] = [];
  const query = values.query.trim();
  if (query) chips.push({ id: "query", label: query, onClear: onClear.query });
  if (values.category !== "all") {
    chips.push({
      id: "category",
      label: values.category,
      onClear: onClear.category,
    });
  }
  if (values.borrowerStatus !== "all") {
    chips.push({
      id: "status",
      label: BORROWER_STATUS_LABEL[values.borrowerStatus],
      onClear: onClear.borrowerStatus,
    });
  }
  if (values.cosigner !== "all") {
    chips.push({
      id: "cosigner",
      label: values.cosigner === "has" ? "Has co-signer" : "No co-signer",
      onClear: onClear.cosigner,
    });
  }
  if (values.fromDate && onClear.fromDate) {
    chips.push({ id: "fromDate", label: `From ${formatChipDate(values.fromDate)}`, onClear: onClear.fromDate });
  }
  if (values.toDate && onClear.toDate) {
    chips.push({ id: "toDate", label: `To ${formatChipDate(values.toDate)}`, onClear: onClear.toDate });
  }
  return chips;
}

export function FilterBadges({ chips, onClearAll }: { chips: FilterChip[]; onClearAll: () => void }) {
  return (
    <FilterTags
      tags={chips.map((chip) => ({
        id: chip.id,
        label: chip.label,
        onRemove: chip.onClear,
      }))}
      onClearAll={onClearAll}
    />
  );
}

function formatChipDate(value: string) {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

